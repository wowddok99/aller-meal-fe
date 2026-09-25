"use client";

import { AlertTriangle, CheckCircle2, LoaderCircle, Search, UserRoundCog } from "lucide-react";
import { useState } from "react";
import { compactUserId, normalizeUserId, validateUserId } from "@/components/admin/admin-user-role-utils";
import type { AdminUserDetailResponse } from "@/generated/api/admin/models/adminUserDetailResponse";
import type { AdminUserRoleResponse } from "@/generated/api/admin/models/adminUserRoleResponse";
import { getAdminUserDetail, promoteUserToAdmin } from "@/lib/admin-api";

const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101419]";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short", hour12: false }).format(new Date(value));
}

function userStatusLabel(status?: string) {
  return {
    ACTIVE: "활성",
    WITHDRAWAL_PENDING: "탈퇴 예정",
    SUSPENDED: "이용 제한",
    DISABLED: "개인정보 삭제 완료",
  }[status ?? ""] ?? "확인할 수 없음";
}

function userRoleLabel(role?: string) {
  return role === "ADMIN" ? "관리자" : role === "MEMBER" ? "일반 사용자" : "확인할 수 없음";
}

function isPromotionResponse(value: AdminUserRoleResponse): value is Required<AdminUserRoleResponse> {
  return Boolean(
    value.userId
      && value.role === "ADMIN"
      && value.status
      && typeof value.version === "number"
      && value.action
      && value.changedAt,
  );
}

function errorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error && cause.message.trim() ? cause.message : fallback;
}

