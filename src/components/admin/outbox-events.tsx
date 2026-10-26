"use client";

import { adminEventTypeOptions } from "@/lib/admin-operation-labels";
import { AdminOperationList } from "@/components/admin/admin-operation-list";
import { getOutboxEvents } from "@/lib/admin-api";
import { AdminOperationStatus, outboxStatusOptions } from "./admin-operation-status";

export function OutboxEvents() {
  return <AdminOperationList idColumnLabel="이벤트 ID" primaryColumnLabel="이벤트 종류" title="이벤트 발행 작업" description="outbox 이벤트의 발행 처리 현황을 확인하세요." itemName="이벤트 발행 작업" load={getOutboxEvents}
    statusOptions={outboxStatusOptions} renderStatus={(item) => <AdminOperationStatus status={item.status} options={outboxStatusOptions} />}
    filters={[{ key: "eventType", label: "이벤트 종류", options: adminEventTypeOptions, allowUnknownValue: true }]} />;
}
