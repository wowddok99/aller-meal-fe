import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordResetConfirmForm } from "@/components/auth/password-reset-form";

export default async function PasswordResetConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <AuthShell description="이메일로 받은 링크를 확인하고 안전한 새 비밀번호를 설정하세요." showSecurityNotice={false} compact><PasswordResetConfirmForm initialToken={token} /></AuthShell>;
}
