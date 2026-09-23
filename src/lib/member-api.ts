import type {
  ChildAllergenResponse as GeneratedChildAllergen,
  ChildNotificationPreferenceResponse as GeneratedChildNotificationPreference,
  NotificationHistoryItemResponse as GeneratedNotificationHistoryItem,
  NotificationHistoryResponse as GeneratedNotificationHistory,
} from "@/generated/api/member/models";
import type { ChildProfileResponse as GeneratedChildProfile } from "@/generated/api/member/models/childProfileResponse";
import {
  createChild as requestCreateChild,
  deleteChild as requestDeleteChild,
  getChildAllergens as requestChildAllergens,
  getChildNotificationPreference as requestChildNotificationPreference,
  getChild as requestChild,
  listChildren as requestChildren,
  replaceChildAllergens as requestReplaceChildAllergens,
  updateChildNotificationPreference as requestUpdateChildNotificationPreference,
  updateChild as requestUpdateChild,
} from "@/generated/api/member";
import {
  listAllergens as requestAllergens,
  getPublicSchool as requestSchool,
  searchPublicSchools as requestSchoolSearch,
} from "@/generated/api/public";
import type { AllergenResponse as GeneratedAllergen } from "@/generated/api/public/models";
import type { SchoolResponse as GeneratedSchool } from "@/generated/api/public/models/schoolResponse";
import { toSchoolSearchResult } from "@/components/public/school-search/school-search-adapter";
import { ApiClientError } from "@/shared/api/api-client-error";

export type ChildProfile = { id: string; name: string; grade: number; classNumber: number; schoolId: string; createdAt: string; updatedAt: string };
export type School = { id: string; neisSchoolCode: string; educationOfficeCode: string; name: string; address: string; region: string };
export type SchoolSearchResult = { schools: School[]; page: number; pageSize: number; totalCount: number };
export type CreateChildProfileInput = { name: string; grade: number; classNumber: number; schoolId: string };
export type UpdateChildProfileInput = CreateChildProfileInput;
export type Allergen = { code: number; name: string };
export type ChildAllergen = { childId: string; allergenCodes: number[] };
export type ChildNotificationPreference = { childId: string; emailEnabled: boolean; notificationTime: string; timezone: string; createdAt: string; updatedAt: string };
export type UpdateChildNotificationPreferenceInput = { emailEnabled: boolean; notificationTime: string; timezone: string };
export type PersonalizedMealItem = { name: string; rawText: string; displayOrder: number; labelingStatus: string; riskLevel: string; matchedAllergenCodes: number[] };
export type MealOrigin = { ingredients: string[]; origin: string };
export type PersonalizedMeal = { mealId: string; mealDate: string; mealType: string; sourceReceivedAt: string; labelingStatus: string; nutritionInfo: string; originInfo: string; origins?: MealOrigin[]; riskLevel: string; riskVersion: string; items: PersonalizedMealItem[] };
export type PersonalizedMealQuery = { childId: string; schoolId: string; rangeStart: string; rangeEnd: string; collectionStatus: string; retryAfterSeconds: number; meals: PersonalizedMeal[]; pendingTargets: Array<{ mealDate: string; mealType: string }> };
export type PersonalizedMealMode = "today" | "daily" | "weekly";
export type NotificationHistoryItem = Required<Pick<GeneratedNotificationHistoryItem, "notificationId" | "notificationDate" | "channel" | "reason" | "status" | "attemptCount" | "createdAt" | "updatedAt">> & Pick<GeneratedNotificationHistoryItem, "sentAt" | "failureCode">;
export type NotificationHistory = Required<Pick<GeneratedNotificationHistory, "page" | "pageSize" | "totalCount">> & { notifications: NotificationHistoryItem[] };
export type AccountWithdrawal = { userId: string; withdrawalRequestedAt: string; withdrawalDueAt: string; maskedNotificationCount: number };

export class MemberApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = "MemberApiError"; }
}

