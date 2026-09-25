import type { AdminDashboardSummaryResponse } from "@/generated/api/admin/models/adminDashboardSummaryResponse";
import type { AdminDeadLetterEventItemResponse } from "@/generated/api/admin/models/adminDeadLetterEventItemResponse";
import type { AdminExternalApiLogItemResponse } from "@/generated/api/admin/models/adminExternalApiLogItemResponse";
import type { AdminFailedCollectionJobItemResponse } from "@/generated/api/admin/models/adminFailedCollectionJobItemResponse";
import type { AdminFailedNotificationItemResponse } from "@/generated/api/admin/models/adminFailedNotificationItemResponse";
import type { AdminNotificationReprocessResponse } from "@/generated/api/admin/models/adminNotificationReprocessResponse";
import type { AdminRecollectionResponse } from "@/generated/api/admin/models/adminRecollectionResponse";
import type { AdminUserAccessHistoryPageResponse } from "@/generated/api/admin/models/adminUserAccessHistoryPageResponse";
import type { AdminUserDetailResponse } from "@/generated/api/admin/models/adminUserDetailResponse";
import type { AdminUserPageResponse } from "@/generated/api/admin/models/adminUserPageResponse";
import type { AdminUserRoleChangeRequest } from "@/generated/api/admin/models/adminUserRoleChangeRequest";
import type { AdminUserRoleResponse } from "@/generated/api/admin/models/adminUserRoleResponse";
import type { AdminUserSuspensionRequest } from "@/generated/api/admin/models/adminUserSuspensionRequest";
import type { ListAdminUsersStatus } from "@/generated/api/admin/models/listAdminUsersStatus";
import {
  changeAdminUserSuspension as requestUserSuspension,
  getAdminDashboardSummary as requestDashboardSummary,
  getAdminUser as requestAdminUser,
  getAdminUserAccessHistory as requestAdminUserAccessHistory,
  listAdminUsers as requestAdminUsers,
  listExternalApiLogs as requestExternalApiLogs,
  listFailedCollectionJobs as requestFailedCollectionJobs,
  listFailedNotifications as requestFailedNotifications,
  listNotificationDeadLetterEvents as requestDeadLetterEvents,
  promoteUserToAdmin as requestUserPromotion,
  reprocessNotificationDeadLetterEvent as requestDeadLetterReprocess,
  requestCollectionRecollection as requestRecollectionOperation,
} from "@/generated/api/admin";
import { ApiClientError } from "@/shared/api/api-client-error";

export type DashboardSummary = AdminDashboardSummaryResponse;
export type AdminUserPage = AdminUserPageResponse;
export type AdminUserAccessHistoryPage = AdminUserAccessHistoryPageResponse;
export type AdminUserRole = AdminUserRoleResponse;
export type AdminUserDetail = AdminUserDetailResponse;
/** Display mappers preserve action IDs as optional so missing API fields cannot enable a mutation. */
export type FailedCollectionJob = Omit<AdminFailedCollectionJobItemResponse, "schoolId" | "mealDate" | "mealType" | "responseTimeMillis" | "collectionDurationMillis" | "failureCode" | "failureMessage" | "createdAt" | "updatedAt"> & {
  schoolId: string; mealDate: string; mealType: string; responseTimeMillis: number; collectionDurationMillis: number; failureCode: string; failureMessage: string; createdAt: string; updatedAt: string;
};
export type FailedCollectionJobPage = { items: FailedCollectionJob[]; page: number; pageSize: number; totalCount: number };
export type ExternalApiLog = Omit<AdminExternalApiLogItemResponse, "provider" | "operation" | "schoolId" | "mealDate" | "mealType" | "method" | "endpoint" | "httpStatus" | "outcome" | "failureCode" | "responseTimeMillis" | "createdAt"> & {
  provider: string; operation: string; schoolId: string; mealDate: string; mealType: string; method: string; endpoint: string; httpStatus: number; outcome: string; failureCode: string; responseTimeMillis: number; createdAt: string;
};
export type ExternalApiLogPage = { items: ExternalApiLog[]; page: number; pageSize: number; totalCount: number };
export type FailedNotification = Omit<AdminFailedNotificationItemResponse, "notificationTargetId" | "childId" | "userId" | "notificationDate" | "channel" | "reason" | "status" | "attemptCount" | "maxAttempts" | "failureCode" | "createdAt" | "updatedAt"> & {
  notificationTargetId: string; childId: string; userId: string; notificationDate: string; channel: string; reason: string; status: string; attemptCount: number; maxAttempts: number; failureCode: string; createdAt: string; updatedAt: string;
};
export type FailedNotificationPage = { items: FailedNotification[]; page: number; pageSize: number; totalCount: number };
export type DeadLetterEvent = Omit<AdminDeadLetterEventItemResponse, "messageId" | "eventType" | "retryCount" | "status" | "reprocessedByUserId" | "reprocessedAt" | "createdAt" | "updatedAt"> & {
  messageId: string; eventType: string; retryCount: number; status: string; reprocessedByUserId: string; reprocessedAt: string; createdAt: string; updatedAt: string;
};
export type DeadLetterEventPage = { items: DeadLetterEvent[]; page: number; pageSize: number; totalCount: number };
export type RecollectionResult = AdminRecollectionResponse;
export type NotificationReprocessResult = AdminNotificationReprocessResponse;

