export function getSessionExpiredLoginUrl({
  pathname,
  search,
  hash,
}: Pick<Location, "pathname" | "search" | "hash">) {
  const next = `${pathname}${search}${hash}`;
  return `/auth/login?next=${encodeURIComponent(next)}`;
}

/** Only internal paths may be passed to the router after authentication. */
export function getSafeLoginDestination(next: string | null | undefined, origin: string) {
  if (!next?.startsWith("/") || next.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(next)) return "/children";
  try {
    const url = new URL(next, origin);
    const path = decodeURIComponent(url.pathname);
    if (url.origin !== new URL(origin).origin || path.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(path)) return "/children";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/children";
  }
}
import type { LoginResponse } from "@/generated/api/public/models";


/** Navigation only: protected APIs continue to enforce account status and ownership. */
export function getLoginSuccessDestination(response: Pick<LoginResponse, "userStatus">, next: string | null | undefined, origin: string) {
  if (response.userStatus === "WITHDRAWAL_PENDING") return "/account/withdrawal";
  return getSafeLoginDestination(next, origin);
}
