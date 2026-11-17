import type { FormEvent, ReactElement } from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ login: vi.fn(), push: vi.fn(), refresh: vi.fn(), hook: 0 }));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (initial: unknown) => {
    state.hook += 1;
    return [state.hook === 1 ? " USER@EXAMPLE.COM " : state.hook === 2 ? "password123" : initial, vi.fn()];
  },
  useRef: (initial: unknown) => ({ current: initial }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: state.push, refresh: state.refresh }) }));
vi.mock("@/lib/auth-api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/auth-api")>(),
  login: state.login,
}));

import { LoginForm } from "./login-form";

beforeEach(() => { vi.clearAllMocks(); state.hook = 0; });
afterEach(() => { vi.unstubAllGlobals(); });

async function submit(next: string) {
  vi.stubGlobal("window", { location: { search: `?next=${encodeURIComponent(next)}`, origin: "https://allermeal.test" } });
  const section = LoginForm() as ReactElement<{ children: ReactElement[] }>;
  const form = section.props.children[1] as ReactElement<{ onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> }>;
  const preventDefault = vi.fn();
  await form.props.onSubmit({ preventDefault } as unknown as FormEvent<HTMLFormElement>);
  expect(preventDefault).toHaveBeenCalledOnce();
}

describe("login submission navigation", () => {
  it("uses the returned pending status before an original child destination", async () => {
    state.login.mockResolvedValue({ userStatus: "WITHDRAWAL_PENDING", sessionId: "session-1" });
    await submit("/children/child-1/meals?date=2026-11-09&mode=daily#lunch");
    expect(state.login).toHaveBeenCalledWith({ email: "user@example.com", password: "password123", rememberMe: false });
    expect(state.push).toHaveBeenCalledWith("/account/withdrawal");
    expect(state.refresh).toHaveBeenCalledOnce();
  });

  it("keeps a normal account's original child date and fragment", async () => {
    state.login.mockResolvedValue({ userStatus: "ACTIVE" });
    const next = "/children/child-1/meals?date=2026-11-09&mode=daily#lunch";
    await submit(next);
    expect(state.push).toHaveBeenCalledWith(next);
    expect(state.refresh).toHaveBeenCalledOnce();
  });

  it("does not navigate when authentication fails", async () => {
    state.login.mockRejectedValue(new Error("Request failed"));
    await submit("/children/child-1/meals");
    expect(state.push).not.toHaveBeenCalled();
    expect(state.refresh).not.toHaveBeenCalled();
  });
});
