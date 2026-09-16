import type { Metadata } from "next";
import { ChildRegistrationForm } from "@/components/member/child-registration-form";
import { MemberShell } from "@/components/member/member-shell";

export const metadata: Metadata = {
  description: "자녀 기본 정보와 학교를 등록합니다.",
};

export default function ChildRegistrationPage() {
  return <MemberShell><ChildRegistrationForm /></MemberShell>;
}
