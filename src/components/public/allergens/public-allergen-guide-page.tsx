"use client";

import { CheckCircle2, Info, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { PublicPageShell } from "@/components/public/public-page-shell";

type AllergenCode = {
  code: number;
  name: string;
};

const allergenCodes: AllergenCode[] = [
  { code: 1, name: "난류" },
  { code: 2, name: "우유" },
  { code: 3, name: "메밀" },
  { code: 4, name: "땅콩" },
  { code: 5, name: "대두" },
  { code: 6, name: "밀" },
  { code: 7, name: "고등어" },
  { code: 8, name: "게" },
  { code: 9, name: "새우" },
  { code: 10, name: "돼지고기" },
  { code: 11, name: "복숭아" },
  { code: 12, name: "토마토" },
  { code: 13, name: "아황산류" },
  { code: 14, name: "호두" },
  { code: 15, name: "닭고기" },
  { code: 16, name: "쇠고기" },
  { code: 17, name: "오징어" },
  { code: 18, name: "조개류" },
  { code: 19, name: "잣" },
];

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

function CodeBadge({ code }: { code: number }) {
  return (
    <span className="inline-flex h-7 min-w-10 items-center justify-center rounded-[8px] border border-zinc-200 bg-zinc-50 px-2 text-sm font-extrabold text-zinc-700 dark:border-zinc-700 dark:bg-[#11161c] dark:text-zinc-100">
      {code}
    </span>
  );
}

function AllergenRow({ allergen }: { allergen: AllergenCode }) {
  return (
    <div className="grid min-h-12 grid-cols-[56px_minmax(0,1fr)_minmax(120px,0.8fr)] items-center gap-3 border-b border-zinc-200 px-4 last:border-b-0 dark:border-zinc-800">
      <CodeBadge code={allergen.code} />
      <p className="truncate text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
        {allergen.name}
      </p>
      <p className="truncate text-sm font-semibold text-zinc-500 dark:text-zinc-400">
        {allergen.code} 또는 {allergen.name}
      </p>
    </div>
  );
}

export function PublicAllergenGuidePage() {
  const [query, setQuery] = useState("");

  const filteredAllergens = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return allergenCodes;
    }

    return allergenCodes.filter(
      (allergen) =>
        allergen.name.toLowerCase().includes(keyword) ||
        String(allergen.code).includes(keyword),
    );
  }, [query]);

  const columns = [
    filteredAllergens.slice(0, 7),
    filteredAllergens.slice(7, 14),
    filteredAllergens.slice(14),
  ];

  return (
    <PublicPageShell>
      <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
        <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">
          급식 메뉴에 표시되는 알레르기 코드를 확인하세요.
        </p>

        <Card className="p-5 md:p-7">
          <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.5fr)] lg:items-start">
            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-mint-600 dark:text-mint-400" strokeWidth={2.2} />
                <h1 className="text-2xl font-extrabold tracking-[-0.02em]">
                  알레르기 코드 안내
                </h1>
              </div>
              <p className="text-base font-semibold leading-6 text-zinc-500 dark:text-zinc-400">
                학교 급식 알레르기 표시에 사용되는 기준 코드입니다.
              </p>
            </div>

            <form className="flex flex-col gap-3" action="/allergens">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_112px]">
                <label
                  className="flex h-12 items-center gap-3 rounded-[10px] border border-zinc-200 bg-white px-4 transition-colors focus-within:border-mint-500 dark:border-zinc-700 dark:bg-[#0f1318] dark:focus-within:border-mint-400"
                  htmlFor="allergen-search"
                >
                  <Search className="h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400" strokeWidth={2} />
                  <span className="sr-only">알레르기명 검색</span>
                  <input
                    id="allergen-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="알레르기명을 입력해 주세요"
                    className="h-full min-w-0 flex-1 bg-transparent text-base font-semibold text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center rounded-[10px] bg-mint-500 px-6 text-base font-extrabold text-white transition-colors hover:bg-mint-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-canvas"
                >
                  검색
                </button>
              </div>
              <p className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-500">
                목록은 코드 번호순으로 정렬돼요.
              </p>
            </form>
          </div>
        </Card>

        <Card className="p-5 md:p-7">
          <h2 className="mb-5 text-2xl font-extrabold tracking-[-0.02em]">
            알레르기 코드 목록
          </h2>

          {filteredAllergens.length > 0 ? (
            <div className="grid overflow-hidden lg:grid-cols-3">
              {columns.map((column, columnIndex) => (
                <div
                  key={columnIndex}
                  className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-800 lg:border-b-0 lg:border-r lg:last:border-r-0"
                >
                  <div className="grid h-10 grid-cols-[56px_minmax(0,1fr)_minmax(120px,0.8fr)] items-center gap-3 border-b border-zinc-200 px-4 text-xs font-extrabold text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    <span>{columnIndex === 0 ? "코드" : ""}</span>
                    <span />
                    <span>표시 예시</span>
                  </div>
                  {column.map((allergen) => (
                    <AllergenRow key={allergen.code} allergen={allergen} />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 px-5 py-10 text-center dark:border-zinc-700">
              <p className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                일치하는 알레르기 코드가 없어요
              </p>
              <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                다른 이름이나 코드 번호로 다시 검색해 주세요.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-5 md:p-7">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-mint-600 dark:text-mint-400" strokeWidth={2.2} />
            <h2 className="text-xl font-extrabold tracking-[-0.02em]">표시 기준</h2>
          </div>
          <div className="flex flex-col gap-3">
            {[
              "메뉴명 옆에 코드 또는 이름으로 표시될 수 있어요.",
              "개인 알레르기 설정 화면에서도 같은 코드를 사용해요.",
            ].map((item) => (
              <p
                key={item}
                className="flex items-start gap-2 text-sm font-semibold leading-6 text-zinc-600 dark:text-zinc-300"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint-600 dark:text-mint-400" strokeWidth={2.2} />
                {item}
              </p>
            ))}
          </div>
        </Card>
      </div>
    </PublicPageShell>
  );
}
