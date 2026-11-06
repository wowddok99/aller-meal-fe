import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  void request;
  // Render the page shell; protected data and mutations remain authorized by the API.
  // https://nextjs.org/docs/15/app/guides/authentication#authorization
  return NextResponse.next();
}

export const config = {
  matcher: ["/children/:path*", "/admin/:path*"],
};
