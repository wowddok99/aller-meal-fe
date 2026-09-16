import { AdminShell } from "@/components/admin/admin-shell";
import { AdminUserManagement } from "@/components/admin/admin-user-management";

export default function AdminUsersPreviewPage() {
  return <AdminShell><AdminUserManagement preview /></AdminShell>;
}
