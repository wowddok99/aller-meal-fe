import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordResetRequestForm } from "@/components/auth/password-reset-form";

export default function PasswordResetPage() {
  return <AuthShell showDescription={false} showSecurityNotice={false} compact><PasswordResetRequestForm /></AuthShell>;
}
