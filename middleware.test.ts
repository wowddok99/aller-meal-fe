import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "./src/middleware";

describe("protected route middleware", () => {
  it("redirects an anonymous protected request to login with its same-origin next path", () => {
    const response = middleware(
      new NextRequest("http://localhost:3000/children/child-1/meals?date=2026-09-19"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/login?next=%2Fchildren%2Fchild-1%2Fmeals%3Fdate%3D2026-09-19",
    );
  });

  it("lets the protected request reach the app when the access token is unexpired", () => {
    const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 })).toString("base64url");
    const response = middleware(
      new NextRequest("http://localhost:3000/admin", {
        headers: { cookie: `access_token=header.${payload}.signature` },
      }),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("routes an expired access session with refresh cookie to restoration, preserving next", () => {
    const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 1 })).toString("base64url");
    const response = middleware(new NextRequest("http://localhost:3000/children?tab=meals", {
      headers: { cookie: `access_token=header.${payload}.signature; refresh_token=opaque` },
    }));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/auth/restore?next=%2Fchildren%3Ftab%3Dmeals");
  });
});
