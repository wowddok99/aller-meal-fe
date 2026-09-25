import type { AdminDashboardSummaryResponse } from "@/generated/api/admin/models/adminDashboardSummaryResponse";
import type { AdminDeadLetterEventItemResponse } from "@/generated/api/admin/models/adminDeadLetterEventItemResponse";
import type { AdminDeadLetterEventPageResponse } from "@/generated/api/admin/models/adminDeadLetterEventPageResponse";
import type { AdminExternalApiLogItemResponse } from "@/generated/api/admin/models/adminExternalApiLogItemResponse";
import type { AdminExternalApiLogPageResponse } from "@/generated/api/admin/models/adminExternalApiLogPageResponse";
import type { AdminFailedCollectionJobItemResponse } from "@/generated/api/admin/models/adminFailedCollectionJobItemResponse";
import type { AdminFailedCollectionJobPageResponse } from "@/generated/api/admin/models/adminFailedCollectionJobPageResponse";
import type { AdminFailedNotificationItemResponse } from "@/generated/api/admin/models/adminFailedNotificationItemResponse";
import type { AdminFailedNotificationPageResponse } from "@/generated/api/admin/models/adminFailedNotificationPageResponse";
import type { AdminNotificationReprocessResponse } from "@/generated/api/admin/models/adminNotificationReprocessResponse";
import type { AdminRecollectionResponse } from "@/generated/api/admin/models/adminRecollectionResponse";
import type { AdminUserDetailResponse } from "@/generated/api/admin/models/adminUserDetailResponse";
import type { AdminUserRoleChangeRequest } from "@/generated/api/admin/models/adminUserRoleChangeRequest";
import type { AdminUserRoleResponse } from "@/generated/api/admin/models/adminUserRoleResponse";
import type { AdminUserPageResponse } from "@/generated/api/admin/models/adminUserPageResponse";
import type { AdminUserAccessHistoryPageResponse } from "@/generated/api/admin/models/adminUserAccessHistoryPageResponse";
import type { AdminUserSuspensionRequest } from "@/generated/api/admin/models/adminUserSuspensionRequest";
import type { ListAdminUsersStatus } from "@/generated/api/admin/models/listAdminUsersStatus";
import {
  changeAdminUserSuspension as requestUserSuspension,
  getAdminDashboardSummary as requestDashboardSummary,
  getAdminUserAccessHistory as requestAdminUserAccessHistory,
  getAdminUser as requestAdminUser,
  listAdminUsers as requestAdminUsers,
  promoteUserToAdmin as requestUserPromotion,
} from "@/generated/api/admin";
import { ApiClientError } from "@/shared/api/api-client-error";

export type DashboardSummary = AdminDashboardSummaryResponse;
export type AdminUserPage = AdminUserPageResponse;
export type AdminUserAccessHistoryPage = AdminUserAccessHistoryPageResponse;

// Review fixtures include every field this screen depends on; the boundary
// stays aligned with the generated OpenAPI contract.
export type FailedCollectionJob =
  Required<AdminFailedCollectionJobItemResponse>;
export type FailedCollectionJobPage = Required<
  Omit<AdminFailedCollectionJobPageResponse, "items">
> & {
  items: FailedCollectionJob[];
};
export type RecollectionResult = Required<AdminRecollectionResponse>;

// The UI requires these fields to render a usable operation record. Keeping
// the review boundary based on Orval types prevents it from drifting from the
// API contract while fixtures remain intentionally complete.
export type ExternalApiLog = Required<AdminExternalApiLogItemResponse>;
export type ExternalApiLogPage = Required<
  Omit<AdminExternalApiLogPageResponse, "items">
> & {
  items: ExternalApiLog[];
};

export type FailedNotification = Required<
  AdminFailedNotificationItemResponse
>;
export type FailedNotificationPage = Required<
  Omit<AdminFailedNotificationPageResponse, "items">
> & {
  items: FailedNotification[];
};

