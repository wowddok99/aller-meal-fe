"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAccountProfile } from "@/generated/api/member";
import type { AccountProfileResponse } from "@/generated/api/member/models";
import { getProfileFailureState, loadCurrentProfile, type ProfileFailureState } from "@/components/profile-request";
import { ApiClientError } from "@/shared/api/api-client-error";
import { getAccountPageDecision, getConfirmedAccountAccess, isWithdrawalOnly, WITHDRAWAL_PATH, type ConfirmedAccountAccess } from "@/shared/account/account-access-policy";
import { ACCOUNT_STATUS_CHANGED_EVENT } from "@/shared/account/account-status-event";
import { API_SESSION_CHANGED_EVENT, API_SESSION_PENDING_EVENT, API_SESSION_UNCERTAIN_EVENT, API_SESSION_EXPIRED_EVENT, API_SESSION_REFRESHED_EVENT, refreshSession } from "@/shared/api/orval-mutator";

type AccountAccess = {
  isAuthenticated: boolean | undefined;
  sessionCheckFailed: boolean;
  sessionChecking: boolean;
  profile: AccountProfileResponse | undefined;
  profileFailure: ProfileFailureState | undefined;
  access: ConfirmedAccountAccess | undefined;
  profileLoading: boolean;
  reloadAccount: () => void;
  clearAccount: () => void;
  hideAccountProfile: () => void;
};
const AccountAccessContext = createContext<AccountAccess | null>(null);

export function useAccountAccess() {
  const state = useContext(AccountAccessContext);
  if (!state) throw new Error("AccountAccessProvider is required.");
  return state;
}

