"use client";

import {
  AlertTriangle,
  Check,
  LoaderCircle,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  AuthApiError,
  confirmEmailVerification,
  requestEmailVerification,
} from "@/lib/auth-api";

type ResultState = "loading" | "success" | "error" | "missing";

function errorMessage(error: unknown) {
  if (error instanceof AuthApiError && error.status === 429) {
    return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (error instanceof AuthApiError && error.message) {
    return error.message;
  }
  return "인증 링크가 만료되었거나 올바르지 않습니다.";
}

export function EmailVerificationResult({ token, previewState }: { token?: string; previewState?: "success" | "error" }) {
  const [state, setState] = useState<ResultState>(previewState ?? (token ? "loading" : "missing"));
  const [message, setMessage] = useState(previewState === "error" ? "인증 링크가 만료되었거나 올바르지 않습니다." : "");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendFailed, setResendFailed] = useState(false);

  useEffect(() => {
    if (previewState || !token) return;
    let active = true;

    confirmEmailVerification(token)
      .then((response) => {
        if (!active) return;
        if (response.emailVerificationStatus === "VERIFIED") {
          setState("success");
          return;
        }
        setMessage("이메일 인증이 완료되지 않았습니다. 새 인증 메일을 요청해 주세요.");
        setState("error");
      })
      .catch((error) => {
        if (!active) return;
        setMessage(errorMessage(error));
        setState("error");
      });

    return () => {
      active = false;
    };
  }, [previewState, token]);

  const handleResend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError("올바른 이메일을 입력해 주세요.");
      return;
    }

    setEmailError("");
    setIsResending(true);
    setResendMessage("");
    setResendFailed(false);
    try {
      await requestEmailVerification(normalizedEmail);
      setEmail(normalizedEmail);
      setResendMessage("인증 메일을 다시 보냈습니다. 받은편지함을 확인해 주세요.");
    } catch (error) {
      setResendFailed(true);
      setResendMessage(errorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <section className="rounded-2xl bg-white p-6 shadow-[0_10px_32px_rgba(24,24,27,0.06)] dark:bg-[#101419] dark:shadow-none sm:p-8">
        {state === "loading" ? (
          <ResultPanel
            icon={<LoaderCircle className="h-8 w-8 animate-spin" />}
            iconClass="bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
            title="이메일 인증을 확인하고 있어요"
            description="잠시만 기다려 주세요. 인증 링크의 유효성을 확인하고 있습니다."
          />
        ) : state === "success" ? (
          <ResultPanel
            icon={<Check className="h-8 w-8" strokeWidth={2.6} />}
            iconClass="bg-mint-500/10 text-mint-600 dark:text-mint-400"
            title="이메일 인증이 완료됐어요"
            description="이제 AllerMeal의 서비스를 이용할 수 있어요."
          >
            <div className="mt-7 border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <Link href="/auth/login" className="flex h-12 w-full items-center justify-center rounded-[10px] bg-mint-500 px-5 text-base font-extrabold text-white transition hover:bg-mint-600 active:scale-[0.98]">
                로그인으로 이동
              </Link>
            </div>
          </ResultPanel>
        ) : (
          <ResultPanel
            icon={<AlertTriangle className="h-8 w-8" />}
            iconClass="bg-orange-50 text-orange-500 dark:bg-orange-950/30 dark:text-orange-400"
            title={state === "missing" ? "인증 토큰이 필요해요" : "인증 링크를 확인해 주세요"}
            description={state === "missing" ? "이메일에서 받은 인증 링크로 다시 접속해 주세요." : message}
          >
            <form className="mt-7 border-t border-zinc-200 pt-6 dark:border-zinc-800" onSubmit={handleResend} noValidate>
              <div>
                <label htmlFor="verification-email" className="text-sm font-bold text-zinc-800 dark:text-zinc-200">인증 메일을 받을 이메일</label>
                <span className={`mt-3 flex h-12 w-full items-center gap-3 rounded-[10px] border bg-white px-4 transition dark:bg-[#101419] ${emailError ? "border-red-500" : "border-zinc-200 focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/15 dark:border-zinc-700"}`}>
                  <Mail className="h-5 w-5 shrink-0 text-zinc-400" />
                  <input id="verification-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isResending} placeholder="example@email.com" className="h-full min-w-0 flex-1 bg-transparent font-semibold outline-none placeholder:text-zinc-400" />
                </span>
                {emailError ? <p className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400">{emailError}</p> : null}
                <button disabled={isResending} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-mint-500 px-5 text-sm font-extrabold text-white transition hover:bg-mint-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
                  {isResending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  {isResending ? "보내는 중" : "인증 메일 다시 요청"}
                </button>
                {resendMessage ? <p aria-live="polite" className={`mt-3 text-sm font-semibold ${resendFailed ? "text-red-600 dark:text-red-400" : "text-mint-600 dark:text-mint-400"}`}>{resendMessage}</p> : null}
              </div>
              <p className="mt-5 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
                다른 이메일로 가입하려면 <Link href="/auth/signup" className="font-extrabold text-mint-600 hover:text-mint-500 dark:text-mint-400">회원가입으로 이동</Link>
              </p>
            </form>
          </ResultPanel>
        )}
      </section>
    </>
  );
}

function ResultPanel({ icon, iconClass, title, description, children }: { icon: React.ReactNode; iconClass: string; title: string; description: string; children?: React.ReactNode }) {
  return (
    <div>
      <span className={`flex h-16 w-16 items-center justify-center rounded-full ${iconClass}`}>{icon}</span>
      <div className="mt-6 min-w-0">
        <h1 className="text-2xl font-extrabold tracking-[-0.03em] sm:text-[28px]">{title}</h1>
        <p className="mt-2 text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">{description}</p>
        {children}
      </div>
    </div>
  );
}
