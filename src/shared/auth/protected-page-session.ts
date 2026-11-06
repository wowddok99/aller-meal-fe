export function keepProtectedPageOnExpiry(pathname: string, event: Event) {
  const protectedPage = pathname === "/children" || pathname.startsWith("/children/") || pathname === "/admin" || pathname.startsWith("/admin/");
  return protectedPage && event instanceof CustomEvent && event.detail === "protected-request";
}
