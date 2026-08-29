"use client";

import { AlertTriangle, Check, CheckCircle2, Clipboard, Info, LoaderCircle, Shield, UserRoundCog } from "lucide-react";
import { useState } from "react";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PREVIEW_USER_ID = "8f3a0000-0000-4000-8000-000000007b9c";

function isValidUserId(value: string) { return UUID_PATTERN.test(value.trim()); }
function compactUserId(value: string) { const normalized = value.trim(); return normalized.length > 12 ? `${normalized.slice(0, 8)}...${normalized.slice(-4)}` : normalized; }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "medium", hour12: false }).format(new Date(value)); }

export function AdminUserRole({ userId = PREVIEW_USER_ID }: { userId?: string }) {
  const [inputUserId, setInputUserId] = useState(userId);
  const [fieldError, setFieldError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successAt, setSuccessAt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const normalizedUserId = inputUserId.trim();
  const valid = isValidUserId(normalizedUserId);

  const copyUserId = async () => {
    if (!normalizedUserId || !navigator.clipboard) return;
    await navigator.clipboard.writeText(normalizedUserId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  const requestPromotion = () => {
    setSuccessAt(null); setError("");
    if (!valid) { setFieldError("UUID 형식의 사용자 ID를 입력해 주세요."); return; }
    setFieldError(""); setConfirming(true);
  };
  const confirmPromotion = () => {
    setConfirming(false); setSaving(true); setError("");
    window.setTimeout(() => {
      setSaving(false);
      if (normalizedUserId === "00000000-0000-4000-8000-000000000000") { setError("사용자 권한을 변경하지 못했습니다. 잠시 후 다시 시도해 주세요."); return; }
      setSuccessAt(new Date().toISOString());
    }, 700);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
      <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">사용자 ID를 직접 입력해 관리자 권한을 부여하세요.</p>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-7">
        <div className="flex items-start gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500"><Shield className="h-8 w-8" /></span><div className="min-w-0"><h1 className="text-2xl font-extrabold tracking-[-0.03em]">사용자 권한 변경</h1><p className="mt-2 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">사용자 ID를 직접 입력해 운영 권한을 변경합니다.</p><div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-bold"><span className="text-zinc-500 dark:text-zinc-400">변경 대상 역할</span><span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-amber-600 dark:text-amber-300">관리자</span></div></div></div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-7">
        <div className="flex items-center gap-3"><UserRoundCog className="h-6 w-6 text-mint-500" /><h2 className="text-xl font-extrabold">권한 변경 입력</h2></div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="text-sm font-bold" htmlFor="admin-role-user-id">사용자 ID<div className="relative mt-2"><input id="admin-role-user-id" value={inputUserId} onChange={(event) => { setInputUserId(event.target.value); setFieldError(""); setError(""); setSuccessAt(null); }} placeholder="사용자 ID를 입력해 주세요" aria-invalid={Boolean(fieldError)} className={`h-14 w-full rounded-[10px] border bg-transparent px-4 pr-12 font-mono text-sm font-semibold outline-none transition-colors placeholder:font-sans placeholder:text-zinc-400 focus:border-mint-500 ${fieldError ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"}`} /><button type="button" onClick={() => void copyUserId()} disabled={!normalizedUserId} aria-label="사용자 ID 복사" className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-mint-600 disabled:opacity-40 dark:hover:bg-zinc-800">{copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}</button></div>{fieldError ? <span role="alert" className="mt-2 block text-sm font-bold text-red-600 dark:text-red-400">{fieldError}</span> : <span className="mt-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">예: 8f3a...7b9c (UUID 형식)</span>}</label>
          <div className="text-sm font-bold"><span>부여할 역할</span><div className="mt-2 flex h-14 items-center rounded-[10px] border border-zinc-200 bg-zinc-50 px-4 text-base font-extrabold dark:border-zinc-800 dark:bg-zinc-900/60">관리자</div><span className="mt-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">고정 역할</span></div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800"><button type="button" onClick={() => { setInputUserId(""); setFieldError(""); setError(""); setSuccessAt(null); }} className="h-12 rounded-[10px] border border-zinc-300 px-6 text-sm font-extrabold hover:border-zinc-500 dark:border-zinc-700">입력 초기화</button><button type="button" onClick={requestPromotion} disabled={saving} className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-mint-500 px-6 text-sm font-extrabold text-white transition-colors hover:bg-mint-600 disabled:cursor-wait disabled:opacity-50">{saving ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}{saving ? "저장 중" : "관리자 권한 부여"}</button></div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-7"><div className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-mint-500" /><h2 className="text-xl font-extrabold">권한 변경 확인</h2></div><div className="mt-5 grid gap-5 lg:grid-cols-2">
        {confirming ? <div role="dialog" aria-modal="true" aria-labelledby="admin-role-confirm-title" className="rounded-xl border border-amber-500/70 bg-amber-500/5 p-5"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-500"><AlertTriangle className="h-5 w-5" /></span><div><h3 id="admin-role-confirm-title" className="text-lg font-extrabold">정말 관리자 권한을 부여할까요?</h3><p className="mt-2 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">이 작업은 즉시 적용되며, 별도의 승인 절차가 없습니다.</p></div></div><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => setConfirming(false)} className="h-11 rounded-[10px] border border-zinc-300 px-5 text-sm font-extrabold dark:border-zinc-700">취소</button><button type="button" onClick={confirmPromotion} className="h-11 rounded-[10px] bg-amber-500 px-5 text-sm font-extrabold text-zinc-950 hover:bg-amber-400">권한 부여</button></div></div> : <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"><div className="flex items-start gap-3"><Info className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" /><p className="text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">사용자 ID를 확인한 뒤 관리자 권한 부여 버튼을 눌러 변경을 진행하세요.</p></div></div>}
        {successAt ? <div role="status" className="rounded-xl border border-mint-500/60 bg-mint-500/5 p-5"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint-500/15 text-mint-500"><CheckCircle2 className="h-5 w-5" /></span><div className="min-w-0"><h3 className="text-lg font-extrabold">권한이 변경됐어요</h3><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-[90px_1fr]"><dt className="font-bold text-zinc-500 dark:text-zinc-400">사용자 ID</dt><dd className="flex min-w-0 items-center gap-2 font-mono font-semibold"><span className="min-w-0 break-all">{compactUserId(normalizedUserId)}</span><button type="button" onClick={() => void copyUserId()} aria-label="변경된 사용자 ID 복사" className="shrink-0 text-zinc-500 hover:text-mint-600"><Clipboard className="h-4 w-4" /></button></dd><dt className="font-bold text-zinc-500 dark:text-zinc-400">역할</dt><dd><span className="rounded-full bg-mint-500/10 px-3 py-1 text-mint-600 dark:text-mint-300">관리자</span></dd><dt className="font-bold text-zinc-500 dark:text-zinc-400">변경 시각</dt><dd className="font-medium text-zinc-600 dark:text-zinc-300">{formatDateTime(successAt)}</dd></dl></div></div><div className="mt-5 flex items-start gap-2 border-t border-mint-500/20 pt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400"><Info className="mt-0.5 h-4 w-4 shrink-0" />사용자의 새로운 권한이 즉시 적용됐습니다.</div></div> : <div className="rounded-xl border border-dashed border-zinc-300 p-5 dark:border-zinc-700"><p className="text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">변경이 완료되면 결과가 여기에 표시됩니다.</p></div>}
      </div>{error ? <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p> : null}</section>
    </div>
  );
}
