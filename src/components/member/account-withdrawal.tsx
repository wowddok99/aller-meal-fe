"use client";

import { runMutationDialogAction } from "@/components/mutation-dialog-action";
import { ApiNotice } from "@/components/api-notice";

import { SuccessToast, useSuccessToast } from "@/components/success-toast";

import { RefreshCw, Check, CircleAlert, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ModalDialog } from "@/components/modal-dialog";
import { PageHeading } from "@/components/page-heading";
import {
  cancelAccountWithdrawal,
  getAccountWithdrawal,
  MemberApiError,
  requestAccountWithdrawal,
  type AccountWithdrawal,
} from "@/lib/member-api";

type WithdrawalAction = "load" | "request" | "cancel";

function errorMessage(error: MemberApiError, action: WithdrawalAction) {
  if (error.status === 401) return "로그인이 필요합니다.";
  if (error.status === 403)
    return "이메일 인증 또는 접근 권한을 확인해 주세요.";
  if (error.status === 409)
    return action === "request"
      ? "이미 회원 탈퇴가 예약되어 있습니다."
      : action === "cancel"
        ? "취소할 회원 탈퇴 예약이 없습니다."
        : error.message;
  if (error.status === 429)
    return "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  return error.message;
}

function formatWithdrawalDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeZone: "Asia/Seoul",
  }).format(date);
}

