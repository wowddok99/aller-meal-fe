"use client";

import { AdminOperationList } from "@/components/admin/admin-operation-list";
import { getNotificationRequests } from "@/lib/admin-api";

export function FailedNotifications() {
  return <AdminOperationList title="알림 발송 작업" description="알림 발송, 재시도 및 실패 상태를 확인하세요." itemName="알림 발송 작업" load={getNotificationRequests}
    statusOptions={[{ value: "PENDING", label: "대기" }, { value: "SENDING", label: "발송 중" }, { value: "RETRY_PENDING", label: "재시도 대기" }, { value: "SENT", label: "발송 완료" }, { value: "FAILED", label: "발송 실패" }, { value: "CANCELED", label: "취소" }]}
    filters={[{ key: "channel", label: "채널", options: [{ value: "EMAIL", label: "이메일" }] }, { key: "reason", label: "사유", options: [{ value: "RISK_DETECTED", label: "위험 감지" }, { value: "NO_RISK", label: "위험 없음" }, { value: "RISK_UNKNOWN", label: "위험 확인 필요" }, { value: "RISK_LABELING_FAILED", label: "라벨링 실패" }, { value: "RISK_PENDING", label: "라벨링 대기" }, { value: "NO_MEAL", label: "급식 없음" }] }]} />;
}
