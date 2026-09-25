import { describe, expect, it } from "vitest";
import { getCollectionRefreshDelay } from "./school-meals-collection-refresh";

describe("getCollectionRefreshDelay", () => {
  it("uses the collecting response delay in milliseconds", () => {
    expect(getCollectionRefreshDelay(3)).toBe(3_000);
  });

  it("falls back to the three-second collection refresh cadence", () => {
    expect(getCollectionRefreshDelay()).toBe(3_000);
    expect(getCollectionRefreshDelay(0)).toBe(3_000);
  });
});
