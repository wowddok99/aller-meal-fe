"use client";

import {
  Info,
  LogIn,
  Menu,
  Utensils,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AllerMealLogo } from "@/components/allermeal-logo";
import {
  isPublicNavItemActive,
  publicNavItems,
} from "@/components/public-nav-links";
import { ThemeToggle } from "@/components/theme-toggle";

const mobileNavItems = [
  { ...publicNavItems[0], icon: Utensils },
  { ...publicNavItems[1], icon: Search },
  { ...publicNavItems[2], icon: Info },
];

export function PublicMobileMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-zinc-700 transition-colors hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:text-zinc-200 dark:hover:text-white dark:focus-visible:ring-zinc-700"
        aria-label="메뉴 열기"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" strokeWidth={2} />
      </button>

      <div
        className={`fixed inset-0 z-50 overflow-hidden text-zinc-950 transition-[background-color,opacity] duration-200 dark:text-zinc-50 ${
          isOpen
            ? "pointer-events-auto bg-black/20 opacity-100 dark:bg-black/35"
            : "pointer-events-none bg-transparent opacity-0"
        }`}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          className="absolute inset-0 h-full w-full cursor-default"
          aria-label="메뉴 닫기"
          onClick={closeMenu}
          tabIndex={isOpen ? 0 : -1}
        />

        <div
          className={`relative ml-auto h-[100dvh] w-screen overflow-hidden bg-white transition-transform duration-300 ease-out dark:bg-[#06080b] sm:max-w-[420px] ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-zinc-100 px-4 dark:border-zinc-900">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-zinc-600 transition-colors hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:text-zinc-300 dark:hover:text-white dark:focus-visible:ring-zinc-700"
              aria-label="메뉴 닫기"
              onClick={closeMenu}
            >
              <X className="h-6 w-6" strokeWidth={2} />
            </button>
            <Link
              href="/"
              className="flex items-center transition-opacity hover:opacity-90 active:opacity-80"
              onClick={closeMenu}
              aria-label="AllerMeal 홈"
            >
              <AllerMealLogo variant="full" />
            </Link>
          </div>

          <nav className="px-4 py-3" aria-label="모바일 메뉴">
            <div className="flex flex-col gap-1">
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isPublicNavItemActive(pathname, item);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex h-[52px] items-center gap-3 rounded-[10px] px-3 text-[16px] font-bold transition-colors ${
                      isActive
                        ? "bg-zinc-100 text-mint-600 dark:bg-zinc-900 dark:text-mint-400"
                        : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
                    }`}
                    onClick={closeMenu}
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={2.1} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <Link
                href="/login"
                className="flex h-[52px] items-center gap-3 rounded-[10px] px-3 text-[16px] font-bold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
                onClick={closeMenu}
              >
                <LogIn className="h-5 w-5 shrink-0" strokeWidth={2.1} />
                로그인
              </Link>

              <ThemeToggle variant="menu" />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
