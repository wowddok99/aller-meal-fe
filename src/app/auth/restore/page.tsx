import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SessionRestore } from "@/components/auth/session-restore";

export const metadata: Metadata = { description: "로그인 상태를 확인합니다." };

function protectedDestination(value: string | string[] | undefined) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/children";
  const url = new URL(value, "http://localhost");
  if (url.origin !== "http://localhost" || !/^\/(children|admin)(\/|$)/.test(url.pathname)) return "/children";
  return `${url.pathname}${url.search}${url.hash}`;
}

export default async function RestorePage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <AuthShell showDescription={false} showSecurityNotice={false} compact><SessionRestore next={protectedDestination(next)} /></AuthShell>;
}
