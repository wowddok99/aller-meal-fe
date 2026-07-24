import type { Metadata } from "next";
import { ChildAllergenSettings } from "@/components/member/child-allergen-settings";
import { MemberShell } from "@/components/member/member-shell";

export const metadata: Metadata = {
  title: "자녀 알레르기 설정 | AllerMeal",
  description: "자녀의 급식 위험도 확인에 사용할 알레르기 코드를 설정합니다.",
};

export default async function ChildAllergensPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  return (
    <MemberShell>
      <ChildAllergenSettings childId={childId} />
    </MemberShell>
  );
}
