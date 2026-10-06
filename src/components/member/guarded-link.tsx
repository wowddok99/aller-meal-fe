"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useEditNavigation } from "./edit-navigation-guard";

type GuardedLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export function GuardedLink({ href, onNavigate, replace, scroll, ...props }: GuardedLinkProps) {
  const router = useRouter();
  const navigation = useEditNavigation();

  return <Link {...props} href={href} replace={replace} scroll={scroll} onNavigate={(event) => {
    let prevented = false;
    onNavigate?.({ preventDefault: () => { prevented = true; event.preventDefault(); } });
    if (prevented || !navigation.isBlocked()) return;
    const destination = new URL(href, window.location.href);
    if (destination.origin !== window.location.origin || (destination.pathname === window.location.pathname && destination.search === window.location.search)) return;
    event.preventDefault();
    navigation.requestLeave(() => {
      if (replace) router.replace(href, { scroll });
      else router.push(href, { scroll });
    });
  }} />;
}
