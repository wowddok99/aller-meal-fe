export function getSessionExpiredLoginUrl({
  pathname,
  search,
  hash,
}: Pick<Location, "pathname" | "search" | "hash">) {
  const next = `${pathname}${search}${hash}`;
  return `/auth/login?next=${encodeURIComponent(next)}`;
}
