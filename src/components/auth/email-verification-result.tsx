"use client";

import { SuccessToast, useSuccessToast } from "@/components/success-toast";

import {
  Info,
  LoaderCircle,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { PageHeading } from "@/components/page-heading";
import {
  AuthApiError,
  confirmEmailVerification,
  getAuthErrorMessage,
} from "@/lib/auth-api";

type ResultState = "ready" | "loading" | "success" | "error" | "missing";

export function EmailVerificationResult({ token }: { token?: string }) {
  const [state, setState] = useState<ResultState>(token ? "ready" : "missing");
  const confirming = useRef(false);
  const [message, setMessage] = useState("");
  const [transportFailure, setTransportFailure] = useState(false);
  const { notice, notify } = useSuccessToast();

  const handleConfirm = async () => {
    if (!token || confirming.current) return;
    confirming.current = true;
    setState("loading");
    try {
      const response = await confirmEmailVerification(token);
      if (response.emailVerificationStatus === "VERIFIED") {
        setState("success");
        notify("이메일 인증이 완료되었습니다.");
      } else {
        setMessage("이메일 인증이 완료되지 않았습니다. 로그인 화면에서 인증 메일을 다시 요청해 주세요.");
        setState("error");
      }
    } catch (error) {
      const unavailable = !(error instanceof AuthApiError) || error.status === 0 || error.status >= 500;
      setTransportFailure(unavailable);
      setMessage(unavailable ? "잠시 후 인증 링크를 다시 열어 주세요. 인증 메일은 로그인 화면에서 다시 요청할 수 있습니다." : getAuthErrorMessage(error, "email-verification-confirm"));
      setState("error");
    } finally {
      confirming.current = false;
    }
  };


  return (
    <>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#101419] sm:p-8">
        <div className="mb-6"><PageHeading title="이메일 인증" parents={[{ label: "회원가입", href: "/auth/signup" }]} /></div>
        {state === "ready" ? (
          <ResultPanel compact icon={<Mail className="h-6 w-6" />} iconClass="bg-mint-500/10 text-mint-600 dark:text-mint-400" title="이메일을 인증해 주세요" description="아래 버튼을 눌러 이메일 인증을 완료해 주세요.">
            <button type="button" onClick={() => void handleConfirm()} className="mt-7 flex h-12 w-full items-center justify-center rounded-[10px] bg-mint-500 px-5 text-sm font-extrabold text-white transition hover:bg-mint-600">이메일 인증하기</button>
          </ResultPanel>
        ) : state === "loading" ? (
          <ResultPanel
            compact
            icon={<LoaderCircle className="h-6 w-6 animate-spin" />}
            iconClass="bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
            title="이메일 인증을 확인하고 있어요"
            description="잠시만 기다려 주세요. 인증 링크의 유효성을 확인하고 있습니다."
          />
        ) : state === "success" ? (
          <ResultPanel
            compact
            icon={<Mail className="h-6 w-6" />}
            iconClass="bg-mint-500/10 text-mint-600 dark:text-mint-400"
            title="이메일 인증이 완료되었습니다"
            description="로그인하고 AllerMeal 서비스를 이용해 주세요."
          >
            <div className="mt-7">
              <Link href="/auth/login" className="flex h-12 w-full items-center justify-center rounded-[10px] bg-mint-500 px-5 text-sm font-extrabold text-white transition hover:bg-mint-600 active:scale-[0.98]">
                로그인으로 이동
              </Link>
            </div>
          </ResultPanel>
        ) : (
          <ResultPanel
            compact
            icon={<Info aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />}
            iconClass="bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
            title={state === "missing" ? "인증 링크로 접속해 주세요" : transportFailure ? "이메일 인증을 확인하지 못했어요" : "인증 링크를 확인해 주세요"}
            description={state === "missing" ? "이메일에서 받은 인증 링크로 다시 접속하거나 로그인 화면에서 인증 메일을 다시 요청해 주세요." : message === "인증 링크가 올바르지 않거나 만료되었습니다. 새 인증 메일을 요청해 주세요." ? "인증 링크가 올바르지 않거나 만료되었습니다. 로그인 화면에서 인증 메일을 다시 요청해 주세요." : message}
          >
            <Link href="/auth/login" className="mt-7 flex h-12 w-full items-center justify-center rounded-[10px] bg-mint-500 px-5 text-sm font-extrabold text-white transition hover:bg-mint-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500">로그인으로 이동</Link>
          </ResultPanel>
        )}
      </section>
      <SuccessToast notice={notice} />
    </>
  );
}

function ResultPanel({ icon, iconClass, title, description, children, compact = false, centered = false }: { icon: React.ReactNode; iconClass: string; title: string; description: string; children?: React.ReactNode; compact?: boolean; centered?: boolean }) {
  return (
    <div className={compact || centered ? "text-center" : undefined}>
      <span className={`flex items-center justify-center rounded-full ${compact ? "mx-auto h-12 w-12" : centered ? "mx-auto h-14 w-14" : "h-16 w-16"} ${iconClass}`}>{icon}</span>
      <div className={compact ? "mt-3 min-w-0" : "mt-6 min-w-0"}>
        <h2 className={compact ? "text-base font-bold text-zinc-800 dark:text-zinc-100" : "text-2xl font-extrabold tracking-[-0.03em] sm:text-[28px]"}>{title}</h2>
        <p className={`mt-2 leading-6 text-zinc-500 dark:text-zinc-400 ${compact ? "text-sm" : "text-base font-medium"}`}>{description}</p>
        {children}
      </div>
    </div>
  );
}
