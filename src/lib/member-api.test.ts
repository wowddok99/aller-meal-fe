import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createChild as requestCreateChild,
  cancelAccountWithdrawal as requestCancelAccountWithdrawal,
  deleteChild as requestDeleteChild,
  getChildAllergens as requestChildAllergens,
  getChildNotificationHistory as requestNotificationHistory,
  getChildNotificationPreference as requestChildNotificationPreference,
  getChild as requestChild,
  getAccountWithdrawal as requestCurrentAccountWithdrawal,
  getPersonalizedDailyMeal as requestPersonalizedDailyMeal,
  getPersonalizedTodayMeal as requestPersonalizedTodayMeal,
  getPersonalizedWeeklyMeals as requestPersonalizedWeeklyMeals,
  listChildren as requestChildren,
  replaceChildAllergens as requestReplaceChildAllergens,
  requestAccountWithdrawal as requestAccountWithdrawal,
  updateChildNotificationPreference as requestUpdateChildNotificationPreference,
  updateChild as requestUpdateChild,
} from "@/generated/api/member";
import {
  listAllergens as requestAllergens,
  getPublicSchool as requestSchool,
  searchPublicSchools as requestSchoolSearch,
} from "@/generated/api/public";
import { ApiClientError } from "@/shared/api/api-client-error";
import {
  createChild,
  cancelAccountWithdrawal as cancelWithdrawal,
  deleteChild,
  getAllergens,
  getChildAllergens,
  getChild,
  getPersonalizedMeals,
  getChildNotificationPreference,
  getChildren,
  getNotificationHistory,
  getSchool,
  searchSchools,
  toChildAllergen,
  toChildNotificationPreference,
  toChildProfile,
  updateChildNotificationPreference,
  updateChild,
  replaceChildAllergens,
  requestAccountWithdrawal as createWithdrawal,
  getAccountWithdrawal as getWithdrawalStatus,
  toAccountWithdrawal,
} from "./member-api";

vi.mock("@/generated/api/member", () => ({
  cancelAccountWithdrawal: vi.fn(),
  createChild: vi.fn(),
  deleteChild: vi.fn(),
  getChildAllergens: vi.fn(),
  getChildNotificationHistory: vi.fn(),
  getChildNotificationPreference: vi.fn(),
  getChild: vi.fn(),
  getAccountWithdrawal: vi.fn(),
  getPersonalizedDailyMeal: vi.fn(),
  getPersonalizedTodayMeal: vi.fn(),
  getPersonalizedWeeklyMeals: vi.fn(),
  listChildren: vi.fn(),
  replaceChildAllergens: vi.fn(),
  requestAccountWithdrawal: vi.fn(),
  updateChildNotificationPreference: vi.fn(),
  updateChild: vi.fn(),
}));

vi.mock("@/generated/api/public", () => ({
  listAllergens: vi.fn(),
  getPublicSchool: vi.fn(),
  searchPublicSchools: vi.fn(),
}));

