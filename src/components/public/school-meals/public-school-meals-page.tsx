import { CalendarDays, ChevronLeft, MapPin, School } from "lucide-react";
import Link from "next/link";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { getSchoolById, schoolSearchResponse } from "@/components/public/school-data";

type PublicSchoolMealsPageProps = {
  schoolId: string;
};

const fallbackSchool = schoolSearchResponse.schools[0];

export function PublicSchoolMealsPage({ schoolId }: PublicSchoolMealsPageProps) {
  const school = getSchoolById(schoolId) ?? fallbackSchool;

  return (
    <PublicPageShell>
      <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
        <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">
          선택한 학교의 급식 정보를 확인하세요.
        </p>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex items-center gap-2 text-sm font-extrabold text-mint-600 dark:text-mint-400">
                <School className="h-5 w-5" strokeWidth={2} />
                학교 정보
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <h1 className="min-w-0 text-3xl font-extrabold tracking-[-0.03em]">
                  {school.name}
                </h1>
                <span className="inline-flex h-7 items-center rounded-full border border-zinc-300 px-3 text-sm font-bold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
                  {school.region}
                </span>
              </div>
              <p className="flex items-center gap-2 text-base font-semibold text-zinc-500 dark:text-zinc-400">
                <MapPin className="h-4 w-4 shrink-0" strokeWidth={2} />
                {school.address}
              </p>
            </div>

            <Link
              href="/schools"
              className="inline-flex h-10 items-center gap-1.5 self-start rounded-[10px] px-2 text-sm font-bold text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
            >
              학교 다시 검색
              <ChevronLeft className="h-4 w-4 rotate-180" strokeWidth={2.2} />
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-7">
          <div className="mb-5 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-zinc-700 dark:text-zinc-200" strokeWidth={2} />
            <h2 className="text-xl font-extrabold tracking-[-0.02em]">급식 조회</h2>
          </div>

          <div className="rounded-xl border border-dashed border-zinc-300 px-5 py-8 text-center dark:border-zinc-700">
            <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              급식 상세 화면 구현 예정
            </p>
            <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              01_01_public_school_meals 디자인은 이 페이지에서 이어서 구현합니다.
            </p>
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}
