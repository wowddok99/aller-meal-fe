import type { AdminDashboardSummaryResponse } from "@/generated/api/admin/models/adminDashboardSummaryResponse";
import type { AdminCollectionJobItemResponse } from "@/generated/api/admin/models/adminCollectionJobItemResponse";
import type { AdminMealItemLabelingItemResponse } from "@/generated/api/admin/models/adminMealItemLabelingItemResponse";
import type { AdminNotificationRequestItemResponse } from "@/generated/api/admin/models/adminNotificationRequestItemResponse";
import type { AdminOutboxEventItemResponse } from "@/generated/api/admin/models/adminOutboxEventItemResponse";
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
  listAdminCollectionJobs as requestCollectionJobs,
  listAdminMealItemLabelings as requestMealItemLabelings,
  listAdminNotificationRequests as requestNotificationRequests,
  listAdminOutboxEvents as requestOutboxEvents,
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

export type AdminOperationItem = {
  id?: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  fields: Array<[string, string]>;
  actionId?: string;
};
export type AdminOperationPage = { items: AdminOperationItem[]; page: number; pageSize: number; totalCount: number };
export type AdminOperationQuery = {
  page: number; pageSize: number; status?: string; schoolId?: string; mealDate?: string; mealType?: string;
  eventType?: string; channel?: string; reason?: string; provider?: string; method?: string; outcome?: string; query?: string;
};

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

function display(value: string | number | undefined) { return value === undefined || value === "" ? "미제공" : String(value); }
function operationPage(page: number, pageSize: number, response: { page?: number; pageSize?: number; totalCount?: number; items?: unknown[] }, items: AdminOperationItem[]): AdminOperationPage {
  return { ...pageMeta(page, pageSize, response), items };
}

function mapCollectionJob(item: AdminCollectionJobItemResponse): AdminOperationItem {
  return { id: item.collectionJobId, actionId: item.collectionJobId, title: display(item.schoolName), status: display(item.status), createdAt: display(item.createdAt), updatedAt: display(item.updatedAt), fields: [["학교", display(item.schoolName)], ["식사일", display(item.mealDate)], ["식사", display(item.mealType)], ["상태", display(item.status)], ["실패 코드", display(item.failureCode)], ["실패 사유", display(item.failureMessage)]] };
}
function mapMealItemLabeling(item: AdminMealItemLabelingItemResponse): AdminOperationItem {
  return { id: item.mealItemId, title: display(item.name), status: display(item.status), createdAt: display(item.createdAt), updatedAt: display(item.updatedAt), fields: [["메뉴", display(item.name)], ["학교", display(item.schoolName)], ["식사일", display(item.mealDate)], ["식사", display(item.mealType)], ["표시 순서", display(item.displayOrder)], ["상태", display(item.status)]] };
}
function mapOutboxEvent(item: AdminOutboxEventItemResponse): AdminOperationItem {
  return { id: item.eventId, title: display(item.eventType), status: display(item.status), createdAt: display(item.createdAt ?? item.occurredAt), updatedAt: display(item.updatedAt ?? item.publishedAt), fields: [["이벤트 ID", display(item.eventId)], ["이벤트 타입", display(item.eventType)], ["상태", display(item.status)], ["발생 시각", display(item.occurredAt)], ["발행 시각", display(item.publishedAt)]] };
}
function mapNotificationRequest(item: AdminNotificationRequestItemResponse): AdminOperationItem {
  return { id: item.notificationId, title: display(item.notificationId), status: display(item.status), createdAt: display(item.createdAt), updatedAt: display(item.updatedAt), fields: [["알림 ID", display(item.notificationId)], ["채널", display(item.channel)], ["사유", display(item.reason)], ["상태", display(item.status)], ["재시도", `${item.attemptCount ?? 0}/${item.maxAttempts ?? 0}`], ["다음 시도", display(item.nextAttemptAt)], ["실패 코드", display(item.failureCode)], ["실패 사유", display(item.failureMessage)]] };
}
function mapDeadLetterOperation(item: AdminDeadLetterEventItemResponse): AdminOperationItem {
  return { id: item.deadLetterEventId, actionId: item.deadLetterEventId, title: display(item.eventType), status: display(item.status), createdAt: display(item.createdAt), updatedAt: display(item.updatedAt), fields: [["이벤트 ID", display(item.deadLetterEventId)], ["메시지 ID", display(item.messageId)], ["이벤트 타입", display(item.eventType)], ["재시도", `${item.retryCount ?? 0}회`], ["상태", display(item.status)], ["재처리 담당", display(item.reprocessedByUserId)], ["재처리 시각", display(item.reprocessedAt)]] };
}
function mapExternalApiLogOperation(item: AdminExternalApiLogItemResponse): AdminOperationItem {
  return { id: item.externalApiLogId, title: `${display(item.provider)} · ${display(item.operation)}`, status: display(item.outcome), createdAt: display(item.createdAt), updatedAt: display(item.createdAt), fields: [["로그 ID", display(item.externalApiLogId)], ["제공자", display(item.provider)], ["작업", display(item.operation)], ["메서드", display(item.method)], ["엔드포인트", display(item.endpoint)], ["결과", display(item.outcome)], ["HTTP 상태", display(item.httpStatus)], ["응답 시간", `${item.responseTimeMillis ?? 0}ms`], ["학교 ID", display(item.schoolId)]] };
}

