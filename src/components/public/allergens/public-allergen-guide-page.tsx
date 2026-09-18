"use client";

import { Search } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { useListAllergens } from "@/generated/api/public";
import {
  toPublicAllergens,
  type PublicAllergen,
} from "./public-allergen-adapter";

function Card({
  children,
  className = "",
  ariaBusy,
}: {
  children: React.ReactNode;
  className?: string;
  ariaBusy?: boolean;
}) {
  return (
    <section
      aria-busy={ariaBusy}
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

function AllergenRow({
  allergen,
  isMatch,
}: {
  allergen: PublicAllergen;
  isMatch: boolean;
}) {
  return (
    <div
      id={`allergen-code-${allergen.code}`}
      aria-label={isMatch ? `${allergen.name}, 코드 ${allergen.code}, 검색 일치` : undefined}
      className={`relative grid min-h-12 grid-cols-[56px_minmax(0,1fr)_minmax(120px,0.8fr)] items-center gap-3 border-b border-zinc-200 px-4 transition-colors last:border-b-0 dark:border-zinc-800 ${isMatch ? "bg-mint-500/[0.07] before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-mint-500 dark:bg-mint-500/10" : ""}`}
    >
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
  const [activeQuery, setActiveQuery] = useState("");
  const allergensQuery = useListAllergens({ query: { retry: false } });
  const allergens = useMemo(
    () => (allergensQuery.data ? toPublicAllergens(allergensQuery.data) : []),
    [allergensQuery.data],
  );

  const matchingCodes = useMemo(() => {
    const keyword = activeQuery.toLowerCase();

    if (!keyword) {
      return new Set<number>();
    }

    return new Set(
      allergens.filter(
        (allergen) =>
        allergen.name.toLowerCase().includes(keyword) ||
        String(allergen.code).includes(keyword),
      ).map((allergen) => allergen.code),
    );
  }, [activeQuery, allergens]);

  const columns = useMemo(() => {
    const columnSize = Math.ceil(allergens.length / 3);

    return [
      allergens.slice(0, columnSize),
      allergens.slice(columnSize, columnSize * 2),
      allergens.slice(columnSize * 2),
    ];
  }, [allergens]);

  useEffect(() => {
    const firstMatchedCode = matchingCodes.values().next().value;
    if (typeof firstMatchedCode !== "number") return;

    document.getElementById(`allergen-code-${firstMatchedCode}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [matchingCodes]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActiveQuery(query.trim());
  };

  return (
    <PublicPageShell>
      <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
        <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">
          급식 메뉴에 표시되는 알레르기 코드를 확인하세요.
        </p>

        <Card className="flex flex-col gap-3 p-5 md:p-7">
          <h1 className="text-2xl font-extrabold tracking-[-0.02em]">알레르기 코드 검색</h1>

          <form className="flex w-full flex-col gap-3" action="/allergens" onSubmit={handleSearch}>
            <div className="flex flex-col gap-4 md:flex-row">
              <label
                className="flex h-12 w-full items-center gap-3 rounded-[10px] border border-zinc-200 bg-white px-4 transition-colors focus-within:border-mint-500 dark:border-zinc-700 dark:bg-[#0f1318] dark:focus-within:border-mint-400 md:flex-1"
                htmlFor="allergen-search"
              >
                <Search className="h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400" strokeWidth={2} />
                <span className="sr-only">알레르기명 또는 코드 검색</span>
                <input
                  id="allergen-search"
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    if (!event.target.value.trim()) setActiveQuery("");
                  }}
                  placeholder="알레르기명 또는 코드를 입력해 주세요"
                  className="h-full min-w-0 flex-1 bg-transparent text-base font-semibold text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                />
              </label>
              <button
                type="submit"
                className="flex h-12 w-full min-w-[112px] items-center justify-center rounded-[10px] bg-mint-500 px-7 text-base font-extrabold text-white transition-colors hover:bg-mint-600 active:bg-mint-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-zinc-700 dark:focus-visible:ring-offset-canvas md:w-auto"
              >
                검색
              </button>
            </div>
            <p aria-live="polite" className="text-[13px] font-medium leading-5 text-zinc-500 dark:text-zinc-500">
              {activeQuery && matchingCodes.size === 0
                ? "일치하는 알레르기 코드가 없어요."
                : "알레르기명이나 코드 번호로 목록을 빠르게 찾을 수 있어요."}
            </p>
          </form>
        </Card>

        <Card
          className="p-5 md:p-7"
          ariaBusy={allergensQuery.isLoading || allergensQuery.isFetching}
        >
          <h2 className="mb-5 text-2xl font-extrabold tracking-[-0.02em]">
            알레르기 코드 목록
          </h2>

          {allergensQuery.isLoading ? (
            <p
              role="status"
              className="rounded-xl border border-dashed border-zinc-300 px-5 py-10 text-center text-sm font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
            >
              알레르기 코드를 불러오고 있습니다.
            </p>
          ) : null}
          {allergensQuery.isError ? (
            <div
              role="alert"
              className="rounded-xl border border-dashed border-zinc-300 px-5 py-10 text-center dark:border-zinc-700"
            >
              <p className="text-sm font-semibold text-red-600">
                {allergensQuery.error.message ||
                  "알레르기 코드를 불러오는 중 문제가 발생했습니다."}
              </p>
              <button
                type="button"
                onClick={() => void allergensQuery.refetch()}
                className="mt-4 h-10 rounded-[10px] border border-zinc-300 px-4 text-sm font-bold text-zinc-700 transition-colors hover:border-mint-500 hover:text-mint-600 dark:border-zinc-700 dark:text-zinc-200"
              >
                다시 시도
              </button>
            </div>
          ) : null}
          {!allergensQuery.isLoading &&
          !allergensQuery.isError &&
          allergens.length === 0 ? (
            <div
              role="status"
              className="rounded-xl border border-dashed border-zinc-300 px-5 py-10 text-center dark:border-zinc-700"
            >
              <p className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                제공되는 알레르기 코드가 없습니다.
              </p>
              <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                잠시 후 다시 확인해 주세요.
              </p>
            </div>
          ) : null}
          {allergens.length > 0 ? (
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
                    <AllergenRow
                      key={allergen.code}
                      allergen={allergen}
                      isMatch={matchingCodes.has(allergen.code)}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </Card>

        <Card className="p-5 md:px-7 md:py-6">
          <h2 className="mb-2 text-xl font-extrabold tracking-[-0.02em]">표시 기준</h2>
          <ol className="space-y-0">
            {[
              "메뉴명 옆에 코드 또는 이름으로 표시될 수 있어요.",
              "개인 알레르기 설정 화면에서도 같은 코드를 사용해요.",
            ].map((item, index) => (
              <li
                key={item}
                className="text-sm font-semibold leading-6 tabular-nums text-zinc-600 dark:text-zinc-300"
              >
                {index + 1}) {item}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </PublicPageShell>
  );
}
