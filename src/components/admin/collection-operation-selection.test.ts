import { describe, expect, it, vi } from "vitest";
import { isCollectionOperationForSelection, runForCollectionSelection } from "./collection-operation-selection";

const first = "a1111111-1111-4111-8111-111111111111";
const second = "b1111111-1111-4111-8111-111111111111";

describe("collection operation selection ownership", () => {
  it("does not run a failed A request from a stale button after selecting B", () => {
    const retryPost = vi.fn();
    const recheckGet = vi.fn();
    let currentSelection = first;
    const retryFromRenderedA = () => runForCollectionSelection(first, first, currentSelection, retryPost);
    const recheckFromRenderedA = () => runForCollectionSelection(first, first, currentSelection, recheckGet);

    currentSelection = second;
    expect(isCollectionOperationForSelection(currentSelection, first)).toBe(false);
    expect(retryFromRenderedA()).toBe(false);
    expect(recheckFromRenderedA()).toBe(false);
    expect(retryPost).not.toHaveBeenCalled();
    expect(recheckGet).not.toHaveBeenCalled();
  });

  it("allows a selected source to check its new recollection result without changing the result ID", () => {
    const resultGet = vi.fn();
    expect(runForCollectionSelection(first, first, first.toUpperCase(), () => resultGet(second))).toBe(true);
    expect(resultGet).toHaveBeenCalledWith(second);
  });

  it("rejects absent selections and a different operation source", () => {
    const action = vi.fn();
    expect(runForCollectionSelection(first, second, second, action)).toBe(false);
    expect(runForCollectionSelection(first, undefined, undefined, action)).toBe(false);
    expect(action).not.toHaveBeenCalled();
  });
});

describe("collection requests awaiting a definitive result", () => {
  it("blocks a new request after response loss or an accepted request whose result is unavailable", async () => {
    const { isCollectionRequestUnresolved } = await import("./collection-operation-selection");
    expect(isCollectionRequestUnresolved(true, false, undefined)).toBe(true);
    expect(isCollectionRequestUnresolved(false, true, undefined)).toBe(true);
    expect(isCollectionRequestUnresolved(false, true, "PENDING")).toBe(true);
    expect(isCollectionRequestUnresolved(false, true, "RUNNING")).toBe(true);
    expect(isCollectionRequestUnresolved(false, true, "FAILED")).toBe(false);
    expect(isCollectionRequestUnresolved(false, true, "SUCCEEDED")).toBe(false);
    expect(isCollectionRequestUnresolved(false, false, undefined)).toBe(false);
  });
});
