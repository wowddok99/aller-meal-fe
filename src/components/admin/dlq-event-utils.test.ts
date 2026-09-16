import { describe, expect, it } from "vitest";
import { filterDeadLetterEvents } from "./dlq-event-utils";

type DeadLetterEvent = Parameters<typeof filterDeadLetterEvents>[0][number];

const events: DeadLetterEvent[] = [
  {
    deadLetterEventId: "dlq-pending",
    messageId: "message-alpha",
    eventType: "ALERT_EMAIL_SEND",
    retryCount: 3,
    status: "PENDING",
    reprocessedByUserId: "",
    reprocessedAt: "",
    createdAt: "2026-07-04T08:55:00+09:00",
    updatedAt: "2026-07-04T08:55:00+09:00",
  },
  {
    deadLetterEventId: "dlq-complete",
    messageId: "message-beta",
    eventType: "ALERT_EMAIL_BAD_ADDRESS",
    retryCount: 1,
    status: "REPROCESSED",
    reprocessedByUserId: "admin@allermeal.io",
    reprocessedAt: "2026-07-04T09:10:00+09:00",
    createdAt: "2026-07-04T08:15:00+09:00",
    updatedAt: "2026-07-04T09:10:00+09:00",
  },
];

describe("filterDeadLetterEvents", () => {
  it("combines status, event type, and message search without mutating the list", () => {
    const filtered = filterDeadLetterEvents(events, {
      status: "PENDING",
      eventType: "ALERT_EMAIL_SEND",
      search: "ALPHA",
    });

    expect(filtered).toEqual([events[0]]);
    expect(events).toHaveLength(2);
  });
});
