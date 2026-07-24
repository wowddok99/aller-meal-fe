"use client";

import { AlertTriangle, BellRing, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, Info, LoaderCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminApiError, type FailedNotificationPage, getFailedNotifications } from "@/lib/admin-api";

const PAGE_SIZES = [10, 20, 50];

const reasonLabels: Record<string, string> = {
  CAUTION_MENU_DETECTED: "주의 메뉴 감지",
  RISK_CONFIRMATION_FAILED: "위험 확인 실패",
  MEAL_RISK_DETECTED: "급식 위험 감지",
};

const statusLabels: Record<string, string> = {
  FAILED: "실패",
  RETRY_PENDING: "재시도 대기",
  CANCELED: "취소됨",
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short", hour12: false }).format(date);
}

function statusClass(status: string) {
  if (status === "RETRY_PENDING") return "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200";
  if (status === "CANCELED") return "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  return "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300";
}

function ErrorState({ error, retry }: { error: AdminApiError; retry: () => void }) {
  const auth = error.status === 401 || error.status === 403;
  return <section className="rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-950 dark:bg-[#101419]"><AlertTriangle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-extrabold">{auth ? "관리자 권한이 필요합니다" : "실패 알림 목록을 불러오지 못했습니다"}</h1><p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">{auth ? "관리자 계정으로 로그인한 후 다시 확인해 주세요." : error.message}</p>{!auth ? <button type="button" onClick={retry} className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 px-5 font-bold hover:border-mint-500 dark:border-zinc-700"><RefreshCw className="h-4 w-4" /> 다시 시도</button> : null}</section>;
}

export function FailedNotifications({ review = false }: { review?: boolean }) {
  const [result, setResult] = useState<FailedNotificationPage>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [error, setError] = useState<AdminApiError>();
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setResult(await getFailedNotifications(page, pageSize, review));
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause : new AdminApiError(0, "실패 알림 목록을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, review]);

  useEffect(() => { void load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil((result?.totalCount ?? 0) / pageSize));
  const isInitialLoading = loading && !result;
  if (isInitialLoading) return <div className="mx-auto flex min-h-[calc(100dvh-50px)] max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> 실패 알림 목록을 불러오고 있습니다.</div>;
  if (error && !result) return <div className="mx-auto w-full max-w-[1220px] px-5 pt-5"><ErrorState error={error} retry={() => void load()} /></div>;

  return <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5"><p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">실패한 알림 요청을 조회합니다. 재처리는 DLQ 화면에서 진행해 주세요.</p><section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-500"><BellRing className="h-6 w-6" /></span><div><h1 className="text-2xl font-extrabold tracking-[-0.03em]">실패 알림</h1><p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">총 {result?.totalCount.toLocaleString() ?? 0}건</p></div></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-zinc-300 px-4 text-sm font-extrabold hover:border-mint-500 disabled:opacity-50 dark:border-zinc-700"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> 새로고침</button></div><div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-zinc-100 pt-5 dark:border-zinc-800"><div><label htmlFor="notification-page-size" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">목록 표시 수</label><select id="notification-page-size" value={pageSize} onChange={(event) => { setPage(1); setPageSize(Number(event.target.value)); }} className="mt-2 h-11 rounded-[10px] border border-zinc-300 bg-white px-3 text-sm font-bold dark:border-zinc-700 dark:bg-[#101419]">{PAGE_SIZES.map((size) => <option key={size} value={size}>{size}개</option>)}</select></div><p className="max-w-xl text-sm font-medium leading-5 text-zinc-500 dark:text-zinc-400">최근 실패 알림을 페이지 단위로 표시합니다.</p></div></section>{error && result ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">최신 목록을 갱신하지 못했습니다. 이전 목록을 표시합니다. {error.message}</p> : null}<section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419]"><div className="flex items-center justify-between gap-3 px-5 py-5 md:px-6"><h2 className="text-xl font-extrabold">실패 알림 목록</h2><p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{page} / {totalPages} 페이지</p></div>{result?.items.length ? <div className="overflow-x-auto border-y border-zinc-200 dark:border-zinc-800"><table className="w-full min-w-[1120px] text-left text-sm"><thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400"><tr>{["알림 ID", "대상", "알림일", "채널", "사유", "상태", "시도", "실패 코드", "생성 시각"].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-4 py-3 font-extrabold">{label}</th>)}</tr></thead><tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">{result.items.map((item) => <tr key={item.notificationId} className="align-top"><td className="max-w-40 truncate px-4 py-4 font-mono text-xs font-semibold" title={item.notificationId}>{item.notificationId}</td><td className="max-w-48 px-4 py-4"><p className="truncate font-mono text-xs font-semibold" title={item.notificationTargetId}>{item.notificationTargetId}</p><p className="mt-1 truncate text-xs font-medium text-zinc-500 dark:text-zinc-400" title={item.userId || item.childId}>{item.userId ? `사용자 ID ${item.userId}` : item.childId ? `자녀 ID ${item.childId}` : "대상 정보 없음"}</p></td><td className="whitespace-nowrap px-4 py-4 font-semibold">{item.notificationDate}</td><td className="px-4 py-4"><span className="rounded-full border border-zinc-300 px-2.5 py-1 font-mono text-xs font-extrabold dark:border-zinc-700">{item.channel}</span></td><td className="px-4 py-4"><p className="whitespace-nowrap font-semibold">{reasonLabels[item.reason] ?? item.reason}</p><p className="mt-1 font-mono text-xs font-medium text-zinc-500 dark:text-zinc-400">{item.reason}</p></td><td className="px-4 py-4"><span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-extrabold ${statusClass(item.status)}`}>{statusLabels[item.status] ?? item.status}</span><p className="mt-1 font-mono text-xs font-medium text-zinc-500 dark:text-zinc-400">{item.status}</p></td><td className="whitespace-nowrap px-4 py-4 font-semibold">{item.attemptCount} / {item.maxAttempts}</td><td className="px-4 py-4"><span className="inline-flex rounded-full border border-red-300 bg-red-50 px-2.5 py-1 font-mono text-xs font-extrabold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{item.failureCode || "-"}</span></td><td className="whitespace-nowrap px-4 py-4 font-medium">{formatDateTime(item.createdAt)}</td></tr>)}</tbody></table></div> : <div className="px-5 py-16 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-mint-500" /><h2 className="mt-4 text-lg font-extrabold">실패한 알림 요청이 없습니다</h2><p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">현재 페이지에서 확인할 실패 알림 요청이 없습니다.</p></div>}<div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">페이지 단위로 조회합니다.</p><div className="flex items-center gap-2"><button type="button" aria-label="이전 페이지" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading} className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 disabled:opacity-40 dark:border-zinc-700"><ChevronLeft className="h-4 w-4" /></button><span className="min-w-20 text-center text-sm font-bold">{page} / {totalPages}</span><button type="button" aria-label="다음 페이지" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages || loading} className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 disabled:opacity-40 dark:border-zinc-700"><ChevronRight className="h-4 w-4" /></button></div></div></section><section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] sm:flex-row sm:items-center sm:justify-between md:p-6"><div className="flex items-start gap-3"><Info className="mt-0.5 h-6 w-6 shrink-0 text-mint-600 dark:text-mint-400" /><div><h2 className="text-lg font-extrabold">재처리가 필요한 경우</h2><p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">실패 알림은 DLQ 이벤트에서 다시 처리할 수 있어요.</p></div></div><Link href="/admin/notification-dlq-events" className="inline-flex shrink-0 items-center gap-2 font-extrabold text-mint-700 hover:text-mint-600 dark:text-mint-300 dark:hover:text-mint-400">DLQ 이벤트로 이동 <ExternalLink className="h-4 w-4" /></Link></section></div>;
}
