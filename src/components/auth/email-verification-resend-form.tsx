"use client";

import { ApiNotice } from "@/components/api-notice";
import { SuccessToast, useSuccessToast } from "@/components/success-toast";
import { LoaderCircle, Mail } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { getAuthErrorMessage, requestEmailVerification } from "@/lib/auth-api";

/** 기존 인증 메일 재요청 폼을 다른 화면에서 사용할 수 있도록 보존합니다. */
export function EmailVerificationResendForm() {
  const { notice, notify } = useSuccessToast();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleResend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError("올바른 이메일을 입력해 주세요.");
      return;
    }

    setEmailError("");
    notify("");
    setIsResending(true);
    setResendMessage("");
    try {
      await requestEmailVerification(normalizedEmail);
      setEmail(normalizedEmail);
      notify("인증 메일을 다시 보냈습니다. 받은편지함을 확인해 주세요.");
    } catch (error) {
      setResendMessage(getAuthErrorMessage(error, "email-verification-request"));
    } finally {
      setIsResending(false);
    }
  };

  return <>
            <form className="mt-7 border-t border-zinc-200 pt-6 text-left dark:border-zinc-800" onSubmit={handleResend} noValidate>
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
                {resendMessage ? <div className="mt-3 rounded-[10px] bg-zinc-50 px-4 py-3 dark:bg-zinc-900/60"><ApiNotice title={resendMessage} /></div> : null}
              </div>
              <p className="mt-5 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
                다른 이메일로 가입하려면 <Link href="/auth/signup" className="font-extrabold text-mint-600 hover:text-mint-500 dark:text-mint-400">회원가입으로 이동</Link>
              </p>
            </form>
    <SuccessToast notice={notice} />
  </>;
}