export type DeadLetterEvent = Required<AdminDeadLetterEventItemResponse> & {
  reprocessOutcome?: "SUCCESS" | "DUPLICATE" | "ERROR";
};
export type DeadLetterEventPage = Required<
  Omit<AdminDeadLetterEventPageResponse, "items">
> & {
  items: DeadLetterEvent[];
};
export type NotificationReprocessResult = Required<
  AdminNotificationReprocessResponse
>;
export type AdminUserRole = AdminUserRoleResponse;
export type AdminUserDetail = AdminUserDetailResponse;

const reviewCollectionJobs: FailedCollectionJob[] = [
  {
    collectionJobId: "review-collection-001",
    schoolId: "B100000658",
    mealDate: "2026-07-13",
    mealType: "LUNCH",
    responseTimeMillis: 3210,
    collectionDurationMillis: 3372,
    rawObjectId: "raw-review-001",
    failureCode: "NEIS_TIMEOUT",
    failureMessage: "NEIS 응답 시간이 초과되었습니다.",
    createdAt: "2026-07-13T07:10:00+09:00",
    updatedAt: "2026-07-13T07:10:00+09:00",
  },
  {
    collectionJobId: "review-collection-002",
    schoolId: "B100000701",
    mealDate: "2026-07-13",
    mealType: "DINNER",
    responseTimeMillis: 502,
    collectionDurationMillis: 590,
    rawObjectId: "raw-review-002",
    failureCode: "SOURCE_UNAVAILABLE",
    failureMessage: "외부 급식 원본을 찾을 수 없습니다.",
    createdAt: "2026-07-13T06:42:00+09:00",
    updatedAt: "2026-07-13T06:42:00+09:00",
  },
  ...Array.from({ length: 22 }, (_, index): FailedCollectionJob => ({
    collectionJobId: `review-collection-${String(index + 3).padStart(3, "0")}`,
    schoolId: `B100000${String(index + 702).padStart(3, "0")}`,
    mealDate: `2026-07-${String(12 - Math.floor(index / 3)).padStart(2, "0")}`,
    mealType:
      index % 3 === 0 ? "BREAKFAST" : index % 3 === 1 ? "LUNCH" : "DINNER",
    responseTimeMillis: 600 + index * 137,
    collectionDurationMillis: 730 + index * 151,
    rawObjectId: `raw-review-${String(index + 3).padStart(3, "0")}`,
    failureCode: index % 2 === 0 ? "NEIS_TIMEOUT" : "SOURCE_UNAVAILABLE",
    failureMessage:
      index % 2 === 0
        ? "NEIS 응답 시간이 초과되었습니다."
        : "외부 급식 원본을 찾을 수 없습니다.",
    createdAt: `2026-07-${String(12 - Math.floor(index / 3)).padStart(2, "0")}T0${index % 9}:20:00+09:00`,
    updatedAt: `2026-07-${String(12 - Math.floor(index / 3)).padStart(2, "0")}T0${index % 9}:25:00+09:00`,
  })),
];

