import { describe, expect, it, vi } from "vitest";
import { runMutationDialogAction } from "./mutation-dialog-action";

describe("mutation confirmation and result actions", () => {
  it.each(["HTTP 409", "MUTATION_RESULT_UNKNOWN"])("acknowledges %s by closing and reading, never resending", async (failure) => {
    const events: string[] = [];
    const write = vi.fn(async () => { events.push("write"); throw new Error(failure); });
    const close = vi.fn(() => { events.push("close"); });
    const read = vi.fn(async () => { events.push("read"); });
    let hasResult = false;
    try { await runMutationDialogAction({ busy: false, hasResult }, write, close, read); }
    catch { hasResult = true; }
    await runMutationDialogAction({ busy: false, hasResult }, write, close, read);
    expect(write).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
    expect(read).toHaveBeenCalledOnce();
    expect(events).toEqual(["write", "close", "read"]);
  });

  it("does nothing while the original request is pending", async () => {
    const write = vi.fn(); const close = vi.fn(); const read = vi.fn();
    await runMutationDialogAction({ busy: true, hasResult: false }, write, close, read);
    await runMutationDialogAction({ busy: true, hasResult: true }, write, close, read);
    expect(write).not.toHaveBeenCalled(); expect(close).not.toHaveBeenCalled(); expect(read).not.toHaveBeenCalled();
  });

  it("never falls back to a mutation when refreshing the acknowledged result fails", async () => {
    const write = vi.fn(); const close = vi.fn();
    const read = vi.fn().mockRejectedValue(new Error("lookup unavailable"));
    await expect(runMutationDialogAction({ busy: false, hasResult: true }, write, close, read)).rejects.toThrow("lookup unavailable");
    expect(close).toHaveBeenCalledOnce(); expect(write).not.toHaveBeenCalled();
  });
});
