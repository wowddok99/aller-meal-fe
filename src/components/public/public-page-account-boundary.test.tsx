import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  account: {} as unknown,
  query: vi.fn(() => { throw new Error("A gated page must not mount its data hooks."); }),
}));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useContext: () => state.account,
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/schools", useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/components/app-header", () => ({ AppHeader: () => <header>service shell</header> }));
vi.mock("@/generated/api/public", () => ({
  useSearchPublicSchools: state.query,
  useListAllergens: state.query,
  useGetPublicSchool: state.query,
  useGetPublicDailyMeal: state.query,
  useGetPublicWeeklyMeals: state.query,
}));

import { PublicSchoolSearchPage } from "./school-search/public-school-search-page";
import { PublicSchoolMealsPage } from "./school-meals/public-school-meals-page";
import { PublicAllergenGuidePage } from "./allergens/public-allergen-guide-page";

beforeEach(() => vi.clearAllMocks());

describe.each([
  ["school search", () => <PublicSchoolSearchPage />],
  ["school meals", () => <PublicSchoolMealsPage schoolId="school-1" />],
  ["allergen guide", () => <PublicAllergenGuidePage />],
] as const)("public %s mount boundary", (_, page) => {
  it.each(["checking", "pending"])("keeps the shell and does not start page queries while %s", (mode) => {
    state.account = {
      isAuthenticated: true,
      sessionChecking: mode === "checking",
      profileLoading: mode === "checking",
      access: mode === "pending" ? { userStatus: "WITHDRAWAL_PENDING", role: "MEMBER" } : undefined,
    };
    const html = renderToStaticMarkup(page());
    expect(html).toContain("service shell");
    expect(html).toContain(mode === "checking" ? "계정 상태를 확인하고 있습니다." : "탈퇴 예약 화면으로 이동하고 있습니다.");
    expect(state.query).not.toHaveBeenCalled();
  });
});
