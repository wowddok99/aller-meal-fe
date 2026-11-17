import type { ReactElement, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountProfileResponse } from "@/generated/api/member/models";

const harness = vi.hoisted(() => ({
  index: 0,
  slots: [] as unknown[],
  dependencies: new Map<number, unknown[]>(),
  effects: [] as (() => void)[],
  cleanups: new Map<number, (() => void) | void>(),
  pathname: "/children",
  replace: vi.fn(),
  profile: vi.fn(),
  refresh: vi.fn(),
  context: undefined as unknown,
}));

// Execute the provider's real asynchronous effects without a DOM or browser.
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = harness.index++;
    if (!(index in harness.slots)) harness.slots[index] = initial;
    return [harness.slots[index], (value: unknown) => {
      harness.slots[index] = typeof value === "function" ? value(harness.slots[index]) : value;
    }];
  },
  useRef: (initial: unknown) => {
    const index = harness.index++;
    if (!(index in harness.slots)) harness.slots[index] = { current: initial };
    return harness.slots[index];
  },
  useCallback: (callback: unknown) => callback,
  useContext: () => harness.context,
  useEffect: (effect: () => void | (() => void), dependencies: unknown[]) => {
    const index = harness.index++;
    const previous = harness.dependencies.get(index);
    if (previous && dependencies.every((value, offset) => Object.is(value, previous[offset]))) return;
    harness.dependencies.set(index, dependencies);
    harness.effects.push(() => {
      harness.cleanups.get(index)?.();
      harness.cleanups.set(index, effect());
    });
  },
}));
vi.mock("next/navigation", () => ({ usePathname: () => harness.pathname, useRouter: () => ({ replace: harness.replace }) }));
vi.mock("@/generated/api/member", () => ({ getAccountProfile: harness.profile }));
vi.mock("@/shared/api/orval-mutator", () => ({
  API_SESSION_CHANGED_EVENT: "changed", API_SESSION_PENDING_EVENT: "pending", API_SESSION_UNCERTAIN_EVENT: "uncertain",
  API_SESSION_EXPIRED_EVENT: "expired", API_SESSION_REFRESHED_EVENT: "refreshed", refreshSession: harness.refresh,
}));

import { AccountAccessProvider, AccountPageBoundary } from "./account-access-provider";
import { ACCOUNT_STATUS_CHANGED_EVENT } from "@/shared/account/account-status-event";

const active: AccountProfileResponse = { displayName: "하늘", email: "member@example.test", userStatus: "ACTIVE", role: "MEMBER" };
const pending: AccountProfileResponse = { ...active, userStatus: "WITHDRAWAL_PENDING" };
type Value = { access?: Pick<AccountProfileResponse, "role" | "userStatus">; profile?: AccountProfileResponse; isAuthenticated?: boolean };

function renderProvider() {
  harness.index = 0;
  const element = AccountAccessProvider({ children: "body" }) as ReactElement<{ value: Value }>;
  harness.context = element.props.value;
  for (const effect of harness.effects.splice(0)) effect();
  return element.props.value;
}
async function settle() {
  // Session hint -> JSON -> profile -> state -> redirect effect.
  for (let turn = 0; turn < 10; turn += 1) { await Promise.resolve(); renderProvider(); }
  return harness.context as Value;
}
function body(): ReactNode { return AccountPageBoundary({ children: "protected body" }); }
function defer<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function sessionPending(pending: boolean) {
  const event = new Event("pending");
  Object.assign(event, { detail: pending });
  window.dispatchEvent(event);
}
function markerChanged() {
  const event = new Event("storage");
  Object.assign(event, { key: "allermeal:auth-session-generation" });
  window.dispatchEvent(event);
}

beforeEach(() => {
  vi.clearAllMocks();
  harness.index = 0;
  harness.slots = [];
  harness.dependencies.clear();
  harness.cleanups.clear();
  harness.effects = [];
  harness.pathname = "/children";
  harness.context = undefined;
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ authenticated: true }))));
  harness.profile.mockResolvedValue(active);
});
afterEach(() => {
  for (const cleanup of harness.cleanups.values()) cleanup?.();
  vi.unstubAllGlobals();
});

