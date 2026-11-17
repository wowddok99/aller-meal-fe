"use client";

import { Suspense, useEffect, useState, type ComponentProps } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GuardedLink } from "@/components/member/guarded-link";
import { useEditNavigation } from "@/components/member/edit-navigation-guard";
import { getSessionExpiredLoginUrl } from "@/shared/api/session-expired-redirect";

type LoginLinkProps = Omit<ComponentProps<typeof GuardedLink>, "href"> & { preserveDestination?: boolean };

export function LoginLink({ preserveDestination = true, ...props }: LoginLinkProps) {
  if (!preserveDestination) return <GuardedLink {...props} href="/auth/login" />;
  return <Suspense fallback={<GuardedLink {...props} href="/auth/login" />}><CurrentPageLoginLink {...props} /></Suspense>;
}

function CurrentPageLoginLink({ onNavigate, replace, scroll, ...props }: Omit<LoginLinkProps, "preserveDestination">) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const navigation = useEditNavigation();
  const [hash, setHash] = useState("");
  const search = params.toString();

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname, search]);

  const href = getSessionExpiredLoginUrl({ pathname, search: search ? `?${search}` : "", hash });
  return <GuardedLink {...props} href={href} replace={replace} scroll={scroll} onNavigate={(event) => {
    let prevented = false;
    onNavigate?.({ preventDefault: () => { prevented = true; event.preventDefault(); } });
    if (prevented) return;
    // A fragment may have changed through history APIs without a hashchange event.
    const currentHref = getSessionExpiredLoginUrl(window.location);
    if (currentHref === href) return;
    event.preventDefault();
    navigation.requestLeave(() => {
      if (replace) router.replace(currentHref, { scroll });
      else router.push(currentHref, { scroll });
    });
  }} />;
}
