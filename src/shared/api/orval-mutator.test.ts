import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "./api-client-error";
import {
  API_SESSION_EXPIRED_EVENT,
  orvalFetch,
  resetOrvalMutatorForTests,
} from "./orval-mutator";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("orvalFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetOrvalMutatorForTests();
  });

  it("normalizes an OpenAPI server URL to the same-origin API path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      orvalFetch<{ id: number }>("http://localhost:8080/api/v1/allergens"),
    ).resolves.toEqual({ id: 1 });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/allergens",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("adds the CSRF cookie only to mutation requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(undefined, 204));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("document", { cookie: "csrf_token=csrf-value" });

    await orvalFetch<void>("/api/v1/account", { method: "DELETE" });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(options.headers).get("X-CSRF-Token")).toBe("csrf-value");
  });

  it("preserves structured error details without refreshing a 403 response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: "CSRF_INVALID",
            message: "Invalid CSRF token",
            details: { field: "csrf" },
            traceId: "trace-123",
          },
        },
        403,
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(orvalFetch("/api/v1/account")).rejects.toMatchObject({
      status: 403,
      code: "CSRF_INVALID",
      details: { field: "csrf" },
      traceId: "trace-123",
      sessionExpired: false,
    } satisfies Partial<ApiClientError>);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shares one refresh request across concurrent protected 401 responses", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { code: "UNAUTHORIZED" } }, 401))
      .mockResolvedValueOnce(jsonResponse({ error: { code: "UNAUTHORIZED" } }, 401))
      .mockResolvedValueOnce(jsonResponse(undefined, 204))
      .mockResolvedValueOnce(jsonResponse({ id: "first" }))
      .mockResolvedValueOnce(jsonResponse({ id: "second" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      Promise.all([
        orvalFetch<{ id: string }>("/api/v1/account/profile"),
        orvalFetch<{ id: string }>("/api/v1/children"),
      ]),
    ).resolves.toEqual([{ id: "first" }, { id: "second" }]);

    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/v1/auth/refresh")).toHaveLength(1);
  });

  it("marks a request as session-expired and emits an event when refresh fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { code: "UNAUTHORIZED" } }, 401))
      .mockResolvedValueOnce(jsonResponse({ error: { code: "REFRESH_EXPIRED" } }, 401));
    const eventTarget = new EventTarget();
    const sessionExpiredListener = vi.fn();
    eventTarget.addEventListener(API_SESSION_EXPIRED_EVENT, sessionExpiredListener);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", eventTarget);

    await expect(orvalFetch("/api/v1/account/profile")).rejects.toMatchObject({
      status: 401,
      sessionExpired: true,
    } satisfies Partial<ApiClientError>);
    expect(sessionExpiredListener).toHaveBeenCalledTimes(1);
  });

  it("marks a protected request as session-expired when its one retry is also unauthorized", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { code: "UNAUTHORIZED" } }, 401))
      .mockResolvedValueOnce(jsonResponse(undefined, 204))
      .mockResolvedValueOnce(jsonResponse({ error: { code: "UNAUTHORIZED" } }, 401));
    const eventTarget = new EventTarget();
    const sessionExpiredListener = vi.fn();
    eventTarget.addEventListener(API_SESSION_EXPIRED_EVENT, sessionExpiredListener);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", eventTarget);

    await expect(orvalFetch("/api/v1/account/withdrawal")).rejects.toMatchObject({
      status: 401,
      sessionExpired: true,
    } satisfies Partial<ApiClientError>);
    expect(sessionExpiredListener).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/v1/auth/refresh")).toHaveLength(1);
  });
});
