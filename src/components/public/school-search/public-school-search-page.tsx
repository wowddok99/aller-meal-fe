import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  School,
  Search,
} from "lucide-react";
import Link from "next/link";
import { PublicPageShell } from "@/components/public/public-page-shell";
import {
  schoolSearchResponse,
  type SchoolResponse,
} from "@/components/public/school-data";

const recentSchools = schoolSearchResponse.schools.slice(0, 2);

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419] ${className}`}
    >
      {children}
    </section>
  );
}

function RegionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-7 min-w-11 items-center justify-center rounded-full border border-zinc-300 px-3 text-xs font-semibold text-zinc-900 dark:border-zinc-600 dark:text-zinc-100">
      {children}
    </span>
  );
}

function SchoolCodeTooltip({ school }: { school: SchoolResponse }) {
  return (
    <span className="group relative inline-flex shrink-0 items-center">
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-zinc-600 active:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:text-zinc-500 dark:hover:text-zinc-300 dark:active:text-zinc-400 dark:focus-visible:ring-zinc-700"
        aria-label={`${school.name} 학교 코드 보기`}
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2.1} />
      </button>
      <span className="pointer-events-none absolute left-1/2 top-7 z-20 hidden w-max max-w-[220px] -translate-x-1/2 rounded-[10px] border border-zinc-200 bg-white px-3 py-2 text-left text-xs font-semibold leading-5 text-zinc-700 shadow-lg shadow-zinc-950/10 group-hover:block group-focus-within:block dark:border-zinc-700 dark:bg-[#11161c] dark:text-zinc-200 dark:shadow-black/30">
        <span className="block">NEIS 학교 코드 {school.neisSchoolCode}</span>
        <span className="block">교육청 코드 {school.educationOfficeCode}</span>
      </span>
    </span>
  );
}

function MealLinkButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2 text-sm font-extrabold text-mint-600 transition-colors hover:text-mint-500 active:text-mint-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:text-mint-400 dark:hover:text-mint-300 dark:active:text-mint-400 dark:focus-visible:ring-zinc-700"
    >
      급식 보기
      <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
    </Link>
  );
}

export function PublicSchoolSearchPage() {
  const { schools, page, pageSize, totalCount } = schoolSearchResponse;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <PublicPageShell>
      <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-3 px-5 pb-12 pt-5">
        <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">
          학교 급식 메뉴와 알레르기 유발 성분을 쉽고 빠르게 확인하세요.
        </p>

        <Card className="flex flex-col gap-3 p-5 md:p-7">
          <h1 className="text-2xl font-extrabold tracking-[-0.02em]">학교 검색</h1>

          <form className="flex w-full flex-col gap-3" action="/schools">
            <div className="flex flex-col gap-4 md:flex-row">
              <label className="sr-only" htmlFor="school-search">
                학교명 검색
              </label>
              <div className="flex h-12 w-full items-center gap-3 rounded-[10px] border border-zinc-200 bg-white px-4 transition-colors focus-within:border-mint-500 dark:border-zinc-700 dark:bg-[#0f1318] dark:focus-within:border-mint-400 md:flex-1">
                <Search className="h-5 w-5 shrink-0 text-zinc-600 dark:text-zinc-300" strokeWidth={2} />
                <input
                  id="school-search"
                  name="name"
                  type="search"
                  placeholder="학교명을 입력해 주세요"
                  className="h-full w-full bg-transparent text-base font-semibold text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                />
              </div>
              <button
                type="submit"
                className="flex h-12 w-full min-w-[112px] items-center justify-center rounded-[10px] bg-mint-500 px-7 text-base font-extrabold text-white transition-colors hover:bg-mint-600 active:bg-mint-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-zinc-700 dark:focus-visible:ring-offset-canvas md:w-auto"
              >
                검색
              </button>
            </div>
            <p className="text-[13px] font-medium leading-5 text-zinc-500 dark:text-zinc-500">
              검색 결과에서 학교를 선택해 급식을 확인할 수 있어요.
            </p>
          </form>
        </Card>

        <Card className="flex flex-col gap-5 p-5 md:p-7">
          <div className="flex items-center gap-4">
            <h2 className="text-[25px] font-extrabold tracking-[-0.02em]">
              최근 선택한 학교
            </h2>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            {recentSchools.map((school) => (
              <article
                key={school.id}
                className="flex min-h-20 flex-1 flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-800 dark:bg-[#0b0f13] sm:flex-row sm:items-center sm:gap-5 sm:px-5"
              >
                <div className="flex min-w-0 items-start gap-3 sm:flex-1 sm:items-center">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 dark:border-zinc-500 dark:text-zinc-100 sm:h-11 sm:w-11">
                    <Clock3 className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.8} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                      <h3 className="min-w-0 truncate text-[17px] font-extrabold tracking-[-0.02em] sm:text-xl">
                        {school.name}
                      </h3>
                      <RegionBadge>{school.region}</RegionBadge>
                    </div>
                    <p className="truncate text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                      {school.address}
                    </p>
                  </div>
                </div>
                <Link
                  className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-[10px] px-2 py-1 text-sm font-extrabold text-mint-600 transition-colors hover:text-mint-500 active:text-mint-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:text-mint-400 dark:hover:text-mint-300 dark:active:text-mint-400 dark:focus-visible:ring-zinc-700 sm:ml-0"
                  href={`/schools/${school.id}/meals`}
                >
                  급식 보기
                  <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
                </Link>
              </article>
            ))}
          </div>
        </Card>

        <Card className="p-5 md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 md:gap-5">
            <div className="flex items-center gap-3">
              <h2 className="text-[25px] font-extrabold tracking-[-0.02em]">검색 결과</h2>
              <p className="inline-flex h-7 items-center rounded-full bg-zinc-100 px-3 text-sm font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                총 {totalCount}개 학교
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                <span className="text-mint-600 dark:text-mint-400">{page}</span> / {totalPages}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 active:border-zinc-300 active:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:border-zinc-700 dark:bg-[#0f1318] dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 dark:active:border-zinc-600 dark:active:text-zinc-50 dark:focus-visible:ring-zinc-700 dark:focus-visible:ring-offset-canvas"
                  aria-label="이전 검색 결과"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 active:border-zinc-300 active:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:border-zinc-700 dark:bg-[#0f1318] dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 dark:active:border-zinc-600 dark:active:text-zinc-50 dark:focus-visible:ring-zinc-700 dark:focus-visible:ring-offset-canvas"
                  aria-label="다음 검색 결과"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:gap-0 lg:rounded-xl lg:border lg:border-zinc-200 lg:bg-zinc-50 lg:dark:border-zinc-800 lg:dark:bg-[#0b0f13]">
            <div className="hidden h-12 grid-cols-[54px_minmax(0,1fr)_120px] items-center border-b border-zinc-200 px-5 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:text-zinc-300 lg:grid">
              <div className="w-[54px]" aria-hidden="true" />
              <div>학교 정보</div>
              <div className="justify-self-start pl-2">급식 확인</div>
            </div>

            <div className="flex flex-col">
              {schools.map((school) => (
                <article
                  key={school.id}
                  className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-[#0b0f13] lg:grid lg:min-h-[78px] lg:grid-cols-[54px_minmax(0,1fr)_120px] lg:items-center lg:gap-0 lg:rounded-none lg:border-0 lg:border-b lg:bg-transparent lg:last:border-b-0 lg:dark:bg-transparent"
                >
                  <div className="hidden w-[54px] shrink-0 lg:block">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <School className="h-6 w-6 text-zinc-700 dark:text-zinc-100" strokeWidth={1.7} />
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-col gap-1 pr-5">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-extrabold tracking-[-0.02em]">
                        {school.name}
                      </h3>
                      <RegionBadge>{school.region}</RegionBadge>
                      <SchoolCodeTooltip school={school} />
                    </div>
                    <p className="truncate text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                      {school.address}
                    </p>
                  </div>

                  <div className="flex w-full justify-end lg:w-auto lg:justify-start">
                    <MealLinkButton href={`/schools/${school.id}/meals`} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </PublicPageShell>
  );
}
