import type { PublicMealQueryResponse } from "@/generated/api/public/models/publicMealQueryResponse";
import type { PublicMealResponse } from "@/generated/api/public/models/publicMealResponse";
import type { SchoolResponse } from "@/generated/api/public/models/schoolResponse";

const mealTypeLabels: Record<string, string> = {
  BREAKFAST: "아침",
  LUNCH: "점심",
  DINNER: "저녁",
};

export type PublicSchoolDetail = {
  name: string;
  address: string;
  region: string;
};

export type PublicMealItem = {
  name: string;
  rawText: string;
};

export type PublicMealOrigin = {
  origin: string;
  ingredients: string[];
};

export type PublicMeal = {
  id: string;
  date: string;
  type: string;
  typeLabel: string;
  sourceReceivedAt?: string;
  nutritionInfo?: string;
  originInfo?: string;
  origins: PublicMealOrigin[];
  items: PublicMealItem[];
};

export type PendingMealTarget = {
  date: string;
  type: string;
  typeLabel: string;
};

export type PublicMealQuery = {
  collectionStatus?: string;
  retryAfterSeconds?: number;
  rangeStart?: string;
  rangeEnd?: string;
  meals: PublicMeal[];
  pendingTargets: PendingMealTarget[];
};

function getMealTypeLabel(mealType?: string) {
  return mealType ? (mealTypeLabels[mealType] ?? mealType) : "식사";
}

export function toPublicSchoolDetail(
  school: SchoolResponse,
): PublicSchoolDetail {
  return {
    name: school.name ?? "학교명 정보 없음",
    address: school.address ?? "주소 정보 없음",
    region: school.region ?? "지역 정보 없음",
  };
}

function toPublicMeal(meal: PublicMealResponse, index: number): PublicMeal {
  const type = meal.mealType ?? "UNKNOWN";

  return {
    id: meal.mealId ?? `${meal.mealDate ?? "unknown-date"}-${type}-${index}`,
    date: meal.mealDate ?? "날짜 정보 없음",
    type,
    typeLabel: getMealTypeLabel(meal.mealType),
    sourceReceivedAt: meal.sourceReceivedAt ?? undefined,
    nutritionInfo: meal.nutritionInfo ?? undefined,
    originInfo: meal.originInfo ?? undefined,
    origins: (meal.origins ?? [])
      .filter((origin) => Boolean(origin.origin || origin.ingredients?.length))
      .map((origin) => ({
        origin: origin.origin ?? "원산지 정보 없음",
        ingredients: origin.ingredients ?? [],
      })),
    items: [...(meal.items ?? [])]
      .sort(
        (left, right) =>
          (left.displayOrder ?? Number.MAX_SAFE_INTEGER) -
          (right.displayOrder ?? Number.MAX_SAFE_INTEGER),
      )
      .map((item) => ({
        name: item.name ?? item.rawText ?? "메뉴 정보 없음",
        rawText: item.rawText ?? item.name ?? "메뉴 정보 없음",
      })),
  };
}

export function toPublicMealQuery(
  response: PublicMealQueryResponse,
): PublicMealQuery {
  return {
    collectionStatus: response.collectionStatus ?? undefined,
    retryAfterSeconds: response.retryAfterSeconds ?? undefined,
    rangeStart: response.rangeStart ?? undefined,
    rangeEnd: response.rangeEnd ?? undefined,
    meals: (response.meals ?? []).map(toPublicMeal),
    pendingTargets: (response.pendingTargets ?? []).map((target) => ({
      date: target.mealDate ?? "날짜 정보 없음",
      type: target.mealType ?? "UNKNOWN",
      typeLabel: getMealTypeLabel(target.mealType),
    })),
  };
}
