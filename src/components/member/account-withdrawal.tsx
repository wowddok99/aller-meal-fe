"use client";

import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/auth-api";
import { MemberApiError, requestAccountWithdrawal } from "@/lib/member-api";

function errorMessage(error: MemberApiError) {
  if (error.status === 401) return "로그인이 필요합니다.";
  if (error.status === 403)
    return "이메일 인증 또는 접근 권한을 확인해 주세요.";
  if (error.status === 409)
    return "현재 계정 상태에서는 요청을 처리할 수 없습니다.";
  if (error.status === 429)
    return "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  return error.message;
}

export function AccountWithdrawalPage() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [logoutRequired, setLogoutRequired] = useState(false);
  const [error, setError] = useState("");
  const withdrawalButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

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

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) setConfirming(false);

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

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [confirming, pending]);

  async function completeLogout() {
    setPending(true);
    setError("");
    try {
      await logout();
      router.replace("/auth/login");
      router.refresh();
    } catch {
      setLogoutRequired(true);
      setError(
        "회원 탈퇴는 접수되었지만 로그아웃하지 못했습니다. 다시 로그아웃해 주세요.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleWithdrawal() {
    setPending(true);
    setError("");
    try {
      await requestAccountWithdrawal();
      setConfirming(false);
      setLogoutRequired(true);
      await completeLogout();
    } catch (reason) {
      setError(
        reason instanceof MemberApiError
          ? errorMessage(reason)
          : "회원 탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setPending(false);
    }
  }

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

        {logoutRequired ? (
          <section
            aria-labelledby="logout-heading"
            className="rounded-2xl border border-amber-200 bg-white p-5 md:p-6 dark:border-amber-900/60 dark:bg-[#101419]"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <h2
                  id="logout-heading"
                  className="text-xl font-extrabold tracking-[-0.02em]"
                >
                  회원 탈퇴가 접수되었어요
                </h2>
                <p className="mt-1.5 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
                  보안을 위해 로그아웃한 뒤 탈퇴 처리를 계속합니다.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => void completeLogout()}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-zinc-900 px-5 text-sm font-extrabold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            >
              <LogOut className="h-4 w-4" />
              {pending ? "로그아웃 중" : "로그아웃하기"}
            </button>
          </section>
        ) : (
          <>
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
                <li>다시 로그인하면 진행 중인 탈퇴는 자동으로 취소됩니다.</li>
                <li>개인정보는 관련 정책에 따라 처리됩니다.</li>
              </ol>
              <div className="mt-5 border-t border-zinc-200 pt-5 dark:border-zinc-800">
                <p className="text-sm font-medium leading-6 text-zinc-600 dark:text-zinc-300">
                탈퇴를 진행하면 로그아웃됩니다. 다시 로그인하면 회원 탈퇴를
                취소하고 계정을 계속 이용할 수 있어요.
                </p>
                <button
                  ref={withdrawalButtonRef}
                  type="button"
                  onClick={() => {
                    setError("");
                    setConfirming(true);
                  }}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[10px] border border-red-500 px-5 font-extrabold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-400 dark:hover:bg-red-950/20"
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
            if (event.target === event.currentTarget && !pending) {
              setConfirming(false);
            }
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
              회원 탈퇴를 진행할까요?
            </h2>
            <p
              id="withdrawal-confirm-description"
              className="mt-2 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400"
            >
              진행하면 바로 로그아웃돼요. 탈퇴 예정일 전에 다시 로그인하면
              탈퇴가 자동으로 취소됩니다.
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
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    처리 중
                  </>
                ) : (
                  "탈퇴하기"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
