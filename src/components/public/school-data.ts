import type { SchoolSearchItem } from "@/components/public/school-search/school-search-adapter";

export type SchoolResponse = SchoolSearchItem;

const recentSchoolsStorageKey = "allermeal:recent-schools";
const maxRecentSchools = 2;

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getRecentSchools(): SchoolResponse[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const storedSchools: unknown = JSON.parse(
      window.localStorage.getItem(recentSchoolsStorageKey) ?? "[]",
    );

    return Array.isArray(storedSchools)
      ? storedSchools.filter(isSchoolResponse).slice(0, maxRecentSchools)
      : [];
  } catch {
    return [];
  }
}

export function saveRecentSchool(school: SchoolResponse) {
  if (!canUseStorage()) {
    return;
  }

  const recentSchools = [
    school,
    ...getRecentSchools().filter((item) => item.id !== school.id),
  ].slice(0, maxRecentSchools);

  try {
    window.localStorage.setItem(
      recentSchoolsStorageKey,
      JSON.stringify(recentSchools),
    );
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function getSchoolById(schoolId: string) {
  return getRecentSchools().find((school) => school.id === schoolId);
}

function isSchoolResponse(value: unknown): value is SchoolResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const school = value as Record<string, unknown>;
  return [
    "id",
    "name",
    "address",
    "region",
    "neisSchoolCode",
    "educationOfficeCode",
  ].every((key) => typeof school[key] === "string");
}
