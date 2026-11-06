import { ApiClientError } from "./api-client-error";

export const API_SESSION_EXPIRED_EVENT = "allermeal:api-session-expired";
export const API_SESSION_REFRESHED_EVENT = "allermeal:api-session-refreshed";
export const API_SESSION_CHANGED_EVENT = "allermeal:api-session-changed";
export const API_SESSION_UNCERTAIN_EVENT = "allermeal:api-session-uncertain";
export const API_SESSION_PENDING_EVENT = "allermeal:api-session-pending";
export const API_MUTATION_RESULT_UNKNOWN_EVENT = "allermeal:mutation-result-unknown";
export type ErrorType<TError> = TError extends unknown ? ApiClientError : never;

type ErrorPayload = { error?: { code?: unknown; message?: unknown; details?: unknown; traceId?: unknown } };
type SessionIdentity = { sessionId: string; userId: string };
type SessionMarker = { generation: string; sessionId: string | null; userId: string | null; previousSessionId?: string | null; previousUserId?: string | null; previousGeneration?: string | null; pending?: boolean };
type Reservation = { operationId: string; sessionId: string; expiresAt: string };
const MARKER = "allermeal:auth-session-generation";
const AUTH_TIMEOUT_MS = 10_000;
let binding: SessionMarker | null = readMarker();
let invalidated = false;
let refreshPromise: Promise<void> | undefined;

