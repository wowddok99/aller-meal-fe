import type {
  AccountWithdrawalResponse as GeneratedAccountWithdrawal,
  ChildAllergenResponse as GeneratedChildAllergen,
  ChildNotificationPreferenceResponse as GeneratedChildNotificationPreference,
  NotificationHistoryItemResponse as GeneratedNotificationHistoryItem,
  NotificationHistoryResponse as GeneratedNotificationHistory,
  PersonalizedMealQueryResponse as GeneratedPersonalizedMealQuery,
  PersonalizedMealResponse as GeneratedPersonalizedMeal,
} from "@/generated/api/member/models";
import type { ChildProfileResponse as GeneratedChildProfile } from "@/generated/api/member/models/childProfileResponse";
import {
  cancelAccountWithdrawal as requestCancelAccountWithdrawal,
  createChild as requestCreateChild,
  deleteChild as requestDeleteChild,
  getChildAllergens as requestChildAllergens,
  getChildNotificationPreference as requestChildNotificationPreference,
  getChild as requestChild,
  getAccountWithdrawal as requestCurrentAccountWithdrawal,
  getChildNotificationHistory as requestNotificationHistory,
  getPersonalizedDailyMeal as requestPersonalizedDailyMeal,
  getPersonalizedTodayMeal as requestPersonalizedTodayMeal,
  getPersonalizedWeeklyMeals as requestPersonalizedWeeklyMeals,
  listChildren as requestChildren,
  replaceChildAllergens as requestReplaceChildAllergens,
  requestAccountWithdrawal as requestWithdrawal,
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

function toPersonalizedMeal(response: GeneratedPersonalizedMeal): PersonalizedMeal | undefined {
  if (!response.mealId || !response.mealDate || !response.mealType) return undefined;
  const origins = response.origins?.flatMap((origin) =>
    Array.isArray(origin.ingredients) && typeof origin.origin === "string"
      ? [{ ingredients: origin.ingredients.filter((ingredient) => typeof ingredient === "string"), origin: origin.origin }]
      : [],
  );
  return {
    mealId: response.mealId,
    mealDate: response.mealDate,
    mealType: response.mealType,
    sourceReceivedAt: response.sourceReceivedAt ?? "",
    labelingStatus: response.labelingStatus ?? "UNKNOWN",
    nutritionInfo: response.nutritionInfo ?? "",
    originInfo: response.originInfo ?? "",
    ...(origins?.length ? { origins } : {}),
    riskLevel: response.riskLevel ?? "UNKNOWN",
    riskVersion: response.riskVersion ?? "",
    items: (response.items ?? []).flatMap((item) => item.name ? [{
      name: item.name,
      rawText: item.rawText ?? "",
      displayOrder: item.displayOrder ?? 0,
      labelingStatus: item.labelingStatus ?? "UNKNOWN",
      riskLevel: item.riskLevel ?? "UNKNOWN",
      matchedAllergenCodes: (item.matchedAllergenCodes ?? []).filter((code) => typeof code === "number"),
    }] : []),
  };
}

function requiredPersonalizedMealQuery(response: GeneratedPersonalizedMealQuery | null | undefined): PersonalizedMealQuery {
  if (!response?.childId || !response.schoolId || !response.rangeStart || !response.rangeEnd || !response.collectionStatus) {
    throw new MemberApiError(0, "자녀 급식 응답이 올바르지 않습니다.");
  }
  return {
    childId: response.childId,
    schoolId: response.schoolId,
    rangeStart: response.rangeStart,
    rangeEnd: response.rangeEnd,
    collectionStatus: response.collectionStatus,
    retryAfterSeconds: typeof response.retryAfterSeconds === "number" ? response.retryAfterSeconds : 0,
    meals: (response.meals ?? []).flatMap((meal) => {
      const mapped = toPersonalizedMeal(meal);
      return mapped ? [mapped] : [];
    }),
    pendingTargets: (response.pendingTargets ?? []).flatMap((target) =>
      target.mealDate && target.mealType ? [{ mealDate: target.mealDate, mealType: target.mealType }] : [],
    ),
  };
}

function requiredNotificationHistory(response: GeneratedNotificationHistory | null | undefined): NotificationHistory {
  if (!response || typeof response.page !== "number" || typeof response.pageSize !== "number" || typeof response.totalCount !== "number") {
    throw new MemberApiError(0, "알림 이력 응답이 올바르지 않습니다.");
  }
  return {
    page: response.page,
    pageSize: response.pageSize,
    totalCount: response.totalCount,
    notifications: (response.notifications ?? []).flatMap((item) =>
      item.notificationId && item.notificationDate && item.channel && item.reason && item.status && typeof item.attemptCount === "number" && item.createdAt && item.updatedAt
        ? [{ notificationId: item.notificationId, notificationDate: item.notificationDate, channel: item.channel, reason: item.reason, status: item.status, attemptCount: item.attemptCount, createdAt: item.createdAt, updatedAt: item.updatedAt, ...(item.sentAt ? { sentAt: item.sentAt } : {}), ...(item.failureCode ? { failureCode: item.failureCode } : {}) }]
        : [],
    ),
  };
}

/** Accepts a withdrawal result only when every server-provided status field is usable. */
export function toAccountWithdrawal(response: GeneratedAccountWithdrawal | null | undefined): AccountWithdrawal | undefined {
  if (!response?.userId || !response.withdrawalRequestedAt || !response.withdrawalDueAt || typeof response.maskedNotificationCount !== "number") {
    return undefined;
  }

  return {
    userId: response.userId,
    withdrawalRequestedAt: response.withdrawalRequestedAt,
    withdrawalDueAt: response.withdrawalDueAt,
    maskedNotificationCount: response.maskedNotificationCount,
  };
}

function requiredAccountWithdrawal(response: GeneratedAccountWithdrawal | null | undefined): AccountWithdrawal {
  const withdrawal = toAccountWithdrawal(response);
  if (!withdrawal) throw new MemberApiError(0, "회원 탈퇴 응답이 올바르지 않습니다.");
  return withdrawal;
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
export async function getAllergens(): Promise<Allergen[]> {
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
  try {
    const response = mode === "today"
      ? await requestPersonalizedTodayMeal(childId)
      : mode === "daily"
        ? await requestPersonalizedDailyMeal(childId, date)
        : await requestPersonalizedWeeklyMeals(childId, { date });
    return requiredPersonalizedMealQuery(response);
  } catch (error) { throw asMemberApiError(error, "자녀 급식을 불러오지 못했습니다."); }
}
export async function getNotificationHistory(childId: string, page = 1, pageSize = 20): Promise<NotificationHistory> {
  try { return requiredNotificationHistory(await requestNotificationHistory(childId, { page, pageSize })); }
  catch (error) { throw asMemberApiError(error, "알림 이력을 불러오지 못했습니다."); }
}
export async function requestAccountWithdrawal(): Promise<AccountWithdrawal> {
  try { return requiredAccountWithdrawal(await requestWithdrawal()); }
  catch (error) { throw asMemberApiError(error, "회원 탈퇴를 예약하지 못했습니다."); }
}
export async function getAccountWithdrawal(): Promise<AccountWithdrawal | null> {
  try {
    const response = await requestCurrentAccountWithdrawal();
    if (!response) return null;
    const withdrawal = toAccountWithdrawal(response);
    if (!withdrawal) {
      throw new MemberApiError(0, "회원 탈퇴 상태 응답이 올바르지 않습니다.");
    }
    return withdrawal;
  } catch (error) { throw asMemberApiError(error, "회원 탈퇴 상태를 불러오지 못했습니다."); }
}
export async function cancelAccountWithdrawal(): Promise<void> {
  try { await requestCancelAccountWithdrawal(); }
  catch (error) { throw asMemberApiError(error, "회원 탈퇴 예약을 취소하지 못했습니다."); }
}
