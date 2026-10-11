import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordResetConfirmForm } from "@/components/auth/password-reset-form";

export default async function PasswordResetConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <AuthShell showDescription={false} showSecurityNotice={false} compact><PasswordResetConfirmForm initialToken={token} /></AuthShell>;
}