function optionalQuery(input: AdminOperationQuery) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== "")) as AdminOperationQuery;
}

export async function getCollectionJobs(input: AdminOperationQuery): Promise<AdminOperationPage> {
  try { const response = await requestCollectionJobs(optionalQuery(input)); return operationPage(input.page, input.pageSize, response, (response.items ?? []).map(mapCollectionJob)); } catch (cause) { throw asAdminApiError(cause, "급식 수집 작업을 불러오지 못했습니다."); }
}
export async function getMealItemLabelings(input: AdminOperationQuery): Promise<AdminOperationPage> {
  try { const response = await requestMealItemLabelings(optionalQuery(input)); return operationPage(input.page, input.pageSize, response, (response.items ?? []).map(mapMealItemLabeling)); } catch (cause) { throw asAdminApiError(cause, "라벨링 작업을 불러오지 못했습니다."); }
}
export async function getOutboxEvents(input: AdminOperationQuery): Promise<AdminOperationPage> {
  try { const response = await requestOutboxEvents(optionalQuery(input)); return operationPage(input.page, input.pageSize, response, (response.items ?? []).map(mapOutboxEvent)); } catch (cause) { throw asAdminApiError(cause, "이벤트 발행 작업을 불러오지 못했습니다."); }
}
export async function getNotificationRequests(input: AdminOperationQuery): Promise<AdminOperationPage> {
  try { const response = await requestNotificationRequests(optionalQuery(input)); return operationPage(input.page, input.pageSize, response, (response.items ?? []).map(mapNotificationRequest)); } catch (cause) { throw asAdminApiError(cause, "알림 발송 작업을 불러오지 못했습니다."); }
}
export async function getAllDeadLetterEvents(input: AdminOperationQuery): Promise<AdminOperationPage> {
  try { const response = await requestDeadLetterEvents(optionalQuery(input)); return operationPage(input.page, input.pageSize, response, (response.items ?? []).map(mapDeadLetterOperation)); } catch (cause) { throw asAdminApiError(cause, "DLQ 이벤트를 불러오지 못했습니다."); }
}
export async function getAllExternalApiLogs(input: AdminOperationQuery): Promise<AdminOperationPage> {
  try { const response = await requestExternalApiLogs(optionalQuery(input)); return operationPage(input.page, input.pageSize, response, (response.items ?? []).map(mapExternalApiLogOperation)); } catch (cause) { throw asAdminApiError(cause, "외부 API 로그를 불러오지 못했습니다."); }
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
