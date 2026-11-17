"use client";

import { LogOut, Trash2, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GuardedLink } from "@/components/member/guarded-link";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ProfileFailureState } from "@/components/profile-request";

type Props = {
  displayName?: string | null;
  email?: string;
  profileFailure?: ProfileFailureState;
  withdrawalPending?: boolean;
  isLoggingOut: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
};

function Avatar() {
  return <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"><UserRound className="h-5 w-5" /></span>;
}

export function ProfileMenuContent({ displayName, email, profileFailure, withdrawalPending, isLoggingOut, onLogout, onNavigate }: Props) {
  return <div>
    {(displayName || email || profileFailure) && <div className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
      {displayName && <p className="break-words text-sm font-bold text-zinc-900 dark:text-zinc-100">{displayName}</p>}
      {email && <p className="break-all text-xs text-zinc-500 dark:text-zinc-400">{email}</p>}
      {profileFailure && !email && <p className="text-xs text-zinc-500 dark:text-zinc-400">계정 정보를 불러오지 못했습니다.</p>}
    </div>}
    <ThemeToggle variant="menu" />
    <button type="button" disabled={isLoggingOut} onClick={onLogout} className="flex h-[52px] w-full items-center gap-3 rounded-[10px] px-3 text-left text-[16px] font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-900"><LogOut className="h-5 w-5" aria-hidden="true" />{isLoggingOut ? "로그아웃 중" : "로그아웃"}</button>
    <div className="border-t border-zinc-200 pt-1 dark:border-zinc-800"><GuardedLink href="/account/withdrawal" onClick={onNavigate} className="flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[16px] font-bold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-mint-500 dark:text-zinc-300 dark:hover:bg-zinc-900"><Trash2 aria-hidden="true" className="h-5 w-5 shrink-0" />{withdrawalPending ? "탈퇴 예약 확인" : "회원탈퇴"}</GuardedLink></div>
  </div>;
}

export function ProfileMenu(props: Props) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) { if (!container.current?.contains(event.target as Node)) setOpen(false); }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div ref={container} className="relative">
    <button ref={trigger} type="button" aria-label="계정 메뉴" aria-expanded={open} aria-controls="account-profile-menu" onClick={() => setOpen((value) => !value)} className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500"><Avatar /></button>
    {open && <div id="account-profile-menu" className="absolute right-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-6rem)] rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-[#101318]"><ProfileMenuContent {...props} onLogout={() => { setOpen(false); props.onLogout(); }} onNavigate={() => { setOpen(false); props.onNavigate?.(); }} /></div>}
  </div>;
}
