"use client";

import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  MapPin,
  RefreshCw,
  School,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { getSchoolById, schoolSearchResponse } from "@/components/public/school-data";

type PublicSchoolMealsPageProps = {
  schoolId: string;
};

type MealMode = "daily" | "weekly";
type MealPeriod = "lunch" | "dinner";
type DetailKey = "nutrition" | "origin";

const fallbackSchool = schoolSearchResponse.schools[0];

const dates = ["2026-07-04", "2026-07-05", "2026-07-06"];

const menuItems = ["현미밥", "닭갈비", "미역국", "배추김치", "우유"];

const nutritionItems = [
  ["열량", "682 kcal"],
  ["탄수화물", "95 g"],
  ["단백질", "32 g"],
  ["지방", "20 g"],
  ["나트륨", "820 mg"],
];

const details: Record<DetailKey, { label: string; value: string }> = {
  nutrition: {
    label: "영양 정보",
    value: nutritionItems.map(([label, value]) => `${label} ${value}`).join("    "),
  },
  origin: {
    label: "원산지 정보",
    value: "닭고기(국내산), 쌀(국내산), 배추김치(배추:국내산, 고춧가루:국내산)",
  },
};

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

function DetailRow({
  detailKey,
  open,
  onToggle,
}: {
  detailKey: DetailKey;
  open: boolean;
  onToggle: () => void;
}) {
  const detail = details[detailKey];

  return (
    <div className="border-b border-zinc-200 bg-white last:border-b-0 dark:border-zinc-800 dark:bg-[#0b0f13]">
      <button
        type="button"
        className={`flex h-10 w-full items-center justify-between gap-4 px-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint-500 ${
          open ? "bg-zinc-50 dark:bg-white/[0.02]" : ""
        }`}
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="flex shrink-0 items-center gap-2 text-sm font-extrabold text-zinc-800 dark:text-zinc-100">
          {detail.label}
          <Info className="h-3.5 w-3.5 text-zinc-500" strokeWidth={2.1} />
        </span>
        <span className="min-w-0 flex-1" aria-hidden="true" />
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2.2}
        />
      </button>
      {open ? (
        <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold leading-6 text-zinc-700 dark:border-zinc-800 dark:bg-[#080c10] dark:text-zinc-200">
          {detailKey === "nutrition" ? (
            <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {nutritionItems.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-[8px] border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-[#0b0f13]">
                  <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
                  <dd className="text-zinc-900 dark:text-zinc-100">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="break-keep">{detail.value}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function PublicSchoolMealsPage({ schoolId }: PublicSchoolMealsPageProps) {
  const school = getSchoolById(schoolId) ?? fallbackSchool;
  const [mode, setMode] = useState<MealMode>("daily");
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [period, setPeriod] = useState<MealPeriod>("lunch");
  const [openDetails, setOpenDetails] = useState<Record<DetailKey, boolean>>({
    nutrition: false,
    origin: false,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const collectedLabel = useMemo(
    () => (isRefreshing ? "수집 중" : "수집 완료"),
    [isRefreshing],
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.setTimeout(() => setIsRefreshing(false), 900);
  };

  return (
    <PublicPageShell>
      <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
        <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">
          선택한 학교의 급식 정보를 확인하세요.
        </p>

        <Card className="p-5 md:p-7">
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
                <RegionBadge>{school.region}</RegionBadge>
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
              <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </div>
        </Card>

        <Card className="p-5 md:p-7">
          <div className="mb-5 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-zinc-700 dark:text-zinc-200" strokeWidth={2} />
            <h2 className="text-xl font-extrabold tracking-[-0.02em]">급식 조회</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px_128px] lg:items-center">
            <div className="grid h-12 grid-cols-2 overflow-hidden rounded-[10px] border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-[#0f1318]">
              {[
                ["daily", "일간"],
                ["weekly", "주간"],
              ].map(([value, label]) => {
                const selected = mode === value;

                return (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-[9px] border text-base font-extrabold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 ${
                      selected
                        ? "border-mint-500 bg-transparent text-zinc-950 dark:text-zinc-50"
                        : "border-transparent text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-white/[0.03]"
                    }`}
                    aria-pressed={selected}
                    onClick={() => setMode(value as MealMode)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <label className="relative flex h-12 items-center rounded-[10px] border border-zinc-200 bg-white px-4 dark:border-zinc-700 dark:bg-[#0f1318]">
              <span className="sr-only">급식 날짜</span>
              <CalendarDays className="mr-3 h-5 w-5 shrink-0 text-zinc-600 dark:text-zinc-300" strokeWidth={2} />
              <select
                className="h-full flex-1 appearance-none bg-transparent text-base font-semibold text-zinc-800 outline-none dark:text-zinc-100"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              >
                {dates.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-zinc-500" strokeWidth={2.2} />
            </label>

            <span
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border px-4 text-sm font-extrabold ${
                isRefreshing
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-mint-500/25 bg-mint-500/10 text-mint-600 dark:text-mint-400"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
              {collectedLabel}
            </span>
          </div>
        </Card>

        <Card className="p-5 md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-zinc-700 dark:text-zinc-200" strokeWidth={2.1} />
              <h2 className="text-xl font-extrabold tracking-[-0.02em]">{selectedDate} 급식</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="whitespace-nowrap text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                최근 수신 <span className="ml-1.5 text-zinc-600 dark:text-zinc-300">2026-07-04 08:30</span>
              </p>
              <span className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-zinc-200 px-3 text-xs font-extrabold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
                표시 완료
              </span>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[156px_minmax(0,1fr)] lg:items-start">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                ["lunch", "점심", "12:00 ~ 13:00"],
                ["dinner", "저녁", "-"],
              ].map(([value, label, time]) => {
                const selected = period === value;

                return (
                  <button
                    key={value}
                    type="button"
                    className={`flex min-h-[72px] flex-col items-start justify-center gap-1 rounded-[10px] border px-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 ${
                      selected
                        ? "border-mint-500 bg-mint-500/[0.04]"
                        : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-[#0b0f13] dark:hover:border-zinc-700"
                    }`}
                    aria-pressed={selected}
                    onClick={() => setPeriod(value as MealPeriod)}
                  >
                    <span className="flex items-center gap-2 text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          selected ? "bg-mint-400" : "bg-zinc-400 dark:bg-zinc-600"
                        }`}
                      />
                      {label}
                    </span>
                    <span className="pl-[18px] text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                      {time}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-[#0b0f13]">
              {period === "lunch" ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="mb-2 text-sm font-bold text-zinc-500 dark:text-zinc-400">메뉴</p>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                      {menuItems.map((menu, index) => (
                        <div
                          key={menu}
                          className="flex h-10 min-w-0 items-center gap-3 rounded-[10px] border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-[#101419]"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-xs font-bold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                            {index + 1}
                          </span>
                          <span className="truncate text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                            {menu}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[10px] border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0b0f13]">
                    {(Object.keys(details) as DetailKey[]).map((detailKey) => (
                      <DetailRow
                        key={detailKey}
                        detailKey={detailKey}
                        open={openDetails[detailKey]}
                        onToggle={() =>
                          setOpenDetails((current) => ({
                            ...current,
                            [detailKey]: !current[detailKey],
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[188px] flex-col items-center justify-center rounded-[10px] border border-dashed border-zinc-300 px-5 text-center dark:border-zinc-700">
                  <p className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                    등록된 저녁 급식이 없어요
                  </p>
                  <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    점심 탭에서 오늘 제공되는 급식 정보를 확인할 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-[10px] border border-amber-500/35 bg-amber-500/[0.04] px-4 py-3 text-amber-700 dark:text-amber-400 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" strokeWidth={2.2} />
              <p className="text-sm font-extrabold">
                {isRefreshing ? "급식 정보를 다시 확인하고 있어요" : "수집 중인 급식이 있어요"}
              </p>
              <span className="hidden text-sm font-semibold text-zinc-500 dark:text-zinc-400 sm:inline">
                다시 확인까지 약 30초
              </span>
            </div>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-zinc-300 bg-white px-4 text-sm font-extrabold text-zinc-800 transition-colors hover:border-zinc-400 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
              onClick={handleRefresh}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                strokeWidth={2.2}
              />
              다시 확인
            </button>
          </div>
        </Card>

        <div className="flex justify-start">
          <Link
            href="/schools"
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-2 text-sm font-bold text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
            학교 검색으로 돌아가기
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
