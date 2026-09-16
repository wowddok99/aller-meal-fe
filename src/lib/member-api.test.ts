import { describe, expect, it } from "vitest";
import { getNotificationHistory } from "./member-api";

describe("getNotificationHistory", () => {
  it("keeps notification records across consecutive pages", async () => {
    const firstPage = await getNotificationHistory("preview", 1, 10);
    const secondPage = await getNotificationHistory("preview", 2, 10);
    const thirdPage = await getNotificationHistory("preview", 3, 10);

    expect(firstPage.totalCount).toBe(27);
    expect(firstPage.notifications).toHaveLength(10);
    expect(secondPage.notifications).toHaveLength(10);
    expect(thirdPage.notifications).toHaveLength(7);
    expect(secondPage.notifications[0]?.notificationId).not.toBe(firstPage.notifications[0]?.notificationId);
  });
});
