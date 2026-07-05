"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const themeStorageKey = "allermeal-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem(themeStorageKey);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(nextTheme: Theme) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", nextTheme === "dark");
  root.dataset.theme = nextTheme;
  root.style.colorScheme = nextTheme;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(themeStorageKey, nextTheme);
  }
}

export function ThemeToggle({ variant = "icon" }: { variant?: "icon" | "menu" }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  const isDark = theme === "dark";
  const handleToggle = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const Icon = mounted && isDark ? Sun : Moon;

  if (variant === "menu") {
    return (
      <button
        type="button"
        className="flex h-[52px] w-full items-center gap-3 rounded-[10px] px-3 text-left text-[16px] font-bold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white dark:focus-visible:ring-zinc-700"
        aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
        aria-pressed={isDark}
        onClick={handleToggle}
      >
        <Icon className="h-5 w-5 shrink-0" strokeWidth={2.1} />
        라이트/다크 모드
      </button>
    );
  }

  return (
    <button
      type="button"
      className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 active:border-zinc-300 active:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:border-zinc-700 dark:bg-[#0f1318] dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 dark:active:border-zinc-600 dark:active:text-zinc-50 dark:focus-visible:ring-zinc-700 dark:focus-visible:ring-offset-canvas"
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      aria-pressed={isDark}
      onClick={handleToggle}
    >
      <Icon className="h-4.5 w-4.5" strokeWidth={2.1} />
    </button>
  );
}
