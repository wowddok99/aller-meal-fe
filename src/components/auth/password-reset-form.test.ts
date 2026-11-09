import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PasswordResetConfirmForm } from "./password-reset-form";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

describe("password reset confirmation", () => {
  it("asks only for a new password without rendering the email link's token", () => {
    const token = "test-only-reset-secret";
    const markup = renderToStaticMarkup(React.createElement(PasswordResetConfirmForm, { initialToken: token }));

    expect(markup).not.toContain(token);
    expect(markup).not.toContain("인증 토큰");
    expect(markup).toContain('autoComplete="new-password"');
    expect(markup.match(/<input\b/g)).toHaveLength(1);
    expect(markup).toContain("비밀번호 변경");
  });

  it.each([
    ["missing", ""],
    ["blank", "   "],
    ["overlong", "x".repeat(513)],
  ])("offers a new link instead of a change form for a %s token", (_description, token) => {
    const markup = renderToStaticMarkup(React.createElement(PasswordResetConfirmForm, { initialToken: token }));

    expect(markup).not.toContain("<form");
    expect(markup).not.toContain("<input");
    expect(markup).toContain("인증 링크를 확인해 주세요");
    expect(markup).toContain('href="/auth/password-reset"');
    expect(markup).toContain("새 링크 요청하기");
  });
});
