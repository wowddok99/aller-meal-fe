import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ProfileMenuContent } from "./profile-menu";

vi.mock("@/components/theme-toggle", () => ({ ThemeToggle: () => null }));
vi.mock("@/components/member/guarded-link", () => ({
  GuardedLink: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

describe("profile menu account state", () => {
  it("describes a withdrawal reservation without presenting a lookup error", () => {
    const html = renderToStaticMarkup(<ProfileMenuContent displayName="하늘" email="user@example.test" withdrawalPending isLoggingOut={false} onLogout={vi.fn()} />);
    expect(html).toContain("하늘");
    expect(html).toContain("user@example.test");
    expect(html).not.toContain("탈퇴 예약 중");
    expect(html).toContain('href="/account/withdrawal"');
    expect(html).toContain("탈퇴 예약 확인");
    expect(html).not.toContain("계정 정보를 불러오지 못했습니다.");
    expect(html).toContain("로그아웃");
  });

  it("retains the neutral lookup failure for unrelated errors", () => {
    const html = renderToStaticMarkup(<ProfileMenuContent profileFailure="error" isLoggingOut={false} onLogout={vi.fn()} />);
    expect(html).toContain("계정 정보를 불러오지 못했습니다.");
    expect(html).toContain("회원탈퇴");
    expect(html).not.toContain("탈퇴 예약 중");
  });

  it("keeps the ordinary account identity and withdrawal label", () => {
    const html = renderToStaticMarkup(<ProfileMenuContent displayName="하늘" email="member@example.test" isLoggingOut={false} onLogout={vi.fn()} />);
    expect(html).toContain("하늘");
    expect(html).toContain("member@example.test");
    expect(html).toContain("회원탈퇴");
    expect(html).not.toContain("탈퇴 예약 중");
  });
});
