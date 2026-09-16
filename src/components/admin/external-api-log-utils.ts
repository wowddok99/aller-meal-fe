import type { ExternalApiLog } from "@/lib/admin-api";

export type ExternalApiLogFilters = {
  provider: string;
  method: string;
  outcome: string;
  search: string;
};

export function filterExternalApiLogs(
  items: ExternalApiLog[],
  filters: ExternalApiLogFilters,
) {
  const keyword = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    const searchable =
      `${item.provider} ${item.operation} ${item.endpoint} ${item.schoolId}`.toLowerCase();

    return (
      (filters.provider === "ALL" || item.provider === filters.provider) &&
      (filters.method === "ALL" || item.method === filters.method) &&
      (filters.outcome === "ALL" || item.outcome === filters.outcome) &&
      (!keyword || searchable.includes(keyword))
    );
  });
}
