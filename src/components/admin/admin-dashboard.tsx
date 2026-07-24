"use client";

import { AlertTriangle, ArrowRight, BellRing, DatabaseZap, Inbox, LoaderCircle, RefreshCw, Send, Tag, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminApiError, type DashboardSummary, getDashboardSummary } from "@/lib/admin-api";

type Metric = { label: string; value: number; tone?: "success" | "warning" | "danger" };

const numberFormatter = new Intl.NumberFormat("ko-KR");

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", hour12: false }).format(date);
}

function MetricCard({ title, description, icon: Icon, metrics, href }: { title: string; description: string; icon: typeof DatabaseZap; metrics: Metric[]; href?: string }) {
  const content = <><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-500/10 text-mint-600 dark:text-mint-400"><Icon className="h-6 w-6" /></span><h2 className="text-xl font-extrabold tracking-[-0.02em]">{title}</h2></div><div className="mt-7 grid grid-cols-2 divide-x divide-zinc-200 dark:divide-zinc-800 sm:grid-cols-4">{metrics.map((metric) => <div key={metric.label} className="min-w-0 px-3 first:pl-0 last:pr-0"><p className="truncate text-sm font-bold text-zinc-500 dark:text-zinc-400">{metric.label}</p><p className={`mt-3 text-2xl font-extrabold tabular-nums ${metric.tone === "success" ? "text-mint-600 dark:text-mint-400" : metric.tone === "warning" ? "text-amber-500" : metric.tone === "danger" ? "text-red-500" : ""}`}>{numberFormatter.format(metric.value ?? 0)}</p></div>)}</div><div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-4 text-sm font-semibold text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"><span>{description}</span>{href ? <ArrowRight className="h-5 w-5" /> : null}</div></>;
  const className = "rounded-2xl border border-zinc-200 bg-white p-5 transition-colors dark:border-zinc-800 dark:bg-[#101419] md:p-6";
  return href ? <Link href={href} className={`${className} hover:border-mint-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500`}>{content}</Link> : <section className={className}>{content}</section>;
}

const shortcuts = [
  { href: "/admin/collection-failures", title: "수집 실패 보기", description: "수집 실패 내역을 확인하고 재시도할 수 있어요.", icon: TriangleAlert, tone: "text-red-500 bg-red-500/10" },
  { href: "/admin/external-api-logs", title: "외부 API 로그", description: "외부 연계 API 호출 이력과 응답을 확인할 수 있어요.", icon: DatabaseZap, tone: "text-blue-500 bg-blue-500/10" },
  { href: "/admin/notification-failures", title: "실패 알림", description: "실패한 알림 메시지 목록과 상세 정보를 확인할 수 있어요.", icon: BellRing, tone: "text-amber-500 bg-amber-500/10" },
  { href: "/admin/notification-dlq-events", title: "DLQ 이벤트", description: "DLQ 이벤트 목록과 재처리 이력을 확인할 수 있어요.", icon: Inbox, tone: "text-violet-500 bg-violet-500/10" },
];

