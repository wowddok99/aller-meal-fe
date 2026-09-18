import { describe, expect, it } from "vitest";
import { toPublicMealQuery } from "./school-meals-adapter";

describe("toPublicMealQuery", () => {
  it("maps ready meals into display values while preserving menu order and raw allergen text", () => {
    const result = toPublicMealQuery({
      collectionStatus: "READY",
      rangeStart: "2026-09-18",
      rangeEnd: "2026-09-18",
      meals: [
        {
          mealId: "meal-1",
          mealDate: "2026-09-18",
          mealType: "LUNCH",
          sourceReceivedAt: "2026-09-18T08:30:00Z",
          nutritionInfo: "열량 600 kcal",
          originInfo: "쌀: 국내산",
          items: [
            { name: "김치", rawText: "김치 (9)", displayOrder: 2 },
            { name: "밥", rawText: "밥", displayOrder: 1 },
          ],
        },
      ],
    });

    expect(result).toEqual({
      collectionStatus: "READY",
      retryAfterSeconds: undefined,
      rangeStart: "2026-09-18",
      rangeEnd: "2026-09-18",
      pendingTargets: [],
      meals: [
        {
          id: "meal-1",
          date: "2026-09-18",
          type: "LUNCH",
          typeLabel: "점심",
          sourceReceivedAt: "2026-09-18T08:30:00Z",
          nutritionInfo: "열량 600 kcal",
          originInfo: "쌀: 국내산",
          origins: [],
          items: [
            { name: "밥", rawText: "밥" },
            { name: "김치", rawText: "김치 (9)" },
          ],
        },
      ],
    });
  });

  it("keeps a collecting response distinct from an empty ready response", () => {
    const result = toPublicMealQuery({
      collectionStatus: "COLLECTING",
      retryAfterSeconds: 3,
      pendingTargets: [{ mealDate: "2026-09-18", mealType: "LUNCH" }],
    });

    expect(result.collectionStatus).toBe("COLLECTING");
    expect(result.retryAfterSeconds).toBe(3);
    expect(result.pendingTargets).toEqual([
      { date: "2026-09-18", type: "LUNCH", typeLabel: "점심" },
    ]);
    expect(result.meals).toEqual([]);
  });
});
