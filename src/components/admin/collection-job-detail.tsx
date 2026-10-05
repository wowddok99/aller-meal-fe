"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, MoreVertical } from "lucide-react";
import { AdminApiError, getCollectionJob, isAdminActionId, type CollectionJob } from "@/lib/admin-api";
import { useCollectionRequest } from "./use-collection-request";
import { CollectionRequestConfirmation } from "./collection-request-confirmation";
import { CollectionRequestResult } from "./collection-request-result";
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
  const [confirmation, setConfirmation] = useState<{ job: CollectionJob; kind: "recollection" | "execution" }>();
  const closeConfirmation = useCallback(() => setConfirmation(undefined), []);
  const canConfirm = Boolean(confirmation && job && job.collectionJobId?.toLowerCase() === confirmation.job.collectionJobId?.toLowerCase() && !loading && !error && !operation.authStatus && !operation.busy && !operation.retryIntent && job.recovery?.status !== "SUCCEEDED" && isJobActionAvailable(job) && (confirmation.kind === "recollection" ? job.availableActions.canRecollect : job.availableActions.canExecute));

  useEffect(() => {
    if (confirmation && !canConfirm) closeConfirmation();
  }, [confirmation, canConfirm, closeConfirmation]);

  const confirmRequest = () => {
    if (!confirmation || !canConfirm || new URLSearchParams(window.location.search).get("collectionJobId")?.toLowerCase() !== confirmation.job.collectionJobId?.toLowerCase()) return;
    closeConfirmation();
    void operation.run(confirmation.job, confirmation.kind);
  };

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
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-3"><h2 id="collection-detail-title" tabIndex={-1} className="text-xl font-extrabold">급식 수집 상세</h2>{job && !loading && !error ? job.status === "FAILED" ? <CollectionJobStatus job={job} /> : <CollectionBadge status={job.status} label={collectionOriginalStatusLabel(job.status)} /> : null}</div>{job && !loading && !error && !operation.authStatus && job.recovery?.status !== "SUCCEEDED" && isJobActionAvailable(job) ? <CollectionActionMenu key={job.collectionJobId} label={job.availableActions.canRecollect ? "재수집 요청" : "수집 실행"} disabled={operation.busy || Boolean(operation.retryIntent)} processing={operation.processing} onAction={() => setConfirmation({ job, kind: job.availableActions.canRecollect ? "recollection" : "execution" })} /> : null}</div>
    {loading ? <p role="status" className="mt-5 flex items-center gap-2 text-sm text-zinc-500"><LoaderCircle className="h-4 w-4 animate-spin" />상세를 불러오고 있습니다.</p> : error ? <div role="alert" className="mt-5 space-y-3 text-sm"><p>{error.status === 404 ? "수집 작업을 찾을 수 없습니다." : error.status === 401 ? "로그인한 후 다시 확인해 주세요." : error.status === 403 ? "관리자 권한이 필요합니다." : error.message}</p>{error.status === 401 ? <Link className={collectionButtonStyle} href={`/auth/login?next=${encodeURIComponent(selectedId ? collectionJobHref(selectedId) : "/admin/collection-jobs")}`}>로그인</Link> : null}<Link href="/admin/collection-jobs" className={collectionButtonStyle}>전체 목록 보기</Link></div> : job ? <CollectionJobInformation key={job.collectionJobId} job={job} /> : <p className="mt-8 text-center text-sm text-zinc-500">행을 선택하면 상세 정보를 표시합니다.</p>}
    {operation.retryIntent ? <button type="button" disabled={operation.processing} className={`${collectionButtonStyle} mt-3`} onClick={() => void operation.retry()}>요청 다시 시도</button> : null}
    {operation.authStatus === 401 ? <Link className={`${collectionButtonStyle} mt-3`} href={`/auth/login?next=${encodeURIComponent(selectedId ? collectionJobHref(selectedId) : "/admin/collection-jobs")}`}>로그인</Link> : null}
  </section>
  {confirmation && canConfirm ? <CollectionRequestConfirmation job={confirmation.job} kind={confirmation.kind} onClose={closeConfirmation} onConfirm={confirmRequest} /> : null}
  {operation.notice && (operation.notice.kind === "accepted" || !operation.processing) && !confirmation ? <CollectionRequestResult title={operation.notice.title || "결과 확인 안내"} message={operation.notice.text} onClose={operation.dismiss} /> : null}</>;
}

