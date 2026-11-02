"use client";

import { adminEventTypeOptions } from "@/lib/admin-operation-labels";
import { AdminOperationList, dlqReprocessAction } from "@/components/admin/admin-operation-list";
import { getAllDeadLetterEvents } from "@/lib/admin-api";
import { AdminOperationStatus, dlqStatusOptions } from "./admin-operation-status";

export function NotificationDlqEvents() {
  return <AdminOperationList idColumnLabel="DLQ 이벤트 ID" primaryColumnLabel="이벤트 종류" title="DLQ 이벤트 목록" description="DLQ로 격리된 알림 이벤트를 확인하고 재처리하세요." itemName="DLQ 이벤트" load={getAllDeadLetterEvents} action={dlqReprocessAction}
    statusOptions={dlqStatusOptions} renderStatus={(item) => <AdminOperationStatus status={item.status} options={dlqStatusOptions} />}
    filters={[{ key: "eventType", label: "이벤트 종류", options: adminEventTypeOptions, allowUnknownValue: true }]} />;
}
