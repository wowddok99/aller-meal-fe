"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const publicNavItems = [
  { href: "/schools/1/meals", label: "급식 확인" },
  { href: "/schools", label: "학교 검색" },
  { href: "/allergens", label: "알레르기 안내" },
];

export function isPublicNavItemActive(
  pathname: string,
  item: (typeof publicNavItems)[number],
) {
  if (pathname === item.href) {
    return true;
  }

  if (item.href === "/schools/1/meals") {
    return pathname.startsWith("/schools/") && pathname.endsWith("/meals");
  }

  if (item.href === "/schools" && pathname.endsWith("/meals")) {
    return false;
  }

  return item.href === "/schools" && pathname.startsWith("/schools/");
}

export function PublicNavLinks() {
  const pathname = usePathname();

  return (
    <div className="hidden h-full items-center gap-[23px] text-[15px] font-bold text-zinc-600 dark:text-zinc-300 md:flex">
      {publicNavItems.map((item) => {
        const isActive = isPublicNavItemActive(pathname, item);

        return (
          <Link
            key={item.href}
            className={
              isActive
                ? "flex h-full items-center border-b-2 border-mint-500 px-1 text-mint-600 transition-colors dark:text-mint-400"
                : "flex h-full items-center border-b-2 border-transparent px-1 transition-colors hover:text-zinc-950 active:text-mint-600 focus-visible:text-mint-600 dark:hover:text-white dark:active:text-mint-400 dark:focus-visible:text-mint-400"
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