const now = "2026-07-13T09:00:00+09:00";
function reviewMeals(childId: string, date: string): PersonalizedMealQuery {
  return {
    childId,
    schoolId: "review-school",
    rangeStart: date,
    rangeEnd: date,
    collectionStatus: "COMPLETED",
    retryAfterSeconds: 0,
    pendingTargets: [],
    meals: [{
      mealId: "review-meal-lunch",
      mealDate: date,
      mealType: "LUNCH",
      sourceReceivedAt: `${date}T11:30:00+09:00`,
      labelingStatus: "LABELED",
      nutritionInfo: "열량: 612 kcal · 단백질: 24.1 g · 칼슘: 238 mg",
      originInfo: "쌀·돼지고기 국내산, 고등어 노르웨이산",
      origins: [{ ingredients: ["쌀", "돼지고기"], origin: "국내산" }, { ingredients: ["고등어"], origin: "노르웨이산" }],
      riskLevel: "RISKY",
      riskVersion: "review",
      items: [
        { name: "현미밥", rawText: "현미밥", displayOrder: 1, labelingStatus: "LABELED", riskLevel: "SAFE", matchedAllergenCodes: [] },
        { name: "된장국", rawText: "두부된장국(5.6)", displayOrder: 2, labelingStatus: "LABELED", riskLevel: "RISKY", matchedAllergenCodes: [5, 6] },
        { name: "고등어구이", rawText: "고등어구이(7)", displayOrder: 3, labelingStatus: "LABELED", riskLevel: "RISKY", matchedAllergenCodes: [7] },
        { name: "배추김치", rawText: "배추김치", displayOrder: 4, labelingStatus: "LABELED", riskLevel: "SAFE", matchedAllergenCodes: [] },
      ],
    }, {
      mealId: "review-meal-dinner",
      mealDate: date,
      mealType: "DINNER",
      sourceReceivedAt: `${date}T16:30:00+09:00`,
      labelingStatus: "LABELED",
      nutritionInfo: "열량: 574 kcal · 단백질: 27.8 g · 칼슘: 194 mg",
      originInfo: "쌀 국내산, 닭고기 국내산",
      origins: [{ ingredients: ["쌀"], origin: "국내산" }, { ingredients: ["닭고기"], origin: "국내산" }],
      riskLevel: "RISKY",
      riskVersion: "review",
      items: [
        { name: "보리밥", rawText: "보리밥", displayOrder: 1, labelingStatus: "LABELED", riskLevel: "SAFE", matchedAllergenCodes: [] },
        { name: "닭볶음탕", rawText: "닭볶음탕(15)", displayOrder: 2, labelingStatus: "LABELED", riskLevel: "RISKY", matchedAllergenCodes: [15] },
        { name: "콩나물무침", rawText: "콩나물무침(5)", displayOrder: 3, labelingStatus: "LABELED", riskLevel: "RISKY", matchedAllergenCodes: [5] },
        { name: "깍두기", rawText: "깍두기", displayOrder: 4, labelingStatus: "LABELED", riskLevel: "SAFE", matchedAllergenCodes: [] },
      ],
    }],
  };
}

function toKstDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(date);
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00+09:00`);
  value.setDate(value.getDate() + days);
  return toKstDate(value);
}

function weekRange(date: string) {
  const value = new Date(`${date}T12:00:00+09:00`);
  const mondayOffset = (value.getDay() + 6) % 7;
  const rangeStart = addDays(date, -mondayOffset);
  return { rangeStart, rangeEnd: addDays(rangeStart, 6) };
}

function reviewWeeklyMeals(childId: string, date: string): PersonalizedMealQuery {
  const { rangeStart, rangeEnd } = weekRange(date);
  const meals = Array.from({ length: 5 }, (_, index) => {
    const mealDate = addDays(rangeStart, index);
    return reviewMeals(childId, mealDate).meals.map((meal) => ({ ...meal, mealId: `${meal.mealId}-${mealDate}` }));
  }).flat();

  return {
    childId,
    schoolId: "review-school",
    rangeStart,
    rangeEnd,
    collectionStatus: "COMPLETED",
    retryAfterSeconds: 0,
    pendingTargets: [],
    meals,
  };
}

function reviewNotifications(page: number, pageSize: number): NotificationHistory {
  const patterns: Array<{ reason: string; status: string; attemptCount: number; sentTime?: string; failureCode?: string }> = [
    { reason: "RISK_DETECTED", status: "SENT", attemptCount: 1, sentTime: "08:30" },
    { reason: "NO_RISK", status: "SENT", attemptCount: 1, sentTime: "06:10" },
    { reason: "RISK_DETECTED", status: "FAILED", attemptCount: 3, sentTime: "17:25", failureCode: "SMTP_TIMEOUT" },
    { reason: "RISK_UNKNOWN", status: "RETRY_PENDING", attemptCount: 2 },
    { reason: "RISK_PENDING", status: "PENDING", attemptCount: 0 },
    { reason: "NO_MEAL", status: "CANCELED", attemptCount: 1 },
    { reason: "RISK_LABELING_FAILED", status: "FAILED", attemptCount: 3, sentTime: "08:32", failureCode: "LABELING_FAILED" },
  ] as const;
  const notifications: NotificationHistoryItem[] = Array.from({ length: 27 }, (_, index) => {
    const pattern = patterns[index % patterns.length];
    const notificationDate = addDays("2026-07-04", -Math.floor(index / 3));
    const createdTime = pattern.sentTime ?? "06:05";
    return {
      notificationId: `review-notification-${index + 1}`,
      notificationDate,
      channel: "EMAIL",
      reason: pattern.reason,
      status: pattern.status,
      attemptCount: pattern.attemptCount,
      ...(pattern.sentTime ? { sentAt: `${notificationDate}T${pattern.sentTime}:00+09:00` } : {}),
      ...(pattern.failureCode ? { failureCode: pattern.failureCode } : {}),
      createdAt: `${notificationDate}T${createdTime}:00+09:00`,
      updatedAt: `${notificationDate}T${createdTime}:00+09:00`,
    };
  });
  const start = (page - 1) * pageSize;
  return { notifications: notifications.slice(start, start + pageSize), page, pageSize, totalCount: notifications.length };
}

function asMemberApiError(error: unknown, fallbackMessage: string): MemberApiError {
  if (error instanceof MemberApiError) return error;
  if (error instanceof ApiClientError) return new MemberApiError(error.status, error.message);
  return new MemberApiError(0, error instanceof Error ? error.message : fallbackMessage);
}

/** Converts an optional OpenAPI response into the UI model only when its identity is usable. */
export function toChildProfile(response: GeneratedChildProfile | null | undefined): ChildProfile | undefined {
  if (!response?.id) return undefined;

  return {
    id: response.id,
    name: response.name ?? "이름 정보 없음",
    grade: response.grade ?? 0,
    classNumber: response.classNumber ?? 0,
    schoolId: response.schoolId ?? "",
    createdAt: response.createdAt ?? "",
    updatedAt: response.updatedAt ?? "",
  };
}

function requiredChild(response: GeneratedChildProfile | null | undefined): ChildProfile {
  const child = toChildProfile(response);
  if (!child) throw new MemberApiError(0, "자녀 정보 응답이 올바르지 않습니다.");
  return child;
}

function toSchool(response: GeneratedSchool | null | undefined): School | undefined {
  if (!response?.id) return undefined;

  return {
    id: response.id,
    name: response.name ?? "학교명 정보 없음",
    address: response.address ?? "주소 정보 없음",
    region: response.region ?? "지역 정보 없음",
    neisSchoolCode: response.neisSchoolCode ?? "정보 없음",
    educationOfficeCode: response.educationOfficeCode ?? "정보 없음",
  };
}

function requiredSchool(response: GeneratedSchool | null | undefined): School {
  const school = toSchool(response);
  if (!school) throw new MemberApiError(0, "학교 정보 응답이 올바르지 않습니다.");
  return school;
}

function toAllergen(response: GeneratedAllergen | null | undefined): Allergen | undefined {
  if (typeof response?.code !== "number" || !response.name) return undefined;
  return { code: response.code, name: response.name };
}

export function toChildAllergen(response: GeneratedChildAllergen | null | undefined): ChildAllergen | undefined {
  if (!response?.childId || !Array.isArray(response.allergenCodes) || !response.allergenCodes.every((code) => typeof code === "number")) return undefined;
  return { childId: response.childId, allergenCodes: response.allergenCodes };
}

function requiredChildAllergen(response: GeneratedChildAllergen | null | undefined): ChildAllergen {
  const allergens = toChildAllergen(response);
  if (!allergens) throw new MemberApiError(0, "자녀 알레르기 설정 응답이 올바르지 않습니다.");
  return allergens;
}

export function toChildNotificationPreference(response: GeneratedChildNotificationPreference | null | undefined): ChildNotificationPreference | undefined {
  if (!response?.childId || typeof response.emailEnabled !== "boolean" || typeof response.notificationTime !== "string" || typeof response.timezone !== "string" || typeof response.createdAt !== "string" || typeof response.updatedAt !== "string") return undefined;
  return {
    childId: response.childId,
    emailEnabled: response.emailEnabled,
    notificationTime: response.notificationTime,
    timezone: response.timezone,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}

function requiredChildNotificationPreference(response: GeneratedChildNotificationPreference | null | undefined): ChildNotificationPreference {
  const preference = toChildNotificationPreference(response);
  if (!preference) throw new MemberApiError(0, "자녀 알림 설정 응답이 올바르지 않습니다.");
  return preference;
}

export async function getChildren(): Promise<ChildProfile[]> {
  try { return (await requestChildren()).map(toChildProfile).filter((child): child is ChildProfile => child !== undefined); }
  catch (error) { throw asMemberApiError(error, "자녀 목록을 불러오지 못했습니다."); }
}
export async function getChild(childId: string): Promise<ChildProfile> {
  try { return requiredChild(await requestChild(childId)); }
  catch (error) { throw asMemberApiError(error, "자녀 정보를 불러오지 못했습니다."); }
}
export async function getSchool(schoolId: string): Promise<School> {
  try { return requiredSchool(await requestSchool(schoolId)); }
  catch (error) { throw asMemberApiError(error, "학교 정보를 불러오지 못했습니다."); }
}
export async function getAllergens(_review = false): Promise<Allergen[]> {
  void _review;
  try { return (await requestAllergens()).map(toAllergen).filter((allergen): allergen is Allergen => allergen !== undefined); }
  catch (error) { throw asMemberApiError(error, "알레르기 목록을 불러오지 못했습니다."); }
}
export async function searchSchools(keyword: string): Promise<SchoolSearchResult> {
  try { return toSchoolSearchResult(await requestSchoolSearch({ keyword, page: 1, pageSize: 20 }), 1, 20); }
  catch (error) { throw asMemberApiError(error, "학교를 검색하지 못했습니다."); }
}
export async function createChild(input: CreateChildProfileInput): Promise<ChildProfile> {
  try { return requiredChild(await requestCreateChild(input)); }
  catch (error) { throw asMemberApiError(error, "자녀를 등록하지 못했습니다."); }
}
export async function updateChild(childId: string, input: UpdateChildProfileInput): Promise<ChildProfile> {
  try { return requiredChild(await requestUpdateChild(childId, input)); }
  catch (error) { throw asMemberApiError(error, "자녀 정보를 수정하지 못했습니다."); }
}
export async function deleteChild(childId: string): Promise<void> {
  try { await requestDeleteChild(childId); }
  catch (error) { throw asMemberApiError(error, "자녀 정보를 삭제하지 못했습니다."); }
}
export async function getChildAllergens(childId: string): Promise<ChildAllergen> {
  try { return requiredChildAllergen(await requestChildAllergens(childId)); }
  catch (error) { throw asMemberApiError(error, "자녀 알레르기 설정을 불러오지 못했습니다."); }
}
export async function replaceChildAllergens(childId: string, allergenCodes: number[]): Promise<ChildAllergen> {
  try { return requiredChildAllergen(await requestReplaceChildAllergens(childId, { allergenCodes })); }
  catch (error) { throw asMemberApiError(error, "자녀 알레르기 설정을 저장하지 못했습니다."); }
}
export async function getChildNotificationPreference(childId: string): Promise<ChildNotificationPreference> {
  try { return requiredChildNotificationPreference(await requestChildNotificationPreference(childId)); }
  catch (error) { throw asMemberApiError(error, "자녀 알림 설정을 불러오지 못했습니다."); }
}
export async function updateChildNotificationPreference(childId: string, input: UpdateChildNotificationPreferenceInput): Promise<ChildNotificationPreference> {
  try { return requiredChildNotificationPreference(await requestUpdateChildNotificationPreference(childId, input)); }
  catch (error) { throw asMemberApiError(error, "자녀 알림 설정을 저장하지 못했습니다."); }
}
export async function getPersonalizedMeals(childId: string, mode: PersonalizedMealMode, date: string): Promise<PersonalizedMealQuery> {
  if (mode === "weekly") return reviewWeeklyMeals(childId, date);
  return reviewMeals(childId, mode === "today" ? toKstDate(new Date()) : date);
}
export async function getNotificationHistory(childId: string, page = 1, pageSize = 20): Promise<NotificationHistory> { void childId; return reviewNotifications(page, pageSize); }
export async function requestAccountWithdrawal(): Promise<AccountWithdrawal> { return { userId: "review-user-001", withdrawalRequestedAt: now, withdrawalDueAt: "2026-08-12T09:00:00+09:00", maskedNotificationCount: 12 }; }
export async function cancelAccountWithdrawal(): Promise<void> {}
