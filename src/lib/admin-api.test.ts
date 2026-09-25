import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/shared/api/api-client-error";

const adminApi = vi.hoisted(() => ({
  changeAdminUserSuspension: vi.fn(),
  getAdminDashboardSummary: vi.fn(),
  getAdminUser: vi.fn(),
  getAdminUserAccessHistory: vi.fn(),
  listAdminUsers: vi.fn(),
  promoteUserToAdmin: vi.fn(),
}));

vi.mock("@/generated/api/admin", () => adminApi);

import {
  AdminApiError,
  getAdminUserHistory,
  getAdminUsers,
  getDashboardSummary,
  getExternalApiLogs,
  getFailedNotifications,
} from "./admin-api";

describe("getExternalApiLogs review data", () => {
  it("provides one hundred records in the selected page size", async () => {
    const firstPage = await getExternalApiLogs(1, 10);
    const largerPage = await getExternalApiLogs(1, 50);
    const finalPage = await getExternalApiLogs(10, 10);

    expect(firstPage).toMatchObject({
      page: 1,
      pageSize: 10,
      totalCount: 100,
    });
    expect(firstPage.items).toHaveLength(10);
    expect(largerPage.items).toHaveLength(50);
    expect(finalPage.items).toHaveLength(10);
    expect(finalPage.items[0]?.externalApiLogId).not.toBe(
      firstPage.items[0]?.externalApiLogId,
    );
  });
});

describe("getFailedNotifications review data", () => {
  it("provides multiple 10-item pages for the failure notification list", async () => {
    const firstPage = await getFailedNotifications(1, 10);
    const finalPage = await getFailedNotifications(3, 10);

    expect(firstPage).toMatchObject({
      page: 1,
      pageSize: 10,
      totalCount: 24,
    });
    expect(firstPage.items).toHaveLength(10);
    expect(finalPage.items).toHaveLength(4);
  });
});

describe("PR-05 admin API adapters", () => {
  it("passes exact list filters and server pagination without client-side expansion", async () => {
    adminApi.listAdminUsers.mockResolvedValueOnce({
      items: [], page: 2, pageSize: 20, totalCount: 21,
    });

    await expect(getAdminUsers({
      query: "member@example.com", status: "SUSPENDED", page: 2, pageSize: 20,
    })).resolves.toMatchObject({ page: 2, pageSize: 20, totalCount: 21 });
    expect(adminApi.listAdminUsers).toHaveBeenCalledWith({
      query: "member@example.com", status: "SUSPENDED", page: "2", pageSize: "20",
    });
  });

  it("requests only the selected user's history page", async () => {
    adminApi.getAdminUserAccessHistory.mockResolvedValueOnce({
      items: [], page: 3, pageSize: 10, totalCount: 25,
    });

    await getAdminUserHistory("user-1", 3, 10);
    expect(adminApi.getAdminUserAccessHistory).toHaveBeenCalledWith("user-1", {
      page: "3", pageSize: "10",
    });
  });

  it("preserves dashboard response fields and maps an API conflict for recovery UI", async () => {
    adminApi.getAdminDashboardSummary.mockResolvedValueOnce({
      generatedAt: "2026-09-24T00:00:00Z", collection: { pendingCount: 2 },
    });
    await expect(getDashboardSummary()).resolves.toMatchObject({
      collection: { pendingCount: 2 },
    });

    adminApi.listAdminUsers.mockRejectedValueOnce(new ApiClientError({
      status: 409, code: "VERSION_CONFLICT", message: "stale version",
    }));
    await expect(getAdminUsers({ page: 1, pageSize: 20 })).rejects.toMatchObject({
      name: "AdminApiError", status: 409,
    } satisfies Partial<AdminApiError>);
  });
});
