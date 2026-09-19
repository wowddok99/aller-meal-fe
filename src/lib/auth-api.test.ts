import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/shared/api/api-client-error";

const publicApi = vi.hoisted(() => ({
  confirmEmailVerification: vi.fn(),
  confirmPasswordReset: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  requestEmailVerification: vi.fn(),
  requestPasswordReset: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/generated/api/public", () => publicApi);

import {
  confirmEmailVerification,
  confirmPasswordReset,
  getAuthErrorMessage,
  login,
  logout,
  requestEmailVerification,
  requestPasswordReset,
  signup,
  shouldTerminateSessionAfterLogout,
} from "./auth-api";

describe("auth-api public adapters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards signup input and preserves the 201 response", async () => {
    const response = { userId: "user-1", emailVerificationStatus: "UNVERIFIED" };
    publicApi.signUp.mockResolvedValue(response);

    await expect(signup({ email: "user@example.com", password: "password123" })).resolves.toBe(response);
    expect(publicApi.signUp).toHaveBeenCalledWith({ email: "user@example.com", password: "password123" });
  });

  it("forwards login input and preserves the cookie-session response", async () => {
    const response = {
      userId: "user-1",
      emailVerificationStatus: "VERIFIED",
      accessTokenExpiresAt: "2026-09-19T12:00:00+09:00",
    };
    publicApi.login.mockResolvedValue(response);

    await expect(login({ email: "user@example.com", password: "password123" })).resolves.toBe(response);
    expect(publicApi.login).toHaveBeenCalledWith({ email: "user@example.com", password: "password123" });
  });

  it("uses the generated logout adapter", async () => {
    publicApi.logout.mockResolvedValue(undefined);

    await expect(logout()).resolves.toBeUndefined();
    expect(publicApi.logout).toHaveBeenCalledWith();
  });

  it.each([
    [new ApiClientError({ status: 401, code: "UNAUTHORIZED", message: "Session ended." }), true],
    [new ApiClientError({ status: 403, code: "FORBIDDEN", message: "Forbidden." }), false],
    [new Error("Network failed."), false],
  ])("ends the client session only for a 401 logout response", (error, expected) => {
    expect(shouldTerminateSessionAfterLogout(error)).toBe(expected);
  });

  it("uses the generated email verification request and confirmation adapters", async () => {
    publicApi.requestEmailVerification.mockResolvedValue({ emailVerificationStatus: "UNVERIFIED" });
    publicApi.confirmEmailVerification.mockResolvedValue({ userId: "user-1", emailVerificationStatus: "VERIFIED" });

    await expect(requestEmailVerification("user@example.com")).resolves.toEqual({ emailVerificationStatus: "UNVERIFIED" });
    await expect(confirmEmailVerification("verification-token")).resolves.toEqual({ userId: "user-1", emailVerificationStatus: "VERIFIED" });
    expect(publicApi.requestEmailVerification).toHaveBeenCalledWith({ email: "user@example.com" });
    expect(publicApi.confirmEmailVerification).toHaveBeenCalledWith({ token: "verification-token" });
  });

  it("uses the generated password reset adapters and preserves 204 responses", async () => {
    publicApi.requestPasswordReset.mockResolvedValue(undefined);
    publicApi.confirmPasswordReset.mockResolvedValue(undefined);

    await expect(requestPasswordReset({ email: "user@example.com" })).resolves.toBeUndefined();
    await expect(confirmPasswordReset({ token: "reset-token", password: "password123" })).resolves.toBeUndefined();
    expect(publicApi.requestPasswordReset).toHaveBeenCalledWith({ email: "user@example.com" });
    expect(publicApi.confirmPasswordReset).toHaveBeenCalledWith({ token: "reset-token", password: "password123" });
  });

  it("preserves ApiClientError from password reset confirmation", async () => {
    const error = new ApiClientError({ status: 422, code: "INVALID_TOKEN", message: "Invalid reset token." });
    publicApi.confirmPasswordReset.mockRejectedValue(error);

    await expect(confirmPasswordReset({ token: "expired-token", password: "password123" })).rejects.toBe(error);
  });

  it.each([
    ["signup", 400, "입력한 이메일과 비밀번호를 확인해 주세요."],
    ["signup", 401, "회원가입 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요."],
    ["signup", 403, "회원가입 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요."],
    ["signup", 409, "이미 가입된 이메일입니다. 로그인하거나 다른 이메일을 사용해 주세요."],
    ["signup", 422, "입력한 이메일과 비밀번호를 확인해 주세요."],
    ["email-verification-request", 400, "이메일 주소를 확인한 뒤 다시 요청해 주세요."],
    ["email-verification-request", 401, "인증 메일 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요."],
    ["email-verification-request", 403, "인증 메일 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요."],
    ["email-verification-request", 404, "인증 메일 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요."],
    ["email-verification-request", 409, "인증 메일 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요."],
    ["email-verification-request", 422, "이메일 주소를 확인한 뒤 다시 요청해 주세요."],
    ["email-verification-confirm", 400, "인증 링크가 올바르지 않거나 만료되었습니다. 새 인증 메일을 요청해 주세요."],
    ["email-verification-confirm", 401, "인증 링크가 올바르지 않거나 만료되었습니다. 새 인증 메일을 요청해 주세요."],
    ["email-verification-confirm", 403, "인증 링크가 올바르지 않거나 만료되었습니다. 새 인증 메일을 요청해 주세요."],
    ["email-verification-confirm", 409, "인증 링크가 올바르지 않거나 만료되었습니다. 새 인증 메일을 요청해 주세요."],
    ["email-verification-confirm", 422, "인증 링크가 올바르지 않거나 만료되었습니다. 새 인증 메일을 요청해 주세요."],
    ["password-reset-request", 400, "이메일 주소를 확인한 뒤 다시 요청해 주세요."],
    ["password-reset-request", 401, "비밀번호 재설정 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요."],
    ["password-reset-request", 403, "비밀번호 재설정 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요."],
    ["password-reset-request", 409, "비밀번호 재설정 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요."],
    ["password-reset-request", 422, "이메일 주소를 확인한 뒤 다시 요청해 주세요."],
    ["password-reset-confirm", 400, "재설정 링크가 올바르지 않거나 만료되었습니다. 새 링크를 요청해 주세요."],
    ["password-reset-confirm", 401, "재설정 링크가 올바르지 않거나 만료되었습니다. 새 링크를 요청해 주세요."],
    ["password-reset-confirm", 403, "재설정 링크가 올바르지 않거나 만료되었습니다. 새 링크를 요청해 주세요."],
    ["password-reset-confirm", 409, "재설정 링크가 올바르지 않거나 만료되었습니다. 새 링크를 요청해 주세요."],
    ["password-reset-confirm", 422, "재설정 링크가 올바르지 않거나 만료되었습니다. 새 링크를 요청해 주세요."],
  ] as const)("maps %s %i to an actionable message", (action, status, expected) => {
    expect(
      getAuthErrorMessage(
        new ApiClientError({ status, code: `HTTP_${status}`, message: "Request failed." }),
        action,
      ),
    ).toBe(expected);
  });
});
