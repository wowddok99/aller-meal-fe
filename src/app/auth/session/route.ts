import { NextResponse, type NextRequest } from "next/server";

const ACCESS_TOKEN_COOKIE = "access_token";

/** Returns only the UI session state; the token itself never leaves the server. */
export function GET(request: NextRequest) {
  return NextResponse.json(
    { authenticated: request.cookies.has(ACCESS_TOKEN_COOKIE) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
