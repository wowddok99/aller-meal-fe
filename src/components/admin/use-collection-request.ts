"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminApiError, createIdempotencyKey, getCollectionJob, isAdminActionId, requestCollectionExecution, requestRecollection, type CollectionJob } from "@/lib/admin-api";

type RequestKind = "recollection" | "execution";
type Intent = { sourceId: string; kind: RequestKind; key: string };
type Tracking = { id: string; kind: RequestKind; token: number };
export type CollectionNotice = { error: boolean; text: string };

export function useCollectionRequest(refresh: () => Promise<void>) {
  const [processing, setProcessing] = useState(false);
  const [tracking, setTracking] = useState<Tracking>();
  const [trackedJob, setTrackedJob] = useState<CollectionJob>();
  const [paused, setPaused] = useState<string>();
  const [notice, setNotice] = useState<CollectionNotice>();
  const [authStatus, setAuthStatus] = useState<number>();
  const [retryIntent, setRetryIntent] = useState<Intent>();
  const [check, setCheck] = useState(0);
  const guard = useRef(false);
  const mounted = useRef(false);
  const sequence = useRef(0);
  const terminalAnnounced = useRef<number | undefined>(undefined);
  const refreshRef = useRef(refresh); refreshRef.current = refresh;

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const runIntent = useCallback(async (intent: Intent) => {
    if (guard.current || !isAdminActionId(intent.sourceId)) return;
    guard.current = true; setProcessing(true); setNotice(undefined); setRetryIntent(undefined); setAuthStatus(undefined);
    try {
      const result = await (intent.kind === "recollection" ? requestRecollection : requestCollectionExecution)(intent.sourceId, intent.key);
      if (!mounted.current) return;
      if (!isAdminActionId(result.collectionJobId)) {
        setRetryIntent(intent);
        setNotice({ error: true, text: "요청 응답에 작업 ID가 없어 결과를 확인할 수 없습니다. 상태를 새로고침해 주세요." });
        await refreshRef.current(); return;
      }
      setNotice({ error: false, text: result.duplicate ? "이미 접수된 요청입니다. 기존 작업의 결과를 확인합니다." : intent.kind === "recollection" ? "재수집 요청을 접수했습니다." : "수집 실행 요청을 접수했습니다." });
      setTrackedJob(undefined); setPaused(undefined);
      setTracking({ id: result.collectionJobId!, kind: intent.kind, token: ++sequence.current });
      await refreshRef.current();
    } catch (cause) {
      if (!mounted.current) return;
      const error = cause instanceof AdminApiError ? cause : new AdminApiError(0, "요청을 처리하지 못했습니다.");
      if (error.status === 401 || error.status === 403) setAuthStatus(error.status);
      setNotice({ error: true, text: error.status === 401 ? "로그인한 후 다시 요청해 주세요." : error.status === 403 ? "관리자 권한이 필요합니다." : error.status === 409 ? "상태가 변경되어 요청하지 못했습니다. 최신 상태를 다시 확인해 주세요." : error.status === 404 ? "수집 작업을 찾을 수 없습니다." : "요청 결과를 확인하지 못했습니다. 다시 시도하면 같은 요청으로 확인합니다." });
      if (error.status === 0 || error.status >= 500) setRetryIntent(intent);
      if (error.status === 409 || error.status === 404) await refreshRef.current();
    } finally {
      guard.current = false;
      if (mounted.current) setProcessing(false);
    }
  }, []);

  const run = useCallback((job: CollectionJob, kind: RequestKind) => {
    if (guard.current || (tracking && (!trackedJob || !["SUCCEEDED", "FAILED"].includes(trackedJob.status ?? "")))) return;
    if (!job.collectionJobId || (kind === "recollection" ? !job.availableActions?.canRecollect : !job.availableActions?.canExecute)) return;
    return runIntent({ sourceId: job.collectionJobId, kind, key: createIdempotencyKey() });
  }, [runIntent, trackedJob, tracking]);

  // Schedule the next GET only after the current GET resolves; cleanup aborts it on unmount.
  // https://react.dev/reference/react/useEffect#fetching-data-with-effects
  useEffect(() => {
    if (!tracking) return;
    let active = true;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = setTimeout(() => {
      if (!active) return;
      active = false; controller.abort(); if (timer) clearTimeout(timer);
      setPaused("수집이 아직 대기 또는 진행 중입니다. 자동 확인을 잠시 멈췄습니다.");
    }, 120_000);
    const pause = (text: string) => { clearTimeout(deadline); if (active) { setPaused(text); active = false; } };
    const poll = async () => {
      try {
        const next = await getCollectionJob(tracking.id, controller.signal);
        if (!active) return;
        setTrackedJob(next); setPaused(undefined); setAuthStatus(undefined);
        if (next.status === "SUCCEEDED" || next.status === "FAILED") {
          clearTimeout(deadline);
          if (terminalAnnounced.current !== tracking.token) {
            terminalAnnounced.current = tracking.token;
            setNotice({ error: next.status === "FAILED", text: next.status === "FAILED" ? "급식 수집에 실패했습니다. 상세에서 실패 사유를 확인해 주세요." : tracking.kind === "recollection" ? "급식 재수집이 완료되었습니다." : "급식 수집이 완료되었습니다." });
            await refreshRef.current();
          }
          return;
        }
        timer = setTimeout(() => void poll(), 2000);
      } catch (cause) {
        if (!active || controller.signal.aborted) return;
        const error = cause instanceof AdminApiError ? cause : new AdminApiError(0, "결과 조회 실패");
        if (error.status === 401 || error.status === 403) setAuthStatus(error.status);
        pause(error.status === 401 ? "로그인한 후 처리 결과를 다시 확인해 주세요." : error.status === 403 ? "처리 결과를 확인하려면 관리자 권한이 필요합니다." : "처리 결과를 확인하지 못했습니다. 수집 실패 여부는 아직 확인되지 않았습니다.");
      }
    };
    void poll();
    return () => { active = false; controller.abort(); if (timer) clearTimeout(timer); clearTimeout(deadline); };
  }, [tracking, check]);

  return { processing, tracking, trackedJob, paused, notice, authStatus, retryIntent,
    busy: processing || Boolean(tracking && (!trackedJob || !["SUCCEEDED", "FAILED"].includes(trackedJob.status ?? ""))),
    run, retry: () => retryIntent ? runIntent(retryIntent) : undefined,
    recheck: () => { setPaused(undefined); setCheck((value) => value + 1); },
    dismiss: () => setNotice(undefined),
  };
}
