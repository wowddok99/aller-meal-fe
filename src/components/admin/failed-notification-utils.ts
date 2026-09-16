import type { FailedNotification } from "@/lib/admin-api";

export type FailedNotificationFilters = {
  reason: string;
  status: string;
  search: string;
};

export function filterFailedNotifications(
  items: FailedNotification[],
  filters: FailedNotificationFilters,
) {
  const keyword = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    const searchable =
      `${item.notificationId} ${item.notificationTargetId} ${item.childId} ${item.userId} ${item.failureCode}`.toLowerCase();

    return (
      (filters.reason === "ALL" || item.reason === filters.reason) &&
      (filters.status === "ALL" || item.status === filters.status) &&
      (!keyword || searchable.includes(keyword))
    );
  });
}
