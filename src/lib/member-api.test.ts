import { beforeEach, describe, expect, it, vi } from "vitest";
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
import { ApiClientError } from "@/shared/api/api-client-error";
import {
  createChild,
  deleteChild,
  getAllergens,
  getChildAllergens,
  getChild,
  getChildNotificationPreference,
  getChildren,
  getNotificationHistory,
  getSchool,
  MemberApiError,
  searchSchools,
  toChildAllergen,
  toChildNotificationPreference,
  toChildProfile,
  updateChildNotificationPreference,
  updateChild,
  replaceChildAllergens,
} from "./member-api";

vi.mock("@/generated/api/member", () => ({
  createChild: vi.fn(),
  deleteChild: vi.fn(),
  getChildAllergens: vi.fn(),
  getChildNotificationPreference: vi.fn(),
  getChild: vi.fn(),
  listChildren: vi.fn(),
  replaceChildAllergens: vi.fn(),
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

    await expect(getChild("missing-child")).rejects.toMatchObject<MemberApiError>({
      name: "MemberApiError",
      status: 404,
      message: "자녀를 찾을 수 없습니다.",
    });
  });

  it("rejects a mutation response with no child identity", async () => {
    vi.mocked(requestCreateChild).mockResolvedValue({ name: "김민준" });

    await expect(createChild({ name: "김민준", grade: 3, classNumber: 2, schoolId: "school-1" })).rejects.toMatchObject<MemberApiError>({
      status: 0,
      message: "자녀 정보 응답이 올바르지 않습니다.",
    });
  });
});

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
