"use client";

import { AdminOperationList, dlqReprocessAction } from "@/components/admin/admin-operation-list";
import { getAllDeadLetterEvents } from "@/lib/admin-api";

export function NotificationDlqEvents() {
  return <AdminOperationList title="DLQ 이벤트 목록" description="DLQ로 격리된 알림 이벤트를 확인하고 재처리하세요." itemName="DLQ 이벤트" load={getAllDeadLetterEvents} action={dlqReprocessAction}
    statusOptions={[{ value: "PENDING", label: "재처리 대기" }, { value: "REPROCESSED", label: "재처리 완료" }]}
    filters={[{ key: "eventType", label: "이벤트 타입", freeText: true }]} />;
}
