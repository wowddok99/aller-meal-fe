import { describe, expect, it, vi } from "vitest";
import { getProfileFailureState, loadCurrentProfile } from "./profile-request";
import { ApiClientError } from "@/shared/api/api-client-error";

describe("profile failure state", () => {
  it("recognizes only the server's withdrawal restriction response", () => {
    expect(getProfileFailureState(new ApiClientError({ status: 403, code: "ACCOUNT_WITHDRAWAL_PENDING", message: "restricted" }))).toBe("withdrawal-pending");
    expect(getProfileFailureState(new ApiClientError({ status: 403, code: "ACCOUNT_SUSPENDED", message: "restricted" }))).toBe("error");
    expect(getProfileFailureState(new ApiClientError({ status: 401, code: "ACCOUNT_WITHDRAWAL_PENDING", message: "unauthorized" }))).toBe("error");
    expect(getProfileFailureState(new Error("network"))).toBe("error");
  });
});

describe("profile requests", () => {
  it("makes account actions available before a delayed profile response", async () => {
    let resolve!: (value: string) => void;
    const ready = vi.fn();
    const show = vi.fn();
    const pending = loadCurrentProfile(() => new Promise<string>((done) => { resolve = done; }), () => true, show, vi.fn(), ready);
    expect(ready).toHaveBeenCalledOnce();
    expect(show).not.toHaveBeenCalled();
    resolve("account");
    await pending;
    expect(show).toHaveBeenCalledWith("account");
  });
  it("reports an active profile lookup failure without guessing the account status", async () => {
    const failed = vi.fn();
    await loadCurrentProfile(async () => { throw new Error("forbidden"); }, () => true, vi.fn(), failed);
    expect(failed).toHaveBeenCalledOnce();
  });
  it("does not reveal a delayed previous account after a session change", async () => {
    let resolve!: (value: string) => void;
    let generation = 1;
    const show = vi.fn();
    const fail = vi.fn();
    const pending = loadCurrentProfile(() => new Promise<string>((done) => { resolve = done; }), () => generation === 1, show, fail);
    generation = 2;
    await loadCurrentProfile(async () => "new account", () => generation === 2, show, fail);
    resolve("old account");
    await pending;
    expect(show).toHaveBeenCalledOnce();
    expect(show).toHaveBeenCalledWith("new account");
    expect(fail).not.toHaveBeenCalled();
  });
  it("ignores an old request failure after logout", async () => {
    let reject!: (reason: Error) => void;
    let current = true;
    const fail = vi.fn();
    const pending = loadCurrentProfile(() => new Promise<string>((_, bad) => { reject = bad; }), () => current, vi.fn(), fail);
    current = false;
    reject(new ApiClientError({ status: 403, code: "ACCOUNT_WITHDRAWAL_PENDING", message: "late" }));
    await pending;
    expect(fail).not.toHaveBeenCalled();
  });
});
