export type DashboardSummary = {
  generatedAt: string;
  collection: {
    pendingCount: number;
    runningCount: number;
    succeededCount: number;
    failedCount: number;
  };
  labeling: {
    pendingCount: number;
    labeledCount: number;
    unknownCount: number;
    labelingFailedCount: number;
  };
  outbox: {
    pendingCount: number;
    publishedCount: number;
  };
  dlq: {
    pendingCount: number;
    reprocessedCount: number;
  };
  notifications: {
    pendingCount: number;
    sendingCount: number;
    retryPendingCount: number;
    sentCount: number;
    failedCount: number;
    canceledCount: number;
  };
};

export type FailedCollectionJob = {
  collectionJobId: string;
  schoolId: string;
  mealDate: string;
  mealType: string;
  responseTimeMillis: number;
  collectionDurationMillis: number;
  rawObjectId: string;
  failureCode: string;
  failureMessage: string;
  createdAt: string;
  updatedAt: string;
};

export type FailedCollectionJobPage = {
  items: FailedCollectionJob[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type RecollectionResult = {
  originalCollectionJobId: string;
  collectionJobId: string;
  status: string;
  duplicate: boolean;
};

export type ExternalApiLog = {
  externalApiLogId: string;
  provider: string;
  operation: string;
  schoolId: string;
  mealDate: string;
  mealType: string;
  method: string;
  endpoint: string;
  httpStatus: number;
  outcome: string;
  failureCode: string;
  responseTimeMillis: number;
  createdAt: string;
};

export type ExternalApiLogPage = {
  items: ExternalApiLog[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type FailedNotification = {
  notificationId: string;
  notificationTargetId: string;
  childId: string;
  userId: string;
  notificationDate: string;
  channel: string;
  reason: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  failureCode: string;
  createdAt: string;
  updatedAt: string;
};

export type FailedNotificationPage = {
  items: FailedNotification[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type DeadLetterEvent = {
  deadLetterEventId: string;
  messageId: string;
  eventType: string;
  retryCount: number;
  status: "PENDING" | "REPROCESSED";
  reprocessedByUserId: string;
  reprocessedAt: string;
  createdAt: string;
  updatedAt: string;
  reprocessOutcome?: "SUCCESS" | "DUPLICATE" | "ERROR";
};

export type DeadLetterEventPage = {
  items: DeadLetterEvent[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export const ADMIN_REVIEW_PREFIX = "/admin/preview";

const reviewDashboardSummary: DashboardSummary = {
  generatedAt: "2026-07-13T09:30:00+09:00",
  collection: { pendingCount: 12, runningCount: 3, succeededCount: 1864, failedCount: 4 },
  labeling: { pendingCount: 8, labeledCount: 1821, unknownCount: 19, labelingFailedCount: 3 },
  outbox: { pendingCount: 6, publishedCount: 2410 },
  dlq: { pendingCount: 2, reprocessedCount: 38 },
  notifications: { pendingCount: 4, sendingCount: 2, retryPendingCount: 3, sentCount: 2387, failedCount: 5, canceledCount: 1 },
};

const reviewCollectionJobs: FailedCollectionJob[] = [
  { collectionJobId: "review-collection-001", schoolId: "B100000658", mealDate: "2026-07-13", mealType: "LUNCH", responseTimeMillis: 3210, collectionDurationMillis: 3372, rawObjectId: "raw-review-001", failureCode: "NEIS_TIMEOUT", failureMessage: "NEIS 응답 시간이 초과되었습니다.", createdAt: "2026-07-13T07:10:00+09:00", updatedAt: "2026-07-13T07:10:00+09:00" },
  { collectionJobId: "review-collection-002", schoolId: "B100000701", mealDate: "2026-07-13", mealType: "DINNER", responseTimeMillis: 502, collectionDurationMillis: 590, rawObjectId: "raw-review-002", failureCode: "SOURCE_UNAVAILABLE", failureMessage: "외부 급식 원본을 찾을 수 없습니다.", createdAt: "2026-07-13T06:42:00+09:00", updatedAt: "2026-07-13T06:42:00+09:00" },
];

const reviewExternalLogs: ExternalApiLog[] = [
  { externalApiLogId: "review-log-001", provider: "NEIS", operation: "MEAL_FETCH", schoolId: "B100000658", mealDate: "2026-07-13", mealType: "LUNCH", method: "GET", endpoint: "/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=B10&SD_SCHUL_CODE=B100000658", httpStatus: 200, outcome: "SUCCESS", failureCode: "", responseTimeMillis: 248, createdAt: "2026-07-13T08:04:00+09:00" },
  { externalApiLogId: "review-log-002", provider: "NEIS", operation: "MEAL_FETCH", schoolId: "B100000701", mealDate: "2026-07-13", mealType: "DINNER", method: "GET", endpoint: "/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=B10&SD_SCHUL_CODE=B100000701", httpStatus: 504, outcome: "FAILURE", failureCode: "UPSTREAM_TIMEOUT", responseTimeMillis: 3000, createdAt: "2026-07-13T07:59:00+09:00" },
];

const reviewFailedNotifications: FailedNotification[] = [
  { notificationId: "review-notification-001", notificationTargetId: "review-target-001", childId: "review-child-001", userId: "review-user-001", notificationDate: "2026-07-13", channel: "EMAIL", reason: "RISK_DETECTED", status: "FAILED", attemptCount: 3, maxAttempts: 3, failureCode: "SMTP_TIMEOUT", createdAt: "2026-07-13T08:10:00+09:00", updatedAt: "2026-07-13T08:15:00+09:00" },
  { notificationId: "review-notification-002", notificationTargetId: "review-target-002", childId: "review-child-002", userId: "review-user-002", notificationDate: "2026-07-13", channel: "EMAIL", reason: "RISK_UNKNOWN", status: "RETRY_PENDING", attemptCount: 2, maxAttempts: 3, failureCode: "LABELING_PENDING", createdAt: "2026-07-13T07:35:00+09:00", updatedAt: "2026-07-13T07:40:00+09:00" },
];

const reviewDeadLetterEvents: DeadLetterEvent[] = [
  { deadLetterEventId: "dlq_01HXYZ8M2Y3J", messageId: "msg_01HXZ8K9ABC", eventType: "ALERT_EMAIL_SEND", retryCount: 3, status: "PENDING", reprocessedByUserId: "", reprocessedAt: "", createdAt: "2026-07-04T08:55:00+09:00", updatedAt: "2026-07-04T08:55:00+09:00", reprocessOutcome: "SUCCESS" },
  { deadLetterEventId: "dlq_01HXYZ7P4N1T", messageId: "msg_01HXZ7N2DEF", eventType: "ALERT_EMAIL_SEND", retryCount: 2, status: "PENDING", reprocessedByUserId: "", reprocessedAt: "", createdAt: "2026-07-04T08:40:00+09:00", updatedAt: "2026-07-04T08:40:00+09:00", reprocessOutcome: "DUPLICATE" },
  { deadLetterEventId: "dlq_01HXYR6QW8E", messageId: "msg_01HXYR3ZXCV", eventType: "ALERT_EMAIL_SEND", retryCount: 1, status: "PENDING", reprocessedByUserId: "", reprocessedAt: "", createdAt: "2026-07-04T08:25:00+09:00", updatedAt: "2026-07-04T08:25:00+09:00", reprocessOutcome: "ERROR" },
  { deadLetterEventId: "dlq_01HXYQ9L5D2", messageId: "msg_01HXYQ6ASDF", eventType: "ALERT_EMAIL_BAD_ADDRESS", retryCount: 1, status: "PENDING", reprocessedByUserId: "", reprocessedAt: "", createdAt: "2026-07-04T08:15:00+09:00", updatedAt: "2026-07-04T08:15:00+09:00", reprocessOutcome: "SUCCESS" },
  { deadLetterEventId: "dlq_01HXYP1K4F7", messageId: "msg_01HXYP0QWER", eventType: "ALERT_EMAIL_SEND", retryCount: 5, status: "REPROCESSED", reprocessedByUserId: "admin@allermeal.io", reprocessedAt: "2026-07-04T08:35:00+09:00", createdAt: "2026-07-04T07:55:00+09:00", updatedAt: "2026-07-04T08:35:00+09:00" },
  { deadLetterEventId: "dlq_01HXYN8B9G6", messageId: "msg_01HXYN5TYUI", eventType: "ALERT_EMAIL_SEND", retryCount: 4, status: "REPROCESSED", reprocessedByUserId: "admin@allermeal.io", reprocessedAt: "2026-07-04T07:45:00+09:00", createdAt: "2026-07-04T07:05:00+09:00", updatedAt: "2026-07-04T07:45:00+09:00" },
  { deadLetterEventId: "dlq_01HXYL2Z1H3", messageId: "msg_01HXYL0OPLK", eventType: "ALERT_EMAIL_SEND", retryCount: 2, status: "REPROCESSED", reprocessedByUserId: "admin@allermeal.io", reprocessedAt: "2026-07-03T22:10:00+09:00", createdAt: "2026-07-03T21:35:00+09:00", updatedAt: "2026-07-03T22:10:00+09:00" },
  { deadLetterEventId: "dlq_01HXYK6J3M4", messageId: "msg_01HXYK3BNML", eventType: "ALERT_EMAIL_BAD_ADDRESS", retryCount: 1, status: "REPROCESSED", reprocessedByUserId: "admin@allermeal.io", reprocessedAt: "2026-07-03T21:05:00+09:00", createdAt: "2026-07-03T20:50:00+09:00", updatedAt: "2026-07-03T21:05:00+09:00" },
  { deadLetterEventId: "dlq_01HXYJ9C7V8", messageId: "msg_01HXYJ6ZXCV", eventType: "ALERT_EMAIL_SEND", retryCount: 6, status: "REPROCESSED", reprocessedByUserId: "admin@allermeal.io", reprocessedAt: "2026-07-03T20:30:00+09:00", createdAt: "2026-07-03T19:45:00+09:00", updatedAt: "2026-07-03T20:30:00+09:00" },
];

function reviewPage<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, pageSize, totalCount: items.length };
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

export async function getDashboardSummary(review = false): Promise<DashboardSummary> { void review; return reviewDashboardSummary; }
export async function getFailedCollectionJobs(page: number, pageSize: number, review = false): Promise<FailedCollectionJobPage> { void review; return reviewPage(reviewCollectionJobs, page, pageSize); }
export async function getExternalApiLogs(page: number, pageSize: number, review = false): Promise<ExternalApiLogPage> { void review; return reviewPage(reviewExternalLogs, page, pageSize); }
export async function getFailedNotifications(page: number, pageSize: number, review = false): Promise<FailedNotificationPage> { void review; return reviewPage(reviewFailedNotifications, page, pageSize); }
export async function getDeadLetterEvents(page: number, pageSize: number): Promise<DeadLetterEventPage> { return reviewPage(reviewDeadLetterEvents, page, pageSize); }
export async function requestRecollection(collectionJobId: string): Promise<RecollectionResult> { return { originalCollectionJobId: collectionJobId, collectionJobId: `review-recollection-${collectionJobId}`, status: "PENDING", duplicate: false }; }
