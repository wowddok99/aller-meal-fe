import { NextResponse, type NextRequest } from "next/server";
import { hasAccessSessionClaim, hasUnexpiredAccessToken } from "@/shared/auth/access-token-expiry";

const ACCESS_TOKEN_COOKIE = "access_token";

/** Returns only the UI session state; the token itself never leaves the server. */
export function GET(request: NextRequest) {
  return NextResponse.json(
    { authenticated: hasUnexpiredAccessToken(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value) },
    { headers: {
      "Cache-Control": "no-store",
      "X-Session-Restore-Available": request.cookies.has("refresh_token") ? "1" : "0",
      "X-Access-Session-Claim": hasAccessSessionClaim(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value) ? "present" : "absent",
    } },
  );
}
