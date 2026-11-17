import { describe, expect, it } from "vitest";
import { prepareSignup } from "./signup-validation";

const valid = { email: " User@Example.com ", password: "password123", displayName: "  별이  ", usageType: "STUDENT" as const };
describe("signup request preparation", () => {
  it("normalizes and includes the chosen profile in the request", () => {
    expect(prepareSignup(valid)).toEqual({ request: { email: "user@example.com", password: "password123", displayName: "별이", usageType: "STUDENT" }, errors: {} });
  });
  it("blocks missing name and choice", () => {
    const { errors, request } = prepareSignup({ ...valid, displayName: "  ", usageType: "" });
    expect(errors.displayName).toBeTruthy(); expect(errors.usageType).toBeTruthy(); expect(request).toBeUndefined();
  });
  it.each(["a".repeat(51), "이\u0000름", "이\u0085름", "\ud800"]) ("rejects invalid display name %s", (displayName) => {
    expect(prepareSignup({ ...valid, displayName }).errors.displayName).toBeTruthy();
  });
  it("counts emoji by Unicode code point", () => {
    expect(prepareSignup({ ...valid, displayName: "😀".repeat(50), usageType: "PARENT" }).request?.usageType).toBe("PARENT");
  });
  it("keeps email and password validation", () => {
    const { errors, request } = prepareSignup({ ...valid, email: "not-email", password: "123" });
    expect(errors.email).toBeTruthy(); expect(errors.password).toBeTruthy(); expect(request).toBeUndefined();
  });
});
