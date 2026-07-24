import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = { title: "관리자 대시보드 | AllerMeal", description: "AllerMeal 운영 현황을 확인합니다." };

export default function AdminPage() {
  return <AdminShell><AdminDashboard /></AdminShell>;
}
