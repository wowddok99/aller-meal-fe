import type { Metadata } from "next";
import { ChildNotificationHistory } from "@/components/member/child-notification-history";
import { MemberShell } from "@/components/member/member-shell";

export const metadata: Metadata = {
  title: "알림 이력 | AllerMeal",
  description: "자녀별 급식 알림 발송 이력을 확인합니다.",
};

export default async function ChildNotificationsPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  return (
    <MemberShell>
      <ChildNotificationHistory childId={childId} />
    </MemberShell>
  );
}
