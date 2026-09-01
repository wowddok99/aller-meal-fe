import { ApiClientError } from "./api-client-error";

export const API_SESSION_EXPIRED_EVENT = "allermeal:api-session-expired";
export type ErrorType<TError> = TError extends unknown ? ApiClientError : never;

type ErrorPayload = {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
    traceId?: unknown;
  };
};

let refreshPromise: Promise<void> | undefined;

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return undefined;
  }

  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);
}

function normalizeApiUrl(url: string) {
  const parsed = new URL(url, "http://orval.local");
  if (!parsed.pathname.startsWith("/api/")) {
    throw new Error(`Orval API URL must begin with /api/: ${url}`);
  }

  return `${parsed.pathname}${parsed.search}`;
}

function isProtectedApiPath(url: string) {
  return ["/api/v1/children/", "/api/v1/account/", "/api/v1/admin/"]
    .some((prefix) => url === prefix.slice(0, -1) || url.startsWith(prefix));
}

function shouldIncludeCsrf(method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

function getRequestOptions(options: RequestInit = {}) {
  const method = options.method?.toUpperCase() ?? "GET";
  const headers = new Headers(options.headers);
  const csrfToken = getCookie("csrf_token");

  if (csrfToken && shouldIncludeCsrf(method)) {
    headers.set("X-CSRF-Token", decodeURIComponent(csrfToken));
  }

  return { ...options, method, headers, credentials: "include" as const };
}

async function parseError(response: Response) {
  let payload: ErrorPayload | undefined;

  try {
    payload = (await response.clone().json()) as ErrorPayload;
  } catch {
    // Some gateways return no body or non-JSON bodies. Preserve a safe error shape.
  }

  const error = payload?.error;
  return new ApiClientError({
    status: response.status,
    code: typeof error?.code === "string" ? error.code : `HTTP_${response.status}`,
    message:
      typeof error?.message === "string" && error.message.trim()
        ? error.message
        : `API request failed with status ${response.status}.`,
    details: error?.details,
    traceId: typeof error?.traceId === "string" ? error.traceId : undefined,
  });
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  const body = await response.text();
  if (!body) {
    return undefined as T;
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    return body as T;
  }
}

function emitSessionExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(API_SESSION_EXPIRED_EVENT));
  }
}

function asSessionExpired(error: ApiClientError) {
  return new ApiClientError({
    status: error.status,
    code: error.code,
    message: error.message,
    details: error.details,
    traceId: error.traceId,
    sessionExpired: true,
  });
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch("/api/v1/auth/refresh", getRequestOptions({ method: "POST" }));
      if (!response.ok) {
        throw await parseError(response);
      }
    })().finally(() => {
      refreshPromise = undefined;
    });
  }

  return refreshPromise;
}

async function request<T>(url: string, options: RequestInit, retried: boolean): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, getRequestOptions(options));
  } catch (error) {
    throw new ApiClientError({
      status: 0,
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Network request failed.",
    });
  }

  if (response.ok) {
    return parseResponse<T>(response);
  }

  const apiError = await parseError(response);
  if (apiError.status !== 401 || !isProtectedApiPath(url)) {
    throw apiError;
  }

  if (retried) {
    const sessionError = asSessionExpired(apiError);
    emitSessionExpired();
    throw sessionError;
  }

  try {
    await refreshSession();
  } catch (refreshError) {
    const error = refreshError instanceof ApiClientError
      ? asSessionExpired(refreshError)
      : new ApiClientError({
        status: 0,
        code: "REFRESH_FAILED",
        message: "Session refresh failed.",
        sessionExpired: true,
      });
    emitSessionExpired();
    throw error;
  }

  return request<T>(url, options, true);
}

/** Orval custom mutator. It deliberately accepts only API paths and uses the Next same-origin proxy. */
export async function orvalFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  return request<T>(normalizeApiUrl(url), options, false);
}

/** Keeps module-scoped refresh state isolated in focused unit tests. */
export function resetOrvalMutatorForTests() {
  refreshPromise = undefined;
}
