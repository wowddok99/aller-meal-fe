import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { FailedNotifications } from "@/components/admin/failed-notifications";

export const metadata: Metadata = { title: "알림 발송 작업 | AllerMeal" };
export default function NotificationRequestsPage() { return <AdminShell><FailedNotifications /></AdminShell>; }