describe("persistent account access effects", () => {
  it("keeps a pending account gated through another tab's aborted auth attempt and rechecks its restored session", async () => {
    harness.pathname = "/account/withdrawal";
    harness.profile.mockResolvedValue(pending);
    renderProvider();
    await settle();
    sessionPending(true);
    markerChanged();
    await settle();
    expect((harness.context as Value).profile).toBeUndefined();
    expect(body()).not.toBe("protected body");
    expect(harness.profile).toHaveBeenCalledTimes(1);
    harness.pathname = "/schools";
    renderProvider();
    expect(body()).not.toBe("protected body");
    const restoredProfile = defer<AccountProfileResponse>();
    harness.profile.mockReturnValueOnce(restoredProfile.promise);
    sessionPending(false);
    markerChanged();
    await settle();
    expect(body()).not.toBe("protected body");
    restoredProfile.resolve(pending);
    await settle();
    expect(harness.replace).toHaveBeenCalledWith("/account/withdrawal");
    expect(body()).not.toBe("protected body");
    expect((harness.context as Value).profile).toEqual(pending);
    expect(harness.profile).toHaveBeenCalledTimes(2);
  });

  it("does not reuse ACTIVE access while the next account profile is unresolved", async () => {
    renderProvider();
    await settle();
    expect(body()).toBe("protected body");
    sessionPending(true);
    renderProvider();
    expect(body()).not.toBe("protected body");
    const nextProfile = defer<AccountProfileResponse>();
    harness.profile.mockReturnValueOnce(nextProfile.promise);
    sessionPending(false);
    await settle();
    expect(body()).not.toBe("protected body");
    nextProfile.resolve(pending);
    await settle();
    expect(body()).not.toBe("protected body");
    expect(harness.replace).toHaveBeenCalledWith("/account/withdrawal");
  });

  it("settles an unknown session error into the existing public shell instead of an endless spinner", async () => {
    renderProvider();
    await settle();
    sessionPending(true);
    vi.mocked(fetch).mockRejectedValueOnce(new Error("unavailable"));
    sessionPending(false);
    await settle();
    expect((harness.context as Value).profile).toBeUndefined();
    expect((harness.context as Value).access).toBeUndefined();
    expect(body()).toBe("protected body");
  });
  it("blocks an initial direct page while profile is delayed, then replaces it for pending", async () => {
    const delayed = defer<AccountProfileResponse>();
    harness.profile.mockReturnValue(delayed.promise);
    renderProvider();
    await settle();
    expect(body()).not.toBe("protected body");
    expect(harness.replace).not.toHaveBeenCalled();
    delayed.resolve(pending);
    const state = await settle();
    expect(state.profile).toEqual(pending);
    expect(harness.replace).toHaveBeenCalledWith("/account/withdrawal");
    expect(body()).not.toBe("protected body");
  });

  it("keeps the permitted withdrawal body during GET event reconciliation and unlocks after cancellation", async () => {
    harness.pathname = "/account/withdrawal";
    harness.profile.mockResolvedValue(pending);
    renderProvider();
    await settle();
    expect(body()).toBe("protected body");
    const delayed = defer<AccountProfileResponse>();
    harness.profile.mockReturnValueOnce(delayed.promise);
    window.dispatchEvent(new Event(ACCOUNT_STATUS_CHANGED_EVENT));
    await settle();
    expect(body()).toBe("protected body");
    expect(harness.profile).toHaveBeenCalledTimes(2);
    delayed.resolve(active);
    await settle();
    expect((harness.context as Value).access?.userStatus).toBe("ACTIVE");
    harness.pathname = "/schools";
    renderProvider();
    expect(body()).toBe("protected body");
    expect(harness.replace).not.toHaveBeenCalled();
  });

  it("clears old identity and access on a session change and ignores its late profile response", async () => {
    const oldRequest = defer<AccountProfileResponse>();
    harness.profile.mockReturnValueOnce(oldRequest.promise);
    renderProvider();
    await settle();
    window.dispatchEvent(new Event("changed"));
    let state = renderProvider();
    expect(state.profile).toBeUndefined();
    expect(state.access).toBeUndefined();
    harness.profile.mockResolvedValue({ ...active, displayName: "새 계정", email: "new@example.test" });
    window.dispatchEvent(new Event("refreshed"));
    await settle();
    oldRequest.resolve({ ...pending, role: "ADMIN" });
    state = await settle();
    expect(state.profile?.email).toBe("new@example.test");
    expect(state.access).toEqual({ userStatus: "ACTIVE", role: "MEMBER" });
    expect(harness.replace).not.toHaveBeenCalled();
  });

  it("drops pending navigation restrictions and identity after logout", async () => {
    harness.pathname = "/account/withdrawal";
    harness.profile.mockResolvedValue(pending);
    renderProvider();
    await settle();
    window.dispatchEvent(new Event("expired"));
    const state = renderProvider();
    expect(state.profile).toBeUndefined();
    expect(state.access).toBeUndefined();
    expect(state.isAuthenticated).toBe(false);
    expect(body()).toBe("protected body");
  });
});