export function AccountWithdrawalPage() {
  const [confirming, setConfirming] = useState(false);
  const [confirmingCancellation, setConfirmingCancellation] = useState(false);
  const [loadingWithdrawal, setLoadingWithdrawal] = useState(true);
  const [pending, setPending] = useState(false);
  const [withdrawal, setWithdrawal] = useState<AccountWithdrawal>();
  const { notice, notify: setNotice } = useSuccessToast();
  const [deletionAgreed, setDeletionAgreed] = useState(false);
  const [notificationAgreed, setNotificationAgreed] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const cancelBackButtonRef = useRef<HTMLButtonElement>(null);
  const withdrawalLoadGeneration = useRef(0);
  const mutationGeneration = useRef(0);
  const pendingRef = useRef(false);

  const loadWithdrawal = useCallback(async (requirePending = false) => {
    const generation = ++withdrawalLoadGeneration.current;
    setLoadingWithdrawal(true);
    setLoadError("");
    try {
      const currentWithdrawal = await getAccountWithdrawal();
      if (requirePending && !currentWithdrawal) {
        throw new MemberApiError(
          0,
          "회원 탈퇴 상태를 다시 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
      }
      if (generation !== withdrawalLoadGeneration.current) return currentWithdrawal;
      setWithdrawal(currentWithdrawal ?? undefined);
      setOutcomeUnknown(false);
      setError("");
      return currentWithdrawal;
    } catch (reason) {
      if (generation !== withdrawalLoadGeneration.current) return null;
      setWithdrawal(undefined);
      setConfirming(false);
      setLoadError(
        reason instanceof MemberApiError
          ? errorMessage(reason, "load")
          : "회원 탈퇴 상태를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
      return null;
    } finally {
      if (generation === withdrawalLoadGeneration.current) {
        setLoadingWithdrawal(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadWithdrawal();
    return () => {
      withdrawalLoadGeneration.current += 1;
      mutationGeneration.current += 1;
      pendingRef.current = false;
    };
  }, [loadWithdrawal]);


  async function handleWithdrawal() {
    if (pendingRef.current || loadingWithdrawal || loadError || !deletionAgreed || !notificationAgreed) return;
    if (error) return;
    pendingRef.current = true;
    const generation = ++mutationGeneration.current;
    setPending(true);
    setError("");
    setNotice("");
    try {
      const response = await requestAccountWithdrawal({ mutationErrorDisplay: "local" });
      if (generation !== mutationGeneration.current) return;
      setWithdrawal(response);
      setConfirming(false);
      setNotice("회원 탈퇴가 예약되었습니다.");
    } catch (reason) {
      if (generation !== mutationGeneration.current) return;
      setOutcomeUnknown(reason instanceof MemberApiError && reason.code === "MUTATION_RESULT_UNKNOWN");
      setError(
        reason instanceof MemberApiError
          ? errorMessage(reason, "request")
          : "회원 탈퇴를 예약하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      if (generation === mutationGeneration.current) {
        pendingRef.current = false;
        setPending(false);
      }
    }
  }

  const confirmWithdrawalDialog = () => runMutationDialogAction(
    { busy: pendingRef.current, hasResult: Boolean(error) },
    handleWithdrawal,
    () => setConfirming(false),
    () => loadWithdrawal(),
  );
  const closeWithdrawalDialog = () => {
    if (pendingRef.current) return;
    if (error) void confirmWithdrawalDialog();
    else setConfirming(false);
  };

  async function handleCancellation() {
    if (!confirmingCancellation || !withdrawal || pendingRef.current || loadingWithdrawal || loadError || outcomeUnknown) return;
    pendingRef.current = true;
    setConfirmingCancellation(false);
    const generation = ++mutationGeneration.current;
    setPending(true);
    setError("");
    setNotice("");
    try {
      await cancelAccountWithdrawal({ mutationErrorDisplay: "local" });
      if (generation !== mutationGeneration.current) return;
      setWithdrawal(undefined);
      setDeletionAgreed(false);
      setNotificationAgreed(false);
      setNotice("회원 탈퇴 예약이 취소되었습니다.");
    } catch (reason) {
      if (generation !== mutationGeneration.current) return;
      if (reason instanceof MemberApiError && reason.status === 409) await loadWithdrawal();
      setOutcomeUnknown(reason instanceof MemberApiError && reason.code === "MUTATION_RESULT_UNKNOWN");
      setError(
        reason instanceof MemberApiError
          ? errorMessage(reason, "cancel")
          : "회원 탈퇴 예약을 취소하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      if (generation === mutationGeneration.current) {
        pendingRef.current = false;
        setPending(false);
      }
    }
  }

  /*
   * A load failure is intentionally terminal for this render. Rendering the
   * normal guide would make a request or cancellation from an unknown state.
   */
  const canMutateWithdrawal = !loadingWithdrawal && !loadError && !pending && !outcomeUnknown;
  const canRequestWithdrawal = canMutateWithdrawal && deletionAgreed && notificationAgreed;

  return (
    <main className="mx-auto w-full max-w-[720px] px-5 pb-16 pt-5">
      <PageHeading title="회원 탈퇴" description="AllerMeal 이용을 중단하려면 회원 탈퇴를 진행해 주세요." />

      <div className="mt-7 space-y-4">
        {error && !confirming ? (
          <div className="rounded-[10px] bg-zinc-50 px-4 py-3 dark:bg-zinc-900/60"><ApiNotice title={error === "회원 탈퇴 예약을 취소하지 못했습니다. 잠시 후 다시 시도해 주세요." ? "탈퇴 예약을 취소하지 못했습니다." : error}>{outcomeUnknown ? "확인을 누르면 현재 탈퇴 예약 상태를 다시 조회합니다." : error === "회원 탈퇴 예약을 취소하지 못했습니다. 잠시 후 다시 시도해 주세요." ? "잠시 후 다시 시도해 주세요." : null}</ApiNotice></div>
        ) : null}

        {loadingWithdrawal ? (
          <div
            role="status"
            aria-busy="true"
            className="flex min-h-48 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-500 dark:border-zinc-800 dark:bg-[#101419] dark:text-zinc-400"
          >
            <LoaderCircle className="h-5 w-5 animate-spin" /> 회원 탈퇴 상태를
            불러오고 있습니다.
          </div>
        ) : loadError ? (
          <section className="rounded-2xl border border-zinc-200 bg-white px-5 py-8 sm:py-10 dark:border-zinc-800 dark:bg-[#101419]">
            <ApiNotice centered title="회원 탈퇴 상태를 불러오지 못했어요." action={<button type="button" onClick={() => void loadWithdrawal()} disabled={pending} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[10px] border border-zinc-300 px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"><RefreshCw aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> 다시 시도</button>}>{loadError}</ApiNotice>
          </section>
        ) : withdrawal ? (
          <section
            aria-labelledby="withdrawal-requested-heading"
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419]"
          >
            <div className="flex items-start gap-3">
              <div>
                <h2
                  id="withdrawal-requested-heading"
                  className="text-lg font-semibold"
                >
                  탈퇴 예약
                </h2>
                <p className="mt-1.5 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
                  탈퇴 예정일 전까지 예약을 취소할 수 있습니다.
                </p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 border-t border-zinc-200 pt-5 text-sm dark:border-zinc-800">
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-semibold text-zinc-500 dark:text-zinc-400">
                    예약일
                  </dt>
                  <dd className="font-bold">
                    <time dateTime={withdrawal.withdrawalRequestedAt}>
                      {formatWithdrawalDate(withdrawal.withdrawalRequestedAt)}
                    </time>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-semibold text-zinc-500 dark:text-zinc-400">
                    탈퇴 예정일
                  </dt>
                  <dd className="font-bold">
                    <time dateTime={withdrawal.withdrawalDueAt}>
                      {formatWithdrawalDate(withdrawal.withdrawalDueAt)}
                    </time>
                  </dd>
                </div>
              </dl>
            <button
              type="button"
              disabled={!canMutateWithdrawal}
              onClick={() => setConfirmingCancellation(true)}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-zinc-300 px-5 text-sm font-extrabold text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {pending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" /> 취소 중
                </>
              ) : (
                "탈퇴 예약 취소"
              )}
            </button>
          </section>
        ) : (
          <>
            <section
              aria-labelledby="withdrawal-guide-heading"
              className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419]"
            >
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900/70">
                <div className="flex items-start gap-2">
                  <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
                  <h2 id="withdrawal-guide-heading" className="break-keep text-base font-semibold">
                    탈퇴 전 다시 한번 확인해 주세요.
                  </h2>
                </div>
                <ul className="mt-3 list-disc space-y-1.5 break-keep pl-5 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                  <li>탈퇴는 신청일로부터 <strong className="font-semibold text-zinc-900 dark:text-zinc-100">7일 후 처리</strong>됩니다. 예정일 전까지 이 화면에서 예약을 취소할 수 있습니다.</li>
                  <li>탈퇴가 완료되면 <strong className="font-semibold text-zinc-900 dark:text-zinc-100">계정 및 자녀 정보가 삭제되며 복구할 수 없습니다.</strong></li>
                  <li>탈퇴를 예약하면 발송 대기 중인 알레르기 안내 이메일이 취소됩니다.</li>
                </ul>
              </div>
              <fieldset disabled={pending} className="mt-4 space-y-1 break-keep">
                <legend className="sr-only">회원 탈퇴 동의</legend>
                <label className="flex min-h-8 cursor-pointer items-start gap-2 py-1.5 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                  <input type="checkbox" checked={deletionAgreed} onChange={(event) => setDeletionAgreed(event.target.checked)} className="peer sr-only" />
                  <span aria-hidden="true" className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border peer-focus-visible:ring-2 peer-focus-visible:ring-mint-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-zinc-900 ${deletionAgreed ? "border-mint-500 bg-mint-500 text-white" : "border-zinc-400 bg-white dark:bg-zinc-900"}`}>
                    {deletionAgreed && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span>탈퇴 완료 후 계정 및 자녀 정보가 삭제되며 복구할 수 없음에 동의합니다.</span>
                </label>
                <label className="flex min-h-8 cursor-pointer items-start gap-2 py-1.5 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                  <input type="checkbox" checked={notificationAgreed} onChange={(event) => setNotificationAgreed(event.target.checked)} className="peer sr-only" />
                  <span aria-hidden="true" className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border peer-focus-visible:ring-2 peer-focus-visible:ring-mint-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-zinc-900 ${notificationAgreed ? "border-mint-500 bg-mint-500 text-white" : "border-zinc-400 bg-white dark:bg-zinc-900"}`}>
                    {notificationAgreed && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span>탈퇴 예약 시 발송 대기 중인 알레르기 안내 이메일이 취소됨에 동의합니다.</span>
                </label>
              </fieldset>
              <button
                type="button"
                disabled={!canRequestWithdrawal}
                onClick={() => {
                  if (!canRequestWithdrawal) return;
                  setError("");
                  setConfirming(true);
                }}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-mint-500 px-5 font-bold text-white transition-colors hover:bg-mint-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                회원 탈퇴
              </button>
              <div className="mt-3 text-center">
                <Link href="/schools" className="inline-flex h-12 w-full items-center justify-center rounded-[10px] border border-zinc-300 bg-white px-5 font-bold text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-200 dark:hover:bg-zinc-800">
                  취소
                </Link>
              </div>
            </section>
          </>
        )}
      </div>

      <SuccessToast notice={notice} />

      <ModalDialog open={confirmingCancellation && Boolean(withdrawal)} onClose={() => setConfirmingCancellation(false)} initialFocusRef={cancelBackButtonRef} labelledBy="withdrawal-cancel-title" describedBy="withdrawal-cancel-description">
        <div className="border-b border-zinc-200 px-6 pb-4 pt-6 dark:border-zinc-800"><h2 id="withdrawal-cancel-title" className="break-keep text-xl font-extrabold">탈퇴 예약을 취소할까요?</h2></div>
        <div className="px-6 py-5"><p id="withdrawal-cancel-description" className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">확인하면 예약된 회원 탈퇴가 취소됩니다.</p></div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <button ref={cancelBackButtonRef} type="button" onClick={() => setConfirmingCancellation(false)} className="h-11 min-w-16 rounded-[10px] border border-zinc-300 px-4 text-sm font-bold transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900">취소</button>
          <button type="button" onClick={() => void handleCancellation()} className="inline-flex h-11 min-w-16 items-center justify-center rounded-[10px] bg-mint-500 px-4 text-sm font-extrabold text-white transition-colors hover:bg-mint-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 disabled:opacity-50">확인</button>
        </div>
      </ModalDialog>

      <ModalDialog open={confirming} busy={pending} onClose={closeWithdrawalDialog} initialFocusRef={backButtonRef} labelledBy="withdrawal-confirm-title" describedBy="withdrawal-confirm-description">
        <div className="border-b border-zinc-200 px-6 pb-4 pt-6 dark:border-zinc-800"><h2 id="withdrawal-confirm-title" className="break-keep text-xl font-extrabold">{error ? "회원 탈퇴 예약 안내" : "회원 탈퇴를 예약할까요?"}</h2></div>
        <div key={error ? "result" : "confirmation"} className={error ? undefined : "px-6 pb-6 pt-5"}>
          {error ? <>
            <div id="withdrawal-confirm-description" className="px-6 py-5"><ApiNotice title={outcomeUnknown ? "탈퇴 예약 결과를 확인하지 못했습니다." : "탈퇴 예약 요청을 완료하지 못했습니다."}>{outcomeUnknown ? "확인을 누르면 현재 상태를 다시 확인합니다." : error}</ApiNotice></div>
            <div className="flex justify-end border-t border-zinc-200 px-6 py-4 dark:border-zinc-800"><button ref={backButtonRef} autoFocus type="button" onClick={() => void confirmWithdrawalDialog()} className="inline-flex h-11 min-w-16 items-center justify-center rounded-[10px] bg-mint-500 px-4 text-sm font-extrabold text-white hover:bg-mint-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2">확인</button></div>
          </> : <>
            <p id="withdrawal-confirm-description" className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">예약 후 예정일 전까지는 이 화면에서 직접 취소할 수 있습니다.</p>
            <div className="-mx-6 -mb-6 mt-5 flex flex-wrap justify-end gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <button ref={backButtonRef} type="button" disabled={pending} onClick={closeWithdrawalDialog} className="h-11 min-w-16 rounded-[10px] border border-zinc-300 px-4 text-sm font-bold transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900">취소</button>
              <button type="button" disabled={pending} onClick={() => void confirmWithdrawalDialog()} className="inline-flex h-11 min-w-16 items-center justify-center rounded-[10px] bg-mint-500 px-4 text-sm font-extrabold text-white transition-colors hover:bg-mint-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 disabled:opacity-50">{pending ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /><span className="sr-only">처리 중</span></> : "확인"}</button>
            </div>
          </>}
        </div>
      </ModalDialog>
    </main>
  );
}
