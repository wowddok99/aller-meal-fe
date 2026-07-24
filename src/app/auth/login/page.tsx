import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "로그인 | AllerMeal",
  description: "로그인하고 자녀별 급식과 알레르기 설정을 관리하세요.",
};

export default function LoginPage() {
  return (
    <AuthShell showDescription={false} showSecurityNotice={false} compact>
      <LoginForm />
    </AuthShell>
  );
}
