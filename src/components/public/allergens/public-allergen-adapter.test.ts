import { describe, expect, it } from "vitest";
import { toPublicAllergens } from "./public-allergen-adapter";

describe("toPublicAllergens", () => {
  it("maps valid API allergens into sorted display values", () => {
    expect(
      toPublicAllergens([
        { code: 18, name: "조개류(굴, 전복, 홍합 포함)" },
        { code: 1, name: "난류" },
      ]),
    ).toEqual([
      { code: 1, name: "난류" },
      { code: 18, name: "조개류(굴, 전복, 홍합 포함)" },
    ]);
  });

  it("omits an API entry without a numeric code and supplies a readable name", () => {
    expect(
      toPublicAllergens([
        { code: undefined, name: "코드 없음" },
        { code: 2, name: undefined },
      ]),
    ).toEqual([{ code: 2, name: "알레르기 정보 없음" }]);
  });
});
