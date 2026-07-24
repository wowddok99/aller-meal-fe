"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, RefreshCw, RotateCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminApiError, type FailedCollectionJob, type FailedCollectionJobPage, getFailedCollectionJobs, requestRecollection, type RecollectionResult } from "@/lib/admin-api";

const PAGE_SIZES = [10, 20, 50];

const mealLabels: Record<string, string> = { BREAKFAST: "아침", LUNCH: "점심", DINNER: "저녁" };

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short", hour12: false }).format(date);
}

function ErrorState({ error, retry }: { error: AdminApiError; retry: () => void }) {
  const auth = error.status === 401 || error.status === 403;
  return <section className="rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-950 dark:bg-[#101419]"><AlertTriangle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-extrabold">{auth ? "관리자 권한이 필요합니다" : "수집 실패 목록을 불러오지 못했습니다"}</h1><p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">{auth ? "관리자 계정으로 로그인한 후 다시 확인해 주세요." : error.message}</p>{!auth ? <button type="button" onClick={retry} className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 px-5 font-bold hover:border-mint-500 dark:border-zinc-700"><RefreshCw className="h-4 w-4" /> 다시 시도</button> : null}</section>;
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
    try { setResult(await getFailedCollectionJobs(page, pageSize, review)); }
    catch (cause) { setError(cause instanceof AdminApiError ? cause : new AdminApiError(0, "수집 실패 목록을 불러오지 못했습니다.")); }
    finally { setLoading(false); }
  }, [page, pageSize, review]);

  useEffect(() => { void load(); }, [load]);

  const recollect = async (job: FailedCollectionJob) => {
    setPendingId(job.collectionJobId);
    setActionError(undefined);
    try {
      const response = review
        ? { originalCollectionJobId: job.collectionJobId, collectionJobId: `review-recollection-${job.collectionJobId}`, status: "PENDING", duplicate: false }
        : await requestRecollection(job.collectionJobId);
      setRecollection({ job, response });
    }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : "재수집 요청을 처리하지 못했습니다."); }
    finally { setPendingId(undefined); }
  };

  const totalPages = Math.max(1, Math.ceil((result?.totalCount ?? 0) / pageSize));
  const isInitialLoading = loading && !result;
  if (isInitialLoading) return <div className="mx-auto flex min-h-[calc(100dvh-50px)] max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> 수집 실패 목록을 불러오고 있습니다.</div>;
  if (error && !result) return <div className="mx-auto w-full max-w-[1220px] px-5 pt-5"><ErrorState error={error} retry={() => void load()} /></div>;

  return <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5"><p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">실패한 급식 수집 작업을 확인하고 재수집을 요청하세요.</p><section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-500"><AlertCircle className="h-6 w-6" /></span><div><h1 className="text-2xl font-extrabold tracking-[-0.03em]">수집 실패</h1><p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">총 {result?.totalCount.toLocaleString() ?? 0}건</p></div></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-zinc-300 px-4 text-sm font-extrabold hover:border-mint-500 disabled:opacity-50 dark:border-zinc-700"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> 새로고침</button></div><div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-zinc-100 pt-5 dark:border-zinc-800"><div><label htmlFor="collection-page-size" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">목록 표시 수</label><select id="collection-page-size" value={pageSize} onChange={(event) => { setPage(1); setPageSize(Number(event.target.value)); }} className="mt-2 h-11 rounded-[10px] border border-zinc-300 bg-white px-3 text-sm font-bold dark:border-zinc-700 dark:bg-[#101419]"><>{PAGE_SIZES.map((size) => <option key={size} value={size}>{size}개</option>)}</></select></div><p className="max-w-xl text-sm font-medium leading-5 text-zinc-500 dark:text-zinc-400">최근 수집 실패 내역을 페이지 단위로 표시합니다.</p></div></section>{error && result ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">최신 목록을 갱신하지 못했습니다. 이전 목록을 표시합니다. {error.message}</p> : null}{actionError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">재수집 요청에 실패했습니다. {actionError}</p> : null}<section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419]"><div className="flex items-center justify-between gap-3 px-5 py-5 md:px-6"><h2 className="text-xl font-extrabold">수집 실패 목록</h2><p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{page} / {totalPages} 페이지</p></div>{result?.items.length ? <div className="overflow-x-auto border-y border-zinc-200 dark:border-zinc-800"><table className="w-full min-w-[1040px] text-left text-sm"><thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400"><tr>{["작업 ID", "학교 ID", "급식일", "식사", "실패 코드", "응답 시간", "소요 시간", "발생 시각", "재수집"].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-4 py-3 font-extrabold">{label}</th>)}</tr></thead><tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">{result.items.map((job) => <tr key={job.collectionJobId} className="align-top"><td className="max-w-44 truncate px-4 py-4 font-mono text-xs font-semibold" title={job.collectionJobId}>{job.collectionJobId}</td><td className="max-w-40 truncate px-4 py-4 font-medium" title={job.schoolId}>{job.schoolId}</td><td className="whitespace-nowrap px-4 py-4 font-semibold">{job.mealDate}</td><td className="whitespace-nowrap px-4 py-4 font-semibold">{mealLabels[job.mealType] ?? job.mealType}</td><td className="max-w-60 px-4 py-3"><span className="inline-flex rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-extrabold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">{job.failureCode}</span><p className="mt-1.5 truncate text-xs font-medium text-zinc-500 dark:text-zinc-400" title={job.failureMessage}>{job.failureMessage}</p></td><td className="whitespace-nowrap px-4 py-4 font-medium">{job.responseTimeMillis.toLocaleString()}ms</td><td className="whitespace-nowrap px-4 py-4 font-medium">{job.collectionDurationMillis.toLocaleString()}ms</td><td className="whitespace-nowrap px-4 py-4 font-medium">{formatDateTime(job.createdAt)}</td><td className="px-4 py-3"><button type="button" onClick={() => void recollect(job)} disabled={Boolean(pendingId)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-300 px-3 text-sm font-extrabold hover:border-mint-500 hover:text-mint-700 disabled:cursor-wait disabled:opacity-50 dark:border-zinc-700 dark:hover:text-mint-300">{pendingId === job.collectionJobId ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}{pendingId === job.collectionJobId ? "요청 중" : "재수집"}</button></td></tr>)}</tbody></table></div> : <div className="px-5 py-16 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-mint-500" /><h2 className="mt-4 text-lg font-extrabold">실패한 수집 작업이 없습니다</h2><p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">현재 조건에서 확인할 수집 실패 작업이 없습니다.</p></div>}<div className="flex items-center justify-end gap-2 px-5 py-4"><button type="button" aria-label="이전 페이지" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading} className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 disabled:opacity-40 dark:border-zinc-700"><ChevronLeft className="h-4 w-4" /></button><span className="min-w-20 text-center text-sm font-bold">{page} / {totalPages}</span><button type="button" aria-label="다음 페이지" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages || loading} className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 disabled:opacity-40 dark:border-zinc-700"><ChevronRight className="h-4 w-4" /></button></div></section>{recollection ? <section role="status" className="rounded-2xl border border-mint-200 bg-white p-5 dark:border-mint-900 dark:bg-[#101419] md:p-6"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-mint-500" /><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-extrabold">재수집 요청됨</h2><span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${recollection.response.duplicate ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-mint-500/10 text-mint-700 dark:text-mint-300"}`}>{recollection.response.duplicate ? "중복 요청" : "중복 요청 아님"}</span></div><p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">{recollection.job.mealDate} {mealLabels[recollection.job.mealType] ?? recollection.job.mealType} · 학교 ID {recollection.job.schoolId}</p><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="font-bold text-zinc-500 dark:text-zinc-400">상태</dt><dd className="mt-1 font-extrabold">대기 중</dd></div><div className="sm:col-span-2"><dt className="font-bold text-zinc-500 dark:text-zinc-400">새 수집 작업 ID</dt><dd className="mt-1 break-all font-mono text-xs font-semibold">{recollection.response.collectionJobId}</dd></div></dl></div></div></section> : null}</div>;
}
