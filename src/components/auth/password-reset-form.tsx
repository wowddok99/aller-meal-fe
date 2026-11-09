"use client";

import { ApiNotice } from "@/components/api-notice";

import { SuccessToast, useSuccessToast } from "@/components/success-toast";

import { Check, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { confirmPasswordReset, getAuthErrorMessage, requestPasswordReset } from "@/lib/auth-api";
import { PageHeading } from "@/components/page-heading";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PasswordResetRequestForm() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const { notice, notify } = useSuccessToast();
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized || normalized.length > 320 || !emailPattern.test(normalized)) {
      setFieldError("올바른 이메일 형식으로 입력해 주세요.");
      return;
    }
    setFieldError(""); setError(""); notify(""); setLoading(true);
    try {
      await requestPasswordReset({ email: normalized });
      notify("입력한 이메일로 안내를 보냈어요");
    } catch (caught) {
      setError(getAuthErrorMessage(caught, "password-reset-request"));
    } finally { setLoading(false); }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-8">
      <PageHeading title="비밀번호 재설정" description="가입한 이메일로 비밀번호 재설정 링크를 보내드려요." parents={[{ label: "로그인", href: "/auth/login" }]} />
      <form className="mt-6 flex flex-col gap-4" noValidate onSubmit={submit}>
        <label className="flex flex-col gap-2" htmlFor="reset-email"><span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">이메일</span><span className={`flex h-12 items-center gap-3 rounded-[10px] border bg-white px-4 transition focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/15 dark:bg-[#0b0f13] ${fieldError ? "border-red-500" : "border-zinc-200 dark:border-zinc-700"}`}><Mail className="h-5 w-5 text-zinc-400"/><input id="reset-email" type="email" autoComplete="email" maxLength={320} disabled={loading} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" className="auth-autofill h-full min-w-0 flex-1 bg-transparent font-semibold outline-none placeholder:text-zinc-400" /></span>{fieldError ? <span className="text-[13px] font-semibold text-red-600 dark:text-red-400">{fieldError}</span> : null}</label>
        <button disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-[10px] bg-mint-500 font-extrabold text-white transition hover:bg-mint-600 active:scale-[0.98] disabled:bg-zinc-300">{loading ? <LoaderCircle className="h-5 w-5 animate-spin"/> : null}{loading ? "요청 중" : "재설정 메일 받기"}</button>
      </form>
      {error ? <div className="mt-4 rounded-[10px] bg-zinc-50 px-4 py-3 dark:bg-zinc-900/60"><ApiNotice title={error} /></div> : null}
      <SuccessToast notice={notice} />
    </section>
  );
}

export function PasswordResetConfirmForm({ initialToken }: { initialToken: string }) {
  const token = initialToken.trim();
  const hasUsableToken = token.length > 0 && token.length <= 512;
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { notice, notify } = useSuccessToast();
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasUsableToken) return;
    if (!password.trim() || password.length < 8) { setFieldError("비밀번호를 8자 이상 입력해 주세요."); return; }
    setFieldError(""); setError(""); notify(""); setLoading(true);
    try { await confirmPasswordReset({ token, password }); setSuccess(true); notify("비밀번호가 변경됐어요"); }
    catch (caught) { setError(getAuthErrorMessage(caught, "password-reset-confirm")); }
    finally { setLoading(false); }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-8">
      <PageHeading title="새 비밀번호 설정" parents={[{ label: "로그인", href: "/auth/login" }, { label: "비밀번호 재설정", href: "/auth/password-reset" }]} />
      {!hasUsableToken ? (
        <div className="mt-7">
          <ApiNotice centered title="인증 링크를 확인해 주세요" action={<Link href="/auth/password-reset" className="font-semibold underline underline-offset-4">새 링크 요청하기</Link>}>
            이메일로 받은 비밀번호 재설정 링크로 다시 접속하거나 새 링크를 요청해 주세요.
          </ApiNotice>
        </div>
      ) : success ? (
        <div className="mt-7 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-mint-500/10 text-mint-600 dark:text-mint-400">
            <Check aria-hidden="true" className="h-6 w-6" />
          </span>
          <div className="mt-3 min-w-0">
            <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100">비밀번호가 변경되었습니다</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">새 비밀번호로 로그인해 주세요.</p>
            <div className="mt-7">
              <Link href="/auth/login" className="flex h-12 w-full items-center justify-center rounded-[10px] bg-mint-500 px-5 text-sm font-extrabold text-white transition hover:bg-mint-600 active:scale-[0.98]">
                로그인으로 이동
              </Link>
            </div>
          </div>
        </div>
      ) : <div className="mt-7">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-mint-500/10 text-mint-600 dark:text-mint-400">
            <LockKeyhole aria-hidden="true" className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-base font-bold text-zinc-800 dark:text-zinc-100">새 비밀번호를 설정해 주세요</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">8자 이상의 비밀번호를 입력해 주세요.</p>
        </div>
        <form className="mt-6 flex flex-col gap-4" noValidate onSubmit={submit}>
        <label className="flex flex-col gap-2"><span className="text-sm font-semibold">새 비밀번호</span><span className="flex h-12 items-center gap-3 rounded-[10px] border border-zinc-200 px-4 transition focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/15 dark:border-zinc-700 dark:bg-[#0b0f13]"><LockKeyhole className="h-5 w-5 text-zinc-400"/><input type={show ? "text" : "password"} autoComplete="new-password" placeholder="새 비밀번호를 입력해 주세요" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="auth-autofill h-full min-w-0 flex-1 bg-transparent font-semibold outline-none placeholder:text-zinc-400"/><button type="button" onClick={() => setShow((v) => !v)} className="rounded-md p-1 text-zinc-400 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:hover:text-zinc-200" aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}>{show ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}</button></span></label>
        {fieldError ? <p className="text-[13px] font-semibold text-red-600">{fieldError}</p> : null}
        {error ? <div className="rounded-[10px] bg-zinc-50 px-4 py-3 dark:bg-zinc-900/60"><ApiNotice title={error} action={<Link href="/auth/password-reset" className="font-semibold underline underline-offset-4">새 링크 요청하기</Link>} /></div> : null}
        <button disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-[10px] bg-mint-500 font-extrabold text-white transition hover:bg-mint-600 active:scale-[0.98] disabled:opacity-50">{loading ? <LoaderCircle className="h-5 w-5 animate-spin"/> : null}{loading ? "변경 중" : "비밀번호 변경"}</button>
        </form>
      </div>}
      <SuccessToast notice={notice} />
    </section>
  );
}
