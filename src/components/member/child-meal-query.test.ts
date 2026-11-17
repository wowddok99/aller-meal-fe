import { describe, expect, it } from "vitest";
import { getChildMealQuery, getChildMealUrl } from "./child-meal-query";

const today = "2026-11-13";

describe("child meal query", () => {
  it("starts directly at the daily date from the notification link", () => {
    expect(getChildMealQuery(new URLSearchParams("date=2026-11-09&mode=daily"), today))
      .toEqual({ mode: "daily", date: "2026-11-09" });
  });

  it("uses daily mode when only a valid date is provided", () => {
    expect(getChildMealQuery(new URLSearchParams("date=2024-02-29"), today))
      .toEqual({ mode: "daily", date: "2024-02-29" });
  });

  it.each(["", "date=2026-02-29&mode=daily", "date=2026-11-31", "date=not-a-date", "date=2026-11-09&date=2026-11-10", "mode=daily&mode=weekly", "date=2026-11-09&mode=unknown", "date=2026-11-09&mode="])("uses the safe default for missing or invalid query: %s", (query) => {
    expect(getChildMealQuery(new URLSearchParams(query), today)).toEqual({ mode: "today", date: today });
  });

  it("explicit today mode ignores the old date", () => {
    expect(getChildMealQuery(new URLSearchParams("date=2026-11-09&mode=today"), today))
      .toEqual({ mode: "today", date: today });
  });

  it("reads a later URL change instead of retaining the first mail's date", () => {
    const params = new URLSearchParams("date=2026-11-09&mode=daily");
    expect(getChildMealQuery(params, today).date).toBe("2026-11-09");
    params.set("date", "2026-11-10"); params.set("mode", "weekly");
    expect(getChildMealQuery(params, today)).toEqual({ mode: "weekly", date: "2026-11-10" });
  });

  it("changes only meal query values and preserves unrelated query and fragment", () => {
    const location = { pathname: "/children/child-1/meals", search: "?date=2026-11-09&mode=daily&view=compact", hash: "#lunch" };
    const url = getChildMealUrl(location, { mode: "weekly", date: "2026-11-10" });
    expect(url).toBe("/children/child-1/meals?date=2026-11-10&mode=weekly&view=compact#lunch");
    expect(getChildMealUrl(location, { mode: "today", date: today }))
      .toBe("/children/child-1/meals?mode=today&view=compact#lunch");
  });
});