const reviewExternalLogs: ExternalApiLog[] = [
  {
    externalApiLogId: "review-log-001",
    provider: "NEIS",
    operation: "MEAL_FETCH",
    schoolId: "B100000658",
    mealDate: "2026-07-13",
    mealType: "LUNCH",
    method: "GET",
    endpoint:
      "/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=B10&SD_SCHUL_CODE=B100000658",
    httpStatus: 200,
    outcome: "SUCCESS",
    failureCode: "",
    responseTimeMillis: 248,
    createdAt: "2026-07-13T08:04:00+09:00",
  },
  {
    externalApiLogId: "review-log-002",
    provider: "NEIS",
    operation: "MEAL_FETCH",
    schoolId: "B100000701",
    mealDate: "2026-07-13",
    mealType: "DINNER",
    method: "GET",
    endpoint:
      "/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=B10&SD_SCHUL_CODE=B100000701",
    httpStatus: 504,
    outcome: "FAILURE",
    failureCode: "UPSTREAM_TIMEOUT",
    responseTimeMillis: 3000,
    createdAt: "2026-07-13T07:59:00+09:00",
  },
  ...Array.from({ length: 98 }, (_, index): ExternalApiLog => {
    const sequence = index + 3;
    const day = String(13 - Math.floor(index / 8)).padStart(2, "0");
    const hour = String(7 - (index % 8)).padStart(2, "0");
    const isFailure = sequence % 7 === 0;

    return {
      externalApiLogId: `review-log-${String(sequence).padStart(3, "0")}`,
      provider: "NEIS",
      operation: "MEAL_FETCH",
      schoolId: `B100000${String(700 + sequence).padStart(3, "0")}`,
      mealDate: `2026-07-${day}`,
      mealType:
        index % 3 === 0 ? "BREAKFAST" : index % 3 === 1 ? "LUNCH" : "DINNER",
      method: "GET",
      endpoint: `/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=B10&SD_SCHUL_CODE=B100000${String(700 + sequence).padStart(3, "0")}`,
      httpStatus: isFailure ? 504 : 200,
      outcome: isFailure ? "FAILURE" : "SUCCESS",
      failureCode: isFailure ? "UPSTREAM_TIMEOUT" : "",
      responseTimeMillis: isFailure ? 3000 : 180 + ((index * 37) % 920),
      createdAt: `2026-07-${day}T${hour}:20:00+09:00`,
    };
  }),
];

