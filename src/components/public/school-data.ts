export type SchoolResponse = {
  id: number;
  name: string;
  address: string;
  region: string;
  neisSchoolCode: string;
  educationOfficeCode: string;
};

export type SchoolSearchResponse = {
  schools: SchoolResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export const schoolSearchResponse: SchoolSearchResponse = {
  page: 1,
  pageSize: 3,
  totalCount: 24,
  schools: [
    {
      id: 1,
      name: "서울하늘초등학교",
      address: "서울특별시 마포구 월드컵북로 00",
      region: "서울",
      neisSchoolCode: "B100000001",
      educationOfficeCode: "B10",
    },
    {
      id: 2,
      name: "서울푸른중학교",
      address: "서울특별시 성동구 왕십리로 00",
      region: "서울",
      neisSchoolCode: "B100000002",
      educationOfficeCode: "B10",
    },
    {
      id: 3,
      name: "경기별빛고등학교",
      address: "경기도 성남시 분당구 판교로 00",
      region: "경기",
      neisSchoolCode: "J100000003",
      educationOfficeCode: "J10",
    },
  ],
};

export function getSchoolById(schoolId: string) {
  return schoolSearchResponse.schools.find(
    (school) => String(school.id) === schoolId,
  );
}
