import { describe, expect, it } from "vitest";
import {
  buildAdminUserActionPayload,
  createLatestAdminRequestTracker,
  isAdminAuthenticationError,
  isCurrentAdminUserSelection,
  isExactAdminUserQuery,
  isMissingAdminUserResource,
  isAdminUserActionAvailable,
  normalizeAdminUserQuery,
  validateAdminActionReason,
} from "./admin-user-management-utils";

describe("admin user management input boundaries", () => {
  it("rejects a delayed selection response after a newer selection begins", async () => {
    const requests = createLatestAdminRequestTracker();
    let resolveFirst!: () => void;
    const firstResponse = new Promise<void>((resolve) => { resolveFirst = resolve; });
    const firstRequest = requests.begin();
    const secondRequest = requests.begin();

    resolveFirst();
    await firstResponse;

    expect(requests.isCurrent(firstRequest)).toBe(false);
    expect(requests.isCurrent(secondRequest)).toBe(true);
  });

  it("treats a selected user's missing history as a missing user resource", () => {
    expect(isMissingAdminUserResource(undefined, 404)).toBe(true);
    expect(isMissingAdminUserResource(404, undefined)).toBe(true);
    expect(isMissingAdminUserResource(undefined, 500)).toBe(false);
  });

  it("does not refetch an action target after the operator selects another user", async () => {
    let selectedUserId = "user-a";
    const actionTargetUserId = selectedUserId;
    let resolveListRefresh!: () => void;
    const listRefresh = new Promise<void>((resolve) => { resolveListRefresh = resolve; });

    selectedUserId = "user-b";
    resolveListRefresh();
    await listRefresh;

    expect(isCurrentAdminUserSelection(selectedUserId, actionTargetUserId)).toBe(false);
  });

  it("promotes protected detail, history, and mutation failures to an auth boundary", () => {
    expect(isAdminAuthenticationError(401)).toBe(true);
    expect(isAdminAuthenticationError(403)).toBe(true);
    expect(isAdminAuthenticationError(409)).toBe(false);
  });

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
