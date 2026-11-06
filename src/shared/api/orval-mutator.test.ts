import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "./api-client-error";
import {
  API_MUTATION_RESULT_UNKNOWN_EVENT,
  API_SESSION_EXPIRED_EVENT,
  API_SESSION_REFRESHED_EVENT,
  API_SESSION_UNCERTAIN_EVENT,
  observeAuthSessionTransition,
  orvalFetch,
  resetOrvalMutatorForTests,
  withAuthSessionTransition,
} from "./orval-mutator";

const identity = { sessionId: "session-a", userId: "user-a" };
const marker = { generation: "generation-a", ...identity };
const markerKey = "allermeal:auth-session-generation";
const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
const error = (code: string, status: number) => json({ error: { code, message: code } }, status);

let values: Map<string, string>;
let events: EventTarget;
let documentMock: { cookie: string };

beforeEach(() => {
  values = new Map([[markerKey, JSON.stringify(marker)]]);
  events = new EventTarget();
  documentMock = { cookie: "csrf_token=csrf-a" };
  vi.stubGlobal("window", events);
  vi.stubGlobal("document", documentMock);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
  resetOrvalMutatorForTests();
});

describe("protected requests without a restored session", () => {
  it("does not send a mutation when the initial session check fails", async () => {
    values.clear();
    resetOrvalMutatorForTests();
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(orvalFetch("/api/v1/children", { method: "POST", body: "{}" })).rejects.toBeDefined();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/auth/session-status");
  });
});

