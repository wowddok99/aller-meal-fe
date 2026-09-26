import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/shared/api/api-client-error";

const adminApi = vi.hoisted(() => ({
  changeAdminUserSuspension: vi.fn(),
  getAdminDashboardSummary: vi.fn(),
  getAdminUser: vi.fn(),
  getAdminUserAccessHistory: vi.fn(),
  listAdminUsers: vi.fn(),
  listAdminCollectionJobs: vi.fn(),
  listAdminMealItemLabelings: vi.fn(),
  listAdminNotificationRequests: vi.fn(),
  listAdminOutboxEvents: vi.fn(),
  listExternalApiLogs: vi.fn(),
  listFailedCollectionJobs: vi.fn(),
  listFailedNotifications: vi.fn(),
  listNotificationDeadLetterEvents: vi.fn(),
  promoteUserToAdmin: vi.fn(),
  reprocessNotificationDeadLetterEvent: vi.fn(),
  requestCollectionRecollection: vi.fn(),
}));

vi.mock("@/generated/api/admin", () => adminApi);

import {
  AdminApiError,
  getAdminUsers,
  getAllDeadLetterEvents,
  getAllExternalApiLogs,
  getCollectionJobs,
  getDeadLetterEvents,
  getExternalApiLogs,
  getFailedCollectionJobs,
  getFailedNotifications,
  getMealItemLabelings,
  getNotificationRequests,
  getOutboxEvents,
  isAdminActionId,
  reprocessDeadLetterEvent,
  requestRecollection,
} from "./admin-api";

