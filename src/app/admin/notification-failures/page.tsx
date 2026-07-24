import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { FailedNotifications } from "@/components/admin/failed-notifications";

export const metadata: Metadata = { title: "실패 알림 | AllerMeal", description: "실패한 알림 요청을 확인하고 DLQ 재처리 화면으로 이동합니다." };

export default function NotificationFailuresPage() {
  return <AdminShell><FailedNotifications /></AdminShell>;
}
