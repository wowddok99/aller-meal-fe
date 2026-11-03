import { NextResponse, type NextRequest } from "next/server";
import { hasUnexpiredAccessToken } from "@/shared/auth/access-token-expiry";

const ACCESS_TOKEN_COOKIE = "access_token";

export function middleware(request: NextRequest) {
  if (hasUnexpiredAccessToken(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const loginUrl = new URL(
    request.cookies.has("refresh_token") ? "/auth/restore" : "/auth/login",
    request.url,
  );
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/children/:path*", "/admin/:path*"],
};
