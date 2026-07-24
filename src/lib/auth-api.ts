export type EmailVerificationStatus = "UNVERIFIED" | "VERIFIED" | string;

export type SignupRequest = {
  email: string;
  password: string;
};

export type SignupResponse = {
  userId: string;
  emailVerificationStatus: EmailVerificationStatus;
};

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

export type EmailVerificationRequestResponse = {
  emailVerificationStatus: EmailVerificationStatus;
};

export type EmailVerificationConfirmResponse = {
  userId: string;
  emailVerificationStatus: EmailVerificationStatus;
};

export type PasswordResetRequest = { email: string };
export type PasswordResetConfirmRequest = { token: string; password: string };

export class AuthApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

const reviewUserId = "review-user-001";
const reviewExpiry = "2026-07-13T18:00:00+09:00";

export async function signup(request: SignupRequest): Promise<SignupResponse> {
  void request;
  return { userId: reviewUserId, emailVerificationStatus: "UNVERIFIED" };
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  void request;
  return { userId: reviewUserId, emailVerificationStatus: "VERIFIED", accessTokenExpiresAt: reviewExpiry, refreshTokenExpiresAt: reviewExpiry };
}

export async function requestEmailVerification(email: string): Promise<EmailVerificationRequestResponse> {
  void email;
  return { emailVerificationStatus: "UNVERIFIED" };
}

export async function confirmEmailVerification(token: string): Promise<EmailVerificationConfirmResponse> {
  void token;
  return { userId: reviewUserId, emailVerificationStatus: "VERIFIED" };
}

export async function requestPasswordReset(request: PasswordResetRequest): Promise<void> { void request; }

export async function confirmPasswordReset(request: PasswordResetConfirmRequest): Promise<void> { void request; }
