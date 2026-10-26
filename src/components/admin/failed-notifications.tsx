"use client";

import { adminNotificationChannelOptions, adminNotificationReasonOptions } from "@/lib/admin-operation-labels";
import { AdminOperationList } from "@/components/admin/admin-operation-list";
import { getNotificationRequests } from "@/lib/admin-api";
import { AdminOperationStatus, notificationStatusOptions } from "./admin-operation-status";

export function FailedNotifications() {
  return <AdminOperationList notificationIdSearch primaryColumnLabel="알림 ID" additionalColumns={["채널", "발송 사유"]} title="알림 발송 작업" description="알림 발송, 재시도 및 실패 상태를 확인하세요." itemName="알림 발송 작업" load={getNotificationRequests}
    statusOptions={notificationStatusOptions} renderStatus={(item) => <AdminOperationStatus status={item.status} options={notificationStatusOptions} />}
    filters={[{ key: "channel", label: "채널", options: adminNotificationChannelOptions }, { key: "reason", label: "발송 사유", options: adminNotificationReasonOptions }]} />;
}
