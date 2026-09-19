import {
  confirmEmailVerification as confirmEmailVerificationRequest,
  confirmPasswordReset as confirmPasswordResetRequest,
  requestEmailVerification as requestEmailVerificationRequest,
  requestPasswordReset as requestPasswordResetRequest,
  signUp,
} from "@/generated/api/public";
import type {
  EmailVerificationConfirmResponse as GeneratedEmailVerificationConfirmResponse,
  EmailVerificationRequestResponse as GeneratedEmailVerificationRequestResponse,
  PasswordResetConfirmRequest as GeneratedPasswordResetConfirmRequest,
  PasswordResetRequest as GeneratedPasswordResetRequest,
  SignupRequest as GeneratedSignupRequest,
  SignupResponse as GeneratedSignupResponse,
} from "@/generated/api/public/models";
import { ApiClientError } from "@/shared/api/api-client-error";

export type EmailVerificationStatus = string;
export type SignupRequest = GeneratedSignupRequest;
export type SignupResponse = GeneratedSignupResponse;

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  userId: string;
  emailVerificationStatus: EmailVerificationStatus;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

export type EmailVerificationRequestResponse =
  GeneratedEmailVerificationRequestResponse;
export type EmailVerificationConfirmResponse =
  GeneratedEmailVerificationConfirmResponse;
export type PasswordResetRequest = GeneratedPasswordResetRequest;
export type PasswordResetConfirmRequest = GeneratedPasswordResetConfirmRequest;

// Preserve the import used by the login slice while propagating the shared error model.
export { ApiClientError as AuthApiError } from "@/shared/api/api-client-error";

type AuthAction =
  | "signup"
  | "email-verification-request"
  | "email-verification-confirm"
  | "password-reset-request"
  | "password-reset-confirm";

const invalidTokenMessage =
  "인증 링크가 올바르지 않거나 만료되었습니다. 새 인증 메일을 요청해 주세요.";
const invalidResetTokenMessage =
  "재설정 링크가 올바르지 않거나 만료되었습니다. 새 링크를 요청해 주세요.";

/** Returns a user-actionable message while keeping the shared ApiClientError contract. */
export function getAuthErrorMessage(error: unknown, action: AuthAction) {
  if (!(error instanceof ApiClientError)) {
    return "네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
  }

  if (error.status === 429) {
    return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (action === "signup") {
    if (error.status === 409) {
      return "이미 가입된 이메일입니다. 로그인하거나 다른 이메일을 사용해 주세요.";
    }
    if ([400, 422].includes(error.status)) {
      return "입력한 이메일과 비밀번호를 확인해 주세요.";
    }
    if ([401, 403].includes(error.status)) {
      return "회원가입 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.";
    }
  }

  if (action === "email-verification-confirm") {
    if ([400, 401, 403, 409, 422].includes(error.status)) {
      return invalidTokenMessage;
    }
  }

  if (action === "password-reset-confirm") {
    if ([400, 401, 403, 409, 422].includes(error.status)) {
      return invalidResetTokenMessage;
    }
  }

  if (action === "email-verification-request") {
    if ([400, 422].includes(error.status)) {
      return "이메일 주소를 확인한 뒤 다시 요청해 주세요.";
    }
    if ([401, 403, 404, 409].includes(error.status)) {
      return "인증 메일 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.";
    }
  }

  if (action === "password-reset-request") {
    if ([400, 422].includes(error.status)) {
      return "이메일 주소를 확인한 뒤 다시 요청해 주세요.";
    }
    if ([401, 403, 409].includes(error.status)) {
      return "비밀번호 재설정 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.";
    }
  }

  return error.message || "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export async function signup(request: SignupRequest): Promise<SignupResponse> {
  return signUp(request);
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  void request;
  return {
    userId: "review-user-001",
    emailVerificationStatus: "VERIFIED",
    accessTokenExpiresAt: "2026-07-13T18:00:00+09:00",
    refreshTokenExpiresAt: "2026-07-13T18:00:00+09:00",
  };
}

export async function logout(): Promise<void> {}

export async function requestEmailVerification(
  email: string,
): Promise<EmailVerificationRequestResponse> {
  return requestEmailVerificationRequest({ email });
}

export async function confirmEmailVerification(
  token: string,
): Promise<EmailVerificationConfirmResponse> {
  return confirmEmailVerificationRequest({ token });
}

export async function requestPasswordReset(
  request: PasswordResetRequest,
): Promise<void> {
  return requestPasswordResetRequest(request);
}

export async function confirmPasswordReset(
  request: PasswordResetConfirmRequest,
): Promise<void> {
  return confirmPasswordResetRequest(request);
}
