import { AdminShell } from "@/components/admin/admin-shell";
import { FailedNotifications } from "@/components/admin/failed-notifications";

export default function FailedNotificationsPreviewPage() {
  return <AdminShell><FailedNotifications review /></AdminShell>;
}
