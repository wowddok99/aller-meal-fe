import { describe, expect, it } from "vitest";
import { getSeoulToday } from "./school-meals-date";

describe("getSeoulToday", () => {
  it("uses the Korean calendar date before Korea reaches midnight", () => {
    expect(getSeoulToday(new Date("2026-09-17T16:30:00.000Z"))).toBe(
      "2026-09-18",
    );
  });

  it("keeps the Korean calendar date after Korea reaches midnight", () => {
    expect(getSeoulToday(new Date("2026-09-18T15:30:00.000Z"))).toBe(
      "2026-09-19",
    );
  });
});
