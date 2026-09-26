"use client";

import { AdminOperationList } from "@/components/admin/admin-operation-list";
import { getOutboxEvents } from "@/lib/admin-api";

export function OutboxEvents() {
  return <AdminOperationList title="이벤트 발행 작업" description="outbox 이벤트의 발행 처리 현황을 확인하세요." itemName="이벤트 발행 작업" load={getOutboxEvents}
    statusOptions={[{ value: "PENDING", label: "발행 대기" }, { value: "PUBLISHED", label: "발행 완료" }]}
    filters={[{ key: "eventType", label: "이벤트 타입", freeText: true }]} />;
}
