import type { Metadata } from "next";
import { ChildDetailForm } from "@/components/member/child-detail-form";
import { MemberShell } from "@/components/member/member-shell";

export const metadata: Metadata = {
  title: "자녀 상세/수정 | AllerMeal",
  description: "자녀 기본 정보와 학교를 확인하고 수정합니다.",
};

export default async function ChildDetailPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return <MemberShell><ChildDetailForm childId={childId} /></MemberShell>;
}
