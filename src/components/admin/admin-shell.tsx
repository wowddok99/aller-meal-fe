"use client";

import { BellRing, DatabaseZap, Menu, ScrollText, ShieldCheck, TriangleAlert, UserRoundCog, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AllerMealLogo } from "@/components/allermeal-logo";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/admin", label: "대시보드", icon: DatabaseZap },
  { href: "/admin/collection-failures", label: "수집 실패", icon: TriangleAlert },
  { href: "/admin/external-api-logs", label: "외부 API 로그", icon: ScrollText },
  { href: "/admin/notification-failures", label: "알림", icon: BellRing },
  { href: "/admin/notification-dlq-events", label: "DLQ", icon: ShieldCheck },
  { href: "/admin/users/8f3a0000-0000-4000-8000-000000007b9c/role", label: "사용자 권한", icon: UserRoundCog, previewHref: "/admin/preview/users/preview/role" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isReviewPreview = pathname.startsWith("/admin/preview");
  const reviewLinks = links.map((link) => ({
    ...link,
    href: link.previewHref ?? (link.href === "/admin" ? "/admin/preview" : `/admin/preview${link.href.slice("/admin".length)}`),
  }));
  const navigationLinks = isReviewPreview ? reviewLinks : links;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <main className="min-h-[100dvh] bg-zinc-50 text-zinc-950 dark:bg-canvas dark:text-zinc-50">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-900 dark:bg-[#06080b]">
        <nav className="mx-auto flex h-[50px] w-full max-w-[1220px] items-center justify-between px-5">
          <div className="flex h-full items-center gap-8">
            <Link href="/" aria-label="AllerMeal 홈"><AllerMealLogo variant="full" /></Link>
            <div className="hidden h-full items-center gap-8 lg:flex">
              {navigationLinks.map((link) => {
                const active = pathname === link.href;
                return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={`flex h-full items-center border-b-2 px-1 text-[15px] font-bold transition-colors ${active ? "border-mint-500 text-mint-600 dark:text-mint-400" : "border-transparent text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"}`}>{link.label}</Link>;
              })}
            </div>
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-300"><ShieldCheck className="h-4 w-4" /></span>
            <p className="text-sm font-extrabold">관리자</p>
            <ThemeToggle />
          </div>
          <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:text-zinc-200 dark:focus-visible:ring-zinc-700 lg:hidden" aria-label="관리자 메뉴 열기" aria-expanded={open}><Menu className="h-6 w-6" /></button>
        </nav>
        <div className={`fixed inset-0 z-50 overflow-hidden transition-[background-color,opacity] duration-200 lg:hidden ${open ? "pointer-events-auto bg-black/20 opacity-100 dark:bg-black/35" : "pointer-events-none bg-transparent opacity-0"}`} aria-hidden={!open}>
          <button type="button" className="absolute inset-0 h-full w-full cursor-default" aria-label="관리자 메뉴 닫기" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} />
          <div className={`relative ml-auto h-[100dvh] w-screen bg-white transition-transform duration-300 ease-out dark:bg-[#06080b] sm:max-w-[420px] ${open ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex h-14 items-center justify-between border-b border-zinc-100 px-4 dark:border-zinc-900"><button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-zinc-600" aria-label="관리자 메뉴 닫기"><X className="h-6 w-6" /></button><AllerMealLogo variant="full" /></div>
            <nav className="px-4 py-3" aria-label="관리자 메뉴"><div className="flex flex-col gap-1">{navigationLinks.map((link) => { const Icon = link.icon; const active = pathname === link.href; return <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={`flex h-[52px] items-center gap-3 rounded-[10px] px-3 text-[16px] font-bold ${active ? "bg-zinc-100 text-mint-600 dark:bg-zinc-900 dark:text-mint-400" : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"}`}><Icon className="h-5 w-5" />{link.label}</Link>; })}</div><div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800"><ThemeToggle variant="menu" /></div></nav>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
