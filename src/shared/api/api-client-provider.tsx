"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ApiClientError } from "./api-client-error";
import { API_MUTATION_RESULT_UNKNOWN_EVENT, API_SESSION_CHANGED_EVENT, API_SESSION_EXPIRED_EVENT, API_SESSION_PENDING_EVENT, API_SESSION_UNCERTAIN_EVENT, observeAuthSessionTransition } from "./orval-mutator";
import { getSessionExpiredLoginUrl } from "./session-expired-redirect";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          !(error instanceof ApiClientError &&
            (error.sessionExpired || ["SESSION_CHANGED", "SESSION_TRANSITION_PENDING", "SESSION_STATUS_UNCERTAIN", "SESSION_RETRY_REQUIRED", "REFRESH_RETRY_REQUIRED", "REQUEST_TIMEOUT"].includes(error.code) || error.status === 401 || error.status === 403)) &&
          failureCount < 3,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function ApiClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const [sessionChanged, setSessionChanged] = useState<"changed" | "storage" | "uncertain" | "pending" | null>(null);
  const [mutationUnknown, setMutationUnknown] = useState(false);

  useEffect(() => {
    const onSessionExpired = () => {
      queryClient.clear();
      window.location.assign(getSessionExpiredLoginUrl(window.location));
    };

    const onSessionChanged = (event: Event) => {
      queryClient.clear();
      setSessionChanged(event instanceof CustomEvent && event.detail === "storage" ? "storage" : "changed");
    };

    const onSessionUncertain = () => setSessionChanged((current) => current ?? "uncertain");
    const onMutationUnknown = () => setMutationUnknown(true);
    const onSessionPending = (event: Event) => {
      const path = window.location.pathname;
      const protectedPage = ["/children", "/admin", "/account"].some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
      if (!protectedPage) return;
      const pending = event instanceof CustomEvent && event.detail === true;
      setSessionChanged((current) => pending ? current ?? "pending" : current === "pending" ? null : current);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") observeAuthSessionTransition();
    };

    window.addEventListener(API_SESSION_EXPIRED_EVENT, onSessionExpired);
    window.addEventListener(API_SESSION_CHANGED_EVENT, onSessionChanged);
    window.addEventListener(API_SESSION_UNCERTAIN_EVENT, onSessionUncertain);
    window.addEventListener(API_MUTATION_RESULT_UNKNOWN_EVENT, onMutationUnknown);
    window.addEventListener(API_SESSION_PENDING_EVENT, onSessionPending);
    window.addEventListener("storage", observeAuthSessionTransition);
    window.addEventListener("pageshow", observeAuthSessionTransition);
    document.addEventListener("visibilitychange", onVisibilityChange);
    observeAuthSessionTransition();
    return () => {
      window.removeEventListener(API_SESSION_EXPIRED_EVENT, onSessionExpired);
      window.removeEventListener(API_SESSION_CHANGED_EVENT, onSessionChanged);
      window.removeEventListener(API_SESSION_UNCERTAIN_EVENT, onSessionUncertain);
      window.removeEventListener(API_MUTATION_RESULT_UNKNOWN_EVENT, onMutationUnknown);
      window.removeEventListener(API_SESSION_PENDING_EVENT, onSessionPending);
      window.removeEventListener("storage", observeAuthSessionTransition);
      window.removeEventListener("pageshow", observeAuthSessionTransition);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>
    <div inert={sessionChanged !== null || mutationUnknown}>{children}</div>
    {sessionChanged || mutationUnknown ? <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-5">
      <section role="alertdialog" aria-modal="true" aria-labelledby="session-changed-title" aria-describedby="session-changed-description" className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#101419]">
        <h2 id="session-changed-title" className="text-lg font-bold">{mutationUnknown ? "요청 결과를 확인해 주세요" : sessionChanged === "changed" ? "로그인 상태가 변경되었습니다" : "로그인 상태를 확인할 수 없습니다"}</h2>
        <p id="session-changed-description" className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{mutationUnknown ? "요청이 처리됐는지 확인하지 못했습니다. 변경 사항을 확인한 뒤 다시 시도해 주세요." : sessionChanged === "storage" ? "브라우저 저장 공간에 접근할 수 없어 보호된 요청을 중지했습니다. 브라우저 설정을 확인해 주세요." : sessionChanged === "pending" ? "다른 탭에서 로그인 상태를 변경하고 있습니다. 완료될 때까지 기다리거나 다시 로그인해 주세요." : sessionChanged === "uncertain" ? "로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도하거나 다시 로그인해 주세요." : "다른 탭에서 로그인 상태가 변경되어 이 화면의 요청을 중지했습니다. 화면을 새로고침하면 작성 중인 내용이 사라질 수 있습니다."}</p>
        {mutationUnknown ? <button type="button" autoFocus onClick={() => setMutationUnknown(false)} className="mt-5 flex h-12 w-full items-center justify-center rounded-[10px] bg-mint-500 px-6 text-base font-extrabold text-white hover:bg-mint-600">확인</button> : sessionChanged === "uncertain" ? <button type="button" autoFocus onClick={() => setSessionChanged(null)} className="mt-5 flex h-12 w-full items-center justify-center rounded-[10px] bg-mint-500 px-6 text-base font-extrabold text-white hover:bg-mint-600">계속해서 다시 시도</button> : <button type="button" autoFocus onClick={() => window.location.reload()} className="mt-5 flex h-12 w-full items-center justify-center rounded-[10px] bg-mint-500 px-6 text-base font-extrabold text-white hover:bg-mint-600">화면 새로고침</button>}
        {sessionChanged === "uncertain" || sessionChanged === "pending" ? <a href={getSessionExpiredLoginUrl(window.location)} className="mt-3 flex h-12 w-full items-center justify-center rounded-[10px] border border-zinc-200 text-sm font-bold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">로그인 화면으로 이동</a> : null}
        {sessionChanged === "storage" ? <a href="/schools" className="mt-3 flex h-12 w-full items-center justify-center rounded-[10px] border border-zinc-200 text-sm font-bold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">학교 검색으로 이동</a> : null}
      </section>
    </div> : null}
  </QueryClientProvider>;
}
