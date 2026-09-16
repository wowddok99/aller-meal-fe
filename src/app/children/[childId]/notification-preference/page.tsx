import type { Metadata } from "next";
import { ChildNotificationPreferenceForm } from "@/components/member/child-notification-preference-form";
import { MemberShell } from "@/components/member/member-shell";

export const metadata: Metadata = {
  description: "자녀의 이메일 급식 알림 사용 여부와 발송 시간을 설정합니다.",
};

export default async function ChildNotificationPreferencePage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  return (
    <MemberShell>
      <ChildNotificationPreferenceForm childId={childId} />
    </MemberShell>
  );
}
