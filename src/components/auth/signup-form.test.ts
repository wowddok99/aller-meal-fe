import type { FormEvent, ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ hook: 0, signup: vi.fn(), resend: vi.fn(), values: [] as unknown[] }));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = state.hook++;
    if (!(index in state.values)) state.values[index] = initial;
    return [state.values[index], (value: unknown) => { state.values[index] = typeof value === "function" ? (value as (previous: unknown) => unknown)(state.values[index]) : value; }];
  },
}));
vi.mock("@/components/success-toast", () => ({ SuccessToast: () => null, useSuccessToast: () => ({ notice: null, notify: vi.fn() }) }));
vi.mock("@/lib/auth-api", async (original) => ({ ...await original<typeof import("@/lib/auth-api")>(), signup: state.signup, requestEmailVerification: state.resend }));
import { SignupForm } from "./signup-form";

beforeEach(() => { vi.clearAllMocks(); state.hook = 0; state.values = [" USER@EXAMPLE.COM ", "  별이  ", "PARENT", "password123"]; });
async function submit() {
  const section = SignupForm() as ReactElement<{ children: ReactElement[] }>;
  const container = section.props.children[1] as ReactElement<{ children: ReactElement[] }>;
  const form = container.props.children[1] as ReactElement<{ onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> }>;
  await form.props.onSubmit({ preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>);
}
describe("signup submission", () => {
  it("sends normalized email, displayed name and selected type", async () => {
    state.signup.mockResolvedValue({});
    await submit();
    expect(state.signup).toHaveBeenCalledWith({ email: "user@example.com", password: "password123", displayName: "별이", usageType: "PARENT" });
  });
  it("does not submit when the new fields are missing", async () => {
    state.values[1] = " "; state.values[2] = "";
    await submit();
    expect(state.signup).not.toHaveBeenCalled();
  });
});


describe("signup state transitions", () => {
  it("keeps input values and offers the form again after an API failure", async () => {
    state.signup.mockRejectedValue(new Error("unavailable"));
    await submit();
    state.hook = 0;
    const section = SignupForm() as ReactElement<{ children: ReactElement[] }>;
    const container = section.props.children[1] as ReactElement<{ children: ReactElement[] }>;
    const form = container.props.children[1] as ReactElement<{ children: ReactElement[] }>;
    const profile = form.props.children[0] as ReactElement<{ displayName: string; usageType: string }>;
    expect(profile.props.displayName).toBe("  별이  ");
    expect(profile.props.usageType).toBe("PARENT");
    expect(state.values[0]).toBe(" USER@EXAMPLE.COM ");
    expect(state.values[3]).toBe("password123");
    expect(state.values[6]).toBeTruthy();
    expect(state.values[7]).toBe(false);
  });
  it("shows verification pending after success and resends to the registered email", async () => {
    state.signup.mockResolvedValue({}); state.resend.mockResolvedValue({});
    await submit();
    state.hook = 0;
    const section = SignupForm() as ReactElement<{ children: ReactElement[] }>;
    expect((section.props.children[3] as ReactElement<{ children: string }>).props.children).toBe("인증 메일을 확인해 주세요");
    const resend = section.props.children[6] as ReactElement<{ onClick: () => Promise<void> }>;
    await resend.props.onClick();
    expect(state.resend).toHaveBeenCalledWith("user@example.com");
    expect(state.values[9]).toBe(false);
  });
});
