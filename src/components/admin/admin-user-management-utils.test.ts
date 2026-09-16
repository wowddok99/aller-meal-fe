import { describe, expect, it } from "vitest";
import {
  buildAdminUserActionPayload,
  isExactAdminUserQuery,
  isAdminUserActionAvailable,
  normalizeAdminUserQuery,
  validateAdminActionReason,
} from "./admin-user-management-utils";

describe("admin user management input boundaries", () => {
  it("only accepts a whole email address or UUID for an exact user search", () => {
    expect(isExactAdminUserQuery("admin@allermeal.io")).toBe(true);
    expect(isExactAdminUserQuery(" 8F3A0000-0000-4000-8000-000000007B9C ")).toBe(true);
    expect(isExactAdminUserQuery("admin")).toBe(false);
    expect(isExactAdminUserQuery("admin@allermeal")).toBe(false);
  });

  it("trims the exact query before it is sent to the API", () => {
    expect(normalizeAdminUserQuery("  ADMIN@ALLERMEAL.IO ")).toBe(
      "admin@allermeal.io",
    );
  });

  it("requires a trimmed reason between one and five hundred characters", () => {
    expect(validateAdminActionReason("  운영 확인  ")).toEqual({
      valid: true,
      value: "운영 확인",
    });
    expect(validateAdminActionReason("   ").valid).toBe(false);
    expect(validateAdminActionReason("a".repeat(501)).valid).toBe(false);
  });

  it("only builds a mutation payload for an action allowed by the server", () => {
    const actions = {
      canPromoteToAdmin: true,
      canSuspend: false,
      canUnsuspend: false,
    };
    expect(isAdminUserActionAvailable(actions, "promote")).toBe(true);
    expect(isAdminUserActionAvailable(actions, "suspend")).toBe(false);
    expect(buildAdminUserActionPayload("promote", actions, 7, "  운영 승인 "))
      .toEqual({ valid: true, value: { reason: "운영 승인", expectedVersion: 7 } });
    expect(buildAdminUserActionPayload("suspend", actions, 7, "운영 승인"))
      .toMatchObject({ valid: false, field: "action" });
  });
});