function sessionChangedError() {
  return new ApiClientError({ status: 0, code: "SESSION_CHANGED", message: "로그인 상태가 변경되었습니다. 다시 확인해 주세요." });
}
function unavailableError() {
  return new ApiClientError({ status: 0, code: "SESSION_STORAGE_UNAVAILABLE", message: "브라우저 저장 공간에 접근할 수 없습니다. 브라우저 설정을 확인해 주세요." });
}
function retryError() {
  return new ApiClientError({ status: 0, code: "REFRESH_RETRY_REQUIRED", message: "로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." });
}
function mutationUnknownError() {
  emit(API_MUTATION_RESULT_UNKNOWN_EVENT);
  return new ApiClientError({ status: 0, code: "MUTATION_RESULT_UNKNOWN", message: "요청 결과를 확인하지 못했습니다. 변경 사항을 확인한 뒤 다시 시도해 주세요." });
}
function uncertainStatusError() {
  return new ApiClientError({ status: 0, code: "SESSION_STATUS_UNCERTAIN", message: "로그인 상태를 확인하지 못했습니다. 다시 시도하거나 로그인해 주세요." });
}
function transitionPendingError() {
  return new ApiClientError({ status: 0, code: "SESSION_TRANSITION_PENDING", message: "다른 탭에서 로그인 상태를 변경 중입니다. 잠시 후 다시 확인해 주세요." });
}
function notifyPending(pending: boolean) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(API_SESSION_PENDING_EVENT, { detail: pending }));
}
function readMarker(): SessionMarker | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(MARKER);
    if (!value) return null;
    const marker = JSON.parse(value) as Partial<SessionMarker>;
    return typeof marker.generation === "string" && marker.generation &&
      (typeof marker.sessionId === "string" || marker.sessionId === null) &&
      (typeof marker.userId === "string" || marker.userId === null) ? marker as SessionMarker : null;
  } catch { return null; }
}
function writeMarker(marker: SessionMarker) {
  try { localStorage.setItem(MARKER, JSON.stringify(marker)); }
  catch { throw unavailableError(); }
}
function generation() {
  if (typeof globalThis.crypto?.randomUUID === "function") return crypto.randomUUID();
  if (typeof globalThis.crypto?.getRandomValues !== "function") throw unavailableError();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function invalidate() {
  if (!invalidated && typeof window !== "undefined") window.dispatchEvent(new CustomEvent(API_SESSION_CHANGED_EVENT));
  invalidated = true;
}
export function observeAuthSessionTransition() {
  if (!binding || invalidated) return;
  const marker = readMarker();
  if (marker?.pending && marker.previousGeneration === binding.generation) { notifyPending(true); return; }
  if (!marker || marker.generation !== binding.generation) invalidate();
  else notifyPending(false);
}
function assertMarker(expected: SessionMarker, notify = true) {
  if (invalidated) throw sessionChangedError();
  const marker = readMarker();
  if (!marker || marker.generation !== expected.generation || marker.sessionId !== expected.sessionId || marker.userId !== expected.userId) {
    if (marker?.pending && marker.previousGeneration === expected.generation) {
      if (notify) notifyPending(true);
      throw transitionPendingError();
    }
    if (notify) invalidate();
    throw sessionChangedError();
  }
}
function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  return document.cookie.split(";").map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(prefix))?.slice(prefix.length);
}
function normalizeApiUrl(url: string) {
  const parsed = new URL(url, "http://orval.local");
  if (!parsed.pathname.startsWith("/api/")) throw new Error(`Orval API URL must begin with /api/: ${url}`);
  return `${parsed.pathname}${parsed.search}`;
}
function isProtectedApiPath(url: string) {
  return ["/api/v1/children/", "/api/v1/account/", "/api/v1/admin/"]
    .some((prefix) => url === prefix.slice(0, -1) || url.startsWith(prefix));
}
function requestOptions(options: RequestInit = {}) {
  const method = options.method?.toUpperCase() ?? "GET";
  const headers = new Headers(options.headers);
  const csrf = getCookie("csrf_token");
  if (csrf && !["GET", "HEAD", "OPTIONS"].includes(method)) headers.set("X-CSRF-Token", decodeURIComponent(csrf));
  return { ...options, method, headers, credentials: "include" as const, cache: "no-store" as const };
}
async function timedFetch(url: string, options: RequestInit, timeout = AUTH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const signal = options.signal;
  if (signal?.aborted) abort(); else signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, timeout);
  try { return await fetch(url, requestOptions({ ...options, signal: controller.signal })); }
  catch { throw new ApiClientError({ status: 0, code: "NETWORK_ERROR", message: "네트워크 연결을 확인하고 요청 결과를 확인한 뒤 다시 시도해 주세요." }); }
  finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
}
async function parseError(response: Response) {
  let payload: ErrorPayload | undefined;
  try { payload = (await boundedJson(response.clone())) as ErrorPayload; } catch { /* 오류 본문이 없을 수 있습니다. */ }
  const error = payload?.error;
  return new ApiClientError({ status: response.status, code: typeof error?.code === "string" ? error.code : `HTTP_${response.status}`,
    message: typeof error?.message === "string" && error.message.trim() ? error.message : "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    details: error?.details, traceId: typeof error?.traceId === "string" ? error.traceId : undefined });
}
async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.headers.get("content-length") === "0") return undefined as T;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let body: string;
  try {
    body = await Promise.race([
      response.text(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(retryError()), AUTH_TIMEOUT_MS); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
  if (!body) return undefined as T;
  try { return JSON.parse(body) as T; } catch { return body as T; }
}
async function boundedJson(response: Response): Promise<unknown> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      response.json() as Promise<unknown>,
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(retryError()), AUTH_TIMEOUT_MS); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
function isIdentity(value: unknown): value is SessionIdentity {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<SessionIdentity>;
  return typeof v.sessionId === "string" && v.sessionId.length > 0 && typeof v.userId === "string" && v.userId.length > 0;
}
async function sessionStatus(): Promise<SessionIdentity> {
  const csrfAtStart = getCookie("csrf_token");
  let response = await timedFetch("/api/v1/auth/session-status", { method: "POST" });
  if (response.status === 401 && csrfAtStart) {
    // Another tab can rotate the token before its Set-Cookie response arrives.
    // Recheck only if shared cookies actually change; never replay refresh here.
    for (let attempt = 0; attempt < 4; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (getCookie("csrf_token") !== csrfAtStart) {
        response = await timedFetch("/api/v1/auth/session-status", { method: "POST" });
        break;
      }
    }
    // With unchanged cookies the family may be invalid or another tab's
    // rotated cookies may still be in flight. Do not call it expired yet.
    if (response.status === 401) throw uncertainStatusError();
  }
  if (!response.ok) throw await parseError(response);
  const value = await boundedJson(response);
  if (!isIdentity(value)) throw retryError();
  return value;
}
function sameIdentity(marker: SessionIdentity | SessionMarker, identity: SessionIdentity) {
  return marker.sessionId === identity.sessionId && marker.userId === identity.userId;
}
async function boundSession(notify = true): Promise<SessionMarker> {
  if (invalidated) throw sessionChangedError();
  if (binding?.sessionId && binding.userId) {
    assertMarker(binding, notify);
    return binding;
  }
  const identity = await sessionStatus();
  let marker = readMarker();
  if (binding) {
    assertMarker(binding, notify);
    if (!binding.sessionId || !binding.userId) {
      if (!binding.previousSessionId || !binding.previousUserId ||
          binding.previousSessionId !== identity.sessionId || binding.previousUserId !== identity.userId) {
        if (notify) invalidate();
        throw sessionChangedError();
      }
      const recovered: SessionMarker = { generation: binding.previousGeneration ?? binding.generation, ...identity };
      writeMarker(recovered);
      binding = recovered;
      return recovered;
    }
    if (!sameIdentity(binding, identity)) { if (notify) invalidate(); throw sessionChangedError(); }
    return binding;
  }
  if (marker?.sessionId && marker.userId) {
    if (!sameIdentity(marker, identity)) { if (notify) invalidate(); throw sessionChangedError(); }
  } else {
    marker = { generation: generation(), ...identity };
    writeMarker(marker);
  }
  binding = marker;
  return marker;
}
function emit(name: string) { if (typeof window !== "undefined") window.dispatchEvent(new Event(name)); }
function expired(error: ApiClientError) {
  return new ApiClientError({ status: error.status, code: error.code, message: error.message, details: error.details, traceId: error.traceId, sessionExpired: true });
}
async function requireSameSession(expected: SessionMarker): Promise<void> {
  assertMarker(expected);
  const identity = await sessionStatus();
  assertMarker(expected);
  if (!sameIdentity(expected, identity)) { invalidate(); throw sessionChangedError(); }
}

async function recoverUncertainExecution(path: string, expected: SessionMarker): Promise<void> {
  assertMarker(expected);
  const cancel = await timedFetch(`${path}/cancel`, { method: "POST" });
  if (!cancel.ok) throw await parseError(cancel);
  const value = await boundedJson(cancel);
  if (!value || typeof value !== "object" || !("state" in value)) throw retryError();
  const state = (value as { state: unknown }).state;
  if (state !== "CANCELLED" && state !== "EXPIRED" && state !== "ROTATED") throw retryError();
  await requireSameSession(expected);
  if (state !== "ROTATED") throw retryError();
  emit(API_SESSION_REFRESHED_EVENT);
}

/** 로그인과 로그아웃을 다른 탭에 알리고 전환 후 서버 세션을 확인합니다. */
export async function withAuthSessionTransition<T>(operation: (expectedSessionId?: string) => Promise<T>, kind: "login" | "logout"): Promise<T> {
  const expected = kind === "logout" ? await boundSession() : undefined;
  if (kind === "logout" && !expected?.sessionId) throw sessionChangedError();
  const previous = binding;
  const pending: SessionMarker = {
    generation: generation(), sessionId: null, userId: null,
    previousSessionId: previous?.sessionId ?? previous?.previousSessionId ?? null,
    previousUserId: previous?.userId ?? previous?.previousUserId ?? null,
    previousGeneration: previous?.previousGeneration ?? previous?.generation ?? null,
    pending: true,
  };
  writeMarker(pending);
  binding = pending;
  invalidated = false;
  let result: T;
  try {
    result = await operation(expected?.sessionId ?? undefined);
  } catch (failure) {
    // A response may be lost after the server processed it. Only restore the
    // previous binding if the server still confirms that exact family.
    try {
      assertMarker(pending, false);
      const current = await sessionStatus();
      assertMarker(pending, false);
      if (pending.previousSessionId && pending.previousUserId &&
          pending.previousSessionId === current.sessionId && pending.previousUserId === current.userId) {
        const recovered: SessionMarker = { generation: pending.previousGeneration ?? pending.generation, ...current };
        writeMarker(recovered);
        binding = recovered;
      }
    } catch (recoveryFailure) {
      const definiteFailure = failure instanceof ApiClientError && failure.status >= 400 && failure.status < 500 && failure.status !== 408;
      if (definiteFailure && recoveryFailure instanceof ApiClientError && recoveryFailure.status === 401) {
        // No active server session: allow a fresh login rather than retaining a
        // non-identity binding that makes all subsequent restoration fail.
        try {
          assertMarker(pending, false);
          writeMarker({ generation: pending.generation, sessionId: null, userId: null });
          binding = null;
        } catch { /* Another tab won the transition. */ }
      }
    }
    throw failure;
  }
  assertMarker(pending);
  if (kind === "login") {
    if (!isIdentity(result)) throw retryError();
    const identity = await sessionStatus();
    assertMarker(pending);
    if (!sameIdentity(result, identity)) { invalidate(); throw sessionChangedError(); }
    const current: SessionMarker = { generation: pending.generation, ...identity };
    writeMarker(current);
    binding = current;
  } else {
    writeMarker({ generation: pending.generation, sessionId: null, userId: null });
    binding = null;
  }
  return result;
}

/** Web Locks 없이 서버 예약으로 refresh를 직렬화합니다. */
export async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const expected = await boundSession(false);
      await requireSameSession(expected);
      const before = getCookie("csrf_token");
      for (let attempt = 0; attempt < 4; attempt++) {
        assertMarker(expected);
        const response = await timedFetch("/api/v1/auth/refresh-operations", { method: "POST" });
        if (response.status === 409) {
          const error = await parseError(response);
          if (error.code !== "REFRESH_IN_PROGRESS") throw error;
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await requireSameSession(expected);
          if (getCookie("csrf_token") !== before) {
            emit(API_SESSION_REFRESHED_EVENT);
            return;
          }
          continue;
        }
        if (!response.ok) throw await parseError(response);
        const reservation = await boundedJson(response) as Partial<Reservation> | null;
        if (!reservation || typeof reservation.operationId !== "string" || !reservation.operationId) throw retryError();
        if (reservation.sessionId !== expected.sessionId) {
          invalidate(); throw sessionChangedError();
        }
        const path = `/api/v1/auth/refresh-operations/${encodeURIComponent(reservation.operationId)}`;
        assertMarker(expected);
        let execution: Response;
        try {
          execution = await timedFetch(`${path}/execute`, { method: "POST" });
        } catch {
          return recoverUncertainExecution(path, expected);
        }
        if (!execution.ok) {
          const error = await parseError(execution);
          if (execution.status >= 500) {
            return recoverUncertainExecution(path, expected);
          }
          if (error.code === "REFRESH_OPERATION_EXPIRED") { await requireSameSession(expected); throw retryError(); }
          throw error;
        }
        let result: unknown;
        try { result = await boundedJson(execution); }
        catch { return recoverUncertainExecution(path, expected); }
        if (!isIdentity(result)) return recoverUncertainExecution(path, expected);
        if (!sameIdentity(expected, result)) { invalidate(); throw sessionChangedError(); }
        await requireSameSession(expected);
        emit(API_SESSION_REFRESHED_EVENT);
        return;
      }
      throw retryError();
    })().finally(() => { refreshPromise = undefined; });
  }
  return refreshPromise;
}
async function request<T>(url: string, options: RequestInit, retried = false): Promise<T> {
  const protectedRequest = isProtectedApiPath(url);
  const mutation = !["GET", "HEAD", "OPTIONS"].includes((options.method ?? "GET").toUpperCase());
  let expected: SessionMarker | undefined;
  try {
    if (protectedRequest) expected = await boundSession();
    const headers = new Headers(options.headers);
    if (expected?.sessionId) headers.set("X-Expected-Session-Id", expected.sessionId);
    let response: Response;
    try { response = await timedFetch(url, { ...options, headers }, 15_000); }
    catch (error) { if (protectedRequest && mutation) throw mutationUnknownError(); throw error; }
    if (expected) {
      try { assertMarker(expected); }
      catch (error) { if (protectedRequest && mutation) throw mutationUnknownError(); throw error; }
    }
    if (response.ok) {
      try {
        const value = await parseResponse<T>(response);
        if (expected) assertMarker(expected);
        return value;
      }
      catch (error) { if (protectedRequest && mutation) throw mutationUnknownError(); throw error; }
    }
    const error = await parseError(response);
    if (protectedRequest && mutation && error.status >= 500) throw mutationUnknownError();
    if (protectedRequest && error.status === 401 && error.code === "SESSION_INACTIVE") {
      if (!expected) throw sessionChangedError();
      try {
        await requireSameSession(expected);
      } catch (statusFailure) {
        if (statusFailure instanceof ApiClientError && statusFailure.code === "SESSION_CHANGED") {
          throw new ApiClientError({ status: 401, code: "SESSION_INACTIVE", message: "로그인 상태를 확인할 수 없습니다. 다시 로그인해 주세요." });
        }
        throw statusFailure;
      }
      const accessHint = await timedFetch("/auth/session", { method: "GET" });
      if (!accessHint.ok) throw retryError();
      if (accessHint.headers.get("X-Access-Session-Claim") === "absent" && !retried) {
        // Legacy access tokens lack a session claim. Only refresh after the
        // server confirmed the same active family; never replay a mutation.
        await refreshSession();
        await requireSameSession(expected);
        if (mutation) throw mutationUnknownError();
        return request<T>(url, options, true);
      }
      throw new ApiClientError({ status: 0, code: "SESSION_RETRY_REQUIRED", message: "로그인 상태를 확인했습니다. 요청 결과를 확인한 뒤 다시 시도해 주세요." });
    }
    if (!protectedRequest || error.status !== 401 || retried) throw error;
    await refreshSession();
    if (!expected) throw sessionChangedError();
    await requireSameSession(expected);
    if (mutation) throw mutationUnknownError();
    return request<T>(url, options, true);
  } catch (failure) {
    if (protectedRequest && failure instanceof ApiClientError && failure.code === "SESSION_STATUS_UNCERTAIN") {
      emit(API_SESSION_UNCERTAIN_EVENT);
    }
    if (protectedRequest && failure instanceof ApiClientError && failure.status === 401) {
      emit(API_SESSION_EXPIRED_EVENT);
      throw expired(failure);
    }
    throw failure;
  }
}
export async function orvalFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  return request<T>(normalizeApiUrl(url), options);
}
export function resetOrvalMutatorForTests() {
  refreshPromise = undefined;
  binding = readMarker();
  invalidated = false;
}
