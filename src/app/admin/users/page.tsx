import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminUserManagement } from "@/components/admin/admin-user-management";

export const metadata: Metadata = {
  description: "사용자 계정 상태와 관리자 권한을 관리합니다.",
};

export default function AdminUsersPage() {
  return <AdminShell><AdminUserManagement /></AdminShell>;
}
