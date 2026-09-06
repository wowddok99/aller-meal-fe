"use client";

import { AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminApiError, type DashboardSummary, getDashboardSummary } from "@/lib/admin-api";

const numberFormatter = new Intl.NumberFormat("ko-KR");
const panel = "rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419]";
const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101419]";
const buttonStyle = `inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-zinc-300 bg-white px-4 text-sm font-extrabold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-wait disabled:opacity-50 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-200 dark:hover:bg-zinc-800 ${focusRing}`;

function Count({ value }: { value: number | undefined }) {
  return value === undefined
    ? <><span aria-hidden="true">-</span><span className="sr-only">미제공</span></>
    : <>{numberFormatter.format(value)}<span className="ml-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">건</span></>;
}

function ActionRow({ title, description, primaryLabel, primaryCount, secondaryLabel, secondaryCount, href, linkLabel }: {
  title: string;
  description: string;
  primaryLabel: string;
  primaryCount: number | undefined;
  secondaryLabel: string;
  secondaryCount: number | undefined;
  href: string;
  linkLabel: string;
}) {
  return (
    <article className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_260px_152px] lg:items-center lg:gap-8">
      <div className="min-w-0">
        <h3 className="text-lg font-extrabold tracking-[-0.02em]">{title}</h3>
        <p className="mt-1 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      <dl className="grid w-full grid-cols-2 divide-x divide-zinc-200 dark:divide-zinc-800">
        <div className="min-w-0 pr-6 text-left lg:text-right">
          <dt className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{primaryLabel}</dt>
          <dd className="mt-1.5 break-all text-2xl font-bold tracking-[-0.03em] text-zinc-950 tabular-nums dark:text-zinc-50"><Count value={primaryCount} /></dd>
        </div>
        <div className="min-w-0 pl-6">
          <dt className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{secondaryLabel}</dt>
          <dd className="mt-1.5 break-all text-2xl font-bold tracking-[-0.03em] text-zinc-950 tabular-nums dark:text-zinc-50"><Count value={secondaryCount} /></dd>
        </div>
      </dl>
      <Link href={href} className={`inline-flex min-h-11 shrink-0 items-center justify-start gap-1 whitespace-nowrap rounded-[10px] px-0 text-sm font-extrabold text-mint-700 transition-colors hover:text-mint-800 focus-visible:text-mint-800 dark:text-mint-400 dark:hover:text-mint-300 dark:focus-visible:text-mint-300 justify-self-start lg:justify-self-end ${focusRing}`}>
        {linkLabel}<ChevronRight aria-hidden="true" className="h-4 w-4" strokeWidth={2.4} />
      </Link>
    </article>
  );
}

function NavigationRow({ title, description, href, linkLabel }: {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <article className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_152px] lg:items-center lg:gap-8">
      <div className="min-w-0">
        <h3 className="text-lg font-extrabold tracking-[-0.02em]">{title}</h3>
        <p className="mt-1 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      <Link href={href} className={`inline-flex min-h-11 shrink-0 items-center justify-start gap-1 whitespace-nowrap rounded-[10px] px-0 text-sm font-extrabold text-mint-700 transition-colors hover:text-mint-800 focus-visible:text-mint-800 dark:text-mint-400 dark:hover:text-mint-300 dark:focus-visible:text-mint-300 justify-self-start lg:justify-self-end ${focusRing}`}>
        {linkLabel}<ChevronRight aria-hidden="true" className="h-4 w-4" strokeWidth={2.4} />
      </Link>
    </article>
  );
}

export function AdminDashboard({ review = false }: { review?: boolean }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<AdminApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const reviewPath = (path: string) => review ? `/admin/preview${path.slice("/admin".length)}` : path;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await getDashboardSummary(review));
    } catch (reason) {
      setError(reason instanceof AdminApiError ? reason : new AdminApiError(0, "운영 현황을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }, [review]);

  useEffect(() => { void load(); }, [load]);

  const authError = error?.status === 401 || error?.status === 403;

  return (
    <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
      <header><p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">서비스 운영 중 확인이 필요한 항목을 살펴보세요.</p><h1 className="mt-4 text-2xl font-extrabold tracking-[-0.02em]">관리자 대시보드</h1></header>
      <p role="status" className="sr-only">{loading ? "운영 현황을 불러오고 있습니다." : ""}</p>

      {error && <section role="alert" className={`${panel} mb-5 p-6`}><div className="flex items-start gap-3"><AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400" /><div><h2 className="text-base font-bold">{summary ? "최신 데이터를 갱신하지 못했습니다" : authError ? "관리자 권한이 필요합니다" : "운영 현황을 불러오지 못했습니다"}</h2><p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{summary ? `이전 요약을 표시합니다. ${error.message}` : authError ? "관리자 계정으로 로그인한 후 다시 확인해 주세요." : error.message}</p>{!summary && (authError ? <Link href="/auth/login" className={`${buttonStyle} mt-4`}>로그인</Link> : <button type="button" onClick={() => void load()} className={`${buttonStyle} mt-4`}>다시 시도</button>)}</div></div></section>}

      {loading && !summary && <div aria-hidden="true" className={`${panel} space-y-5 p-6 md:p-8`}><div className="h-6 w-36 rounded bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-800" /><div className="grid gap-4 md:grid-cols-2">{[0, 1].map((index) => <div key={index} className="h-64 rounded-xl bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-800" />)}</div></div>}

      {summary && <section aria-label="서비스 운영 현황" aria-busy={loading} className={`${panel} px-6 py-3 md:px-8 md:py-4`}><div className="divide-y divide-zinc-200 dark:divide-zinc-800"><ActionRow title="급식 수집" description="수집에 실패해 재요청이 필요한 작업" primaryLabel="수집 실패" primaryCount={summary.collection?.failedCount} secondaryLabel="수집 대기" secondaryCount={summary.collection?.pendingCount} href={reviewPath("/admin/collection-failures")} linkLabel="수집 실패 보기" /><ActionRow title="알림 발송" description="발송에 실패했거나 재시도 중인 알림" primaryLabel="발송 실패" primaryCount={summary.notifications?.failedCount} secondaryLabel="재시도 대기" secondaryCount={summary.notifications?.retryPendingCount} href={reviewPath("/admin/notification-failures")} linkLabel="실패 알림 보기" /><ActionRow title="DLQ 이벤트" description="자동 재시도 후 재처리를 기다리는 이벤트" primaryLabel="재처리 대기" primaryCount={summary.dlq?.pendingCount} secondaryLabel="누적 재처리" secondaryCount={summary.dlq?.reprocessedCount} href={reviewPath("/admin/notification-dlq-events")} linkLabel="DLQ 이벤트 보기" /><NavigationRow title="외부 연동" description="외부 API 호출 기록과 응답 상태를 확인합니다." href={reviewPath("/admin/external-api-logs")} linkLabel="외부 API 로그 보기" /></div></section>}
    </div>
  );
}
