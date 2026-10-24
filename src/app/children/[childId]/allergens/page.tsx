import type { Metadata } from "next";
import { ChildAllergenSettings } from "@/components/member/child-allergen-settings";
import { MemberShell } from "@/components/member/member-shell";

export const metadata: Metadata = {
  description: "자녀의 급식 위험도 확인에 사용할 알레르기 코드를 설정합니다.",
};

export default async function ChildAllergensPage({
  params,
  searchParams,
}: {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{ registered?: string | string[] }>;
}) {
  const { childId } = await params;
  const { registered } = await searchParams;
  return (
    <MemberShell>
      <ChildAllergenSettings childId={childId} registered={typeof registered === "string" ? registered : undefined} />
    </MemberShell>
  );
}
