"use client";

import { Info, LogOut, Menu, Search, UsersRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AllerMealLogo } from "@/components/allermeal-logo";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/schools/1/meals", label: "급식 확인", icon: Search },
  { href: "/children", label: "자녀 관리", icon: UsersRound },
  { href: "/allergens", label: "알레르기 안내", icon: Info },
];

export function MemberShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open]);

  function handleLogout() {
    setOpen(false);
    router.push("/auth/login");
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#f4f6f8] text-zinc-950 dark:bg-canvas dark:text-zinc-50">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-900 dark:bg-[#06080b]">
        <nav className="mx-auto flex h-[50px] w-full max-w-[1220px] items-center justify-between px-5">
          <div className="flex h-full items-center gap-8">
            <Link href="/" aria-label="AllerMeal 홈"><AllerMealLogo variant="full" className="relative top-[2px]" /></Link>
            <div className="hidden h-full items-center gap-8 md:flex">
              {links.map((link) => {
                const active = link.href === "/children" ? pathname.startsWith("/children") : pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-full items-center border-b-2 px-1 text-[15px] font-bold transition-colors ${active ? "border-mint-500 text-mint-600 dark:text-mint-400" : "border-transparent text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <button type="button" onClick={handleLogout} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white dark:focus-visible:ring-zinc-700"><LogOut className="h-4 w-4" />로그아웃</button>
            <ThemeToggle />
          </div>
          <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:text-zinc-200 dark:focus-visible:ring-zinc-700 md:hidden" aria-label="메뉴 열기" aria-expanded={open}><Menu className="h-6 w-6" /></button>
        </nav>
        <div className={`fixed inset-0 z-50 overflow-clip transition-[background-color,opacity] duration-200 md:hidden ${open ? "pointer-events-auto bg-black/20 opacity-100 dark:bg-black/35" : "pointer-events-none bg-transparent opacity-0"}`} aria-hidden={!open}>
          <button type="button" className="absolute inset-0 h-full w-full cursor-default" aria-label="메뉴 닫기" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} />
          <div className={`relative ml-auto h-[100dvh] w-screen bg-white transition-transform duration-300 ease-out dark:bg-[#06080b] sm:max-w-[420px] ${open ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex h-14 items-center justify-between border-b border-zinc-100 px-4 dark:border-zinc-900">
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-zinc-600" aria-label="메뉴 닫기"><X className="h-6 w-6" /></button>
              <AllerMealLogo variant="full" />
            </div>
            <nav className="px-4 py-3" aria-label="회원 메뉴">
              <div className="flex flex-col gap-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const active = link.href === "/children" ? pathname.startsWith("/children") : pathname === link.href;
                  return <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={`flex h-[52px] items-center gap-3 rounded-[10px] px-3 text-[16px] font-bold ${active ? "bg-zinc-100 text-mint-600 dark:bg-zinc-900 dark:text-mint-400" : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"}`}><Icon className="h-5 w-5" />{link.label}</Link>;
                })}
              </div>
              <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <button type="button" onClick={handleLogout} className="flex h-[52px] w-full items-center gap-3 rounded-[10px] px-3 text-[16px] font-bold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"><LogOut className="h-5 w-5" />로그아웃</button>
                <ThemeToggle variant="menu" />
              </div>
            </nav>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
