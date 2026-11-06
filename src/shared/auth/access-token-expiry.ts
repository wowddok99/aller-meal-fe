/** Optimistic expiry check only; authentication and signature verification remain on the API. */
function accessPayload(token: string | undefined): { exp?: unknown; sessionId?: unknown } | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: unknown; sessionId?: unknown };
  } catch {
    return null;
  }
}

export function hasUnexpiredAccessToken(token: string | undefined): boolean {
  const payload = accessPayload(token);
  return typeof payload?.exp === "number" && Number.isFinite(payload.exp) && payload.exp * 1000 > Date.now();
}

/** This unverified hint only selects recovery; the API performs authorization. */
export function hasAccessSessionClaim(token: string | undefined): boolean {
  const sessionId = accessPayload(token)?.sessionId;
  return typeof sessionId === "string" && sessionId.length > 0;
}