export class AdminApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "AdminApiError";
  }
}

function asAdminApiError(cause: unknown, fallback: string): AdminApiError {
  if (cause instanceof AdminApiError) return cause;
  if (cause instanceof ApiClientError) return new AdminApiError(cause.status, cause.message);
  return new AdminApiError(0, cause instanceof Error && cause.message.trim() ? cause.message : fallback);
}

/** One explicit action gets one key; callers may pass it again for a transport retry. */
export function createIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function isAdminActionId(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

function pageMeta(page: number, pageSize: number, response: { page?: number; pageSize?: number; totalCount?: number }) {
  return { page: response.page ?? page, pageSize: response.pageSize ?? pageSize, totalCount: response.totalCount ?? 0 };
}

function mapFailedCollectionJob(item: AdminFailedCollectionJobItemResponse): FailedCollectionJob {
  return { ...item, schoolId: item.schoolId ?? "미제공", mealDate: item.mealDate ?? "미제공", mealType: item.mealType ?? "미제공", responseTimeMillis: item.responseTimeMillis ?? 0, collectionDurationMillis: item.collectionDurationMillis ?? 0, failureCode: item.failureCode ?? "미제공", failureMessage: item.failureMessage ?? "미제공", createdAt: item.createdAt ?? "미제공", updatedAt: item.updatedAt ?? "미제공" };
}

function mapExternalApiLog(item: AdminExternalApiLogItemResponse): ExternalApiLog {
  return { ...item, provider: item.provider ?? "미제공", operation: item.operation ?? "미제공", schoolId: item.schoolId ?? "미제공", mealDate: item.mealDate ?? "미제공", mealType: item.mealType ?? "미제공", method: item.method ?? "미제공", endpoint: item.endpoint ?? "미제공", httpStatus: item.httpStatus ?? 0, outcome: item.outcome ?? "미제공", failureCode: item.failureCode ?? "미제공", responseTimeMillis: item.responseTimeMillis ?? 0, createdAt: item.createdAt ?? "미제공" };
}

function mapFailedNotification(item: AdminFailedNotificationItemResponse): FailedNotification {
  return { ...item, notificationTargetId: item.notificationTargetId ?? "미제공", childId: item.childId ?? "미제공", userId: item.userId ?? "미제공", notificationDate: item.notificationDate ?? "미제공", channel: item.channel ?? "미제공", reason: item.reason ?? "미제공", status: item.status ?? "미제공", attemptCount: item.attemptCount ?? 0, maxAttempts: item.maxAttempts ?? 0, failureCode: item.failureCode ?? "미제공", createdAt: item.createdAt ?? "미제공", updatedAt: item.updatedAt ?? "미제공" };
}

function mapDeadLetterEvent(item: AdminDeadLetterEventItemResponse): DeadLetterEvent {
  return { ...item, messageId: item.messageId ?? "미제공", eventType: item.eventType ?? "미제공", retryCount: item.retryCount ?? 0, status: item.status ?? "미제공", reprocessedByUserId: item.reprocessedByUserId ?? "미제공", reprocessedAt: item.reprocessedAt ?? "미제공", createdAt: item.createdAt ?? "미제공", updatedAt: item.updatedAt ?? "미제공" };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try { return await requestDashboardSummary(); } catch (cause) { throw asAdminApiError(cause, "운영 현황을 불러오지 못했습니다."); }
}

export async function getFailedCollectionJobs(page: number, pageSize: number): Promise<FailedCollectionJobPage> {
  try { const response = await requestFailedCollectionJobs({ page, pageSize }); return { ...pageMeta(page, pageSize, response), items: (response.items ?? []).map(mapFailedCollectionJob) }; } catch (cause) { throw asAdminApiError(cause, "수집 실패 목록을 불러오지 못했습니다."); }
}

export async function getExternalApiLogs(page: number, pageSize: number): Promise<ExternalApiLogPage> {
  try { const response = await requestExternalApiLogs({ page, pageSize }); return { ...pageMeta(page, pageSize, response), items: (response.items ?? []).map(mapExternalApiLog) }; } catch (cause) { throw asAdminApiError(cause, "외부 API 로그를 불러오지 못했습니다."); }
}

export async function getFailedNotifications(page: number, pageSize: number): Promise<FailedNotificationPage> {
  try { const response = await requestFailedNotifications({ page, pageSize }); return { ...pageMeta(page, pageSize, response), items: (response.items ?? []).map(mapFailedNotification) }; } catch (cause) { throw asAdminApiError(cause, "실패 알림 목록을 불러오지 못했습니다."); }
}

export async function getDeadLetterEvents(page: number, pageSize: number): Promise<DeadLetterEventPage> {
  try { const response = await requestDeadLetterEvents({ page, pageSize }); return { ...pageMeta(page, pageSize, response), items: (response.items ?? []).map(mapDeadLetterEvent) }; } catch (cause) { throw asAdminApiError(cause, "DLQ 이벤트를 불러오지 못했습니다."); }
}

export async function requestRecollection(collectionJobId: string, idempotencyKey = createIdempotencyKey()): Promise<RecollectionResult> {
  try { return await requestRecollectionOperation(collectionJobId, { headers: { "Idempotency-Key": idempotencyKey } }); } catch (cause) { throw asAdminApiError(cause, "재수집 요청을 처리하지 못했습니다."); }
}

export async function reprocessDeadLetterEvent(deadLetterEventId: string, idempotencyKey = createIdempotencyKey()): Promise<NotificationReprocessResult> {
  try { return await requestDeadLetterReprocess(deadLetterEventId, { headers: { "Idempotency-Key": idempotencyKey } }); } catch (cause) { throw asAdminApiError(cause, "DLQ 이벤트를 재처리하지 못했습니다."); }
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  try { return await requestAdminUser(userId); } catch (cause) { throw asAdminApiError(cause, "사용자 상세 정보를 불러오지 못했습니다."); }
}

export async function getAdminUsers(input: { query?: string; status?: ListAdminUsersStatus; page: number; pageSize: number }): Promise<AdminUserPage> {
  try {
    return await requestAdminUsers({ ...(input.query ? { query: input.query } : {}), ...(input.status ? { status: input.status } : {}), page: String(input.page), pageSize: String(input.pageSize) });
  } catch (cause) { throw asAdminApiError(cause, "사용자 목록을 불러오지 못했습니다."); }
}

export async function getAdminUserHistory(userId: string, page: number, pageSize: number): Promise<AdminUserAccessHistoryPage> {
  try { return await requestAdminUserAccessHistory(userId, { page: String(page), pageSize: String(pageSize) }); } catch (cause) { throw asAdminApiError(cause, "사용자 접근 이력을 불러오지 못했습니다."); }
}

export async function promoteUserToAdmin(userId: string, request: AdminUserRoleChangeRequest): Promise<AdminUserRole> {
  try { return await requestUserPromotion(userId, request); } catch (cause) { throw asAdminApiError(cause, "관리자 권한을 변경하지 못했습니다."); }
}

export async function changeUserSuspension(userId: string, request: AdminUserSuspensionRequest): Promise<AdminUserRole> {
  try { return await requestUserSuspension(userId, request); } catch (cause) { throw asAdminApiError(cause, "사용자 이용 상태를 변경하지 못했습니다."); }
}
