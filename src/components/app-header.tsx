"use client";

import { ChevronDown, Info, LogOut, Menu, Search, Settings2, Soup, UsersRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AllerMealLogo } from "@/components/allermeal-logo";
import { ThemeToggle } from "@/components/theme-toggle";

const navigationItems = [
  { href: "/schools", label: "학교 검색", icon: Search },
  { href: "/children/preview/meals", label: "자녀 급식", icon: Soup },
  { href: "/children", label: "자녀 관리", icon: UsersRound },
  { href: "/allergens", label: "알레르기 안내", icon: Info },
] as const;

function isNavigationItemActive(pathname: string, href: string) {
  if (href === "/schools") return pathname === "/schools" || pathname.startsWith("/schools/");
  if (href === "/children/preview/meals") return pathname.startsWith("/children/") && pathname.endsWith("/meals");
  if (href === "/allergens") return pathname === "/allergens";
  if (href === "/children") return pathname === "/children" || (pathname.startsWith("/children/") && !pathname.endsWith("/meals"));
  return pathname.startsWith("/admin");
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const serviceMenuRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const [mobileServiceOpen, setMobileServiceOpen] = useState(pathname.startsWith("/admin"));
  const serviceManagementActive = pathname.startsWith("/admin");
  const serviceManagementItems = pathname.startsWith("/admin/preview")
    ? [{ href: "/admin/preview", label: "관리자 대시보드" }, { href: "/admin/preview/users/preview/role", label: "사용자 권한" }]
    : [{ href: "/admin", label: "관리자 대시보드" }, { href: "/admin/users/8f3a0000-0000-4000-8000-000000007b9c/role", label: "사용자 권한" }];

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previousOverflow; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!serviceMenuOpen) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (!serviceMenuRef.current?.contains(event.target as Node)) setServiceMenuOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setServiceMenuOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [serviceMenuOpen]);

  function handleLogout() {
    setMobileMenuOpen(false);
    router.push("/auth/login");
  }

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-900 dark:bg-[#06080b]">
      <nav className="mx-auto flex h-[50px] w-full max-w-[1220px] items-center justify-between px-5" aria-label="주요 메뉴">
        <div className="flex h-full min-w-0 items-center gap-8">
          <Link href="/schools" aria-label="AllerMeal 홈" className="flex shrink-0 items-center transition-opacity hover:opacity-90 active:opacity-80"><AllerMealLogo variant="full" className="-translate-y-px" /></Link>
          <div className="hidden h-full items-center gap-6 md:flex">
            {navigationItems.map((item) => {
              const active = isNavigationItemActive(pathname, item.href);
              return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex h-full shrink-0 items-center border-b-2 px-1 text-[15px] font-bold transition-colors ${active ? "border-mint-500 text-mint-600 dark:text-mint-400" : "border-transparent text-zinc-600 hover:text-zinc-950 focus-visible:text-mint-600 dark:text-zinc-300 dark:hover:text-white dark:focus-visible:text-mint-400"}`}>{item.label}</Link>;
            })}
            <div ref={serviceMenuRef} className="relative flex h-full items-center">
              <button type="button" onClick={() => setServiceMenuOpen((current) => !current)} aria-expanded={serviceMenuOpen} aria-controls="service-management-menu" className={`flex h-full shrink-0 items-center border-b-2 px-1 text-[15px] font-bold transition-colors focus:outline-none focus-visible:text-mint-600 dark:focus-visible:text-mint-400 ${serviceManagementActive ? "border-mint-500 text-mint-600 dark:text-mint-400" : "border-transparent text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"}`}>서비스 관리</button>
              {serviceMenuOpen ? <div id="service-management-menu" className="absolute left-0 top-[calc(100%-1px)] z-20 w-44 rounded-b-[10px] border border-zinc-200 bg-white p-1.5 shadow-lg shadow-zinc-950/8 dark:border-zinc-800 dark:bg-[#101318] dark:shadow-black/30">
                {serviceManagementItems.map((item) => {
                  const active = pathname === item.href;
                  return <Link key={item.href} href={item.href} onClick={() => setServiceMenuOpen(false)} aria-current={active ? "page" : undefined} className={`flex h-10 items-center rounded-[7px] px-3 text-sm font-bold transition-colors ${active ? "bg-mint-50 text-mint-700 dark:bg-mint-500/10 dark:text-mint-300" : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"}`}>{item.label}</Link>;
                })}
              </div> : null}
            </div>
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <button type="button" onClick={handleLogout} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white dark:focus-visible:ring-zinc-700"><LogOut className="h-4 w-4" />로그아웃</button>
          <ThemeToggle />
        </div>
        <button type="button" onClick={() => setMobileMenuOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:text-zinc-200 dark:focus-visible:ring-zinc-700 md:hidden" aria-label="메뉴 열기" aria-expanded={mobileMenuOpen}><Menu className="h-6 w-6" /></button>
      </nav>
      <div className={`fixed inset-0 z-50 overflow-hidden transition-[background-color,opacity] duration-200 md:hidden ${mobileMenuOpen ? "pointer-events-auto bg-black/20 opacity-100 dark:bg-black/35" : "pointer-events-none bg-transparent opacity-0"}`} aria-hidden={!mobileMenuOpen} inert={!mobileMenuOpen}>
        <button type="button" className="absolute inset-0 h-full w-full cursor-default" aria-label="메뉴 닫기" onClick={() => setMobileMenuOpen(false)} tabIndex={mobileMenuOpen ? 0 : -1} />
        <div className={`relative ml-auto h-[100dvh] w-screen bg-white transition-transform duration-300 ease-out dark:bg-[#06080b] sm:max-w-[420px] ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex h-14 items-center justify-between border-b border-zinc-100 px-4 dark:border-zinc-900"><button type="button" onClick={() => setMobileMenuOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-zinc-600" aria-label="메뉴 닫기"><X className="h-6 w-6" /></button><AllerMealLogo variant="full" /></div>
          <nav className="px-4 py-3" aria-label="주요 메뉴">
            <div className="flex flex-col gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isNavigationItemActive(pathname, item.href);
                return <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} aria-current={active ? "page" : undefined} className={`flex h-[52px] items-center gap-3 rounded-[10px] px-3 text-[16px] font-bold ${active ? "bg-zinc-100 text-mint-600 dark:bg-zinc-900 dark:text-mint-400" : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"}`}><Icon className="h-5 w-5" />{item.label}</Link>;
              })}
              <div className="pt-1">
                <button type="button" onClick={() => setMobileServiceOpen((current) => !current)} aria-expanded={mobileServiceOpen} aria-controls="mobile-service-management-menu" className={`flex h-[52px] w-full items-center gap-3 rounded-[10px] px-3 text-left text-[16px] font-bold ${serviceManagementActive ? "bg-zinc-100 text-mint-600 dark:bg-zinc-900 dark:text-mint-400" : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"}`}><Settings2 className="h-5 w-5" />서비스 관리<ChevronDown className={`ml-auto h-5 w-5 transition-transform ${mobileServiceOpen ? "rotate-180" : ""}`} /></button>
                {mobileServiceOpen ? <div id="mobile-service-management-menu" className="mt-1 space-y-1 border-l border-zinc-200 py-1 pl-3 dark:border-zinc-800">
                  {serviceManagementItems.map((item) => {
                    const active = pathname === item.href;
                    return <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} aria-current={active ? "page" : undefined} className={`flex h-11 items-center rounded-[8px] px-3 text-[15px] font-bold ${active ? "bg-mint-50 text-mint-700 dark:bg-mint-500/10 dark:text-mint-300" : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"}`}>{item.label}</Link>;
                  })}
                </div> : null}
              </div>
            </div>
            <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800"><button type="button" onClick={handleLogout} className="flex h-[52px] w-full items-center gap-3 rounded-[10px] px-3 text-[16px] font-bold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"><LogOut className="h-5 w-5" />로그아웃</button><ThemeToggle variant="menu" /></div>
          </nav>
        </div>
      </div>
    </header>
  );
}
