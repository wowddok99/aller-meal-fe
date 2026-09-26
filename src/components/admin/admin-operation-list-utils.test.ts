import { describe, expect, it } from "vitest";
import {
  createLatestAdminOperationRequestTracker,
  getAdminOperationFailureKind,
  getAdminOperationDisplayId,
  getAdminOperationItemKey,
  getAdminOperationLoadErrorState,
  getCurrentPageFilterState,
  hasSameAdminOperationId,
  getSchoolSearchQuery,
} from "@/components/admin/admin-operation-list-utils";

describe("admin operation list utilities", () => {
  it("only accepts the newest list request result", () => {
    const tracker = createLatestAdminOperationRequestTracker();
    const first = tracker.begin();
    const second = tracker.begin();

    expect(tracker.isCurrent(first)).toBe(false);
    expect(tracker.isCurrent(second)).toBe(true);
  });

  it("does not treat absent action IDs as the same selection", () => {
    expect(hasSameAdminOperationId(undefined, undefined)).toBe(false);
    expect(hasSameAdminOperationId("first", undefined)).toBe(false);
    expect(hasSameAdminOperationId("first", "first")).toBe(true);
    expect(getAdminOperationItemKey("dlq", 0, undefined)).toBe("dlq:missing:0");
    expect(getAdminOperationItemKey("dlq", 1, undefined)).toBe("dlq:missing:1");
    expect(getAdminOperationDisplayId(undefined)).toBe("미제공");
    expect(getAdminOperationDisplayId("event-id")).toBe("event-id");
  });

  it("separates an empty server page from an empty current-page filter", () => {
    expect(getCurrentPageFilterState(0, 0, false)).toBe("server-empty");
    expect(getCurrentPageFilterState(4, 0, true)).toBe("filter-empty");
    expect(getCurrentPageFilterState(4, 4, false)).toBe("items");
  });

  it("keeps conflict, missing resource, and authentication action outcomes distinct", () => {
    expect(getAdminOperationFailureKind(409)).toBe("conflict");
    expect(getAdminOperationFailureKind(404)).toBe("not-found");
    expect(getAdminOperationFailureKind(401)).toBe("authentication");
    expect(getAdminOperationFailureKind(500)).toBe("error");
  });

  it("renders login-required and administrator-forbidden load states separately", () => {
    expect(getAdminOperationLoadErrorState(401)).toBe("login-required");
    expect(getAdminOperationLoadErrorState(403)).toBe("admin-forbidden");
    expect(getAdminOperationLoadErrorState(500)).toBe("generic-error");
  });

  it("uses one school search value for either an exact school ID or a school-name query", () => {
    expect(getSchoolSearchQuery("550e8400-e29b-41d4-a716-446655440000")).toEqual({
      schoolId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(getSchoolSearchQuery("  목포항도여자중학교 ")).toEqual({ query: "목포항도여자중학교" });
  });
});
