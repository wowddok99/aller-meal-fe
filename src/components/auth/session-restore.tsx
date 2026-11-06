"use client";

import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
          setError("로그인 상태를 확인하지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
        }
      }
    });
    return () => { cancelled = true; };
  }, [attempt, next, restore]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-8">
      <PageHeading title="로그인 상태 확인" description="로그인 상태를 확인하고 있습니다." />
      {error ? (
        <div role="alert" className="mt-6 space-y-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          <p>{error}</p>
          <button type="button" onClick={() => { setError(""); setAttempt((value) => value + 1); }} className="flex h-12 w-full items-center justify-center rounded-[10px] bg-mint-500 px-6 text-base font-extrabold text-white hover:bg-mint-600">다시 시도</button>
          <a href={`/auth/login?next=${encodeURIComponent(next)}`} className="flex h-12 w-full items-center justify-center rounded-[10px] border border-zinc-200 text-sm font-bold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">로그인 화면으로 이동</a>
          <a href="/schools" className="flex h-12 w-full items-center justify-center rounded-[10px] border border-zinc-200 text-sm font-bold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">학교 검색으로 이동</a>
        </div>
      ) : <p role="status" className="mt-6 flex items-center gap-2 text-sm font-semibold text-zinc-500"><LoaderCircle className="h-5 w-5 animate-spin" />확인 중입니다.</p>}
    </section>
  );
}
