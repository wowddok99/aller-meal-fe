import { describe, expect, it } from "vitest";
import { logout } from "./auth-api";

describe("logout", () => {
  it("completes without a response body", async () => {
    await expect(logout()).resolves.toBeUndefined();
  });
});
