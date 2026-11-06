"use client";

import { ApiNotice } from "@/components/api-notice";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminApiError, type DashboardSummary, getDashboardSummary } from "@/lib/admin-api";
import { PageHeading } from "@/components/page-heading";

const numberFormatter = new Intl.NumberFormat("ko-KR");
const panel = "rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419]";
const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101419]";
const noticeActionStyle = `inline-flex h-8 shrink-0 items-center justify-center rounded-[10px] border border-zinc-300 px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900 ${focusRing}`;

function Count({ value }: { value: number | undefined }) {
  return value === undefined
    ? <><span aria-hidden="true">-</span><span className="sr-only">미제공</span></>
    : <>{numberFormatter.format(value)}<span className="ml-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">건</span></>;
}

function SummaryRow({ title, description, primaryLabel, primaryCount, primaryHref, secondaryLabel, secondaryCount, secondaryHref, href, linkLabel }: {
  title: string;
  description: string;
  primaryLabel: string;
  primaryCount: number | undefined;
  primaryHref: string;
  secondaryLabel: string;
  secondaryCount: number | undefined;
  secondaryHref: string;
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
          <dd className="mt-1.5"><Link href={primaryHref} aria-label={`${title} ${primaryLabel} ${primaryCount === undefined ? "미제공" : numberFormatter.format(primaryCount)}건 목록 보기`} className={`break-all text-2xl font-bold tracking-[-0.03em] text-zinc-950 tabular-nums hover:text-mint-700 dark:text-zinc-50 dark:hover:text-mint-300 ${focusRing}`}><Count value={primaryCount} /></Link></dd>
        </div>
        <div className="min-w-0 pl-6">
          <dt className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{secondaryLabel}</dt>
          <dd className="mt-1.5"><Link href={secondaryHref} aria-label={`${title} ${secondaryLabel} ${secondaryCount === undefined ? "미제공" : numberFormatter.format(secondaryCount)}건 목록 보기`} className={`break-all text-2xl font-bold tracking-[-0.03em] text-zinc-950 tabular-nums hover:text-mint-700 dark:text-zinc-50 dark:hover:text-mint-300 ${focusRing}`}><Count value={secondaryCount} /></Link></dd>
        </div>
      </dl>
      <Link href={href} className={`inline-flex min-h-11 shrink-0 items-center justify-start gap-1 whitespace-nowrap rounded-[10px] px-0 text-sm font-extrabold text-mint-700 transition-colors hover:text-mint-800 focus-visible:text-mint-800 dark:text-mint-400 dark:hover:text-mint-300 dark:focus-visible:text-mint-300 justify-self-start lg:justify-self-end ${focusRing}`}>
        {linkLabel}<ChevronRight aria-hidden="true" className="h-4 w-4" strokeWidth={2.4} />
      </Link>
    </article>
  );
}

export function AdminDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<AdminApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const latestRequestId = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const result = await getDashboardSummary();
      if (requestId === latestRequestId.current) setSummary(result);
    } catch (reason) {
      if (requestId === latestRequestId.current) {
        setSummary(null);
        setError(reason instanceof AdminApiError ? reason : new AdminApiError(0, "운영 현황을 불러오지 못했습니다."));
      }
    } finally {
      if (requestId === latestRequestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const unauthenticated = error?.status === 401;
  const forbidden = error?.status === 403;

  return (
    <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
      <PageHeading title="서비스 관리" description="서비스 운영 현황을 확인하세요." />
      <p role="status" className="sr-only">{loading ? "운영 현황을 불러오고 있습니다." : ""}</p>

      <section aria-label="서비스 운영 현황" aria-busy={loading} className={`${panel} px-6 py-3 md:px-8 md:py-4`}>
        {error ? <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-zinc-200 py-3 dark:border-zinc-800">
          <ApiNotice title={forbidden ? "관리자 권한이 필요합니다." : unauthenticated ? "로그인한 후 운영 현황을 확인해 주세요." : "운영 현황을 불러오지 못했습니다."} />
          {unauthenticated ? <Link href="/auth/login?next=/admin" className={noticeActionStyle}>로그인</Link> : !forbidden ? <button type="button" onClick={() => void load()} disabled={loading} className={noticeActionStyle}>다시 시도</button> : null}
        </div> : null}
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800"><SummaryRow title="급식 수집" description="수집 작업의 현재 처리 현황입니다." primaryLabel="미해결 수집 실패" primaryCount={summary?.collection?.unresolvedFailedCount} primaryHref="/admin/collection-jobs?status=FAILED&unresolvedFailure=true" secondaryLabel="수집 대기" secondaryCount={summary?.collection?.pendingCount} secondaryHref="/admin/collection-jobs?status=PENDING" href="/admin/collection-jobs" linkLabel="급식 수집 작업 보기" /><SummaryRow title="알레르기 라벨링" description="알레르기 분석 작업의 처리 현황입니다." primaryLabel="라벨링 실패" primaryCount={summary?.labeling?.labelingFailedCount} primaryHref="/admin/meal-item-labelings?status=LABELING_FAILED" secondaryLabel="라벨링 대기" secondaryCount={summary?.labeling?.pendingCount} secondaryHref="/admin/meal-item-labelings?status=PENDING" href="/admin/meal-item-labelings" linkLabel="라벨링 작업 보기" /><SummaryRow title="이벤트 발행" description="outbox 이벤트의 발행 처리 현황입니다." primaryLabel="발행 완료" primaryCount={summary?.outbox?.publishedCount} primaryHref="/admin/outbox-events?status=PUBLISHED" secondaryLabel="발행 대기" secondaryCount={summary?.outbox?.pendingCount} secondaryHref="/admin/outbox-events?status=PENDING" href="/admin/outbox-events" linkLabel="발행 작업 보기" /><SummaryRow title="DLQ 이벤트" description="자동 재시도 후 재처리를 기다리는 이벤트입니다." primaryLabel="재처리 대기" primaryCount={summary?.dlq?.pendingCount} primaryHref="/admin/notification-dlq-events?status=PENDING" secondaryLabel="재처리 완료" secondaryCount={summary?.dlq?.reprocessedCount} secondaryHref="/admin/notification-dlq-events?status=REPROCESSED" href="/admin/notification-dlq-events" linkLabel="DLQ 이벤트 보기" /><SummaryRow title="알림 발송" description="발송에 실패했거나 재시도 중인 알림입니다." primaryLabel="발송 실패" primaryCount={summary?.notifications?.failedCount} primaryHref="/admin/notification-requests?status=FAILED" secondaryLabel="재시도 대기" secondaryCount={summary?.notifications?.retryPendingCount} secondaryHref="/admin/notification-requests?status=RETRY_PENDING" href="/admin/notification-requests" linkLabel="알림 발송 작업 보기" /></div></section>
    </div>
  );
}
