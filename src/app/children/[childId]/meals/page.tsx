import type { Metadata } from "next";
import { ChildPersonalizedMeals } from "@/components/member/child-personalized-meals";
import { MemberShell } from "@/components/member/member-shell";

export const metadata: Metadata = {
  description: "자녀의 알레르기 기준으로 급식 메뉴 위험도를 확인합니다.",
};

export default async function ChildMealsPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return <MemberShell><ChildPersonalizedMeals childId={childId} /></MemberShell>;
}
