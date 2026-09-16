import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { NotificationDlqEvents } from "@/components/admin/notification-dlq-events";

export const metadata: Metadata = { description: "DLQ에 쌓인 알림 이벤트를 확인하고 재처리합니다." };

export default function NotificationDlqEventsPage() {
  return <AdminShell><NotificationDlqEvents /></AdminShell>;
}
