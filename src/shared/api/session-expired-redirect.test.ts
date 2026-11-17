import { describe, expect, it } from "vitest";
import { getLoginSuccessDestination, getSafeLoginDestination, getSessionExpiredLoginUrl } from "./session-expired-redirect";

describe("login success destination", () => {
  const origin = "https://allermeal.test";
  const meal = "/children/child-1/meals?date=2026-11-09&mode=daily#lunch";

  it.each([meal, "/admin/users", "//outside.test", null])("prioritizes withdrawal recovery over next: %s", (next) => {
    expect(getLoginSuccessDestination({ userStatus: "WITHDRAWAL_PENDING" }, next, origin)).toBe("/account/withdrawal");
  });

  it("returns an active account to its child, date and fragment", () => {
    expect(getLoginSuccessDestination({ userStatus: "ACTIVE" }, meal, origin)).toBe(meal);
  });

  it.each([null, "https://outside.test", "/\\outside.test", "/%invalid"])("keeps the default for missing or unsafe active-account next: %s", (next) => {
    expect(getLoginSuccessDestination({ userStatus: "ACTIVE" }, next, origin)).toBe("/children");
  });

  it("preserves safe legacy navigation when the optional status is absent", () => {
    expect(getLoginSuccessDestination({}, meal, origin)).toBe(meal);
    expect(getLoginSuccessDestination({}, "//outside.test", origin)).toBe("/children");
  });
});

describe("login return destination", () => {
  it("preserves a child, meal date, extra query and fragment through the login URL", () => {
    const path = "/children/child-1/meals?date=2026-11-09&mode=daily&view=compact#lunch";
    const login = getSessionExpiredLoginUrl({ pathname: "/children/child-1/meals", search: "?date=2026-11-09&mode=daily&view=compact", hash: "#lunch" });
    const next = new URL(login, "https://allermeal.test").searchParams.get("next");
    expect(getSafeLoginDestination(next, "https://allermeal.test")).toBe(path);
  });

  it.each([null, "", "https://outside.test/children", "//outside.test/children", "javascript:alert(1)", "/\\outside.test", "/%5coutside.test", "/%2foutside.test", "/children\n/other", "/children%0a/other", "/%invalid"])("uses the default destination for an unsafe value: %s", (next) => {
    expect(getSafeLoginDestination(next, "https://allermeal.test")).toBe("/children");
  });

  it("keeps an external address that is merely a query value inside the same origin", () => {
    expect(getSafeLoginDestination("/children?note=https%3A%2F%2Foutside.test", "https://allermeal.test"))
      .toBe("/children?note=https%3A%2F%2Foutside.test");
  });
});
