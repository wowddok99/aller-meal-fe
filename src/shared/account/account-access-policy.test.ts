import { describe, expect, it } from "vitest";
import type { AccountProfileResponse } from "@/generated/api/member/models";
import { canShowServiceManagement, getAccountPageDecision, getConfirmedAccountAccess, WITHDRAWAL_PATH } from "./account-access-policy";

const member: AccountProfileResponse = { displayName: "하늘", email: "member@example.test", userStatus: "ACTIVE", role: "MEMBER" };
const pending = getConfirmedAccountAccess({ ...member, userStatus: "WITHDRAWAL_PENDING" });

describe("confirmed account navigation", () => {
  it.each(["/schools", "/schools/1/meals", "/allergens", "/children", "/children/1/meals", "/admin", "/admin/users", "/auth/login", "/auth/signup", "/"])('redirects a pending account away from %s before mounting its page', (pathname) => {
    expect(getAccountPageDecision(pathname, pending, true, false, false)).toBe("redirect-withdrawal");
  });

  it("keeps the withdrawal page mounted during its own status reconciliation", () => {
    expect(getAccountPageDecision(WITHDRAWAL_PATH, pending, true, true, true)).toBe("show");
    expect(getAccountPageDecision(WITHDRAWAL_PATH, getConfirmedAccountAccess(member), true, true, true)).toBe("show");
  });

  it("waits for an initial authenticated profile but preserves public pages after an unknown lookup", () => {
    expect(getAccountPageDecision("/children", undefined, true, false, true)).toBe("checking");
    expect(getAccountPageDecision("/schools", undefined, undefined, true, false)).toBe("checking");
    expect(getAccountPageDecision("/schools", undefined, undefined, false, false)).toBe("show");
    expect(getAccountPageDecision("/schools", undefined, false, false, false)).toBe("show");
  });

  it("unlocks normal navigation only after an ACTIVE response", () => {
    expect(getAccountPageDecision("/children", pending, true, true, true)).toBe("redirect-withdrawal");
    expect(getAccountPageDecision("/children", getConfirmedAccountAccess(member), true, false, false)).toBe("show");
  });

  it("rejects missing or unknown response metadata instead of guessing privileges", () => {
    for (const invalid of [{ ...member, role: undefined }, { ...member, userStatus: undefined }, { ...member, role: "OWNER" }, { ...member, userStatus: "WITHDRAWN" }]) {
      expect(() => getConfirmedAccountAccess(invalid as unknown as AccountProfileResponse)).toThrow();
    }
  });
});

describe("service management navigation", () => {
  it("shows management only for an authenticated ACTIVE ADMIN", () => {
    expect(canShowServiceManagement(true, { ...member, role: "ADMIN" })).toBe(true);
    expect(canShowServiceManagement(true, member)).toBe(false);
    expect(canShowServiceManagement(true, { ...member, role: "ADMIN", userStatus: "WITHDRAWAL_PENDING" })).toBe(false);
    expect(canShowServiceManagement(true, undefined)).toBe(false);
    expect(canShowServiceManagement(undefined, { ...member, role: "ADMIN" })).toBe(false);
    expect(canShowServiceManagement(false, { ...member, role: "ADMIN" })).toBe(false);
  });
});
