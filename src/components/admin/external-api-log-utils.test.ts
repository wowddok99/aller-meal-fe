import { describe, expect, it } from "vitest";
import type { ExternalApiLog } from "@/lib/admin-api";
import { filterExternalApiLogs } from "./external-api-log-utils";

const logs: ExternalApiLog[] = [
  {
    externalApiLogId: "log-success",
    provider: "NEIS",
    operation: "MEAL_FETCH",
    schoolId: "B100000658",
    mealDate: "2026-07-13",
    mealType: "LUNCH",
    method: "GET",
    endpoint: "/hub/mealServiceDietInfo",
    httpStatus: 200,
    outcome: "SUCCESS",
    failureCode: "",
    responseTimeMillis: 248,
    createdAt: "2026-07-13T08:04:00+09:00",
  },
  {
    externalApiLogId: "log-failure",
    provider: "OTHER",
    operation: "WEEKLY_FETCH",
    schoolId: "B100000701",
    mealDate: "2026-07-14",
    mealType: "DINNER",
    method: "POST",
    endpoint: "/hub/weeklyMeals",
    httpStatus: 504,
    outcome: "FAILURE",
    failureCode: "UPSTREAM_TIMEOUT",
    responseTimeMillis: 3000,
    createdAt: "2026-07-13T07:59:00+09:00",
  },
];

describe("filterExternalApiLogs", () => {
  it("combines the current-list filters without changing the source items", () => {
    const filtered = filterExternalApiLogs(logs, {
      provider: "NEIS",
      method: "GET",
      outcome: "SUCCESS",
      search: "B100000658",
    });

    expect(filtered).toEqual([logs[0]]);
    expect(logs).toHaveLength(2);
  });

  it("searches provider, operation, endpoint, and school ID without case sensitivity", () => {
    expect(
      filterExternalApiLogs(logs, {
        provider: "ALL",
        method: "ALL",
        outcome: "ALL",
        search: "weekly_fetch",
      }),
    ).toEqual([logs[1]]);
    expect(
      filterExternalApiLogs(logs, {
        provider: "ALL",
        method: "ALL",
        outcome: "ALL",
        search: "b100000658",
      }),
    ).toEqual([logs[0]]);
  });
});
