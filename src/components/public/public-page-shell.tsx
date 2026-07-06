import Link from "next/link";
import { AllerMealLogo } from "@/components/allermeal-logo";
import { PublicMobileMenu } from "@/components/public-mobile-menu";
import { PublicNavLinks } from "@/components/public-nav-links";
import { ThemeToggle } from "@/components/theme-toggle";

type PublicPageShellProps = {
  children: React.ReactNode;
};

export function PublicPageShell({ children }: PublicPageShellProps) {
  return (
    <main className="min-h-[100dvh] bg-zinc-50 text-zinc-950 dark:bg-canvas dark:text-zinc-50">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-900 dark:bg-[#06080b]">
        <nav className="mx-auto flex h-[50px] w-full max-w-[1220px] items-center justify-between px-5">
          <div className="flex h-full items-center gap-8">
            <Link
              href="/"
              className="flex shrink-0 items-center transition-opacity hover:opacity-90 active:opacity-80"
              aria-label="AllerMeal 홈"
            >
              <AllerMealLogo variant="full" />
            </Link>

            <PublicNavLinks />
          </div>

          <div className="hidden items-center gap-4 text-[15px] font-medium md:flex">
            <Link
              className="text-zinc-600 transition-colors hover:text-zinc-950 active:text-mint-600 dark:text-zinc-300 dark:hover:text-zinc-50 dark:active:text-mint-400"
              href="/login"
            >
              로그인
            </Link>
            <ThemeToggle />
          </div>
          <PublicMobileMenu />
        </nav>
      </header>

      {children}
    </main>
  );
}