const reviewFailedNotifications: FailedNotification[] = [
  {
    notificationId: "review-notification-001",
    notificationTargetId: "review-target-001",
    childId: "review-child-001",
    userId: "review-user-001",
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
    notificationId: "review-notification-002",
    notificationTargetId: "review-target-002",
    childId: "review-child-002",
    userId: "review-user-002",
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
  ...Array.from({ length: 22 }, (_, index): FailedNotification => {
    const sequence = index + 3;
    const day = String(13 - Math.floor(index / 4)).padStart(2, "0");
    const hour = String(6 - (index % 4)).padStart(2, "0");
    const status =
      index % 5 === 0
        ? "RETRY_PENDING"
        : index % 7 === 0
          ? "CANCELED"
          : "FAILED";
    const reason =
      index % 3 === 0
        ? "RISK_DETECTED"
        : index % 3 === 1
          ? "RISK_UNKNOWN"
          : "RISK_LABELING_FAILED";
    const isChildTarget = index % 2 === 0;

    return {
      notificationId: `review-notification-${String(sequence).padStart(3, "0")}`,
      notificationTargetId: `review-target-${String(sequence).padStart(3, "0")}`,
      childId: isChildTarget
        ? `review-child-${String(sequence).padStart(3, "0")}`
        : "",
      userId: isChildTarget
        ? ""
        : `review-user-${String(sequence).padStart(3, "0")}`,
      notificationDate: `2026-07-${day}`,
      channel: "EMAIL",
      reason,
      status,
      attemptCount: status === "FAILED" ? 3 : status === "RETRY_PENDING" ? 2 : 1,
      maxAttempts: 3,
      failureCode:
        status === "CANCELED"
          ? "CANCELED_BY_POLICY"
          : reason === "RISK_LABELING_FAILED"
            ? "LABELING_PENDING"
            : "SMTP_TIMEOUT",
      createdAt: `2026-07-${day}T${hour}:20:00+09:00`,
      updatedAt: `2026-07-${day}T${hour}:25:00+09:00`,
    };
  }),
];

const reviewDeadLetterEvents: DeadLetterEvent[] = [
  {
    deadLetterEventId: "dlq_01HXYZ8M2Y3J",
    messageId: "msg_01HXZ8K9ABC",
    eventType: "ALERT_EMAIL_SEND",
    retryCount: 3,
    status: "PENDING",
    reprocessedByUserId: "",
    reprocessedAt: "",
    createdAt: "2026-07-04T08:55:00+09:00",
    updatedAt: "2026-07-04T08:55:00+09:00",
    reprocessOutcome: "SUCCESS",
  },
  {
    deadLetterEventId: "dlq_01HXYZ7P4N1T",
    messageId: "msg_01HXZ7N2DEF",
    eventType: "ALERT_EMAIL_SEND",
    retryCount: 2,
    status: "PENDING",
    reprocessedByUserId: "",
    reprocessedAt: "",
    createdAt: "2026-07-04T08:40:00+09:00",
    updatedAt: "2026-07-04T08:40:00+09:00",
    reprocessOutcome: "DUPLICATE",
  },
  {
    deadLetterEventId: "dlq_01HXYR6QW8E",
    messageId: "msg_01HXYR3ZXCV",
    eventType: "ALERT_EMAIL_SEND",
    retryCount: 1,
    status: "PENDING",
    reprocessedByUserId: "",
    reprocessedAt: "",
    createdAt: "2026-07-04T08:25:00+09:00",
    updatedAt: "2026-07-04T08:25:00+09:00",
    reprocessOutcome: "ERROR",
  },
  {
    deadLetterEventId: "dlq_01HXYQ9L5D2",
    messageId: "msg_01HXYQ6ASDF",
    eventType: "ALERT_EMAIL_BAD_ADDRESS",
    retryCount: 1,
    status: "PENDING",
    reprocessedByUserId: "",
    reprocessedAt: "",
    createdAt: "2026-07-04T08:15:00+09:00",
    updatedAt: "2026-07-04T08:15:00+09:00",
    reprocessOutcome: "SUCCESS",
  },
  {
    deadLetterEventId: "dlq_01HXYP1K4F7",
    messageId: "msg_01HXYP0QWER",
    eventType: "ALERT_EMAIL_SEND",
    retryCount: 5,
    status: "REPROCESSED",
    reprocessedByUserId: "admin@allermeal.io",
    reprocessedAt: "2026-07-04T08:35:00+09:00",
    createdAt: "2026-07-04T07:55:00+09:00",
    updatedAt: "2026-07-04T08:35:00+09:00",
  },
  {
    deadLetterEventId: "dlq_01HXYN8B9G6",
    messageId: "msg_01HXYN5TYUI",
    eventType: "ALERT_EMAIL_SEND",
    retryCount: 4,
    status: "REPROCESSED",
    reprocessedByUserId: "admin@allermeal.io",
    reprocessedAt: "2026-07-04T07:45:00+09:00",
    createdAt: "2026-07-04T07:05:00+09:00",
    updatedAt: "2026-07-04T07:45:00+09:00",
  },
  {
    deadLetterEventId: "dlq_01HXYL2Z1H3",
    messageId: "msg_01HXYL0OPLK",
    eventType: "ALERT_EMAIL_SEND",
    retryCount: 2,
    status: "REPROCESSED",
    reprocessedByUserId: "admin@allermeal.io",
    reprocessedAt: "2026-07-03T22:10:00+09:00",
    createdAt: "2026-07-03T21:35:00+09:00",
    updatedAt: "2026-07-03T22:10:00+09:00",
  },
  {
    deadLetterEventId: "dlq_01HXYK6J3M4",
    messageId: "msg_01HXYK3BNML",
    eventType: "ALERT_EMAIL_BAD_ADDRESS",
    retryCount: 1,
    status: "REPROCESSED",
    reprocessedByUserId: "admin@allermeal.io",
    reprocessedAt: "2026-07-03T21:05:00+09:00",
    createdAt: "2026-07-03T20:50:00+09:00",
    updatedAt: "2026-07-03T21:05:00+09:00",
  },
  {
    deadLetterEventId: "dlq_01HXYJ9C7V8",
    messageId: "msg_01HXYJ6ZXCV",
    eventType: "ALERT_EMAIL_SEND",
    retryCount: 6,
    status: "REPROCESSED",
    reprocessedByUserId: "admin@allermeal.io",
    reprocessedAt: "2026-07-03T20:30:00+09:00",
    createdAt: "2026-07-03T19:45:00+09:00",
    updatedAt: "2026-07-03T20:30:00+09:00",
  },
];

function reviewPage<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    totalCount: items.length,
  };
}

