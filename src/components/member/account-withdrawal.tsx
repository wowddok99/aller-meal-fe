"use client";

import { AlertTriangle, CheckCircle2, LoaderCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelAccountWithdrawal,
  getAccountWithdrawal,
  MemberApiError,
  requestAccountWithdrawal,
  type AccountWithdrawal,
} from "@/lib/member-api";

type WithdrawalResult = "idle" | "cancelled";
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
  const [loadingWithdrawal, setLoadingWithdrawal] = useState(true);
  const [pending, setPending] = useState(false);
  const [withdrawal, setWithdrawal] = useState<AccountWithdrawal>();
  const [result, setResult] = useState<WithdrawalResult>("idle");
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const withdrawalButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const withdrawalLoadGeneration = useRef(0);

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
      setResult("idle");
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
    };
  }, [loadWithdrawal]);

  useEffect(() => {
    if (!confirming) return;
    const previousOverflow = document.body.style.overflow;
    const returnFocusElement = withdrawalButtonRef.current;
    document.body.style.overflow = "hidden";
    backButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      returnFocusElement?.focus();
    };
  }, [confirming]);

  useEffect(() => {
    if (!confirming) return;
    function keepFocusInDialog(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        setConfirming(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusableElements =
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
      if (!focusableElements?.length) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
    window.addEventListener("keydown", keepFocusInDialog);
    return () => window.removeEventListener("keydown", keepFocusInDialog);
  }, [confirming, pending]);

  async function handleWithdrawal() {
    if (pending || loadingWithdrawal || loadError) return;
    setPending(true);
    setError("");
    try {
      const response = await requestAccountWithdrawal();
      setWithdrawal(response);
      setResult("idle");
      setConfirming(false);
    } catch (reason) {
      if (reason instanceof MemberApiError && reason.status === 409) {
        setConfirming(false);
        await loadWithdrawal(true);
        return;
      }
      setError(
        reason instanceof MemberApiError
          ? errorMessage(reason, "request")
          : "회원 탈퇴를 예약하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleCancellation() {
    if (pending || loadingWithdrawal || loadError) return;
    setPending(true);
    setError("");
    try {
      await cancelAccountWithdrawal();
      setWithdrawal(undefined);
      setResult("cancelled");
    } catch (reason) {
      setError(
        reason instanceof MemberApiError
          ? errorMessage(reason, "cancel")
          : "회원 탈퇴 예약을 취소하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setPending(false);
    }
  }

  /*
   * A load failure is intentionally terminal for this render. Rendering the
   * normal guide would make a request or cancellation from an unknown state.
   */
  const canMutateWithdrawal = !loadingWithdrawal && !loadError && !pending;

  return (
    <main className="mx-auto w-full max-w-[720px] px-5 pb-16 pt-5">
      <header>
        <h1 className="text-3xl font-extrabold tracking-[-0.035em]">
          회원 탈퇴
        </h1>
        <p className="mt-3 text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">
          AllerMeal 이용을 중단하려면 회원 탈퇴를 진행해 주세요.
        </p>
      </header>

      <div className="mt-7 space-y-4">
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
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
          <section
            aria-labelledby="withdrawal-load-error-heading"
            className="rounded-2xl border border-red-200 bg-white p-5 text-center dark:border-red-950 dark:bg-[#101419]"
          >
            <AlertTriangle className="mx-auto h-9 w-9 text-red-500" />
            <h2
              id="withdrawal-load-error-heading"
              className="mt-3 text-lg font-extrabold"
            >
              회원 탈퇴 상태를 불러오지 못했습니다
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => void loadWithdrawal()}
              disabled={pending}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 px-5 text-sm font-bold transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <RefreshCw className="h-4 w-4" /> 다시 시도
            </button>
          </section>
        ) : withdrawal ? (
          <section
            aria-labelledby="withdrawal-requested-heading"
            className="rounded-2xl border border-amber-200 bg-white p-5 md:p-6 dark:border-amber-900/60 dark:bg-[#101419]"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h2
                  id="withdrawal-requested-heading"
                  className="text-xl font-extrabold tracking-[-0.02em]"
                >
                  회원 탈퇴가 예약되었어요
                </h2>
                <p className="mt-1.5 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
                  예정일 전까지 예약을 취소하고 계정을 계속 이용할 수 있어요.
                </p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 rounded-xl bg-zinc-50 px-4 py-3 text-sm dark:bg-zinc-900/70">
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
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-semibold text-zinc-500 dark:text-zinc-400">
                    보호 처리 알림
                  </dt>
                  <dd className="font-bold">
                    {withdrawal.maskedNotificationCount}건
                  </dd>
                </div>
              </dl>
            <button
              type="button"
              disabled={!canMutateWithdrawal}
              onClick={() => void handleCancellation()}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-zinc-300 px-5 text-sm font-extrabold text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {pending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" /> 취소 중
                </>
              ) : (
                "탈퇴 예약 취소하기"
              )}
            </button>
          </section>
        ) : (
          <>
            {result === "cancelled" ? (
              <section
                aria-labelledby="withdrawal-cancelled-heading"
                className="flex items-start gap-3 rounded-2xl border border-mint-200 bg-mint-50 p-5 text-mint-900 dark:border-mint-900/60 dark:bg-mint-950/20 dark:text-mint-100"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <h2
                    id="withdrawal-cancelled-heading"
                    className="font-extrabold"
                  >
                    회원 탈퇴 예약을 취소했어요
                  </h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-mint-800 dark:text-mint-200">
                    계정을 계속 이용할 수 있습니다.
                  </p>
                </div>
              </section>
            ) : null}
            <section
              aria-labelledby="withdrawal-guide-heading"
              className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419]"
            >
              <h2
                id="withdrawal-guide-heading"
                className="text-xl font-extrabold tracking-[-0.02em]"
              >
                탈퇴 전에 확인해 주세요
              </h2>
              <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm font-medium leading-6 text-zinc-600 marker:text-zinc-600 dark:text-zinc-300 dark:marker:text-zinc-300">
                <li>
                  탈퇴를 진행한 뒤 예정일 전까지는 언제든 취소할 수 있어요.
                </li>
                <li>탈퇴 예약을 취소하면 계정을 계속 이용할 수 있어요.</li>
                <li>개인정보는 관련 정책에 따라 처리됩니다.</li>
              </ol>
              <div className="mt-5 border-t border-zinc-200 pt-5 dark:border-zinc-800">
                <p className="text-sm font-medium leading-6 text-zinc-600 dark:text-zinc-300">
                  탈퇴 예약과 취소는 현재 계정의 실제 상태에 따라 처리됩니다.
                </p>
                <button
                  ref={withdrawalButtonRef}
                  type="button"
                  disabled={!canMutateWithdrawal}
                  onClick={() => {
                    setError("");
                    setConfirming(true);
                  }}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[10px] border border-red-500 px-5 font-extrabold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/20"
                >
                  회원 탈퇴하기
                </button>
              </div>
            </section>
          </>
        )}
      </div>

      {confirming ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdrawal-confirm-title"
          aria-describedby="withdrawal-confirm-description"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending)
              setConfirming(false);
          }}
        >
          <div
            ref={dialogRef}
            className="w-full max-w-md rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl sm:p-6 dark:bg-[#101419]"
          >
            <h2
              id="withdrawal-confirm-title"
              className="text-xl font-extrabold tracking-[-0.02em]"
            >
              회원 탈퇴를 예약할까요?
            </h2>
            <p
              id="withdrawal-confirm-description"
              className="mt-2 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400"
            >
              예약 후 예정일 전까지는 이 화면에서 직접 취소할 수 있어요.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                ref={backButtonRef}
                type="button"
                disabled={pending}
                onClick={() => setConfirming(false)}
                className="h-12 rounded-xl bg-zinc-100 px-4 text-sm font-extrabold text-zinc-700 transition-colors hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                돌아가기
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => void handleWithdrawal()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-extrabold text-white transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-[#101419]"
              >
                {pending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" /> 처리 중
                  </>
                ) : (
                  "탈퇴 예약하기"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
