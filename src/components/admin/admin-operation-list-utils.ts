import { parseDateValue } from "@/lib/date-picker-date";

export function createLatestAdminOperationRequestTracker() {
  let latestRequestId = 0;

  return {
    begin() {
      latestRequestId += 1;
      return latestRequestId;
    },
    invalidate() {
      latestRequestId += 1;
    },
    isCurrent(requestId: number) {
      return requestId === latestRequestId;
    },
  };
}

export function hasSameAdminOperationId(
  currentId: string | undefined,
  targetId: string | undefined,
) {
  return Boolean(currentId && targetId && currentId === targetId);
}

export function getAdminOperationItemKey(
  prefix: string,
  index: number,
  id: string | undefined,
) {
  return id ? `${prefix}:${id}` : `${prefix}:missing:${index}`;
}

export function getAdminOperationDisplayId(id: string | undefined) {
  return id || "미제공";
}

export type CurrentPageFilterState = "items" | "server-empty" | "filter-empty";

export function getCurrentPageFilterState(
  serverItemCount: number,
  filteredItemCount: number,
  hasActiveFilters: boolean,
): CurrentPageFilterState {
  if (serverItemCount === 0) return "server-empty";
  if (filteredItemCount === 0 && hasActiveFilters) return "filter-empty";
  return "items";
}

export type AdminOperationFailureKind = "conflict" | "not-found" | "authentication" | "error";

export function getAdminOperationFailureKind(status: number | undefined): AdminOperationFailureKind {
  if (status === 409) return "conflict";
  if (status === 404) return "not-found";
  if (status === 401 || status === 403) return "authentication";
  return "error";
}

export type AdminOperationLoadErrorState = "login-required" | "admin-forbidden" | "generic-error";

export function getAdminOperationLoadErrorState(status: number | undefined): AdminOperationLoadErrorState {
  if (status === 401) return "login-required";
  if (status === 403) return "admin-forbidden";
  return "generic-error";
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeAdminOperationSearch(value: string, notificationIdSearch = false) {
  const normalized = value.trim();
  return notificationIdSearch && uuidPattern.test(normalized) ? normalized.toLowerCase() : normalized;
}

export function getAdminOperationQueryErrors(query: { query?: string; eventType?: string; mealDate?: string }, notificationIdSearch = false) {
  const errors: { query?: string; eventType?: string; mealDate?: string } = {};
  const search = query.query?.trim();
  if (search && notificationIdSearch && !uuidPattern.test(search)) {
    errors.query = "전체 알림 ID를 UUID 형식으로 입력해 주세요.";
  } else if (search && search.length > 100) {
    errors.query = "검색어는 100자 이하로 입력해 주세요.";
  }
  if (query.eventType?.trim() && query.eventType.trim().length > 100) errors.eventType = "이벤트 종류는 100자 이하로 입력해 주세요.";
  if (query.mealDate?.trim() && !parseDateValue(query.mealDate.trim())) errors.mealDate = "급식 날짜를 YYYY-MM-DD 형식의 올바른 날짜로 선택해 주세요.";
  return errors;
}

export function getSchoolSearchQuery(value: string) {
  const normalized = value.trim();
  if (!normalized) return {};
  return uuidPattern.test(normalized) ? { schoolId: normalized.toLowerCase() } : { query: normalized };
}
