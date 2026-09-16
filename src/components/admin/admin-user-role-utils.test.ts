import { describe, expect, it } from "vitest";
import { normalizeUserId, validateUserId } from "./admin-user-role-utils";

describe("admin user role input", () => {
  it("normalizes a UUID and rejects invalid direct-action targets", () => {
    expect(normalizeUserId(" 8F3A0000-0000-4000-8000-000000007B9C ")).toBe(
      "8f3a0000-0000-4000-8000-000000007b9c",
    );
    expect(validateUserId("not-a-user-id")).toBe(false);
  });
});
