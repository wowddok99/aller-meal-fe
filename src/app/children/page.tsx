import type { Metadata } from "next";
import { ChildrenList } from "@/components/member/children-list";
import { MemberShell } from "@/components/member/member-shell";

export const metadata: Metadata = { description: "등록한 자녀의 급식과 알레르기 설정을 관리합니다." };

export default async function ChildrenPage({ searchParams }: { searchParams: Promise<{ childId?: string | string[]; allergenSaved?: string | string[] }> }) {
  const query = await searchParams;
  return <MemberShell><ChildrenList requestedChildId={typeof query.childId === "string" ? query.childId : undefined} allergenSaved={typeof query.allergenSaved === "string" ? query.allergenSaved : undefined} /></MemberShell>;
}
