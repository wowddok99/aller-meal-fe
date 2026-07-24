"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleUserRound,
  Clock3,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  UserRoundX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  AccountWithdrawal,
  cancelAccountWithdrawal,
  MemberApiError,
  requestAccountWithdrawal,
} from "@/lib/member-api";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function errorMessage(error: MemberApiError) {
  if (error.status === 401) return "로그인이 필요합니다.";
  if (error.status === 403) return "이메일 인증 또는 접근 권한을 확인해 주세요.";
  if (error.status === 409) return "현재 계정 상태에서는 요청을 처리할 수 없습니다.";
  if (error.status === 429) return "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  return error.message;
}

export function AccountWithdrawalPage() {
  const [withdrawal, setWithdrawal] = useState<AccountWithdrawal | null>(null);
  const [confirming, setConfirming] = useState<"request" | "cancel" | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirming) return;
    confirmButtonRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) setConfirming(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [confirming, pending]);

  async function handleConfirmedAction() {
    if (!confirming) return;
    setPending(true);
    setError("");
    setNotice("");
    try {
      if (confirming === "request") {
        const result = await requestAccountWithdrawal();
        setWithdrawal(result);
        setNotice("탈퇴 예약이 완료되었습니다. 예정일 전까지 언제든 예약을 취소할 수 있습니다.");
      } else {
        await cancelAccountWithdrawal();
        setWithdrawal(null);
        setNotice("탈퇴 예약을 취소했습니다. 계정을 계속 사용할 수 있습니다.");
      }
      setConfirming(null);
    } catch (reason) {
      setError(reason instanceof MemberApiError ? errorMessage(reason) : "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setConfirming(null);
    } finally {
      setPending(false);
    }
  }

  const hasRequest = withdrawal !== null;
  const modalTitle = confirming === "request" ? "정말 탈퇴를 예약할까요?" : "탈퇴 예약을 취소할까요?";
  const modalDescription = confirming === "request"
    ? "예약 후에도 탈퇴 예정일 전까지 취소할 수 있습니다."
    : "예약을 취소하면 계정을 계속 사용할 수 있습니다.";

  return (
    <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
      <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">
        계정 탈퇴를 예약하거나 예약된 탈퇴를 취소할 수 있어요.
      </p>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-7 dark:border-zinc-800 dark:bg-[#101419]">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-mint-50 text-mint-600 dark:bg-mint-950/30 dark:text-mint-300"><CircleUserRound className="h-7 w-7" /></span>
          <div><h1 className="text-2xl font-extrabold">계정 상태</h1><p className="mt-1 text-sm font-medium text-zinc-500">탈퇴 예약 상태와 처리 일정을 확인할 수 있어요.</p></div>
        </div>
        <div className="mt-6 grid gap-3 border-t border-zinc-200 pt-5 sm:grid-cols-3 dark:border-zinc-800">
          <div><p className="text-xs font-bold text-zinc-500">현재 상태</p><p className={`mt-1 font-extrabold ${hasRequest ? "text-amber-600 dark:text-amber-300" : "text-mint-600 dark:text-mint-300"}`}>{hasRequest ? "탈퇴 예약됨" : "활성"}</p></div>
          <div><p className="text-xs font-bold text-zinc-500">예약 상태 조회</p><p className="mt-1 text-sm font-semibold">현재 제공되지 않음</p></div>
          <div><p className="text-xs font-bold text-zinc-500">개인정보 처리</p><p className="mt-1 text-sm font-semibold">정책에 따라 처리</p></div>
        </div>
      </section>

      {notice ? <div role="status" className="flex items-start gap-2 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm font-bold text-mint-700 dark:border-mint-900 dark:bg-mint-950/30 dark:text-mint-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div> : null}
      {error ? <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-7 dark:border-zinc-800 dark:bg-[#101419]">
        <h2 className="text-xl font-extrabold">탈퇴 안내</h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <ul className="space-y-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            <li className="flex gap-3"><CalendarDays className="h-5 w-5 shrink-0 text-mint-500" /><span>예약 후 지정일에 계정이 정리돼요.</span></li>
            <li className="flex gap-3"><RefreshCw className="h-5 w-5 shrink-0 text-mint-500" /><span>탈퇴 예정일 전에는 언제든 취소할 수 있어요.</span></li>
            <li className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-mint-500" /><span>개인정보는 관련 정책에 따라 처리돼요.</span></li>
          </ul>
          {withdrawal ? <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-700"><div className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-zinc-400" /><div className="flex-1"><p className="font-extrabold">탈퇴 요청</p><p className="mt-1 text-sm font-medium text-zinc-500">{formatDateTime(withdrawal.withdrawalRequestedAt)}</p></div></div><div className="my-4 border-t border-zinc-200 dark:border-zinc-800" /><div className="flex items-center gap-3"><Clock3 className="h-5 w-5 text-zinc-400" /><div className="flex-1"><p className="font-extrabold">탈퇴 예정</p><p className="mt-1 text-sm font-medium text-zinc-500">{formatDateTime(withdrawal.withdrawalDueAt)}</p></div></div><p className="mt-5 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">마스킹 대상 알림 {withdrawal.maskedNotificationCount}건</p></div> : <div className="rounded-xl border border-dashed border-zinc-300 p-5 text-sm font-medium text-zinc-500 dark:border-zinc-700">아직 등록된 탈퇴 예약이 없습니다.</div>}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-7 dark:border-zinc-800 dark:bg-[#101419]"><h2 className="text-xl font-extrabold">탈퇴 관리</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-red-200 p-5 dark:border-red-950"><UserRoundX className="h-8 w-8 text-red-500" /><h3 className="mt-4 text-lg font-extrabold text-red-600 dark:text-red-400">탈퇴 예약하기</h3><p className="mt-2 min-h-10 text-sm font-medium text-zinc-500">지정일에 계정이 비활성화돼요.</p><button type="button" disabled={hasRequest} onClick={() => { setError(""); setConfirming("request"); }} className="mt-5 h-12 w-full rounded-[10px] border border-red-500 px-5 font-extrabold text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400">{hasRequest ? "탈퇴 예약 완료" : "탈퇴 예약하기"}</button></div><div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-700"><RefreshCw className="h-8 w-8 text-zinc-500" /><h3 className="mt-4 text-lg font-extrabold">탈퇴 예약 취소</h3><p className="mt-2 min-h-10 text-sm font-medium text-zinc-500">예약된 탈퇴를 취소하고 계정을 계속 사용할 수 있어요.</p><button type="button" disabled={!hasRequest} onClick={() => { setError(""); setConfirming("cancel"); }} className="mt-5 h-12 w-full rounded-[10px] border border-zinc-300 px-5 font-extrabold disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700">탈퇴 예약 취소</button></div></div></section>

      {confirming ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5" role="dialog" aria-modal="true" aria-labelledby="withdrawal-confirm-title" aria-describedby="withdrawal-confirm-description"><div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-950 dark:bg-[#101419]"><AlertTriangle className="h-9 w-9 text-red-500" /><h2 id="withdrawal-confirm-title" className="mt-4 text-xl font-extrabold">{modalTitle}</h2><p id="withdrawal-confirm-description" className="mt-2 text-sm font-medium leading-6 text-zinc-500">{modalDescription}</p>{confirming === "request" ? <p className="mt-2 text-sm font-bold text-zinc-700 dark:text-zinc-200">예약이 완료되면 탈퇴 예정일을 확인할 수 있습니다.</p> : null}<div className="mt-6 flex justify-end gap-2"><button type="button" disabled={pending} onClick={() => setConfirming(null)} className="h-11 rounded-[10px] border border-zinc-300 px-5 font-bold disabled:opacity-50 dark:border-zinc-700">취소</button><button ref={confirmButtonRef} type="button" disabled={pending} onClick={() => void handleConfirmedAction()} className={`inline-flex h-11 items-center gap-2 rounded-[10px] px-5 font-extrabold text-white disabled:opacity-50 ${confirming === "request" ? "bg-red-600" : "bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950"}`}>{pending ? <><LoaderCircle className="h-4 w-4 animate-spin" />처리 중</> : confirming === "request" ? "예약하기" : "예약 취소"}</button></div></div></div> : null}
    </div>
  );
}