const child = {
  id: "child-1",
  name: "김민준",
  grade: 3,
  classNumber: 2,
  schoolId: "school-1",
  createdAt: "2026-09-20T09:00:00+09:00",
  updatedAt: "2026-09-20T09:00:00+09:00",
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("child profile mapper", () => {
  it("ignores null and identity-less responses", () => {
    expect(toChildProfile(null)).toBeUndefined();
    expect(toChildProfile({ name: "김민준" })).toBeUndefined();
  });

  it("maps a complete OpenAPI response to the display model", () => {
    expect(toChildProfile(child)).toEqual(child);
  });
});

describe("child settings mappers", () => {
  it("ignores null and identity-less allergen and notification responses", () => {
    expect(toChildAllergen(null)).toBeUndefined();
    expect(toChildAllergen({ allergenCodes: [1] })).toBeUndefined();
    expect(toChildNotificationPreference(null)).toBeUndefined();
    expect(toChildNotificationPreference({ emailEnabled: true })).toBeUndefined();
  });

  it("preserves server allergen codes and notification time/timezone strings", () => {
    expect(toChildAllergen({ childId: "child-1", allergenCodes: [7, 1] })).toEqual({
      childId: "child-1",
      allergenCodes: [7, 1],
    });
    expect(toChildNotificationPreference({
      childId: "child-1",
      emailEnabled: true,
      notificationTime: "08:30:00",
      timezone: "Asia/Seoul",
      createdAt: "2026-09-20T09:00:00+09:00",
      updatedAt: "2026-09-20T10:00:00+09:00",
    })).toEqual({
      childId: "child-1",
      emailEnabled: true,
      notificationTime: "08:30:00",
      timezone: "Asia/Seoul",
      createdAt: "2026-09-20T09:00:00+09:00",
      updatedAt: "2026-09-20T10:00:00+09:00",
    });
  });
});

describe("child settings adapter", () => {
  it("maps public allergens and replaces child settings from server responses", async () => {
    vi.mocked(requestAllergens).mockResolvedValue([{ code: 1, name: "난류" }, { code: 7, name: "고등어" }]);
    vi.mocked(requestChildAllergens).mockResolvedValue({ childId: "child-1", allergenCodes: [7] });
    vi.mocked(requestReplaceChildAllergens).mockResolvedValue({ childId: "child-1", allergenCodes: [1, 7] });
    vi.mocked(requestChildNotificationPreference).mockResolvedValue({ childId: "child-1", emailEnabled: true, notificationTime: "08:30:00", timezone: "Asia/Seoul", createdAt: "2026-09-20T09:00:00+09:00", updatedAt: "2026-09-20T09:00:00+09:00" });
    vi.mocked(requestUpdateChildNotificationPreference).mockResolvedValue({ childId: "child-1", emailEnabled: false, notificationTime: "07:45:00", timezone: "Asia/Seoul", createdAt: "2026-09-20T09:00:00+09:00", updatedAt: "2026-09-20T11:00:00+09:00" });

    await expect(getAllergens()).resolves.toEqual([{ code: 1, name: "난류" }, { code: 7, name: "고등어" }]);
    await expect(getChildAllergens("child-1")).resolves.toEqual({ childId: "child-1", allergenCodes: [7] });
    await expect(replaceChildAllergens("child-1", [1, 7])).resolves.toEqual({ childId: "child-1", allergenCodes: [1, 7] });
    await expect(getChildNotificationPreference("child-1")).resolves.toMatchObject({ notificationTime: "08:30:00", timezone: "Asia/Seoul" });
    await expect(updateChildNotificationPreference("child-1", { emailEnabled: false, notificationTime: "07:45:00", timezone: "Asia/Seoul" })).resolves.toMatchObject({ notificationTime: "07:45:00", timezone: "Asia/Seoul" });

    expect(requestReplaceChildAllergens).toHaveBeenCalledWith("child-1", { allergenCodes: [1, 7] });
    expect(requestUpdateChildNotificationPreference).toHaveBeenCalledWith("child-1", { emailEnabled: false, notificationTime: "07:45:00", timezone: "Asia/Seoul" });
  });

  it("preserves settings API failures as status-aware member errors", async () => {
    vi.mocked(requestChildAllergens).mockRejectedValue(new ApiClientError({ status: 422, code: "INVALID_ALLERGEN", message: "알레르기 코드가 유효하지 않습니다." }));

    await expect(getChildAllergens("child-1")).rejects.toMatchObject({
      status: 422,
      message: "알레르기 코드가 유효하지 않습니다.",
    });
  });
});

describe("child CRUD adapter", () => {
  it("maps list, detail, school search, create, update, and delete responses", async () => {
    vi.mocked(requestChildren).mockResolvedValue([child, { name: "invalid child" }]);
    vi.mocked(requestChild).mockResolvedValue(child);
    vi.mocked(requestSchool).mockResolvedValue({ id: "school-1", name: "서울가람초등학교", address: "서울", region: "서울", neisSchoolCode: "B100", educationOfficeCode: "B10" });
    vi.mocked(requestSchoolSearch).mockResolvedValue({ schools: [{ id: "school-1", name: "서울가람초등학교" }], page: 1, pageSize: 20, totalCount: 1 });
    vi.mocked(requestCreateChild).mockResolvedValue(child);
    vi.mocked(requestUpdateChild).mockResolvedValue({ ...child, name: "김민지" });
    vi.mocked(requestDeleteChild).mockResolvedValue(undefined);

    expect(await getChildren()).toEqual([child]);
    await expect(getChild(child.id)).resolves.toEqual(child);
    await expect(getSchool(child.schoolId)).resolves.toMatchObject({ id: "school-1", name: "서울가람초등학교" });
    await expect(searchSchools("가람")).resolves.toMatchObject({ totalCount: 1, schools: [{ id: "school-1", name: "서울가람초등학교" }] });
    await expect(createChild({ name: child.name, grade: child.grade, classNumber: child.classNumber, schoolId: child.schoolId })).resolves.toEqual(child);
    await expect(updateChild(child.id, { name: "김민지", grade: 3, classNumber: 2, schoolId: "school-1" })).resolves.toMatchObject({ name: "김민지" });
    await expect(deleteChild(child.id)).resolves.toBeUndefined();

    expect(requestCreateChild).toHaveBeenCalledWith({ name: child.name, grade: child.grade, classNumber: child.classNumber, schoolId: child.schoolId });
    expect(requestUpdateChild).toHaveBeenCalledWith(child.id, { name: "김민지", grade: 3, classNumber: 2, schoolId: "school-1" });
    expect(requestDeleteChild).toHaveBeenCalledWith(child.id);
  });

  it("preserves API failures as status-aware member errors", async () => {
    vi.mocked(requestChild).mockRejectedValue(new ApiClientError({ status: 404, code: "CHILD_NOT_FOUND", message: "자녀를 찾을 수 없습니다." }));

    await expect(getChild("missing-child")).rejects.toMatchObject({
      name: "MemberApiError",
      status: 404,
      message: "자녀를 찾을 수 없습니다.",
    });
  });

  it("rejects a mutation response with no child identity", async () => {
    vi.mocked(requestCreateChild).mockResolvedValue({ name: "김민준" });

    await expect(createChild({ name: "김민준", grade: 3, classNumber: 2, schoolId: "school-1" })).rejects.toMatchObject({
      status: 0,
      message: "자녀 정보 응답이 올바르지 않습니다.",
    });
  });
});

describe("personalized meals and notification history adapters", () => {
  it("uses each personalized meal endpoint and preserves collecting and empty responses", async () => {
    const collecting = { childId: "child-1", schoolId: "school-1", rangeStart: "2026-09-23", rangeEnd: "2026-09-23", collectionStatus: "COLLECTING", retryAfterSeconds: 3, meals: [], pendingTargets: [{ mealDate: "2026-09-23", mealType: "LUNCH" }] };
    const completed = { ...collecting, collectionStatus: "COMPLETED", retryAfterSeconds: 0, pendingTargets: [] };
    vi.mocked(requestPersonalizedTodayMeal).mockResolvedValue(collecting);
    vi.mocked(requestPersonalizedDailyMeal).mockResolvedValue(completed);
    vi.mocked(requestPersonalizedWeeklyMeals).mockResolvedValue({ ...completed, rangeEnd: "2026-09-27" });

    await expect(getPersonalizedMeals("child-1", "today", "2026-09-23")).resolves.toMatchObject({ collectionStatus: "COLLECTING", retryAfterSeconds: 3, meals: [] });
    await expect(getPersonalizedMeals("child-1", "daily", "2026-09-22")).resolves.toMatchObject({ rangeStart: "2026-09-23", collectionStatus: "COMPLETED", meals: [] });
    await expect(getPersonalizedMeals("child-1", "weekly", "2026-09-22")).resolves.toMatchObject({ rangeEnd: "2026-09-27", collectionStatus: "COMPLETED" });

    expect(requestPersonalizedTodayMeal).toHaveBeenCalledWith("child-1");
    expect(requestPersonalizedDailyMeal).toHaveBeenCalledWith("child-1", "2026-09-22");
    expect(requestPersonalizedWeeklyMeals).toHaveBeenCalledWith("child-1", { date: "2026-09-22" });
  });

  it("uses server notification pagination and preserves its empty result", async () => {
    vi.mocked(requestNotificationHistory).mockResolvedValue({ notifications: [], page: 2, pageSize: 10, totalCount: 0 });

    await expect(getNotificationHistory("child-1", 2, 10)).resolves.toEqual({ notifications: [], page: 2, pageSize: 10, totalCount: 0 });
    expect(requestNotificationHistory).toHaveBeenCalledWith("child-1", { page: 2, pageSize: 10 });
  });

  it("preserves meal and notification authorization failures", async () => {
    vi.mocked(requestPersonalizedTodayMeal).mockRejectedValue(new ApiClientError({ status: 403, code: "FORBIDDEN", message: "접근 권한이 없습니다." }));
    vi.mocked(requestNotificationHistory).mockRejectedValue(new ApiClientError({ status: 404, code: "CHILD_NOT_FOUND", message: "자녀를 찾을 수 없습니다." }));

    await expect(getPersonalizedMeals("child-1", "today", "2026-09-23")).rejects.toMatchObject({ status: 403, message: "접근 권한이 없습니다." });
    await expect(getNotificationHistory("child-1")).rejects.toMatchObject({ status: 404, message: "자녀를 찾을 수 없습니다." });
  });
});

describe("account withdrawal adapter", () => {
  const withdrawal = {
    userId: "user-1",
    withdrawalRequestedAt: "2026-09-23T09:00:00+09:00",
    withdrawalDueAt: "2026-10-23T09:00:00+09:00",
    maskedNotificationCount: 3,
  };

  it("maps the actual withdrawal response and sends the cancel request", async () => {
    vi.mocked(requestAccountWithdrawal).mockResolvedValue(withdrawal);
    vi.mocked(requestCancelAccountWithdrawal).mockResolvedValue(undefined);

    await expect(createWithdrawal()).resolves.toEqual(withdrawal);
    await expect(cancelWithdrawal()).resolves.toBeUndefined();
  });

  it("maps the current withdrawal response and normalizes a 204 response to null", async () => {
    vi.mocked(requestCurrentAccountWithdrawal).mockResolvedValueOnce(withdrawal);
    vi.mocked(requestCurrentAccountWithdrawal).mockResolvedValueOnce(undefined);

    await expect(getWithdrawalStatus()).resolves.toEqual(withdrawal);
    await expect(getWithdrawalStatus()).resolves.toBeNull();
  });

  it("rejects an incomplete current withdrawal response", async () => {
    vi.mocked(requestCurrentAccountWithdrawal).mockResolvedValue({ userId: "user-1" });

    await expect(getWithdrawalStatus()).rejects.toMatchObject({
      status: 0,
      message: "회원 탈퇴 상태 응답이 올바르지 않습니다.",
    });
  });

  it("rejects incomplete withdrawal responses and preserves request-state errors", async () => {
    expect(toAccountWithdrawal({ userId: "user-1" })).toBeUndefined();
    vi.mocked(requestAccountWithdrawal).mockRejectedValue(new ApiClientError({ status: 409, code: "WITHDRAWAL_ALREADY_REQUESTED", message: "이미 탈퇴가 예약되어 있습니다." }));
    vi.mocked(requestCancelAccountWithdrawal).mockRejectedValue(new ApiClientError({ status: 409, code: "WITHDRAWAL_NOT_REQUESTED", message: "예약된 탈퇴가 없습니다." }));

    await expect(createWithdrawal()).rejects.toMatchObject({ status: 409, message: "이미 탈퇴가 예약되어 있습니다." });
    await expect(cancelWithdrawal()).rejects.toMatchObject({ status: 409, message: "예약된 탈퇴가 없습니다." });
  });
});
