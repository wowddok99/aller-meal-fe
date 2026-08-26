import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  description: "AllerMeal 계정을 만들고 이메일 인증을 진행하세요.",
};

export default function SignupPage() {
  return (
    <AuthShell showDescription={false} showSecurityNotice={false} compact>
      <SignupForm />
    </AuthShell>
  );
}
