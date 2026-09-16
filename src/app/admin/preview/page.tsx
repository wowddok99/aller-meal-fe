import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminDashboardPreviewPage() {
  return <AdminShell><AdminDashboard review /></AdminShell>;
}
