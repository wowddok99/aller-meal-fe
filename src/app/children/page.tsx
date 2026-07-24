import type { Metadata } from "next";
import { ChildrenList } from "@/components/member/children-list";
import { MemberShell } from "@/components/member/member-shell";

export const metadata: Metadata = { title: "자녀 목록 | AllerMeal", description: "등록한 자녀의 급식과 알레르기 설정을 관리합니다." };

export default function ChildrenPage() {
  return <MemberShell><ChildrenList /></MemberShell>;
}
