import type { SignupRequest, SignupRequestUsageType } from "@/generated/api/public/models";

export type SignupFieldErrors = { email?: string; password?: string; displayName?: string; usageType?: string };
export type SignupInput = { email: string; password: string; displayName: string; usageType: NonNullable<SignupRequestUsageType> | "" };

export function prepareSignup(input: SignupInput): { errors: SignupFieldErrors; request?: SignupRequest } {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  const errors: SignupFieldErrors = {};
  if (!email) errors.email = "이메일을 입력해 주세요.";
  else if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "올바른 이메일 형식으로 입력해 주세요.";
  if (!input.password) errors.password = "비밀번호를 입력해 주세요.";
  else if (input.password.length < 8) errors.password = "비밀번호는 8자 이상이어야 합니다.";
  if (!displayName) errors.displayName = "닉네임을 입력해 주세요.";
  else if (Array.from(displayName).length > 50) errors.displayName = "닉네임은 50자 이하로 입력해 주세요.";
  else if (/[\u0000-\u001f\u007f-\u009f]|[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/.test(displayName)) errors.displayName = "닉네임에 사용할 수 없는 문자가 있습니다.";
  if (input.usageType !== "STUDENT" && input.usageType !== "PARENT") errors.usageType = "가입 유형을 선택해 주세요.";
  if (Object.keys(errors).length || !input.usageType) return { errors };
  return { errors, request: { email, password: input.password, displayName, usageType: input.usageType } };
}
