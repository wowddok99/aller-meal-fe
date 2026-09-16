"use client";

import {
  AlertCircle,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthApiError, login } from "@/lib/auth-api";
import { cancelAccountWithdrawal } from "@/lib/member-api";

type FieldErrors = { email?: string; password?: string };

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!email) {
    errors.email = "이메일을 입력해 주세요.";
  } else if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "올바른 이메일 형식으로 입력해 주세요.";
  }
  if (!password) {
    errors.password = "비밀번호를 입력해 주세요.";
  }

  return errors;
}

function getLoginError(error: unknown) {
  if (!(error instanceof AuthApiError)) {
    return "네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
  }
  if (error.status === 401) {
    return "이메일 또는 비밀번호를 확인해 주세요.";
  }
  if (error.status === 403) {
    return "이메일 인증을 완료한 뒤 로그인해 주세요.";
  }
  if (error.status === 429) {
    return "로그인 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  }
  return error.message;
}

function isNoActiveWithdrawal(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    ((error as { status?: unknown }).status === 404 ||
      (error as { status?: unknown }).status === 409)
  );
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const errors = validate(normalizedEmail, password);

    setFieldErrors(errors);
    setErrorMessage("");
    setNeedsVerification(false);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await login({ email: normalizedEmail, password });
      if (response.emailVerificationStatus !== "VERIFIED") {
        setNeedsVerification(true);
        setErrorMessage("이메일 인증을 완료한 뒤 로그인해 주세요.");
        return;
      }
      try {
        await cancelAccountWithdrawal();
      } catch (error) {
        if (!isNoActiveWithdrawal(error)) {
          setErrorMessage(
            "회원 탈퇴를 취소하지 못했습니다. 잠시 후 다시 로그인해 주세요.",
          );
          return;
        }
      }
      router.push("/children");
      router.refresh();
    } catch (error) {
      setNeedsVerification(
        error instanceof AuthApiError && error.status === 403,
      );
      setErrorMessage(getLoginError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-8">
      <h1 className="text-3xl font-extrabold tracking-[-0.04em]">로그인</h1>
      <p className="mt-1 text-base font-medium leading-7 text-zinc-500 dark:text-zinc-400">
        이메일과 비밀번호를 입력해 주세요.
      </p>
      <form
        className="mt-6 flex flex-col gap-5"
        noValidate
        onSubmit={handleSubmit}
      >
        <label className="flex flex-col gap-2" htmlFor="login-email">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            이메일
          </span>
          <span
            className={`flex h-12 items-center gap-3 rounded-[10px] border bg-white px-4 transition focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/15 dark:bg-[#0b0f13] ${fieldErrors.email ? "border-red-500" : "border-zinc-200 dark:border-zinc-700"}`}
          >
            <Mail
              className="h-5 w-5 shrink-0 text-zinc-400"
              strokeWidth={1.8}
            />
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={320}
              disabled={isSubmitting}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@email.com"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={
                fieldErrors.email ? "login-email-error" : undefined
              }
              className="h-full min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-zinc-400 disabled:opacity-70 dark:placeholder:text-zinc-600"
            />
          </span>
          {fieldErrors.email ? (
            <span
              id="login-email-error"
              className="text-[13px] font-semibold text-red-600 dark:text-red-400"
            >
              {fieldErrors.email}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2" htmlFor="login-password">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            비밀번호
          </span>
          <span
            className={`flex h-12 items-center gap-3 rounded-[10px] border bg-white px-4 transition focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/15 dark:bg-[#0b0f13] ${fieldErrors.password ? "border-red-500" : "border-zinc-200 dark:border-zinc-700"}`}
          >
            <LockKeyhole
              className="h-5 w-5 shrink-0 text-zinc-400"
              strokeWidth={1.8}
            />
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isSubmitting}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력해 주세요"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password ? "login-password-error" : undefined
              }
              className="h-full min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-zinc-400 disabled:opacity-70 dark:placeholder:text-zinc-600"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="rounded-md p-1 text-zinc-400 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:hover:text-zinc-200"
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </span>
          {fieldErrors.password ? (
            <span
              id="login-password-error"
              className="text-[13px] font-semibold text-red-600 dark:text-red-400"
            >
              {fieldErrors.password}
            </span>
          ) : null}
        </label>

        <Link
          href="/auth/password-reset"
          className="-mb-2 -mt-2 self-end text-sm font-bold text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
        >
          비밀번호를 잊으셨나요?
        </Link>

        {errorMessage ? (
          <p
            role="alert"
            className={`flex items-start gap-2 rounded-[10px] border px-4 py-3 text-sm font-semibold ${needsVerification ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300" : "border-red-200 bg-red-50 text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300"}`}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 items-center justify-center gap-2 rounded-[10px] bg-mint-500 px-6 text-base font-extrabold text-white transition hover:bg-mint-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-800"
        >
          {isSubmitting ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : null}
          {isSubmitting ? "로그인 중" : "로그인"}
        </button>
      </form>

      <div className="mt-5 flex items-center gap-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        또는
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <p className="mt-4 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
        계정이 없나요?{" "}
        <Link
          href="/auth/signup"
          className="font-extrabold text-mint-600 hover:text-mint-500 dark:text-mint-400"
        >
          회원가입
        </Link>
      </p>
    </section>
  );
}
