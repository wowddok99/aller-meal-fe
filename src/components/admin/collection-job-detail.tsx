"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { AdminApiError, getCollectionJob, isAdminActionId, type CollectionJob } from "@/lib/admin-api";
import { useCollectionRequest } from "./use-collection-request";
import { CollectionBadge, CollectionJobStatus, collectionButtonStyle, collectionDate, collectionJobHref, collectionPanelStyle } from "./collection-job-status";

export function CollectionJobDetail({ refreshList }: { refreshList: () => Promise<void> }) {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("collectionJobId")?.toLowerCase();
  const [loadedJob, setJob] = useState<CollectionJob>();
  const job = loadedJob?.collectionJobId?.toLowerCase() === selectedId ? loadedJob : undefined;
  const [error, setError] = useState<AdminApiError>();
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const request = useRef(0);
  const refreshAll = useCallback(async () => { setRevision((value) => value + 1); await refreshList(); }, [refreshList]);
  const operation = useCollectionRequest(refreshAll);

  // Each selection owns its request; cleanup prevents a late response from replacing another detail.
  // https://react.dev/reference/react/useEffect#fetching-data-with-effects
  useEffect(() => {
    const token = ++request.current;
    const controller = new AbortController();
    let active = true;
    setError(undefined);
    if (!selectedId) { setJob(undefined); setLoading(false); return; }
    setLoading(true);
    void getCollectionJob(selectedId, controller.signal).then((next) => {
      if (active && request.current === token) setJob(next);
    }).catch((cause) => {
      if (active && !controller.signal.aborted && request.current === token) setError(cause instanceof AdminApiError ? cause : new AdminApiError(0, "상세를 불러오지 못했습니다."));
    }).finally(() => { if (active && request.current === token) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [selectedId, revision]);

  return <><section aria-labelledby="collection-detail-title" aria-busy={loading} className={collectionPanelStyle}>
    <div className="flex flex-wrap items-center gap-3"><h2 id="collection-detail-title" className="text-xl font-extrabold">급식 수집 상세</h2>{job && !loading && !error ? job.status === "FAILED" && job.recovery?.status === "SUCCEEDED" ? <CollectionJobStatus job={job} /> : <CollectionBadge status={job.status} label={collectionOriginalStatusLabel(job.status)} /> : null}</div>
    {loading ? <p role="status" className="mt-5 flex items-center gap-2 text-sm text-zinc-500"><LoaderCircle className="h-4 w-4 animate-spin" />상세를 불러오고 있습니다.</p> : error ? <div role="alert" className="mt-5 space-y-3 text-sm"><p>{error.status === 404 ? "수집 작업을 찾을 수 없습니다." : error.status === 401 ? "로그인한 후 다시 확인해 주세요." : error.status === 403 ? "관리자 권한이 필요합니다." : error.message}</p>{error.status === 401 ? <Link className={collectionButtonStyle} href={`/auth/login?next=${encodeURIComponent(selectedId ? collectionJobHref(selectedId) : "/admin/collection-jobs")}`}>로그인</Link> : null}<Link href="/admin/collection-jobs" className={collectionButtonStyle}>전체 목록 보기</Link></div> : job ? <><CollectionJobInformation key={job.collectionJobId} job={job} />{!operation.authStatus && isJobActionAvailable(job) ? <div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={operation.busy || loading || Boolean(operation.retryIntent)} aria-busy={operation.processing} className={`${collectionButtonStyle} border-mint-800 bg-mint-800 text-white`} onClick={() => void operation.run(job, job.availableActions.canRecollect ? "recollection" : "execution")}>{operation.processing ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />요청 중…</> : job.availableActions.canRecollect ? "재수집 요청" : "수집 실행"}</button>{operation.busy && !operation.processing ? <p className="self-center text-zinc-500">접수된 작업의 결과를 확인하고 있습니다.</p> : null}</div> : null}</> : <p className="mt-8 text-center text-sm text-zinc-500">행을 선택하면 상세 정보를 표시합니다.</p>}
    {operation.notice ? <div role={operation.notice.error ? "alert" : "status"} aria-live={operation.notice.error ? "assertive" : "polite"} className={`fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-[10px] border bg-white p-4 text-sm font-bold shadow-lg dark:bg-[#101419] md:left-auto md:max-w-md ${operation.notice.error ? "border-red-200 text-red-700 dark:text-red-300" : "border-mint-600/50 text-mint-800 dark:text-mint-300"}`}><p>{operation.notice.text}</p><button type="button" aria-label="알림 닫기" className={`${collectionButtonStyle} shrink-0 px-3`} onClick={operation.dismiss}><X className="h-4 w-4" /></button></div> : null}
    {operation.retryIntent ? <button type="button" disabled={operation.processing} className={`${collectionButtonStyle} mt-3`} onClick={() => void operation.retry()}>요청 다시 시도</button> : null}
    {operation.authStatus === 401 ? <Link className={`${collectionButtonStyle} mt-3`} href={`/auth/login?next=${encodeURIComponent(selectedId ? collectionJobHref(selectedId) : "/admin/collection-jobs")}`}>로그인</Link> : null}
  </section>
  {operation.tracking ? <section aria-labelledby="collection-result-title" className={collectionPanelStyle}><h2 id="collection-result-title" className="text-xl font-extrabold">요청한 수집 결과</h2><p className="mt-3 break-all font-mono text-xs text-zinc-500">{operation.tracking.id}</p><p role="status" aria-live="polite" className="mt-3 text-sm font-bold">{operation.trackedJob ? collectionStatusLabel(operation.trackedJob.status) : "처리 결과를 확인하고 있습니다."}</p>{operation.trackedJob?.status === "FAILED" ? <p className="mt-3 break-words text-sm text-red-700 dark:text-red-300">{operation.trackedJob.failureCode || "실패 코드 미제공"}: {operation.trackedJob.failureMessage || "실패 사유 미제공"}</p> : null}{operation.paused ? <p role="status" className="mt-3 text-sm text-zinc-500">{operation.paused}</p> : null}<div className="mt-4 flex flex-wrap gap-3">{operation.paused && operation.authStatus !== 403 ? <button type="button" className={collectionButtonStyle} onClick={operation.recheck}>다시 확인</button> : null}<Link className={collectionButtonStyle} href={collectionJobHref(operation.tracking.id)} scroll={false}>요청한 수집 작업 보기</Link></div></section> : null}</>;
}

export function CollectionJobInformation({ job }: { job: CollectionJob }) {
  const recovery = job.recovery;
  const actions = job.availableActions;
  const failed = job.status === "FAILED";
  const recovered = failed && recovery?.status === "SUCCEEDED";
  const newerAttempt = recovered && recovery.latestCollectionJobId && recovery.latestCollectionJobId.toLowerCase() !== recovery.resolvedCollectionJobId?.toLowerCase();
  const fields = [["작업 ID", job.collectionJobId], ["학교", job.schoolName], ["급식 날짜", job.mealDate], ["급식 구분", job.mealType ? ({ BREAKFAST: "아침", LUNCH: "점심", DINNER: "저녁" })[job.mealType] : "미제공"], ["생성 시각", collectionDate(job.createdAt)], ["갱신 시각", collectionDate(job.updatedAt)]];
  const resultLinkStyle = "inline-flex min-h-11 w-fit items-center gap-2 font-bold text-mint-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 dark:text-mint-300";
  return <div className="mt-5 space-y-5 text-sm">
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label}><dt className="text-zinc-500">{label}</dt><dd className="mt-1 break-all font-bold">{value || "미제공"}</dd></div>)}</dl>
    {failed ? <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{[["실패 사유", job.failureMessage], ["오류 코드", job.failureCode]].map(([label, value]) => <div key={label}><dt className="text-zinc-500">{label}</dt><dd className="mt-1 break-words font-medium">{value || "미제공"}</dd></div>)}</dl> : null}
    {job.status === "PENDING" ? <p className="text-zinc-500">{actions?.canExecute ? "자동 수집이 지연되어 직접 실행할 수 있습니다." : actions?.executeAvailableAt ? `자동 수집 대기 중입니다. ${collectionDate(actions.executeAvailableAt)} 이후 새로고침해 주세요.` : "자동 수집을 기다리고 있습니다."}</p> : job.status === "RUNNING" ? <p className="text-zinc-500">수집이 끝나면 결과를 확인할 수 있습니다.</p> : recovery?.status === "IN_PROGRESS" && !recovered ? <p className="text-zinc-500">{actions?.canRecollect ? "이전 요청이 오래되어 다시 요청할 수 있습니다." : "새 수집 작업의 결과를 기다리고 있습니다."}</p> : null}
    {recovery?.latestCollectionJobId ? <details className="border-t border-zinc-100 dark:border-zinc-800"><summary className="min-h-11 cursor-pointer py-3 font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2">재수집 내역</summary><div className="space-y-5 pb-2 pt-2"><dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2"><div className="sm:col-span-2"><dt className="text-zinc-500">재수집 작업 ID</dt><dd className="mt-1"><Link className={resultLinkStyle} href={collectionJobHref(recovery.latestCollectionJobId)} scroll={false} title="수집 작업 열기" aria-label={`수집 작업 열기: ${recovery.latestCollectionJobId}`}><span className="min-w-0 break-all">{recovery.latestCollectionJobId}</span></Link></dd></div>{[["요청 시각", collectionDate(recovery.requestedAt)], ["완료 시각", collectionDate(recovery.completedAt || (recovery.latestCollectionJobId.toLowerCase() === recovery.resolvedCollectionJobId?.toLowerCase() ? recovery.resolvedAt : undefined))]].map(([label, value]) => <div key={label}><dt className="text-zinc-500">{label}</dt><dd className="mt-1 font-bold">{value}</dd></div>)}</dl>{newerAttempt && recovery.resolvedCollectionJobId ? <div className="space-y-3"><p className="text-zinc-500">이전 재수집 완료: {collectionDate(recovery.resolvedAt)}</p><Link className={resultLinkStyle} href={collectionJobHref(recovery.resolvedCollectionJobId)} scroll={false}>이전 수집 내역</Link></div> : null}</div></details> : null}
  </div>;
}

function collectionOriginalStatusLabel(status?: string | null) {
  return ({ PENDING: "수집 대기", RUNNING: "수집 중", SUCCEEDED: "수집 완료", FAILED: "수집 실패" } as Record<string, string>)[status ?? ""] ?? "상태 미제공";
}

function collectionStatusLabel(status?: string | null) {
  return ({ PENDING: "대기", RUNNING: "수집 중", SUCCEEDED: "성공", FAILED: "실패" } as Record<string, string>)[status ?? ""] ?? "미제공";
}

function isJobActionAvailable(job: CollectionJob) {
  return Boolean(isAdminActionId(job.collectionJobId) && (job.availableActions?.canRecollect || job.availableActions?.canExecute));
}
