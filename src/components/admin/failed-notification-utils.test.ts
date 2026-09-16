import { describe, expect, it } from "vitest";
import type { FailedNotification } from "@/lib/admin-api";
import { filterFailedNotifications } from "./failed-notification-utils";

const notifications: FailedNotification[] = [
  {
    notificationId: "notification-failed",
    notificationTargetId: "target-child",
    childId: "child-001",
    userId: "",
    notificationDate: "2026-07-13",
    channel: "EMAIL",
    reason: "RISK_DETECTED",
    status: "FAILED",
    attemptCount: 3,
    maxAttempts: 3,
    failureCode: "SMTP_TIMEOUT",
    createdAt: "2026-07-13T08:10:00+09:00",
    updatedAt: "2026-07-13T08:15:00+09:00",
  },
  {
    notificationId: "notification-retry",
    notificationTargetId: "target-user",
    childId: "",
    userId: "user-002",
    notificationDate: "2026-07-13",
    channel: "EMAIL",
    reason: "RISK_UNKNOWN",
    status: "RETRY_PENDING",
    attemptCount: 2,
    maxAttempts: 3,
    failureCode: "LABELING_PENDING",
    createdAt: "2026-07-13T07:35:00+09:00",
    updatedAt: "2026-07-13T07:40:00+09:00",
  },
];

describe("filterFailedNotifications", () => {
  it("combines reason, status, and current-list search without mutating items", () => {
    const filtered = filterFailedNotifications(notifications, {
      reason: "RISK_UNKNOWN",
      status: "RETRY_PENDING",
      search: "TARGET-USER",
    });

    expect(filtered).toEqual([notifications[1]]);
    expect(notifications).toHaveLength(2);
  });
});
