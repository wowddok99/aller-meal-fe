import { ArrowUpRight, CheckCircle2, CircleDashed } from "lucide-react";
import Link from "next/link";
import { AllerMealLogo } from "@/components/allermeal-logo";

const pageLinks = [
  {
    id: "00",
    title: "00_public_school_search_approved",
    label: "학교 검색",
    description: "구현 완료된 학교 검색 화면입니다.",
    href: "/schools",
    status: "완료",
    icon: CheckCircle2,
  },
  {
    id: "01",
    title: "01_01_public_school_meals",
    label: "급식 확인",
    description: "이제 구현을 시작할 급식 상세 화면입니다.",
    href: "/schools/1/meals",
    status: "진행 예정",
    icon: CircleDashed,
  },
] as const;

export function PublicPageIndex() {
  return (
    <main className="min-h-[100dvh] bg-zinc-50 text-zinc-950 dark:bg-canvas dark:text-zinc-50">
      <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-6 px-5 py-8">
        <div className="flex items-center">
          <AllerMealLogo variant="full" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-mint-600 dark:text-mint-400">
            Page Index
          </p>
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-zinc-950 dark:text-zinc-50">
            퍼블릭 화면 바로가기
          </h1>
          <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">
            구현된 화면과 다음 작업 화면을 한 곳에서 이동합니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {pageLinks.map((page) => {
            const Icon = page.icon;

            return (
              <Link
                key={page.id}
                href={page.href}
                className="group flex min-h-[170px] flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-mint-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:border-zinc-800 dark:bg-[#101419] dark:hover:border-mint-400"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-mint-600 dark:bg-zinc-900 dark:text-mint-400">
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-zinc-500 dark:text-zinc-400">
                        {page.id}
                      </p>
                      <h2 className="text-xl font-extrabold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50">
                        {page.label}
                      </h2>
                    </div>
                  </div>

                  <ArrowUpRight
                    className="h-5 w-5 shrink-0 text-zinc-400 transition-colors group-hover:text-mint-600 dark:group-hover:text-mint-400"
                    strokeWidth={2.2}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    {page.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-bold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                      {page.status}
                    </span>
                    <span className="min-w-0 truncate text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                      {page.title}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
