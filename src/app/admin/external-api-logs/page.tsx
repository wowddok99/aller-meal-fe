import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { ExternalApiLogs } from "@/components/admin/external-api-logs";

export const metadata: Metadata = { description: "NEIS 등 외부 API 호출 결과와 응답 시간을 확인합니다." };

export default function ExternalApiLogsPage() {
  return <AdminShell><ExternalApiLogs /></AdminShell>;
}
