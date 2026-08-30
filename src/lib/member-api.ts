export type ChildProfile = { id: string; name: string; grade: number; classNumber: number; schoolId: string; createdAt: string; updatedAt: string };
export type School = { id: string; neisSchoolCode: string; educationOfficeCode: string; name: string; address: string; region: string };
export type SchoolSearchResult = { schools: School[]; page: number; pageSize: number; totalCount: number };
export type CreateChildProfileInput = { name: string; grade: number; classNumber: number; schoolId: string };
export type UpdateChildProfileInput = CreateChildProfileInput;
export type Allergen = { code: number; name: string };
export type ChildAllergen = { childId: string; allergenCodes: number[] };
export type ChildNotificationPreference = { childId: string; emailEnabled: boolean; notificationTime: string; timezone: string; createdAt: string; updatedAt: string };
export type UpdateChildNotificationPreferenceInput = { emailEnabled: boolean; notificationTime: string; timezone: "Asia/Seoul" };
export type PersonalizedMealItem = { name: string; rawText: string; displayOrder: number; labelingStatus: string; riskLevel: string; matchedAllergenCodes: number[] };
export type MealOrigin = { ingredients: string[]; origin: string };
export type PersonalizedMeal = { mealId: string; mealDate: string; mealType: string; sourceReceivedAt: string; labelingStatus: string; nutritionInfo: string; originInfo: string; origins?: MealOrigin[]; riskLevel: string; riskVersion: string; items: PersonalizedMealItem[] };
export type PersonalizedMealQuery = { childId: string; schoolId: string; rangeStart: string; rangeEnd: string; collectionStatus: string; retryAfterSeconds: number; meals: PersonalizedMeal[]; pendingTargets: Array<{ mealDate: string; mealType: string }> };
export type PersonalizedMealMode = "today" | "daily" | "weekly";
export type NotificationHistoryItem = { notificationId: string; notificationDate: string; channel: string; reason: string; status: string; attemptCount: number; sentAt: string | null; failureCode: string | null; createdAt: string; updatedAt: string };
export type NotificationHistory = { notifications: NotificationHistoryItem[]; page: number; pageSize: number; totalCount: number };
export type AccountWithdrawal = { userId: string; withdrawalRequestedAt: string; withdrawalDueAt: string; maskedNotificationCount: number };

export class MemberApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = "MemberApiError"; }
}

export const REVIEW_CHILD_ID = "preview";
const now = "2026-07-13T09:00:00+09:00";
const reviewChildren: ChildProfile[] = [
  { id: REVIEW_CHILD_ID, name: "김민준", grade: 3, classNumber: 2, schoolId: "preview-school", createdAt: "2026-03-02T09:00:00+09:00", updatedAt: now },
  { id: "preview-child-2", name: "이서준", grade: 1, classNumber: 4, schoolId: "preview-school", createdAt: "2026-04-14T09:00:00+09:00", updatedAt: now },
  { id: "preview-child-3", name: "박하은", grade: 5, classNumber: 1, schoolId: "preview-school", createdAt: "2026-05-20T09:00:00+09:00", updatedAt: now },
];
const reviewChild = reviewChildren[0];
const reviewSchool: School = { id: "preview-school", neisSchoolCode: "B100000658", educationOfficeCode: "B10", name: "서울가람초등학교", address: "서울특별시 마포구 월드컵북로 123", region: "서울" };
const reviewAllergens: Allergen[] = ["난류", "우유", "메밀", "땅콩", "대두", "밀", "고등어", "게", "새우", "돼지고기", "복숭아", "토마토", "아황산류", "호두", "닭고기", "쇠고기", "오징어", "조개류", "잣"].map((name, index) => ({ code: index + 1, name }));

function childFor(id: string): ChildProfile { return { ...(reviewChildren.find((child) => child.id === id) ?? reviewChild) }; }

function reviewMeals(childId: string, date: string): PersonalizedMealQuery {
  return {
    childId,
    schoolId: reviewSchool.id,
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
    schoolId: reviewSchool.id,
    rangeStart,
    rangeEnd,
    collectionStatus: "COMPLETED",
    retryAfterSeconds: 0,
    pendingTargets: [],
    meals,
  };
}

