import { describe, expect, it } from "vitest";
import { keepProtectedPageOnExpiry } from "./protected-page-session";

describe("protected page expiry handling", () => {
  it("keeps an expired protected request in its child or admin page", () => {
    const event = new CustomEvent("expired", { detail: "protected-request" });
    expect(keepProtectedPageOnExpiry("/children/a/meals", event)).toBe(true);
    expect(keepProtectedPageOnExpiry("/admin/users", event)).toBe(true);
  });

  it("does not change logout or other route handling", () => {
    expect(keepProtectedPageOnExpiry("/children", new Event("expired"))).toBe(false);
    expect(keepProtectedPageOnExpiry("/account/withdrawal", new CustomEvent("expired", { detail: "protected-request" }))).toBe(false);
    expect(keepProtectedPageOnExpiry("/children-other", new CustomEvent("expired", { detail: "protected-request" }))).toBe(false);
  });
});
