import {
  confirmEmailVerification as confirmEmailVerificationRequest,
  confirmPasswordReset as confirmPasswordResetRequest,
  login as loginRequest,
  logout as logoutRequest,
  requestEmailVerification as requestEmailVerificationRequest,
  requestPasswordReset as requestPasswordResetRequest,
  signUp,
} from "@/generated/api/public";
import type {
  EmailVerificationConfirmResponse as GeneratedEmailVerificationConfirmResponse,
  EmailVerificationRequestResponse as GeneratedEmailVerificationRequestResponse,
  LoginRequest as GeneratedLoginRequest,
  LoginResponse as GeneratedLoginResponse,
  PasswordResetConfirmRequest as GeneratedPasswordResetConfirmRequest,
  PasswordResetRequest as GeneratedPasswordResetRequest,
  SignupRequest as GeneratedSignupRequest,
  SignupResponse as GeneratedSignupResponse,
} from "@/generated/api/public/models";
import { ApiClientError } from "@/shared/api/api-client-error";
import { withAuthSessionTransition } from "@/shared/api/orval-mutator";

export type EmailVerificationStatus = string;
export type SignupRequest = GeneratedSignupRequest;
export type SignupResponse = GeneratedSignupResponse;

export type LoginRequest = GeneratedLoginRequest;
export type LoginResponse = GeneratedLoginResponse;

export type EmailVerificationRequestResponse =
  GeneratedEmailVerificationRequestResponse;
export type EmailVerificationConfirmResponse =
  GeneratedEmailVerificationConfirmResponse;
export type PasswordResetRequest = GeneratedPasswordResetRequest;
export type PasswordResetConfirmRequest = GeneratedPasswordResetConfirmRequest;

// Preserve the import used by the login slice while propagating the shared error model.
export { ApiClientError as AuthApiError } from "@/shared/api/api-client-error";

/** A 401 may indicate a different session, so it cannot prove logout succeeded. */
export function shouldTerminateSessionAfterLogout(error: unknown) {
  return error instanceof ApiClientError && error.status === 401 && error.sessionExpired;
}

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
  return withAuthSessionTransition(() => loginRequest(request), "login");
}

export async function logout(): Promise<void> {
  return withAuthSessionTransition((sessionId) => {
    if (!sessionId) throw new ApiClientError({ status: 0, code: "SESSION_CHANGED", message: "로그인 상태가 변경되었습니다. 다시 확인해 주세요." });
    return logoutRequest({ headers: { "X-Expected-Session-Id": sessionId } });
  }, "logout");
}

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
