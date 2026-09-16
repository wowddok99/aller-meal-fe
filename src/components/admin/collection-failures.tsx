"use client";

import { AlertTriangle, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, LoaderCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CollectionFailureCard, CollectionFailureTableRow } from "@/components/admin/collection-failure-item";
import { AdminApiError, type FailedCollectionJob, type FailedCollectionJobPage, getFailedCollectionJobs, requestRecollection, type RecollectionResult } from "@/lib/admin-api";

const PAGE_SIZES = [10, 20, 50];
const recollectionStatusLabels: Record<RecollectionResult["status"], string> = {
  PENDING: "대기",
  RUNNING: "수집 중",
  SUCCEEDED: "완료",
  FAILED: "실패",
};

function ErrorState({ error, retry }: { error: AdminApiError; retry: () => void }) {
  const auth = error.status === 401 || error.status === 403;

  return (
    <section className="rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-950 dark:bg-[#101419]">
      <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
      <h1 className="mt-4 text-xl font-extrabold">{auth ? "관리자 권한이 필요합니다" : "수집 실패 목록을 불러오지 못했습니다"}</h1>
      <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">{auth ? "관리자 계정으로 로그인한 후 다시 확인해 주세요." : error.message}</p>
      {!auth ? <button type="button" onClick={retry} className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 px-5 font-bold hover:border-mint-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500 dark:border-zinc-700"><RefreshCw className="h-4 w-4" /> 다시 시도</button> : null}
    </section>
  );
}

function RecollectionResultPanel({ recollection }: { recollection: { job: FailedCollectionJob; response: RecollectionResult } }) {
  const { job, response } = recollection;

  return (
    <section role="status" className="rounded-2xl border border-mint-200 bg-white p-5 dark:border-mint-900 dark:bg-[#101419] md:p-6">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-mint-500" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-extrabold">재수집 요청을 등록했습니다</h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${response.duplicate ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-mint-500/10 text-mint-700 dark:text-mint-300"}`}>{response.duplicate ? "중복 요청" : "새 요청"}</span>
          </div>
          <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">{job.schoolId} · {job.mealDate} · {job.mealType === "BREAKFAST" ? "아침" : job.mealType === "LUNCH" ? "점심" : job.mealType === "DINNER" ? "저녁" : job.mealType}</p>
        </div>
      </div>
      <dl className="mt-5 grid gap-4 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800 sm:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]">
        <div><dt className="font-semibold text-zinc-500 dark:text-zinc-400">새 작업 상태</dt><dd className="mt-1 font-extrabold">{recollectionStatusLabels[response.status]}<span className="ml-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">{response.status}</span></dd></div>
        <div><dt className="font-semibold text-zinc-500 dark:text-zinc-400">새 수집 작업 ID</dt><dd className="mt-1 break-all text-sm font-semibold">{response.collectionJobId}</dd></div>
      </dl>
    </section>
  );
}

function PageSizeMenu({ value, onChange }: { value: number; onChange: (size: number) => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <span className="mr-2 text-sm font-bold">목록 표시 수</span>
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="inline-flex h-9 min-w-20 items-center justify-between gap-2 rounded-[10px] border border-zinc-300 bg-white px-3 text-sm font-extrabold text-zinc-950 transition-colors hover:border-mint-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-50">
        {value}개 <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? <div role="menu" aria-label="목록 표시 수" className="absolute right-0 z-10 mt-2 w-28 overflow-hidden rounded-[10px] border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-[#101419]">{PAGE_SIZES.map((size) => <button key={size} type="button" role="menuitem" onClick={() => { onChange(size); setOpen(false); }} className={`flex h-9 w-full items-center rounded-lg px-3 text-left text-sm font-bold transition-colors hover:bg-mint-50 hover:text-mint-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-mint-500 dark:hover:bg-mint-500/10 dark:hover:text-mint-300 ${value === size ? "bg-mint-500/10 text-mint-800 dark:text-mint-300" : ""}`}>{size}개</button>)}</div> : null}
    </div>
  );
}

export function CollectionFailures({ review = false }: { review?: boolean }) {
  const [result, setResult] = useState<FailedCollectionJobPage>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [error, setError] = useState<AdminApiError>();
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string>();
  const [recollection, setRecollection] = useState<{ job: FailedCollectionJob; response: RecollectionResult }>();
  const [actionError, setActionError] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setResult(await getFailedCollectionJobs(page, pageSize, review));
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause : new AdminApiError(0, "수집 실패 목록을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, review]);

  useEffect(() => { void load(); }, [load]);

  const recollect = async (job: FailedCollectionJob) => {
    setPendingId(job.collectionJobId);
    setActionError(undefined);
    try {
      const response = review
        ? { originalCollectionJobId: job.collectionJobId, collectionJobId: `review-recollection-${job.collectionJobId}`, status: "PENDING" as const, duplicate: false }
        : await requestRecollection(job.collectionJobId);
      setRecollection({ job, response });
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "재수집 요청을 처리하지 못했습니다.");
    } finally {
      setPendingId(undefined);
    }
  };

  const totalCount = result?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = result?.page ?? page;
  const isInitialLoading = loading && !result;

  if (isInitialLoading) return <div className="mx-auto flex min-h-[calc(100dvh-50px)] max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> 수집 실패 목록을 불러오고 있습니다.</div>;
  if (error && !result) return <div className="mx-auto w-full max-w-[1220px] px-5 pt-5"><ErrorState error={error} retry={() => void load()} /></div>;

  return (
    <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
      <header><p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">급식 수집에 실패한 작업을 확인하고, 필요한 경우 다시 수집할 수 있습니다.</p><h1 className="mt-4 text-2xl font-extrabold tracking-[-0.02em]">수집 실패 목록</h1></header>

      {error && result ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">최신 목록을 갱신하지 못했습니다. 이전 목록을 표시합니다. {error.message}</p> : null}
      {actionError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">재수집 요청에 실패했습니다. {actionError}</p> : null}

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">총 {totalCount.toLocaleString()}건</p>
          <PageSizeMenu value={pageSize} onChange={(size) => { setPage(1); setPageSize(size); }} />
        </div>
        {result?.items.length ? <>
          <div className="hidden overflow-x-auto border-y border-zinc-200 dark:border-zinc-800 lg:block"><table className="w-full min-w-[900px] table-fixed text-left text-sm"><colgroup><col className="w-[20%]" /><col className="w-[27%]" /><col className="w-[20%]" /><col className="w-[21%]" /><col className="w-[12%]" /></colgroup><thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400"><tr>{["수집 대상", "실패 원인", "성능", "실패 시각", ""].map((label) => <th key={label || "action"} scope="col" className="whitespace-nowrap px-5 py-3 font-extrabold">{label}</th>)}</tr></thead><tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">{result.items.map((job) => <CollectionFailureTableRow key={job.collectionJobId} job={job} pendingId={pendingId} onRecollect={(target) => void recollect(target)} />)}</tbody></table></div>
          <div className="lg:hidden">{result.items.map((job) => <CollectionFailureCard key={job.collectionJobId} job={job} pendingId={pendingId} onRecollect={(target) => void recollect(target)} />)}</div>
        </> : <div className="px-5 py-16 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-mint-500" /><h2 className="mt-4 text-lg font-extrabold">실패한 수집 작업이 없습니다</h2><p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">현재 페이지에서 확인할 수집 실패 작업이 없습니다.</p></div>}
        <div className="flex justify-center px-5 py-4"><div className="flex items-center gap-2"><button type="button" aria-label="이전 페이지" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1 || loading} className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-zinc-300 transition-colors hover:border-mint-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500 disabled:opacity-40 dark:border-zinc-700"><ChevronLeft className="h-4 w-4" /></button><span className="min-w-20 text-center text-sm font-bold">{currentPage} / {totalPages}</span><button type="button" aria-label="다음 페이지" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages || loading} className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-zinc-300 transition-colors hover:border-mint-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500 disabled:opacity-40 dark:border-zinc-700"><ChevronRight className="h-4 w-4" /></button></div></div>
      </section>

      {recollection ? <RecollectionResultPanel recollection={recollection} /> : null}
    </div>
  );
}