function CollectionActionMenu({ label, disabled, processing, onAction }: { label: string; disabled: boolean; processing: boolean; onAction: () => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRef = useRef<HTMLButtonElement>(null);
  const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101419]";

  useEffect(() => {
    if (!open || disabled) return;
    itemRef.current?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (event.key === "Tab") setOpen(false);
      else if (menuRef.current?.contains(document.activeElement) && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        itemRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, disabled]);

  return <div ref={menuRef} className="relative -mr-2"><button ref={triggerRef} type="button" aria-label={processing ? "수집 작업 요청 중" : "수집 작업 메뉴"} aria-haspopup="menu" aria-controls={open && !disabled ? "collection-action-menu" : undefined} aria-expanded={open && !disabled} aria-busy={processing} disabled={disabled} onClick={() => setOpen((value) => !value)} onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); } }} className={`inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-50 ${focusRing} dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white`}>{processing ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <MoreVertical className="h-5 w-5" aria-hidden="true" />}</button>{open && !disabled ? <div id="collection-action-menu" role="menu" aria-label="수집 작업 메뉴" className="absolute right-0 top-full z-20 mt-2 w-40 rounded-xl border border-zinc-200 bg-white p-1.5 text-left shadow-lg dark:border-zinc-700 dark:bg-[#151b22]"><button ref={itemRef} type="button" role="menuitem" disabled={disabled} onClick={() => { setOpen(false); triggerRef.current?.focus(); onAction(); }} className={`flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 ${focusRing}`}>{label}</button></div> : null}</div>;
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
    {failed ? <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{[["실패 사유", job.failureMessage], ["오류 코드", job.failureCode]].map(([label, value]) => <div key={label}><dt className="text-zinc-500">{label}</dt><dd className="mt-1 break-words font-bold">{value || "미제공"}</dd></div>)}</dl> : null}
    {job.status === "PENDING" ? <p className="text-zinc-500">{actions?.canExecute ? "자동 수집이 지연되어 직접 실행할 수 있습니다." : actions?.executeAvailableAt ? `자동 수집 대기 중입니다. ${collectionDate(actions.executeAvailableAt)} 이후 새로고침해 주세요.` : "자동 수집을 기다리고 있습니다."}</p> : job.status === "RUNNING" ? <p className="text-zinc-500">수집이 끝나면 결과를 확인할 수 있습니다.</p> : null}
    {recovery?.latestCollectionJobId ? <details className="border-t border-zinc-100 dark:border-zinc-800"><summary className="min-h-11 cursor-pointer py-3 font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2">재수집 내역</summary><div className="space-y-5 pb-2 pt-2"><dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2"><div className="sm:col-span-2"><dt className="text-zinc-500">재수집 작업 ID</dt><dd className="mt-1"><Link className={resultLinkStyle} href={collectionJobHref(recovery.latestCollectionJobId)} scroll={false} title="수집 작업 열기" aria-label={`수집 작업 열기: ${recovery.latestCollectionJobId}`}><span className="min-w-0 break-all">{recovery.latestCollectionJobId}</span></Link></dd></div>{[["요청 시각", collectionDate(recovery.requestedAt)], ["완료 시각", collectionDate(recovery.completedAt || (recovery.latestCollectionJobId.toLowerCase() === recovery.resolvedCollectionJobId?.toLowerCase() ? recovery.resolvedAt : undefined))]].map(([label, value]) => <div key={label}><dt className="text-zinc-500">{label}</dt><dd className="mt-1 font-bold">{value}</dd></div>)}</dl>{newerAttempt && recovery.resolvedCollectionJobId ? <div className="space-y-3"><p className="text-zinc-500">이전 재수집 완료: {collectionDate(recovery.resolvedAt)}</p><Link className={resultLinkStyle} href={collectionJobHref(recovery.resolvedCollectionJobId)} scroll={false}>이전 수집 내역</Link></div> : null}</div></details> : null}
  </div>;
}

function collectionOriginalStatusLabel(status?: string | null) {
  return ({ PENDING: "수집 대기", RUNNING: "수집 중", SUCCEEDED: "수집 완료", FAILED: "수집 실패" } as Record<string, string>)[status ?? ""] ?? "상태 미제공";
}

function isJobActionAvailable(job: CollectionJob) {
  return Boolean(isAdminActionId(job.collectionJobId) && (job.availableActions?.canRecollect || job.availableActions?.canExecute));
}
