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

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getSchoolSearchQuery(value: string) {
  const normalized = value.trim();
  if (!normalized) return {};
  return uuidPattern.test(normalized) ? { schoolId: normalized } : { query: normalized };
}