export function AdminUserRole({ userId = "" }: { userId?: string }) {
  const [input, setInput] = useState(userId);
  const [fieldError, setFieldError] = useState("");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [target, setTarget] = useState<AdminUserDetailResponse>();
  const [loadingTarget, setLoadingTarget] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Required<AdminUserRoleResponse>>();
  const targetUserId = normalizeUserId(input);
  const canPromote = Boolean(target?.availableActions?.canPromoteToAdmin && typeof target.version === "number");

  const reset = () => { setInput(userId); setFieldError(""); setReason(""); setReasonError(""); setTarget(undefined); setConfirming(false); setError(""); setResult(undefined); };
  const lookup = async () => {
    if (!validateUserId(targetUserId)) { setFieldError("UUID 형식의 사용자 ID를 입력해 주세요."); return; }
    setLoadingTarget(true); setFieldError(""); setError(""); setConfirming(false); setTarget(undefined);
    try {
      const response = await getAdminUserDetail(targetUserId);
      if (!response.userId || typeof response.version !== "number") {
        throw new Error("사용자 확인 응답이 완전하지 않습니다. 잠시 후 다시 시도해 주세요.");
      }
      setTarget(response);
    } catch (cause) {
      setError(errorMessage(cause, "사용자 정보를 조회하지 못했습니다."));
    } finally { setLoadingTarget(false); }
  };
  const submit = () => {
    if (!validateUserId(targetUserId)) { setFieldError("UUID 형식의 사용자 ID를 입력해 주세요."); return; }
    if (!target || target.userId !== targetUserId || !canPromote) { setError("먼저 권한을 부여할 수 있는 사용자인지 확인해 주세요."); return; }
    if (!reason.trim()) { setReasonError("권한 변경 사유를 입력해 주세요."); return; }
    setFieldError(""); setReasonError(""); setError(""); setConfirming(true);
  };
  const grantRole = async () => {
    if (!target || typeof target.version !== "number") return;
    setSaving(true); setError("");
    try {
      const response = await promoteUserToAdmin(targetUserId, { reason: reason.trim(), expectedVersion: target.version });
      if (!isPromotionResponse(response)) {
        throw new Error("권한 변경 응답이 완전하지 않습니다. 사용자 정보를 다시 확인해 주세요.");
      }
      setResult(response);
      setConfirming(false);
    } catch (cause) {
      setError(errorMessage(cause, "사용자 권한을 변경하지 못했습니다."));
    } finally { setSaving(false); }
  };

  return <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-5 pb-12 pt-5">
    <header><p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">사용자 ID를 확인해 필요한 서비스 권한을 관리하세요.</p><h1 className="mt-3 text-2xl font-extrabold tracking-[-0.02em]">권한 관리</h1></header>
    <section aria-label="관리자 권한 부여" className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419] dark:text-zinc-50">
      {result ? <div className="px-5 py-6 md:px-6"><div role="status" className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-mint-500" /><div><h3 className="text-lg font-extrabold">관리자 권한을 부여했습니다</h3><p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">새 권한이 즉시 적용되었습니다.</p></div></div><dl className="mt-6 grid gap-5 border-t border-zinc-100 pt-5 text-sm dark:border-zinc-800 sm:grid-cols-3"><div><dt className="font-semibold text-zinc-500 dark:text-zinc-400">사용자 ID</dt><dd className="mt-1 break-all font-mono font-extrabold">{compactUserId(result.userId)}</dd></div><div><dt className="font-semibold text-zinc-500 dark:text-zinc-400">현재 상태</dt><dd className="mt-1 font-extrabold">{userStatusLabel(result.status)}</dd></div><div><dt className="font-semibold text-zinc-500 dark:text-zinc-400">적용 시각</dt><dd className="mt-1 font-extrabold">{formatDateTime(result.changedAt)}</dd></div></dl><div className="mt-6 flex justify-end"><button type="button" onClick={reset} className={`h-11 rounded-[10px] border border-zinc-300 px-5 text-sm font-extrabold dark:border-zinc-700 ${focusRing}`}>다른 사용자 변경</button></div></div> : <form onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <div className="px-5 py-6 md:px-6"><div><label htmlFor="admin-role-user-id" className="block text-sm font-bold">사용자 ID</label><div className="mt-2 flex gap-2"><input id="admin-role-user-id" value={input} onChange={(event) => { setInput(event.target.value); setFieldError(""); setError(""); setConfirming(false); setTarget(undefined); }} placeholder="UUID 형식의 사용자 ID" aria-invalid={Boolean(fieldError)} aria-describedby="admin-role-help" className={`h-12 min-w-0 flex-1 rounded-[10px] border bg-white px-3 font-mono text-sm font-semibold text-zinc-950 placeholder:font-sans placeholder:text-zinc-400 dark:bg-[#101419] dark:text-zinc-50 ${fieldError ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"} ${focusRing}`} /><button type="button" onClick={() => void lookup()} disabled={loadingTarget} className={`inline-flex h-12 shrink-0 items-center gap-2 rounded-[10px] border border-zinc-300 px-4 text-sm font-extrabold dark:border-zinc-700 ${focusRing}`}>{loadingTarget ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}{loadingTarget ? "확인 중" : "사용자 확인"}</button></div></div><p id="admin-role-help" className={`mt-2 text-xs font-medium ${fieldError ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}>{fieldError || "예: 8f3a0000-0000-4000-8000-000000007b9c"}</p>
          {target ? <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/40"><p className="text-sm font-extrabold">확인된 사용자</p><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">이메일</dt><dd className="mt-1 break-all font-semibold">{target.email ?? "확인할 수 없음"}</dd></div><div><dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">현재 권한</dt><dd className="mt-1 font-extrabold">{userRoleLabel(target.role)}</dd></div><div><dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">계정 상태</dt><dd className="mt-1 font-extrabold">{userStatusLabel(target.status)}</dd></div></dl><p className={`mt-3 text-xs font-semibold ${canPromote ? "text-mint-700 dark:text-mint-300" : "text-zinc-500 dark:text-zinc-400"}`}>{canPromote ? "관리자 권한을 부여할 수 있습니다." : "현재 상태에서는 관리자 권한을 부여할 수 없습니다."}</p></div> : null}
          <label htmlFor="admin-role-reason" className="mt-5 block text-sm font-bold">변경 사유<textarea id="admin-role-reason" value={reason} onChange={(event) => { setReason(event.target.value); setReasonError(""); }} maxLength={500} disabled={!target} aria-invalid={Boolean(reasonError)} aria-describedby="admin-role-reason-help" placeholder="권한을 부여하는 사유를 입력해 주세요." className={`mt-2 min-h-24 w-full resize-y rounded-[10px] border bg-white px-3 py-3 text-sm font-medium text-zinc-950 placeholder:text-zinc-400 disabled:bg-zinc-100 dark:bg-[#101419] dark:text-zinc-50 dark:disabled:bg-zinc-900 ${reasonError ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"} ${focusRing}`} /></label><p id="admin-role-reason-help" className={`mt-2 text-right text-xs font-medium ${reasonError ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}>{reasonError || `${reason.length}/500`}</p><div className="mt-5 flex items-center justify-between gap-4 border-t border-zinc-100 pt-5 dark:border-zinc-800"><div><p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">부여할 역할</p><p className="mt-1 text-sm font-extrabold">관리자 <span className="ml-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">ADMIN</span></p></div><button type="submit" disabled={saving || !canPromote || !reason.trim()} className={`inline-flex h-11 items-center gap-2 rounded-[10px] bg-mint-500 px-5 text-sm font-extrabold text-white transition-colors hover:bg-mint-600 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}><UserRoundCog className="h-4 w-4" />관리자 권한 부여</button></div></div>
        {confirming ? <div aria-labelledby="admin-role-confirm-title" className="border-t border-zinc-200 bg-zinc-50 px-5 py-5 dark:border-zinc-800 dark:bg-zinc-900/40 md:px-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" /><div><h3 id="admin-role-confirm-title" className="font-extrabold">입력한 사용자에게 관리자 권한을 부여할까요?</h3><p className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">적용 후에는 즉시 관리자 기능을 사용할 수 있습니다.</p><p className="mt-3 break-all font-mono text-xs font-bold text-zinc-700 dark:text-zinc-200">{targetUserId}</p></div></div><div className="flex shrink-0 justify-end gap-3"><button type="button" onClick={() => setConfirming(false)} disabled={saving} className={`h-10 rounded-[10px] border border-zinc-300 bg-white px-4 text-sm font-extrabold dark:border-zinc-700 dark:bg-[#101419] ${focusRing}`}>취소</button><button type="button" onClick={() => void grantRole()} disabled={saving} className={`inline-flex h-10 items-center gap-2 rounded-[10px] bg-mint-500 px-4 text-sm font-extrabold text-white hover:bg-mint-600 disabled:opacity-50 ${focusRing}`}>{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}{saving ? "권한 부여 중" : "권한 부여"}</button></div></div></div> : null}
      </form>}
      {error ? <p role="alert" className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}
    </section>
  </div>;
}
