import { redirect } from "next/navigation";

export default function NotificationFailuresPage() {
  redirect("/admin/notification-requests?status=FAILED");
}