export function AccountAccessProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const sessionLoadGeneration = useRef(0);
  const sessionTransitionPending = useRef(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>();
  const [sessionCheckFailed, setSessionCheckFailed] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [sessionAttempt, setSessionAttempt] = useState(0);
  const [profile, setProfile] = useState<AccountProfileResponse>();
  const [profileFailure, setProfileFailure] = useState<ProfileFailureState>();
  const [access, setAccess] = useState<ConfirmedAccountAccess>();
  const [profileLoading, setProfileLoading] = useState(false);
  const reloadAccount = useCallback(() => setSessionAttempt((attempt) => attempt + 1), []);
  const hideAccountProfile = useCallback(() => {
    sessionLoadGeneration.current += 1;
    setProfile(undefined);
    setAccess(undefined);
    setProfileFailure(undefined);
    setProfileLoading(true);
    setSessionChecking(true);
  }, []);
  const clearAccount = useCallback(() => {
    hideAccountProfile();
    sessionTransitionPending.current = false;
    setIsAuthenticated(false);
    setSessionCheckFailed(false);
    setProfileLoading(false);
    setSessionChecking(false);
  }, [hideAccountProfile]);
  useEffect(() => {
    let disposed = false;
    let recheckScheduled = false;
    async function loadSession() {
      if (sessionTransitionPending.current) return;
      const generation = ++sessionLoadGeneration.current;
      setProfile(undefined);
      setProfileFailure(undefined);
      setProfileLoading(true);
      setSessionChecking(true);
      try {
        let response = await fetch("/auth/session", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Unable to load the session state.");
        let data = (await response.json()) as { authenticated?: unknown };
        if (data.authenticated !== true && response.headers.get("X-Session-Restore-Available") === "1" && !pathname.startsWith("/auth/")) {
          await refreshSession();
          response = await fetch("/auth/session", { cache: "no-store" });
          if (!response.ok) throw new Error("Unable to load the session state.");
          data = (await response.json()) as { authenticated?: unknown };
        }
        if (generation !== sessionLoadGeneration.current) return;
        if (typeof data.authenticated !== "boolean") throw new Error("Invalid session response.");
        setIsAuthenticated(data.authenticated);
        setSessionCheckFailed(false);
        if (data.authenticated) {
          await loadCurrentProfile(
            async () => {
              const result = await getAccountProfile({ cache: "no-store" });
              getConfirmedAccountAccess(result);
              return result;
            },
            () => generation === sessionLoadGeneration.current,
            (result) => { setAccess(getConfirmedAccountAccess(result)); setProfile(result); },
            (error) => setProfileFailure(getProfileFailureState(error)),
            () => setSessionChecking(false),
          );
        } else {
          setAccess(undefined);
          setSessionChecking(false);
        }
      } catch (error) {
        if (generation !== sessionLoadGeneration.current) return;
        setAccess(undefined);
        if (error instanceof ApiClientError && error.status === 401) {
          setIsAuthenticated(false);
          setSessionCheckFailed(false);
        } else {
          setIsAuthenticated(undefined);
          setSessionCheckFailed(true);
        }
      } finally {
        if (generation === sessionLoadGeneration.current) { setSessionChecking(false); setProfileLoading(false); }
      }
    }

    function clearSession() {
      sessionLoadGeneration.current += 1;
      sessionTransitionPending.current = false;
      setIsAuthenticated(false);
      setAccess(undefined);
      setProfileLoading(false);
      setProfile(undefined);
      setProfileFailure(undefined);
      setSessionCheckFailed(false);
      setSessionChecking(false);
    }

    function reloadSession() {
      void loadSession();
    }

    function hideProfile() {
      sessionLoadGeneration.current += 1;
      setProfile(undefined);
      setAccess(undefined);
      setProfileLoading(true);
      setProfileFailure(undefined);
      setSessionChecking(true);
    }
    // Storage observation can emit pending/end events synchronously. Coalesce
    // them and wait until the marker transition has actually ended before GETs.
    function scheduleRecheck() {
      if (recheckScheduled) return;
      recheckScheduled = true;
      queueMicrotask(() => {
        recheckScheduled = false;
        if (!disposed && !sessionTransitionPending.current) void loadSession();
      });
    }
    function onChanged() {
      hideProfile();
      scheduleRecheck();
    }
    function onUncertain() {
      hideProfile();
      setProfileLoading(false);
      setSessionChecking(false);
      setIsAuthenticated(undefined);
      setSessionCheckFailed(true);
    }
    function onPending(event: Event) {
      if ((event as CustomEvent<boolean>).detail === true) {
        sessionTransitionPending.current = true;
        hideProfile();
      } else if (sessionTransitionPending.current) {
        sessionTransitionPending.current = false;
        scheduleRecheck();
      }
    }
    function onStorage(event: StorageEvent) {
      if (event.key === null || event.key.includes("session")) onChanged();
    }
    void loadSession();
    window.addEventListener("storage", onStorage);
    window.addEventListener(API_SESSION_CHANGED_EVENT, onChanged);
    window.addEventListener(API_SESSION_PENDING_EVENT, onPending);
    window.addEventListener(API_SESSION_UNCERTAIN_EVENT, onUncertain);
    window.addEventListener(API_SESSION_EXPIRED_EVENT, clearSession);
    window.addEventListener(API_SESSION_REFRESHED_EVENT, reloadSession);
    window.addEventListener(ACCOUNT_STATUS_CHANGED_EVENT, reloadSession);
    return () => {
      disposed = true;
      sessionLoadGeneration.current += 1;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(API_SESSION_CHANGED_EVENT, onChanged);
      window.removeEventListener(API_SESSION_PENDING_EVENT, onPending);
      window.removeEventListener(API_SESSION_UNCERTAIN_EVENT, onUncertain);
      window.removeEventListener(API_SESSION_EXPIRED_EVENT, clearSession);
      window.removeEventListener(API_SESSION_REFRESHED_EVENT, reloadSession);
      window.removeEventListener(ACCOUNT_STATUS_CHANGED_EVENT, reloadSession);
    };
  }, [pathname, sessionAttempt]);

  useEffect(() => {
    if (isWithdrawalOnly(access) && pathname !== WITHDRAWAL_PATH) router.replace(WITHDRAWAL_PATH);
  }, [access, pathname, router]);

  return <AccountAccessContext.Provider value={{ isAuthenticated, sessionCheckFailed, sessionChecking, profile, profileFailure, access, profileLoading, reloadAccount, clearAccount, hideAccountProfile }}>{children}</AccountAccessContext.Provider>;
}

/** Keep the shell, but never mount another page body for a confirmed pending account. */
export function AccountPageBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { access, isAuthenticated, sessionChecking, profileLoading } = useAccountAccess();
  const decision = getAccountPageDecision(pathname, access, isAuthenticated, sessionChecking, profileLoading);
  if (decision !== "show") return <p role="status" className="mx-auto w-full max-w-[1220px] px-5 py-8 text-center text-sm text-zinc-500">{decision === "checking" ? "계정 상태를 확인하고 있습니다." : "탈퇴 예약 화면으로 이동하고 있습니다."}</p>;
  return children;
}