describe("authentication transitions", () => {
  it("binds a successful login only after the server confirms the returned family", async () => {
    const nextIdentity = { sessionId: "session-b", userId: "user-b" };
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/v1/auth/session-status") return json(nextIdentity);
      throw new Error("Unexpected request");
    });
    vi.stubGlobal("fetch", fetchMock);
    const operation = vi.fn(async () => {
      expect(JSON.parse(values.get(markerKey) ?? "{}")).toMatchObject({ pending: true, previousSessionId: identity.sessionId });
      return nextIdentity;
    });
    await expect(withAuthSessionTransition(operation, "login")).resolves.toEqual(nextIdentity);
    expect(JSON.parse(values.get(markerKey) ?? "{}")).toMatchObject(nextIdentity);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("passes the expected family to logout and publishes a signed-out marker", async () => {
    const operation = vi.fn(async () => undefined);
    await expect(withAuthSessionTransition(operation, "logout")).resolves.toBeUndefined();
    expect(operation).toHaveBeenCalledWith(identity.sessionId);
    expect(JSON.parse(values.get(markerKey) ?? "{}")).toMatchObject({ sessionId: null, userId: null });
    expect(JSON.parse(values.get(markerKey) ?? "{}").generation).not.toBe(marker.generation);
  });

  it("restores the previous marker after a failed login if that family remains active", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(identity));
    vi.stubGlobal("fetch", fetchMock);
    const failure = new ApiClientError({ status: 401, code: "UNAUTHORIZED", message: "invalid credentials" });
    await expect(withAuthSessionTransition(async () => { throw failure; }, "login")).rejects.toBe(failure);
    expect(JSON.parse(values.get(markerKey) ?? "{}")).toEqual(marker);
  });

  it("recovers an uncertain transition after a temporary status outage only after rechecking the family", async () => {
    let statuses = 0;
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/v1/auth/session-status") return ++statuses === 1 ? error("AUTH_TEMPORARILY_UNAVAILABLE", 503) : json(identity);
      if (url === "/api/v1/children") return json({ ok: true });
      throw new Error("Unexpected request");
    });
    vi.stubGlobal("fetch", fetchMock);
    const failure = new ApiClientError({ status: 0, code: "NETWORK_ERROR", message: "response lost" });
    await expect(withAuthSessionTransition(async () => { throw failure; }, "login")).rejects.toBe(failure);
    expect(JSON.parse(values.get(markerKey) ?? "{}")).toMatchObject({ pending: true, previousSessionId: identity.sessionId });
    await expect(orvalFetch("/api/v1/children")).resolves.toEqual({ ok: true });
    expect(JSON.parse(values.get(markerKey) ?? "{}")).toEqual(marker);
    expect(statuses).toBe(2);
  });

  it("does not overwrite a different tab's session after a delayed login result", async () => {
    let finish!: (value: typeof identity) => void;
    let started!: () => void;
    const startedPromise = new Promise<void>((resolve) => { started = resolve; });
    const operation = () => { started(); return new Promise<typeof identity>((resolve) => { finish = resolve; }); };
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    const result = withAuthSessionTransition(operation, "login");
    await startedPromise;
    const other = { generation: "generation-b", sessionId: "session-b", userId: "user-b" };
    values.set(markerKey, JSON.stringify(other));
    observeAuthSessionTransition();
    finish(identity);
    await expect(result).rejects.toMatchObject({ code: "SESSION_CHANGED" });
    expect(JSON.parse(values.get(markerKey) ?? "{}")).toEqual(other);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

afterEach(() => {
  resetOrvalMutatorForTests();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("orvalFetch", () => {
  it("normalizes public URLs without asking for a session", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ id: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(orvalFetch("http://localhost:8080/api/v1/allergens")).resolves.toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/allergens", expect.objectContaining({ credentials: "include" }));
  });

  it("sends the expected session and CSRF on a protected mutation without per-request status calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(null, 204));
    vi.stubGlobal("fetch", fetchMock);
    await orvalFetch("/api/v1/account/withdrawal", { method: "DELETE" });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(options.headers);
    expect(headers.get("X-Expected-Session-Id")).toBe(identity.sessionId);
    expect(headers.get("X-CSRF-Token")).toBe("csrf-a");
  });

  it.each([["CSRF_VALIDATION_FAILED", 403], ["AUTH_RATE_LIMITED", 429]])(
    "preserves %s without treating it as expiry or sending refresh", async (code, status) => {
      const fetchMock = vi.fn().mockResolvedValue(error(code, status));
      const expired = vi.fn(); events.addEventListener(API_SESSION_EXPIRED_EVENT, expired);
      vi.stubGlobal("fetch", fetchMock);
      await expect(orvalFetch("/api/v1/children")).rejects.toMatchObject({ status, code, sessionExpired: false });
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(expired).not.toHaveBeenCalled();
    },
  );

  it("coalesces concurrent expired access requests through one server reservation and execute", async () => {
    let protectedCount = 0;
    const refreshed = vi.fn(); events.addEventListener(API_SESSION_REFRESHED_EVENT, refreshed);
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/v1/auth/session-status") return json(identity);
      if (url === "/api/v1/auth/refresh-operations") return json({ operationId: "op-1", sessionId: identity.sessionId, expiresAt: "2030-01-01T00:00:00Z" }, 201);
      if (url.endsWith("/execute")) return json(identity);
      if (url === "/api/v1/children" || url === "/api/v1/account/profile") {
        protectedCount++;
        return protectedCount <= 2 ? error("UNAUTHORIZED", 401) : json({ restored: true });
      }
      throw new Error("Unexpected request");
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await Promise.all([orvalFetch("/api/v1/children"), orvalFetch("/api/v1/account/profile")]);
    expect(result).toEqual([{ restored: true }, { restored: true }]);
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/v1/auth/refresh-operations")).toHaveLength(1);
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/execute"))).toHaveLength(1);
    expect(refreshed).toHaveBeenCalledOnce();
  });

  it("continues after a lost response only when the rotated cookies are active", async () => {
    let protectedCount = 0;
    let serverRotated = false;
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/v1/auth/session-status") return serverRotated && documentMock.cookie !== "csrf_token=csrf-b" ? error("UNAUTHORIZED", 401) : json(identity);
      if (url === "/api/v1/auth/refresh-operations") return json({ operationId: "op-1", sessionId: identity.sessionId }, 201);
      if (url.endsWith("/execute")) { serverRotated = true; documentMock.cookie = "csrf_token=csrf-b"; throw new Error("response body lost after cookies"); }
      if (url.endsWith("/cancel")) return json({ state: "ROTATED" });
      if (url === "/api/v1/children") return ++protectedCount === 1 ? error("UNAUTHORIZED", 401) : json({ restored: true });
      throw new Error("Unexpected request");
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(orvalFetch("/api/v1/children")).resolves.toEqual({ restored: true });
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/execute"))).toHaveLength(1);
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/cancel"))).toHaveLength(1);
  });

  it("offers retry or login when rotation succeeded but the browser kept the used refresh cookie", async () => {
    let serverRotated = false;
    const expired = vi.fn();
    const refreshed = vi.fn();
    const uncertain = vi.fn();
    events.addEventListener(API_SESSION_EXPIRED_EVENT, expired);
    events.addEventListener(API_SESSION_REFRESHED_EVENT, refreshed);
    events.addEventListener(API_SESSION_UNCERTAIN_EVENT, uncertain);
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/v1/auth/session-status") return serverRotated ? error("UNAUTHORIZED", 401) : json(identity);
      if (url === "/api/v1/auth/refresh-operations") return json({ operationId: "op-1", sessionId: identity.sessionId }, 201);
      if (url.endsWith("/execute")) {
        serverRotated = true;
        // No Set-Cookie reached the browser, so its CSRF and refresh cookies remain old.
        throw new Error("response lost before headers");
      }
      if (url.endsWith("/cancel")) return json({ state: "ROTATED" });
      if (url === "/api/v1/children") return error("UNAUTHORIZED", 401);
      throw new Error("Unexpected request");
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(orvalFetch("/api/v1/children")).rejects.toMatchObject({ status: 0, code: "SESSION_STATUS_UNCERTAIN", sessionExpired: false });
    expect(documentMock.cookie).toBe("csrf_token=csrf-a");
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/execute"))).toHaveLength(1);
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/cancel"))).toHaveLength(1);
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/v1/children")).toHaveLength(1);
    expect(expired).not.toHaveBeenCalled();
    expect(refreshed).not.toHaveBeenCalled();
    expect(uncertain).toHaveBeenCalledOnce();
  });

  it("does not force login when another tab rotates again before its delayed cookie arrives", async () => {
    let rotationInFlight = false;
    let protectedCount = 0;
    const expired = vi.fn();
    const uncertain = vi.fn();
    events.addEventListener(API_SESSION_EXPIRED_EVENT, expired);
    events.addEventListener(API_SESSION_UNCERTAIN_EVENT, uncertain);
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/v1/auth/session-status") return rotationInFlight && documentMock.cookie !== "csrf_token=csrf-c" ? error("UNAUTHORIZED", 401) : json(identity);
      if (url === "/api/v1/auth/refresh-operations") return json({ operationId: "op-1", sessionId: identity.sessionId }, 201);
      if (url.endsWith("/execute")) { documentMock.cookie = "csrf_token=csrf-b"; throw new Error("body lost after first cookies"); }
      if (url.endsWith("/cancel")) { rotationInFlight = true; return json({ state: "ROTATED" }); }
      if (url === "/api/v1/children") return ++protectedCount === 1 ? error("UNAUTHORIZED", 401) : json({ restored: true });
      throw new Error("Unexpected request");
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(orvalFetch("/api/v1/children")).rejects.toMatchObject({ code: "SESSION_STATUS_UNCERTAIN", sessionExpired: false });
    expect(expired).not.toHaveBeenCalled();
    expect(uncertain).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/execute"))).toHaveLength(1);
    expect(protectedCount).toBe(1);
    // The later response arrives; a user-initiated retry can use the new cookies.
    documentMock.cookie = "csrf_token=csrf-c";
    await expect(orvalFetch("/api/v1/children")).resolves.toEqual({ restored: true });
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/execute"))).toHaveLength(1);
  });

  it("requires a user retry when a lost execute is cancelled before rotation", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/v1/auth/session-status") return json(identity);
      if (url === "/api/v1/auth/refresh-operations") return json({ operationId: "op-1", sessionId: identity.sessionId }, 201);
      if (url.endsWith("/execute")) throw new Error("response lost");
      if (url.endsWith("/cancel")) return json({ state: "CANCELLED" });
      return error("UNAUTHORIZED", 401);
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(orvalFetch("/api/v1/children")).rejects.toMatchObject({ code: "REFRESH_RETRY_REQUIRED", sessionExpired: false });
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/execute"))).toHaveLength(1);
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/cancel"))).toHaveLength(1);
  });

  it("cancels an execute when its successful response body cannot be read", async () => {
    let protectedCount = 0;
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/v1/auth/session-status") return json(identity);
      if (url === "/api/v1/auth/refresh-operations") return json({ operationId: "op-1", sessionId: identity.sessionId }, 201);
      if (url.endsWith("/execute")) return new Response(new ReadableStream({ start(controller) { controller.error(new Error("body lost")); } }));
      if (url.endsWith("/cancel")) return json({ state: "ROTATED" });
      if (url === "/api/v1/children") return ++protectedCount === 1 ? error("UNAUTHORIZED", 401) : json({ restored: true });
      throw new Error("Unexpected request");
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(orvalFetch("/api/v1/children")).resolves.toEqual({ restored: true });
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/execute"))).toHaveLength(1);
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/cancel"))).toHaveLength(1);
  });

  it("waits for another tab's reservation and confirms the same family after cookies change", async () => {
    let protectedCount = 0;
    let statusCount = 0;
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/v1/auth/session-status") {
        if (++statusCount === 2) documentMock.cookie = "csrf_token=csrf-b";
        return json(identity);
      }
      if (url === "/api/v1/auth/refresh-operations") return error("REFRESH_IN_PROGRESS", 409);
      if (url === "/api/v1/children") return ++protectedCount === 1 ? error("UNAUTHORIZED", 401) : json({ restored: true });
      throw new Error("Unexpected request");
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(orvalFetch("/api/v1/children")).resolves.toEqual({ restored: true });
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/execute"))).toHaveLength(0);
  });

  it("does not classify cancellation service failure as session expiry", async () => {
    const expired = vi.fn(); events.addEventListener(API_SESSION_EXPIRED_EVENT, expired);
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/v1/auth/session-status") return json(identity);
      if (url === "/api/v1/auth/refresh-operations") return json({ operationId: "op-1", sessionId: identity.sessionId }, 201);
      if (url.endsWith("/execute")) throw new Error("response lost");
      if (url.endsWith("/cancel")) return error("AUTH_TEMPORARILY_UNAVAILABLE", 503);
      return error("UNAUTHORIZED", 401);
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(orvalFetch("/api/v1/children")).rejects.toMatchObject({ status: 503, sessionExpired: false });
    expect(expired).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/execute"))).toHaveLength(1);
  });

  it("recovers a pending transition only when the server confirms the previous family", async () => {
    values.set(markerKey, JSON.stringify({ generation: "pending", sessionId: null, userId: null, pending: true,
      previousGeneration: marker.generation, previousSessionId: identity.sessionId, previousUserId: identity.userId }));
    resetOrvalMutatorForTests();
    const fetchMock = vi.fn(async (url: string) => url === "/api/v1/auth/session-status" ? json(identity) : json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(orvalFetch("/api/v1/children")).resolves.toEqual({ ok: true });
    expect(JSON.parse(values.get(markerKey) ?? "{}")).toEqual(marker);
  });

  it("does not resume a pending account's request under a different active family", async () => {
    values.set(markerKey, JSON.stringify({ generation: "pending", sessionId: null, userId: null, pending: true,
      previousGeneration: marker.generation, previousSessionId: identity.sessionId, previousUserId: identity.userId }));
    resetOrvalMutatorForTests();
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/v1/auth/session-status") return json({ sessionId: "session-b", userId: "user-b" });
      throw new Error("The protected mutation must not be sent");
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(orvalFetch("/api/v1/children", { method: "POST", body: "{}" })).rejects.toMatchObject({ code: "SESSION_CHANGED" });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["/api/v1/auth/session-status"]);
  });

  it("does not replay an old account's mutation when another tab changes session", async () => {
    let finish!: (value: Response) => void;
    let started!: () => void;
    const requestStarted = new Promise<void>((resolve) => { started = resolve; });
    const response = new Promise<Response>((resolve) => { finish = resolve; });
    const fetchMock = vi.fn(() => { started(); return response; });
    const unknown = vi.fn(); events.addEventListener(API_MUTATION_RESULT_UNKNOWN_EVENT, unknown);
    vi.stubGlobal("fetch", fetchMock);
    const pending = orvalFetch("/api/v1/children/1", { method: "PATCH", body: "{}" });
    await requestStarted;
    values.set(markerKey, JSON.stringify({ generation: "generation-b", sessionId: "session-b", userId: "user-b" }));
    observeAuthSessionTransition();
    finish(json({ ok: true }));
    await expect(pending).rejects.toMatchObject({ code: "MUTATION_RESULT_UNKNOWN" });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(unknown).toHaveBeenCalledOnce();
  });

  it("leaves mutation-unknown display to an explicit local owner without replaying or leaking the option", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("offline"));
    const unknown = vi.fn(); events.addEventListener(API_MUTATION_RESULT_UNKNOWN_EVENT, unknown);
    vi.stubGlobal("fetch", fetchMock);
    await expect(orvalFetch("/api/v1/children/1", { method: "DELETE", mutationErrorDisplay: "local" })).rejects.toMatchObject({ code: "MUTATION_RESULT_UNKNOWN" });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty("mutationErrorDisplay");
    expect(unknown).not.toHaveBeenCalled();
  });

  it.each([500, 502, 503, 504])("does not replay a mutation after HTTP %i with unknown outcome", async (status) => {
    const fetchMock = vi.fn().mockResolvedValue(error("SERVER_FAILURE", status));
    const unknown = vi.fn(); events.addEventListener(API_MUTATION_RESULT_UNKNOWN_EVENT, unknown);
    vi.stubGlobal("fetch", fetchMock);
    await expect(orvalFetch("/api/v1/children/1", { method: "PATCH" })).rejects.toMatchObject({ code: "MUTATION_RESULT_UNKNOWN" });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(unknown).toHaveBeenCalledOnce();
  });

  it("refreshes a legacy access token after same-family status confirmation without replaying mutations", async () => {
    let protectedCount = 0;
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/v1/auth/session-status") return json(identity);
      if (url === "/auth/session") return json({}, 200, { "X-Access-Session-Claim": "absent" });
      if (url === "/api/v1/auth/refresh-operations") return json({ operationId: "op-1", sessionId: identity.sessionId }, 201);
      if (url.endsWith("/execute")) return json(identity);
      if (url === "/api/v1/children") { protectedCount++; return error("SESSION_INACTIVE", 401); }
      throw new Error("Unexpected request");
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(orvalFetch("/api/v1/children", { method: "POST", body: "{}" })).rejects.toMatchObject({ code: "MUTATION_RESULT_UNKNOWN" });
    expect(protectedCount).toBe(1);
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/execute"))).toHaveLength(1);
  });

  it("offers retry or login when a 401 status could be a delayed refresh response", async () => {
    const fetchMock = vi.fn(async (url: string) => url === "/api/v1/auth/session-status" ? error("UNAUTHORIZED", 401) : error("SESSION_INACTIVE", 401));
    const uncertain = vi.fn(); const expired = vi.fn();
    events.addEventListener(API_SESSION_UNCERTAIN_EVENT, uncertain);
    events.addEventListener(API_SESSION_EXPIRED_EVENT, expired);
    vi.stubGlobal("fetch", fetchMock);
    await expect(orvalFetch("/api/v1/children")).rejects.toMatchObject({ code: "SESSION_STATUS_UNCERTAIN", sessionExpired: false });
    expect(uncertain).toHaveBeenCalledOnce();
    expect(expired).not.toHaveBeenCalled();
  });
});

describe("protected page session expiry", () => {
  it("reports request expiry to the current protected page", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/v1/auth/session-status") return json(identity);
      if (url === "/api/v1/children") return error("UNAUTHORIZED", 401);
      if (url === "/api/v1/auth/refresh-operations") return error("UNAUTHORIZED", 401);
      throw new Error("Unexpected request");
    });
    const expired = vi.fn();
    events.addEventListener(API_SESSION_EXPIRED_EVENT, expired);
    vi.stubGlobal("fetch", fetchMock);
    await expect(orvalFetch("/api/v1/children")).rejects.toMatchObject({ status: 401, sessionExpired: true });
    expect(expired).toHaveBeenCalledOnce();
    expect((expired.mock.calls[0][0] as CustomEvent).detail).toBe("protected-request");
  });
});
