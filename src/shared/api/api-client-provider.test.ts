import { describe, expect, it } from "vitest";
import { getSessionExpiredLoginUrl } from "./session-expired-redirect";

describe("getSessionExpiredLoginUrl", () => {
  it("preserves the protected route as an encoded next parameter", () => {
    expect(
      getSessionExpiredLoginUrl({
        pathname: "/children/child-1/meals",
        search: "?date=2026-09-19",
        hash: "#lunch",
      }),
    ).toBe(
      "/auth/login?next=%2Fchildren%2Fchild-1%2Fmeals%3Fdate%3D2026-09-19%23lunch",
    );
  });
});
