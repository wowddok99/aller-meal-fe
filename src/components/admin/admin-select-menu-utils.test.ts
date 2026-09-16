import { describe, expect, it } from "vitest";
import { getNextOptionIndex } from "./admin-select-menu-utils";

describe("getNextOptionIndex", () => {
  it("moves through options and wraps at the last option", () => {
    expect(getNextOptionIndex(1, 3, "ArrowDown")).toBe(2);
    expect(getNextOptionIndex(2, 3, "ArrowDown")).toBe(0);
  });

  it("supports reverse, first, and last keyboard navigation", () => {
    expect(getNextOptionIndex(0, 3, "ArrowUp")).toBe(2);
    expect(getNextOptionIndex(1, 3, "Home")).toBe(0);
    expect(getNextOptionIndex(1, 3, "End")).toBe(2);
  });

  it("keeps the current option for unrelated keys", () => {
    expect(getNextOptionIndex(1, 3, "Enter")).toBe(1);
  });
});
