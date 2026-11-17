import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginLink } from "./login-link";

const state = vi.hoisted(() => ({
  onNavigate: undefined as undefined | ((event: { preventDefault: () => void }) => void),
  push: vi.fn(), replace: vi.fn(), requestLeave: vi.fn((action: () => void) => action()),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/children/child-1/meals",
  useSearchParams: () => new URLSearchParams("date=2026-11-09&mode=daily"),
  useRouter: () => ({ push: state.push, replace: state.replace }),
}));
vi.mock("@/components/member/edit-navigation-guard", () => ({ useEditNavigation: () => ({ requestLeave: state.requestLeave }) }));
vi.mock("@/components/member/guarded-link", () => ({
  GuardedLink: ({ href, children, onNavigate }: { href: string; children: React.ReactNode; onNavigate?: typeof state.onNavigate }) => {
    state.onNavigate = onNavigate;
    return React.createElement("a", { href }, children);
  },
}));

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); state.onNavigate = undefined; });

describe("login entry links", () => {
  it("includes the current child and meal query in the rendered destination", () => {
    const markup = renderToStaticMarkup(React.createElement(LoginLink, null, "로그인"));
    expect(markup).toContain("/auth/login?next=%2Fchildren%2Fchild-1%2Fmeals%3Fdate%3D2026-11-09%26mode%3Ddaily");
  });

  it("reads the current fragment at navigation time and keeps the unsaved-change guard", () => {
    renderToStaticMarkup(React.createElement(LoginLink, null, "로그인"));
    vi.stubGlobal("window", { location: { pathname: "/children/child-1/meals", search: "?date=2026-11-09&mode=daily", hash: "#lunch" } });
    const preventDefault = vi.fn();
    state.onNavigate?.({ preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(state.requestLeave).toHaveBeenCalledOnce();
    expect(state.push).toHaveBeenCalledWith("/auth/login?next=%2Fchildren%2Fchild-1%2Fmeals%3Fdate%3D2026-11-09%26mode%3Ddaily%23lunch", { scroll: undefined });
  });

  it("keeps a general public-page login free of a forced destination", () => {
    const markup = renderToStaticMarkup(React.createElement(LoginLink, { preserveDestination: false }, "로그인"));
    expect(markup).toContain('href="/auth/login"');
    expect(markup).not.toContain("?next=");
  });
});
