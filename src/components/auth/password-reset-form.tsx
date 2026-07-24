"use client";

import { AlertCircle, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthApiError, confirmPasswordReset, requestPasswordReset } from "@/lib/auth-api";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errorMessage(error: unknown, action: "request" | "confirm") {
  if (!(error instanceof AuthApiError)) return "네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
  if (error.status === 429) return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  if (action === "confirm" && [400, 404, 409, 422].includes(error.status)) return "재설정 링크가 올바르지 않거나 만료되었습니다. 새 링크를 요청해 주세요.";
  return error.message;
}

export function PasswordResetRequestForm() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized || normalized.length > 320 || !emailPattern.test(normalized)) {
      setFieldError("올바른 이메일 형식으로 입력해 주세요.");
      return;
    }
    setFieldError(""); setError(""); setLoading(true);
    try {
      await requestPasswordReset({ email: normalized });
      setSubmitted(true);
    } catch (caught) {
      setError(errorMessage(caught, "request"));
    } finally { setLoading(false); }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-8">
      <h1 className="text-3xl font-extrabold tracking-[-0.04em]">비밀번호 재설정</h1>
      <p className="mt-1 text-base font-medium leading-7 text-zinc-500 dark:text-zinc-400">가입한 이메일로 비밀번호 재설정 링크를 보내드려요.</p>
      <form className="mt-6 flex flex-col gap-4" noValidate onSubmit={submit}>
        <label className="flex flex-col gap-2" htmlFor="reset-email"><span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">이메일</span><span className={`flex h-12 items-center gap-3 rounded-[10px] border bg-white px-4 transition focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/15 dark:bg-[#0b0f13] ${fieldError ? "border-red-500" : "border-zinc-200 dark:border-zinc-700"}`}><Mail className="h-5 w-5 text-zinc-400"/><input id="reset-email" type="email" autoComplete="email" maxLength={320} disabled={loading} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" className="h-full min-w-0 flex-1 bg-transparent font-semibold outline-none placeholder:text-zinc-400" /></span>{fieldError ? <span className="text-[13px] font-semibold text-red-600 dark:text-red-400">{fieldError}</span> : null}</label>
        <button disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-[10px] bg-mint-500 font-extrabold text-white transition hover:bg-mint-600 active:scale-[0.98] disabled:bg-zinc-300">{loading ? <LoaderCircle className="h-5 w-5 animate-spin"/> : null}{loading ? "요청 중" : "재설정 메일 받기"}</button>
      </form>
      {error ? <p role="alert" className="mt-4 flex gap-2 rounded-[10px] border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"><AlertCircle className="h-5 w-5 shrink-0"/>{error}</p> : null}
      {submitted ? <div role="status" className="mt-4 flex gap-3 rounded-[10px] border border-mint-500/30 bg-mint-500/10 p-4"><CheckCircle2 className="h-6 w-6 shrink-0 text-mint-600"/><div><p className="font-extrabold">입력한 이메일로 안내를 보냈어요</p><p className="mt-1 text-sm font-medium text-zinc-500">보안을 위해 가입 여부와 관계없이 같은 안내를 보여줘요.</p></div></div> : null}
    </section>
  );
}

export function PasswordResetConfirmForm({ initialToken }: { initialToken: string }) {
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedToken = token.trim();
    if (!normalizedToken || normalizedToken.length > 512) { setFieldError("이메일로 받은 재설정 링크를 확인해 주세요."); return; }
    if (!password.trim() || password.length < 8) { setFieldError("비밀번호를 8자 이상 입력해 주세요."); return; }
    setFieldError(""); setError(""); setLoading(true);
    try { await confirmPasswordReset({ token: normalizedToken, password }); setSuccess(true); }
    catch (caught) { setError(errorMessage(caught, "confirm")); }
    finally { setLoading(false); }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-8">
      <h1 className="text-2xl font-extrabold tracking-[-0.03em]">새 비밀번호 설정</h1>
      <p className="mt-2 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">이메일로 받은 링크를 확인하고 새 비밀번호를 입력해 주세요.</p>
      {success ? <div className="mt-7 flex flex-col gap-5 rounded-[10px] border border-mint-500/30 bg-mint-500/10 p-5"><div className="flex gap-3"><CheckCircle2 className="h-6 w-6 text-mint-600"/><div><p className="font-extrabold">비밀번호가 변경됐어요</p><p className="mt-1 text-sm font-medium text-zinc-500">새 비밀번호로 로그인할 수 있어요.</p></div></div><Link href="/auth/login" className="flex h-11 items-center justify-center rounded-[10px] bg-mint-500 text-sm font-extrabold text-white">로그인으로 이동</Link></div> : <form className="mt-7 flex flex-col gap-4" noValidate onSubmit={submit}>
        <label className="flex flex-col gap-2"><span className="text-sm font-semibold">인증 토큰</span><span className="flex h-12 items-center gap-3 rounded-[10px] border border-zinc-200 px-4 transition focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/15 dark:border-zinc-700 dark:bg-[#0b0f13]"><LockKeyhole className="h-5 w-5 text-zinc-400"/><input value={token} onChange={(e) => setToken(e.target.value)} maxLength={512} disabled={loading} placeholder="이메일로 받은 인증 링크의 토큰" className="h-full min-w-0 flex-1 bg-transparent font-semibold outline-none placeholder:text-zinc-400"/></span></label>
        <label className="flex flex-col gap-2"><span className="text-sm font-semibold">새 비밀번호</span><span className="flex h-12 items-center gap-3 rounded-[10px] border border-zinc-200 px-4 transition focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/15 dark:border-zinc-700 dark:bg-[#0b0f13]"><LockKeyhole className="h-5 w-5 text-zinc-400"/><input type={show ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} placeholder="8자 이상 입력해 주세요" className="h-full min-w-0 flex-1 bg-transparent font-semibold outline-none placeholder:text-zinc-400"/><button type="button" onClick={() => setShow((v) => !v)} className="rounded-md p-1 text-zinc-400 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:hover:text-zinc-200" aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}>{show ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}</button></span></label>
        {fieldError ? <p className="text-[13px] font-semibold text-red-600">{fieldError}</p> : null}
        {error ? <div role="alert" className="flex flex-col gap-3 rounded-[10px] border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-800"><span className="flex gap-2"><AlertCircle className="h-5 w-5 shrink-0"/>{error}</span><Link href="/auth/password-reset" className="font-extrabold underline">새 링크 요청하기</Link></div> : null}
        <button disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-[10px] bg-mint-500 font-extrabold text-white transition hover:bg-mint-600 active:scale-[0.98] disabled:opacity-50">{loading ? <LoaderCircle className="h-5 w-5 animate-spin"/> : null}{loading ? "변경 중" : "비밀번호 변경"}</button>
      </form>}
    </section>
  );
}
