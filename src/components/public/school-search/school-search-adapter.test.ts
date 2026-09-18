import { describe, expect, it } from "vitest";
import { toSchoolSearchResult } from "./school-search-adapter";

describe("toSchoolSearchResult", () => {
  it("preserves the API pagination metadata with mapped school fields", () => {
    const result = toSchoolSearchResult(
      {
        schools: [
          {
            id: "school-1",
            name: "서울초등학교",
            address: "서울특별시 종로구",
            region: "서울특별시",
            neisSchoolCode: "B100000001",
            educationOfficeCode: "B10",
          },
        ],
        page: 2,
        pageSize: 10,
        totalCount: 42,
      },
      1,
      20,
    );

    expect(result).toEqual({
      schools: [
        {
          id: "school-1",
          name: "서울초등학교",
          address: "서울특별시 종로구",
          region: "서울특별시",
          neisSchoolCode: "B100000001",
          educationOfficeCode: "B10",
        },
      ],
      page: 2,
      pageSize: 10,
      totalCount: 42,
    });
  });

  it("uses requested pagination defaults and excludes rows without an id", () => {
    const result = toSchoolSearchResult(
      {
        schools: [{ id: "school-1" }, { name: "식별자 없는 학교" }],
      },
      3,
      15,
    );

    expect(result).toEqual({
      schools: [
        {
          id: "school-1",
          name: "학교명 정보 없음",
          address: "주소 정보 없음",
          region: "지역 정보 없음",
          neisSchoolCode: "정보 없음",
          educationOfficeCode: "정보 없음",
        },
      ],
      page: 3,
      pageSize: 15,
      totalCount: 1,
    });
  });
});
