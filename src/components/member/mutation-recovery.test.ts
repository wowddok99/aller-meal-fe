import { describe, expect, it, vi } from "vitest";
import { createMutationRecovery } from "./mutation-recovery";

describe("unknown mutation recovery", () => {
  it("blocks further writes in the current editor after a response is lost", async () => {
    const recovery = createMutationRecovery();
    const write = vi.fn().mockRejectedValue(new Error("response lost"));
    const save = async () => {
      if (recovery.isBlocked()) return;
      try { await write(); }
      catch { recovery.markUnknown(); }
    };
    await save(); await save(); await save();
    expect(write).toHaveBeenCalledOnce();
    expect(recovery.isBlocked()).toBe(true);
  });

  it("keeps the old editor blocked when a separate editor scope is created", () => {
    const recovery = createMutationRecovery(); recovery.markUnknown();
    recovery.markUnknown();
    expect(recovery.isBlocked()).toBe(true);
    const nextEditor = createMutationRecovery();
    expect(nextEditor.isBlocked()).toBe(false);
    expect(recovery.isBlocked()).toBe(true);
  });
});
