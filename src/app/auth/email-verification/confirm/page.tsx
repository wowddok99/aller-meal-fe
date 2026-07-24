import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { EmailVerificationResult } from "@/components/auth/email-verification-result";

export const metadata: Metadata = {
  title: "이메일 인증 결과 | AllerMeal",
  description: "AllerMeal 이메일 인증 결과를 확인하세요.",
};

export default async function EmailVerificationConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; preview?: string | string[] }>;
}) {
  const { token, preview } = await searchParams;
  const normalizedToken = Array.isArray(token) ? token[0] : token;
  const normalizedPreview = Array.isArray(preview) ? preview[0] : preview;
  const previewState = normalizedPreview === "success" || normalizedPreview === "error" ? normalizedPreview : undefined;

  return (
    <AuthShell description="이메일 인증 결과를 확인하세요." showDescription={false} showSecurityNotice={false} showHeader={false} centered compact>
      <EmailVerificationResult token={normalizedToken} previewState={previewState} />
    </AuthShell>
  );
}