export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

function asAdminApiError(cause: unknown, fallback: string): AdminApiError {
  if (cause instanceof AdminApiError) return cause;
  if (cause instanceof ApiClientError) {
    return new AdminApiError(cause.status, cause.message);
  }
  return new AdminApiError(
    0,
    cause instanceof Error && cause.message.trim() ? cause.message : fallback,
  );
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    return await requestDashboardSummary();
  } catch (cause) {
    throw asAdminApiError(cause, "운영 현황을 불러오지 못했습니다.");
  }
}
export async function getFailedCollectionJobs(
  page: number,
  pageSize: number,
): Promise<FailedCollectionJobPage> {
  return reviewPage(reviewCollectionJobs, page, pageSize);
}
export async function getExternalApiLogs(
  page: number,
  pageSize: number,
): Promise<ExternalApiLogPage> {
  return reviewPage(reviewExternalLogs, page, pageSize);
}
export async function getFailedNotifications(
  page: number,
  pageSize: number,
): Promise<FailedNotificationPage> {
  return reviewPage(reviewFailedNotifications, page, pageSize);
}
export async function getDeadLetterEvents(
  page: number,
  pageSize: number,
): Promise<DeadLetterEventPage> {
  return reviewPage(reviewDeadLetterEvents, page, pageSize);
}

export async function reprocessDeadLetterEvent(
  event: DeadLetterEvent,
): Promise<NotificationReprocessResult> {
  if (event.reprocessOutcome === "ERROR") {
    throw new AdminApiError(500, "DLQ 이벤트를 재처리하지 못했습니다.");
  }

  return {
    deadLetterEventId: event.deadLetterEventId,
    status: "REPROCESSED",
    duplicate: event.reprocessOutcome === "DUPLICATE",
    reprocessedAt: "2026-07-04T09:10:00+09:00",
  };
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  try {
    return await requestAdminUser(userId);
  } catch (cause) {
    throw asAdminApiError(cause, "사용자 상세 정보를 불러오지 못했습니다.");
  }
}

export async function getAdminUsers(input: {
  query?: string;
  status?: ListAdminUsersStatus;
  page: number;
  pageSize: number;
}): Promise<AdminUserPage> {
  try {
    return await requestAdminUsers({
      ...(input.query ? { query: input.query } : {}),
      ...(input.status ? { status: input.status } : {}),
      page: String(input.page),
      pageSize: String(input.pageSize),
    });
  } catch (cause) {
    throw asAdminApiError(cause, "사용자 목록을 불러오지 못했습니다.");
  }
}

export async function getAdminUserHistory(
  userId: string,
  page: number,
  pageSize: number,
): Promise<AdminUserAccessHistoryPage> {
  try {
    return await requestAdminUserAccessHistory(userId, {
      page: String(page),
      pageSize: String(pageSize),
    });
  } catch (cause) {
    throw asAdminApiError(cause, "사용자 접근 이력을 불러오지 못했습니다.");
  }
}

export async function promoteUserToAdmin(
  userId: string,
  request: AdminUserRoleChangeRequest,
): Promise<AdminUserRole> {
  try {
    return await requestUserPromotion(userId, request);
  } catch (cause) {
    throw asAdminApiError(cause, "관리자 권한을 변경하지 못했습니다.");
  }
}

export async function changeUserSuspension(
  userId: string,
  request: AdminUserSuspensionRequest,
): Promise<AdminUserRole> {
  try {
    return await requestUserSuspension(userId, request);
  } catch (cause) {
    throw asAdminApiError(cause, "사용자 이용 상태를 변경하지 못했습니다.");
  }
}
export async function requestRecollection(
  collectionJobId: string,
): Promise<RecollectionResult> {
  return {
    originalCollectionJobId: collectionJobId,
    collectionJobId: `review-recollection-${collectionJobId}`,
    status: "PENDING",
    duplicate: false,
  };
}
