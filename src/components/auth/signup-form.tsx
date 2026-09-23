"use client";

import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { getAuthErrorMessage, requestEmailVerification, signup } from "@/lib/auth-api";
import { ApiClientError } from "@/shared/api/api-client-error";

type FieldErrors = {
  email?: string;
  password?: string;
};

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!email) {
    errors.email = "이메일을 입력해 주세요.";
  } else if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "올바른 이메일 형식으로 입력해 주세요.";
  }

  if (!password) {
    errors.password = "비밀번호를 입력해 주세요.";
  } else if (password.length < 8) {
    errors.password = "비밀번호는 8자 이상이어야 합니다.";
  }

  return errors;
}

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendFailed, setResendFailed] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const errors = validate(normalizedEmail, password);

    setFieldErrors(errors);
    setErrorMessage("");
    setResendMessage("");
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({ email: normalizedEmail, password });
      setEmail(normalizedEmail);
      setRegisteredEmail(normalizedEmail);
    } catch (error) {
      const message = getAuthErrorMessage(error, "signup");
      setErrorMessage(message);
      if (error instanceof ApiClientError && error.status === 409) {
        setFieldErrors({ email: message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail || isResending) {
      return;
    }

    setIsResending(true);
    setResendMessage("");
    setResendFailed(false);
    try {
      await requestEmailVerification(registeredEmail);
      setResendMessage("인증 메일을 다시 보냈습니다. 받은편지함을 확인해 주세요.");
    } catch (error) {
      setResendFailed(true);
      setResendMessage(getAuthErrorMessage(error, "email-verification-request"));
    } finally {
      setIsResending(false);
    }
  };

  const isRegistered = Boolean(registeredEmail);
  if (isRegistered) {
    return (
      <section className="mx-auto w-full max-w-[640px] rounded-2xl border border-zinc-200 bg-white p-5 text-center dark:border-zinc-800 dark:bg-[#101419] md:p-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint-500/10 text-mint-600 dark:text-mint-400">
          <MailCheck className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.02em]">
          인증 메일을 확인해 주세요
        </h1>
        <p className="mt-3 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
          회원가입이 완료되었습니다. 아래 이메일로 보낸 인증 링크를 열어 인증을 완료해 주세요.
        </p>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-left dark:border-zinc-800 dark:bg-[#0b0f13]">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">가입 이메일</p>
          <p className="mt-1 break-all font-extrabold">{registeredEmail}</p>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">이메일 인증</span>
            <span className="inline-flex h-7 items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-extrabold text-amber-700 dark:text-amber-400">
              인증 대기
            </span>
          </div>
        </div>

        <button type="button" onClick={handleResend} disabled={isResending} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-mint-500 px-4 text-sm font-extrabold text-mint-600 transition-colors hover:bg-mint-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-mint-400">
          {isResending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          {isResending ? "보내는 중" : "인증 메일 다시 보내기"}
        </button>
        <Link href="/auth/login" className="mt-3 flex h-12 w-full items-center justify-center rounded-[10px] bg-mint-500 text-sm font-extrabold text-white transition-colors hover:bg-mint-600">로그인으로 이동</Link>
        <p aria-live="polite" className={`mt-4 min-h-5 text-sm font-semibold leading-5 ${resendFailed ? "text-red-600 dark:text-red-400" : "text-mint-600 dark:text-mint-400"}`}>{resendMessage}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[640px] overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419]">
      <div className="p-5 md:p-8">
        <h1 className="text-3xl font-extrabold tracking-[-0.04em]">회원가입</h1>
        <p className="mt-1 text-base font-medium leading-7 text-zinc-500 dark:text-zinc-400">
          이메일과 비밀번호로 계정을 만들어 주세요.
        </p>

        <form className="mt-6 flex flex-col gap-5" noValidate onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2" htmlFor="signup-email">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">이메일</span>
            <span className={`flex h-12 items-center gap-3 rounded-[10px] border bg-white px-4 focus-within:border-mint-500 dark:bg-[#0b0f13] dark:focus-within:border-mint-400 ${fieldErrors.email ? "border-red-500 dark:border-red-500" : "border-zinc-200 dark:border-zinc-700"}`}>
              <Mail className="h-5 w-5 shrink-0 text-zinc-400" strokeWidth={1.8} />
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={320}
                disabled={isSubmitting}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@email.com"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "signup-email-error" : undefined}
                className="h-full min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-70 dark:placeholder:text-zinc-600"
              />
            </span>
            {fieldErrors.email ? <span id="signup-email-error" className="text-[13px] font-semibold text-red-600 dark:text-red-400">{fieldErrors.email}</span> : null}
          </label>

          <label className="flex flex-col gap-2" htmlFor="signup-password">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">비밀번호</span>
            <span className={`flex h-12 items-center gap-3 rounded-[10px] border bg-white px-4 focus-within:border-mint-500 dark:bg-[#0b0f13] dark:focus-within:border-mint-400 ${fieldErrors.password ? "border-red-500 dark:border-red-500" : "border-zinc-200 dark:border-zinc-700"}`}>
              <LockKeyhole className="h-5 w-5 shrink-0 text-zinc-400" strokeWidth={1.8} />
              <input
                id="signup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                disabled={isSubmitting}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8자 이상 입력"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "signup-password-error" : undefined}
                className="h-full min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-70 dark:placeholder:text-zinc-600"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="rounded-md p-1 text-zinc-400 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:hover:text-zinc-200" aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}>
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </span>
            {fieldErrors.password ? <span id="signup-password-error" className="text-[13px] font-semibold text-red-600 dark:text-red-400">{fieldErrors.password}</span> : null}
          </label>

          {errorMessage && !fieldErrors.email ? <p role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300">{errorMessage}</p> : null}

          <button type="submit" disabled={isSubmitting} className="flex h-12 items-center justify-center gap-2 rounded-[10px] bg-mint-500 px-6 text-base font-extrabold text-white transition-colors hover:bg-mint-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500">
            {isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
            {isSubmitting ? "가입 중" : "회원가입"}
          </button>
        </form>

        <div className="mt-5 flex items-center gap-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          또는
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <p className="mt-4 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
          이미 계정이 있나요?{" "}
          <Link href="/auth/login" className="font-extrabold text-mint-600 hover:text-mint-500 dark:text-mint-400">로그인</Link>
        </p>
      </div>
    </section>
  );
}
