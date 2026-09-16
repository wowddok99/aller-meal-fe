import type { DeadLetterEvent } from "@/lib/admin-api";

export type DeadLetterEventFilters = {
  status: string;
  eventType: string;
  search: string;
};

export function filterDeadLetterEvents(
  items: DeadLetterEvent[],
  filters: DeadLetterEventFilters,
) {
  const keyword = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    const searchable = `${item.deadLetterEventId} ${item.messageId}`.toLowerCase();

    return (
      (filters.status === "ALL" || item.status === filters.status) &&
      (filters.eventType === "ALL" || item.eventType === filters.eventType) &&
      (!keyword || searchable.includes(keyword))
    );
  });
}
