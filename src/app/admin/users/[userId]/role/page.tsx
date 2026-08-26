import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminUserRole } from "@/components/admin/admin-user-role";

export const metadata: Metadata = { description: "사용자에게 관리자 권한을 부여합니다." };

export default async function AdminUserRolePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <AdminShell><AdminUserRole userId={userId} /></AdminShell>;
}
