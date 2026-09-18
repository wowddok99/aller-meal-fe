import type { SchoolSearchResponse as SchoolSearchDto } from "@/generated/api/public/models/schoolSearchResponse";
import type { SchoolResponse as SchoolDto } from "@/generated/api/public/models/schoolResponse";

export type SchoolSearchItem = {
  id: string;
  name: string;
  address: string;
  region: string;
  neisSchoolCode: string;
  educationOfficeCode: string;
};

export type SchoolSearchResult = {
  schools: SchoolSearchItem[];
  page: number;
  pageSize: number;
  totalCount: number;
};

function toSchoolSearchItem(school: SchoolDto): SchoolSearchItem | undefined {
  if (!school.id) {
    return undefined;
  }

  return {
    id: school.id,
    name: school.name ?? "학교명 정보 없음",
    address: school.address ?? "주소 정보 없음",
    region: school.region ?? "지역 정보 없음",
    neisSchoolCode: school.neisSchoolCode ?? "정보 없음",
    educationOfficeCode: school.educationOfficeCode ?? "정보 없음",
  };
}

export function toSchoolSearchResult(
  response: SchoolSearchDto,
  requestedPage: number,
  requestedPageSize: number,
): SchoolSearchResult {
  const schools = (response.schools ?? [])
    .map(toSchoolSearchItem)
    .filter((school): school is SchoolSearchItem => school !== undefined);

  return {
    schools,
    page: response.page ?? requestedPage,
    pageSize: response.pageSize ?? requestedPageSize,
    totalCount: response.totalCount ?? schools.length,
  };
}
