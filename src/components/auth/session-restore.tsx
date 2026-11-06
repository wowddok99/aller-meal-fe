"use client";

import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ApiNotice } from "@/components/api-notice";
import { PageHeading } from "@/components/page-heading";
import { ApiClientError } from "@/shared/api/api-client-error";
import { refreshSession } from "@/shared/api/orval-mutator";

export function SessionRestore({ next }: { next: string }) {
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const restore = useCallback(async () => {
    await refreshSession();
    const response = await fetch("/auth/session", { cache: "no-store" });
    if (!response.ok) throw new Error("Session check failed");
    const session = (await response.json()) as { authenticated?: unknown };
    if (session.authenticated !== true) throw new ApiClientError({ status: 401, code: "SESSION_EXPIRED", message: "로그인이 필요합니다." });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void restore().then(() => {
      if (!cancelled) window.location.replace(next);
    }).catch((failure: unknown) => {
      if (cancelled) return;
      if (failure instanceof ApiClientError && failure.status === 401) {
        window.location.replace(`/auth/login?next=${encodeURIComponent(next)}`);
      } else {
        if (failure instanceof ApiClientError && failure.code === "SESSION_STORAGE_UNAVAILABLE") {
          setError("브라우저 저장 공간에 접근할 수 없습니다. 브라우저 설정을 확인해 주세요.");
        } else if (failure instanceof ApiClientError && failure.code === "CSRF_VALIDATION_FAILED") {
          setError("보안 검증에 실패했습니다. 로그인 화면에서 다시 로그인해 주세요.");
        } else if (failure instanceof ApiClientError && failure.code === "SESSION_STATUS_UNCERTAIN") {
          setError("로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도하거나 다시 로그인해 주세요.");
        } else if (failure instanceof ApiClientError && failure.status === 429) {
          setError("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
        } else {
          setError("로그인 상태를 확인하지 못했어요.");
        }
      }
    });
    return () => { cancelled = true; };
  }, [attempt, next, restore]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-8">
      <PageHeading title="로그인 상태 확인" description={error ? "다시 시도하거나 로그인 화면으로 이동해 주세요." : "로그인 상태를 확인하고 있습니다."} />
      {error ? (
        <div className="mt-6">
          <div className="rounded-[10px] bg-zinc-50 px-4 py-3 dark:bg-zinc-900/60"><ApiNotice title={error} /></div>
          <button type="button" onClick={() => { setError(""); setAttempt((value) => value + 1); }} className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-mint-500 px-5 text-sm font-bold text-white hover:bg-mint-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2">다시 시도</button>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            <a href={`/auth/login?next=${encodeURIComponent(next)}`} className="rounded underline underline-offset-4 transition-colors hover:text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:hover:text-zinc-200">로그인 화면으로 이동</a>
            <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">|</span>
            <a href="/schools" className="rounded underline underline-offset-4 transition-colors hover:text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:hover:text-zinc-200">학교 검색으로 이동</a>
          </div>
        </div>
      ) : <p role="status" className="mt-6 flex items-center gap-2 text-sm font-semibold text-zinc-500"><LoaderCircle className="h-5 w-5 animate-spin" />확인 중입니다.</p>}
    </section>
  );
}
