import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /auth/session", () => {
  it("returns false without an access token cookie", async () => {
    const response = GET(new NextRequest("http://localhost/auth/session"));

    await expect(response.json()).resolves.toEqual({ authenticated: false });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns true when the request contains an access token cookie", async () => {
    const response = GET(new NextRequest("http://localhost/auth/session", {
      headers: { cookie: "access_token=session-value" },
    }));

    await expect(response.json()).resolves.toEqual({ authenticated: true });
  });
});