export function AdminDashboard({ review = false }: { review?: boolean }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<AdminApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const reviewPath = (path: string) => review ? `/admin/preview${path.slice("/admin".length)}` : path;

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try { setSummary(await getDashboardSummary(review)); }
    catch (reason) { setError(reason instanceof AdminApiError ? reason : new AdminApiError(0, "운영 현황을 불러오지 못했습니다.")); }
    finally { setLoading(false); setRefreshing(false); }
  }, [review]);

  useEffect(() => { void load(); }, [load]);

  if (loading && !summary) return <div className="mx-auto flex min-h-[calc(100dvh-50px)] max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> 운영 현황을 불러오고 있습니다.</div>;
  if (error && !summary) {
    const isAuth = error.status === 401 || error.status === 403;
    return <div className="mx-auto w-full max-w-[1220px] px-5 pt-5"><section className="rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-950 dark:bg-[#101419]"><AlertTriangle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-extrabold">{isAuth ? "관리자 권한이 필요합니다" : "운영 현황을 불러오지 못했습니다"}</h1><p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">{isAuth ? "관리자 계정으로 로그인한 후 다시 확인해 주세요." : error.message}</p>{isAuth ? <Link href="/auth/login" className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-mint-500 px-5 font-bold text-white">로그인</Link> : <button type="button" onClick={() => void load()} className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 px-5 font-bold dark:border-zinc-700"><RefreshCw className="h-4 w-4" /> 다시 시도</button>}</section></div>;
  }
  if (!summary) return null;

  return <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5"><p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">운영 상태를 빠르게 확인하세요.</p><section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-7"><div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-mint-500/10 text-mint-600 dark:text-mint-400"><DatabaseZap className="h-7 w-7" /></span><div><h1 className="text-2xl font-extrabold tracking-[-0.03em]">관리자 대시보드</h1><p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">생성 시각 · {formatTime(summary.generatedAt)}</p></div></div><button type="button" onClick={() => void load(true)} disabled={refreshing} className="inline-flex h-12 items-center gap-2 rounded-[10px] border border-zinc-300 px-4 text-sm font-extrabold transition-colors hover:border-mint-500 hover:text-mint-700 disabled:opacity-50 dark:border-zinc-700 dark:hover:text-mint-300"><RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />{refreshing ? "새로고침 중" : "새로고침"}</button></section>{error ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">최신 데이터를 갱신하지 못했습니다. 이전 요약을 표시합니다. {error.message}</p> : null}<div className="grid gap-4 lg:grid-cols-2"><MetricCard title="수집 상태" description="급식 데이터 수집 작업 상태" icon={DatabaseZap} href={reviewPath("/admin/collection-failures")} metrics={[{ label: "대기", value: summary.collection.pendingCount }, { label: "실행 중", value: summary.collection.runningCount, tone: "warning" }, { label: "성공", value: summary.collection.succeededCount, tone: "success" }, { label: "실패", value: summary.collection.failedCount, tone: "danger" }]} /><MetricCard title="라벨링 상태" description="알레르기 성분 라벨링 처리 상태" icon={Tag} metrics={[{ label: "라벨링 대기", value: summary.labeling.pendingCount }, { label: "표시 완료", value: summary.labeling.labeledCount, tone: "success" }, { label: "알 수 없음", value: summary.labeling.unknownCount, tone: "warning" }, { label: "실패", value: summary.labeling.labelingFailedCount, tone: "danger" }]} /></div><div className="grid gap-4 lg:grid-cols-[0.9fr_0.9fr_1.5fr]"><MetricCard title="아웃박스" description="외부 시스템 발행 대기/완료" icon={Send} metrics={[{ label: "대기", value: summary.outbox.pendingCount }, { label: "발행 완료", value: summary.outbox.publishedCount, tone: "success" }]} /><MetricCard title="DLQ" description="실패 메시지 보관 및 재처리 현황" icon={Inbox} href={reviewPath("/admin/notification-dlq-events")} metrics={[{ label: "대기", value: summary.dlq.pendingCount }, { label: "재처리 완료", value: summary.dlq.reprocessedCount, tone: "success" }]} /><MetricCard title="알림 상태" description="알림 발송 작업 상태" icon={BellRing} href={reviewPath("/admin/notification-failures")} metrics={[{ label: "대기", value: summary.notifications.pendingCount }, { label: "전송 중", value: summary.notifications.sendingCount, tone: "warning" }, { label: "재시도 대기", value: summary.notifications.retryPendingCount, tone: "warning" }, { label: "전송 완료", value: summary.notifications.sentCount, tone: "success" }, { label: "실패", value: summary.notifications.failedCount, tone: "danger" }, { label: "취소", value: summary.notifications.canceledCount }]} /></div><section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-6"><h2 className="text-xl font-extrabold">운영 바로가기</h2><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{shortcuts.map((shortcut) => { const Icon = shortcut.icon; const href = reviewPath(shortcut.href); const content = <><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${shortcut.tone}`}><Icon className="h-5 w-5" /></span><div className="min-w-0"><h3 className="font-extrabold group-hover:text-mint-700 dark:group-hover:text-mint-300">{shortcut.title}</h3><p className="mt-1 text-sm font-medium leading-5 text-zinc-500 dark:text-zinc-400">{shortcut.description}</p></div><ArrowRight className="ml-auto h-5 w-5 shrink-0 text-zinc-400" /></>; const className = "group flex min-h-28 items-center gap-4 rounded-xl border border-zinc-200 p-4 transition-colors dark:border-zinc-800"; return <Link key={shortcut.href} href={href} className={`${className} hover:border-mint-500`}>{content}</Link>; })}</div></section></div>;
}
