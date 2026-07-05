"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const publicNavItems = [
  { href: "/schools", label: "학교 검색", aliases: ["/"] },
  { href: "/allergens", label: "알레르기 안내" },
];

export function isPublicNavItemActive(
  pathname: string,
  item: (typeof publicNavItems)[number],
) {
  if (pathname === item.href || item.aliases?.includes(pathname)) {
    return true;
  }

  return item.href === "/schools" && pathname.startsWith("/schools/");
}

export function PublicNavLinks() {
  const pathname = usePathname();

  return (
    <div className="hidden items-center gap-[23px] text-[16px] font-semibold text-zinc-500 dark:text-zinc-400 md:flex">
      {publicNavItems.map((item) => {
        const isActive = isPublicNavItemActive(pathname, item);

        return (
          <Link
            key={item.href}
            className={
              isActive
                ? "text-mint-600 transition-colors hover:text-mint-600 active:text-mint-600 dark:text-mint-400 dark:hover:text-mint-400 dark:active:text-mint-400"
                : "transition-colors hover:text-mint-600 active:text-mint-600 focus-visible:text-mint-600 dark:hover:text-mint-400 dark:active:text-mint-400 dark:focus-visible:text-mint-400"
            }
            href={item.href}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
