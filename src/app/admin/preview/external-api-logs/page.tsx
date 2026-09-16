import { AdminShell } from "@/components/admin/admin-shell";
import { ExternalApiLogs } from "@/components/admin/external-api-logs";

export default function ExternalApiLogsPreviewPage() {
  return <AdminShell><ExternalApiLogs review /></AdminShell>;
}