function reviewNotifications(page: number, pageSize: number): NotificationHistory {
  const notifications: NotificationHistoryItem[] = [
    { notificationId: "review-notification-1", notificationDate: "2026-07-04", channel: "EMAIL", reason: "RISK_DETECTED", status: "SENT", attemptCount: 1, sentAt: "2026-07-04T08:30:00+09:00", failureCode: null, createdAt: "2026-07-04T08:30:00+09:00", updatedAt: "2026-07-04T08:30:00+09:00" },
    { notificationId: "review-notification-2", notificationDate: "2026-07-03", channel: "EMAIL", reason: "RISK_UNKNOWN", status: "RETRY_PENDING", attemptCount: 2, sentAt: null, failureCode: null, createdAt: "2026-07-03T06:05:00+09:00", updatedAt: "2026-07-03T06:05:00+09:00" },
    { notificationId: "review-notification-3", notificationDate: "2026-07-02", channel: "EMAIL", reason: "RISK_DETECTED", status: "FAILED", attemptCount: 3, sentAt: "2026-07-02T17:25:00+09:00", failureCode: "SMTP_TIMEOUT", createdAt: "2026-07-02T17:20:00+09:00", updatedAt: "2026-07-02T17:25:00+09:00" },
  ];
  const start = (page - 1) * pageSize;
  return { notifications: notifications.slice(start, start + pageSize), page, pageSize, totalCount: notifications.length };
}

export async function getChildren(): Promise<ChildProfile[]> { return reviewChildren.map((child) => ({ ...child })); }
export async function getChild(childId: string): Promise<ChildProfile> { return childFor(childId); }
export async function getSchool(schoolId: string): Promise<School> { return { ...reviewSchool, id: schoolId || reviewSchool.id }; }
export async function getAllergens(review = false): Promise<Allergen[]> { void review; return reviewAllergens; }
export async function searchSchools(keyword: string): Promise<SchoolSearchResult> { const schools = keyword.trim() ? [reviewSchool] : []; return { schools, page: 1, pageSize: 20, totalCount: schools.length }; }
export async function createChild(input: CreateChildProfileInput): Promise<ChildProfile> { return { ...childFor("review-child-new"), ...input, createdAt: now, updatedAt: now }; }
export async function updateChild(childId: string, input: UpdateChildProfileInput): Promise<ChildProfile> { return { ...childFor(childId), ...input, updatedAt: new Date().toISOString() }; }
export async function deleteChild(childId: string): Promise<void> { void childId; }
export async function replaceChildAllergens(childId: string, allergenCodes: number[]): Promise<ChildAllergen> { return { childId, allergenCodes }; }
export async function getChildNotificationPreference(childId: string): Promise<ChildNotificationPreference> { return { childId, emailEnabled: true, notificationTime: "08:30:00", timezone: "Asia/Seoul", createdAt: "2026-03-02T09:00:00+09:00", updatedAt: now }; }
export async function updateChildNotificationPreference(childId: string, input: UpdateChildNotificationPreferenceInput): Promise<ChildNotificationPreference> { return { childId, ...input, notificationTime: `${input.notificationTime}:00`, createdAt: "2026-03-02T09:00:00+09:00", updatedAt: new Date().toISOString() }; }
export async function getPersonalizedMeals(childId: string, mode: PersonalizedMealMode, date: string): Promise<PersonalizedMealQuery> {
  if (mode === "weekly") return reviewWeeklyMeals(childId, date);
  return reviewMeals(childId, mode === "today" ? toKstDate(new Date()) : date);
}
export async function getNotificationHistory(childId: string, page = 1, pageSize = 20): Promise<NotificationHistory> { void childId; return reviewNotifications(page, pageSize); }
export async function requestAccountWithdrawal(): Promise<AccountWithdrawal> { return { userId: "review-user-001", withdrawalRequestedAt: now, withdrawalDueAt: "2026-08-12T09:00:00+09:00", maskedNotificationCount: 12 }; }
export async function cancelAccountWithdrawal(): Promise<void> {}
export async function logout(): Promise<void> {}
