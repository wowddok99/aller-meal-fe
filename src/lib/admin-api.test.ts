import { describe, expect, it } from "vitest";
import { getExternalApiLogs } from "./admin-api";

describe("getExternalApiLogs review data", () => {
  it("provides one hundred records in the selected page size", async () => {
    const firstPage = await getExternalApiLogs(1, 10, true);
    const largerPage = await getExternalApiLogs(1, 50, true);
    const finalPage = await getExternalApiLogs(10, 10, true);

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