describe("PR-06 admin operation adapters", () => {
  it("does not treat missing or fixture-like IDs as actionable UUIDs", () => {
    expect(isAdminActionId(undefined)).toBe(false);
    expect(isAdminActionId("review-collection-001")).toBe(false);
    expect(isAdminActionId("a1111111-1111-4111-8111-111111111111")).toBe(true);
  });

  it("sends only numeric page and pageSize for every operation list", async () => {
    adminApi.listFailedCollectionJobs.mockResolvedValueOnce({ items: [], page: 2, pageSize: 10, totalCount: 11 });
    adminApi.listExternalApiLogs.mockResolvedValueOnce({ items: [], page: 2, pageSize: 10, totalCount: 11 });
    adminApi.listFailedNotifications.mockResolvedValueOnce({ items: [], page: 2, pageSize: 10, totalCount: 11 });
    adminApi.listNotificationDeadLetterEvents.mockResolvedValueOnce({ items: [], page: 2, pageSize: 10, totalCount: 11 });

    await Promise.all([
      getFailedCollectionJobs(2, 10), getExternalApiLogs(2, 10), getFailedNotifications(2, 10), getDeadLetterEvents(2, 10),
    ]);

    expect(adminApi.listFailedCollectionJobs).toHaveBeenCalledWith({ page: 2, pageSize: 10 });
    expect(adminApi.listExternalApiLogs).toHaveBeenCalledWith({ page: 2, pageSize: 10 });
    expect(adminApi.listFailedNotifications).toHaveBeenCalledWith({ page: 2, pageSize: 10 });
    expect(adminApi.listNotificationDeadLetterEvents).toHaveBeenCalledWith({ page: 2, pageSize: 10 });
  });

  it("preserves server pagination and safely displays omitted item fields without inventing an action ID", async () => {
    adminApi.listFailedCollectionJobs.mockResolvedValueOnce({
      items: [{ failureMessage: "timeout" }], page: 3, pageSize: 20, totalCount: 41,
    });

    await expect(getFailedCollectionJobs(1, 10)).resolves.toMatchObject({
      items: [expect.objectContaining({ schoolId: "미제공", failureMessage: "timeout" })],
      page: 3, pageSize: 20, totalCount: 41,
    });
  });

  it("passes a per-action Idempotency-Key through the generated mutating clients", async () => {
    adminApi.requestCollectionRecollection.mockResolvedValueOnce({ status: "PENDING", duplicate: false });
    adminApi.reprocessNotificationDeadLetterEvent.mockResolvedValueOnce({ status: "REPROCESSED", duplicate: true });

    await requestRecollection("a1111111-1111-4111-8111-111111111111", "recollect-key");
    await reprocessDeadLetterEvent("b1111111-1111-4111-8111-111111111111", "dlq-key");

    expect(adminApi.requestCollectionRecollection).toHaveBeenCalledWith("a1111111-1111-4111-8111-111111111111", { headers: { "Idempotency-Key": "recollect-key" } });
    expect(adminApi.reprocessNotificationDeadLetterEvent).toHaveBeenCalledWith("b1111111-1111-4111-8111-111111111111", { headers: { "Idempotency-Key": "dlq-key" } });
  });

  it("keeps 409 distinct from a successful duplicate response", async () => {
    adminApi.requestCollectionRecollection.mockRejectedValueOnce(new ApiClientError({ status: 409, code: "IDEMPOTENCY_KEY_CONFLICT", message: "conflict" }));
    await expect(requestRecollection("a1111111-1111-4111-8111-111111111111", "conflict-key")).rejects.toMatchObject({ name: "AdminApiError", status: 409 } satisfies Partial<AdminApiError>);
  });

  it.each([401, 403, 0])("preserves action failure status %s for recovery UI", async (status) => {
    adminApi.reprocessNotificationDeadLetterEvent.mockRejectedValueOnce(new ApiClientError({ status, code: "ACTION_FAILED", message: "request failed" }));
    await expect(reprocessDeadLetterEvent("b1111111-1111-4111-8111-111111111111", `failure-${status}`)).rejects.toMatchObject({ name: "AdminApiError", status } satisfies Partial<AdminApiError>);
  });

  it("retains existing admin user query behavior", async () => {
    adminApi.listAdminUsers.mockResolvedValueOnce({ items: [], page: 2, pageSize: 20, totalCount: 21 });
    await getAdminUsers({ query: "member@example.com", status: "SUSPENDED", page: 2, pageSize: 20 });
    expect(adminApi.listAdminUsers).toHaveBeenCalledWith({ query: "member@example.com", status: "SUSPENDED", page: "2", pageSize: "20" });
  });

  it("serializes canonical operation filters and preserves server pagination", async () => {
    const page = { items: [], page: 2, pageSize: 50, totalCount: 51 };
    adminApi.listAdminCollectionJobs.mockResolvedValueOnce(page);
    adminApi.listAdminMealItemLabelings.mockResolvedValueOnce(page);
    adminApi.listAdminOutboxEvents.mockResolvedValueOnce(page);
    adminApi.listAdminNotificationRequests.mockResolvedValueOnce(page);
    adminApi.listNotificationDeadLetterEvents.mockResolvedValueOnce(page);
    adminApi.listExternalApiLogs.mockResolvedValueOnce(page);

    const [collection] = await Promise.all([
      getCollectionJobs({ page: 2, pageSize: 50, status: "FAILED", schoolId: "school-1", query: "상명초" }),
      getMealItemLabelings({ page: 2, pageSize: 50, status: "PENDING", mealType: "LUNCH", query: "김치" }),
      getOutboxEvents({ page: 2, pageSize: 50, status: "PUBLISHED", eventType: "MealCollected", query: "event-1" }),
      getNotificationRequests({ page: 2, pageSize: 50, status: "RETRY_PENDING", channel: "EMAIL", reason: "MEAL", query: "notification-1" }),
      getAllDeadLetterEvents({ page: 2, pageSize: 50, status: "PENDING", eventType: "NotificationRequested", query: "message-1" }),
      getAllExternalApiLogs({ page: 2, pageSize: 50, provider: "NEIS", method: "GET", outcome: "SUCCESS", query: "school-1" }),
    ]);

    expect(adminApi.listAdminCollectionJobs).toHaveBeenCalledWith({ page: 2, pageSize: 50, status: "FAILED", schoolId: "school-1", query: "상명초" });
    expect(adminApi.listAdminMealItemLabelings).toHaveBeenCalledWith({ page: 2, pageSize: 50, status: "PENDING", mealType: "LUNCH", query: "김치" });
    expect(adminApi.listAdminOutboxEvents).toHaveBeenCalledWith({ page: 2, pageSize: 50, status: "PUBLISHED", eventType: "MealCollected", query: "event-1" });
    expect(adminApi.listAdminNotificationRequests).toHaveBeenCalledWith({ page: 2, pageSize: 50, status: "RETRY_PENDING", channel: "EMAIL", reason: "MEAL", query: "notification-1" });
    expect(adminApi.listNotificationDeadLetterEvents).toHaveBeenCalledWith({ page: 2, pageSize: 50, status: "PENDING", eventType: "NotificationRequested", query: "message-1" });
    expect(adminApi.listExternalApiLogs).toHaveBeenCalledWith({ page: 2, pageSize: 50, provider: "NEIS", method: "GET", outcome: "SUCCESS", query: "school-1" });
    expect(collection).toMatchObject({ page: 2, pageSize: 50, totalCount: 51 });
  });
});
