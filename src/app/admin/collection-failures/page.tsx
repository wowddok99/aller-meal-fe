import type { Metadata } from "next";
import { CollectionFailures } from "@/components/admin/collection-failures";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = { description: "실패한 급식 수집 작업을 확인하고 재수집을 요청합니다." };

export default function CollectionFailuresPage() {
  return <AdminShell><CollectionFailures /></AdminShell>;
}
