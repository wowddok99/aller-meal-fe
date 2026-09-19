"use client";

import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Info,
  LoaderCircle,
  MapPin,
  RefreshCw,
  School,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PublicPageShell } from "@/components/public/public-page-shell";
import {
  useGetPublicDailyMeal,
  useGetPublicSchool,
  useGetPublicWeeklyMeals,
} from "@/generated/api/public";
import { ApiClientError } from "@/shared/api/api-client-error";
import {
  toPublicMealQuery,
  toPublicSchoolDetail,
  type PublicMeal,
} from "./school-meals-adapter";
import { getSeoulToday } from "./school-meals-date";

type PublicSchoolMealsPageProps = { schoolId: string };
type MealMode = "daily" | "weekly";
type DetailKey = "nutrition" | "origin";

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function getErrorMessage(error: Error | null) {
  return error?.message || "급식 정보를 불러오는 중 문제가 발생했습니다.";
}

function isNotFoundError(error: Error | null) {
  return error instanceof ApiClientError && error.status === 404;
}

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

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 h-10 rounded-[10px] border border-zinc-300 px-4 text-sm font-bold text-zinc-700 transition-colors hover:border-mint-500 hover:text-mint-600 dark:border-zinc-700 dark:text-zinc-200"
    >
      다시 시도
    </button>
  );
}

function MealDetailRow({
  detailKey,
  meal,
  open,
  onToggle,
}: {
  detailKey: DetailKey;
  meal: PublicMeal;
  open: boolean;
  onToggle: () => void;
}) {
  const isNutrition = detailKey === "nutrition";
  const hasDetails = isNutrition
    ? Boolean(meal.nutritionInfo)
    : meal.origins.length > 0 || Boolean(meal.originInfo);

  return (
    <div className="border-b border-zinc-200 bg-white last:border-b-0 dark:border-zinc-800 dark:bg-[#0b0f13]">
      <button
        type="button"
        className={`flex h-10 w-full items-center justify-between gap-4 px-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint-500 ${open ? "bg-zinc-50 dark:bg-white/[0.02]" : ""}`}
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="flex shrink-0 items-center gap-2 text-sm font-extrabold text-zinc-800 dark:text-zinc-100">
          {isNutrition ? "영양 정보" : "원산지 정보"}
          <Info className="h-3.5 w-3.5 text-zinc-500" strokeWidth={2.1} />
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2.2}
        />
      </button>
      {open ? (
        <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold leading-6 text-zinc-700 dark:border-zinc-800 dark:bg-[#080c10] dark:text-zinc-200">
          {!hasDetails ? <p>제공된 정보가 없습니다.</p> : null}
          {isNutrition && meal.nutritionInfo ? (
            <p className="whitespace-pre-line break-keep">
              {meal.nutritionInfo}
            </p>
          ) : null}
          {!isNutrition && meal.origins.length > 0 ? (
            <dl className="grid gap-2">
              {meal.origins.map((origin, index) => (
                <div
                  key={`${origin.origin}-${index}`}
                  className="rounded-[8px] border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-[#0b0f13]"
                >
                  <dt className="font-extrabold text-zinc-900 dark:text-zinc-100">
                    {origin.origin}
                  </dt>
                  {origin.ingredients.length > 0 ? (
                    <dd className="mt-1 text-zinc-500 dark:text-zinc-400">
                      {origin.ingredients.join(", ")}
                    </dd>
                  ) : null}
                </div>
              ))}
            </dl>
          ) : null}
          {!isNutrition && meal.origins.length === 0 && meal.originInfo ? (
            <p className="whitespace-pre-line break-keep">{meal.originInfo}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function PublicSchoolMealsPage({
  schoolId,
}: PublicSchoolMealsPageProps) {
  const [mode, setMode] = useState<MealMode>("daily");
  const [selectedDate, setSelectedDate] = useState(getSeoulToday);
  const [selectedMealId, setSelectedMealId] = useState<string>();
  const [openDetails, setOpenDetails] = useState<Record<DetailKey, boolean>>({
    nutrition: false,
    origin: false,
  });
  const schoolQuery = useGetPublicSchool(schoolId, { query: { retry: false } });
  const dailyMealQuery = useGetPublicDailyMeal(schoolId, selectedDate, {
    query: { enabled: mode === "daily", retry: false },
  });
  const weeklyMealQuery = useGetPublicWeeklyMeals(
    schoolId,
    { date: selectedDate },
    { query: { enabled: mode === "weekly", retry: false } },
  );
  const activeMealQuery = mode === "daily" ? dailyMealQuery : weeklyMealQuery;
  const school = schoolQuery.data
    ? toPublicSchoolDetail(schoolQuery.data)
    : undefined;
  const mealQuery = useMemo(
    () =>
      activeMealQuery.data
        ? toPublicMealQuery(activeMealQuery.data)
        : undefined,
    [activeMealQuery.data],
  );
  const selectedMeal =
    mealQuery?.meals.find((meal) => meal.id === selectedMealId) ??
    mealQuery?.meals[0];
  const isCollecting = Boolean(
    mealQuery?.collectionStatus && mealQuery.collectionStatus !== "READY",
  );

  useEffect(() => {
    if (selectedMeal && selectedMeal.id !== selectedMealId)
      setSelectedMealId(selectedMeal.id);
  }, [selectedMeal, selectedMealId]);

  const handleRefresh = () => void activeMealQuery.refetch();

  if (isNotFoundError(schoolQuery.error)) {
    return (
      <PublicPageShell>
        <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
          <Card className="px-5 py-10 text-center md:px-7">
            <h1 className="text-xl font-extrabold">학교를 찾을 수 없습니다.</h1>
            <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              학교 검색에서 다시 선택해 주세요.
            </p>
            <Link
              href="/schools"
              className="mt-5 inline-flex h-10 items-center rounded-[10px] bg-mint-500 px-4 text-sm font-extrabold text-white hover:bg-mint-600"
            >
              학교 검색으로 돌아가기
            </Link>
          </Card>
        </div>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell>
      <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
        <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">
          선택한 학교의 급식 정보를 확인하세요.
        </p>
        <Card className="p-5 md:p-7" aria-busy={schoolQuery.isLoading}>
          {schoolQuery.isLoading ? (
            <p
              role="status"
              className="text-sm font-semibold text-zinc-500 dark:text-zinc-400"
            >
              학교 정보를 불러오고 있습니다.
            </p>
          ) : null}
          {schoolQuery.isError ? (
            <div role="alert">
              <p className="text-sm font-semibold text-red-600">
                {getErrorMessage(schoolQuery.error)}
              </p>
              <RetryButton onClick={() => void schoolQuery.refetch()} />
            </div>
          ) : null}
          {school ? (
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
          ) : null}
        </Card>
        <Card className="p-5 md:p-7">
          <div className="mb-5 flex items-center gap-2">
            <CalendarDays
              className="h-5 w-5 text-zinc-700 dark:text-zinc-200"
              strokeWidth={2}
            />
            <h2 className="text-xl font-extrabold tracking-[-0.02em]">
              급식 조회
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px_128px] lg:items-center">
            <div className="grid h-12 grid-cols-2 overflow-hidden rounded-[10px] border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-[#0f1318]">
              {(["daily", "weekly"] as const).map((value) => {
                const selected = mode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-[9px] border text-base font-extrabold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 ${selected ? "border-mint-500 bg-transparent text-zinc-950 dark:text-zinc-50" : "border-transparent text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-white/[0.03]"}`}
                    aria-pressed={selected}
                    onClick={() => setMode(value)}
                  >
                    {value === "daily" ? "일간" : "주간"}
                  </button>
                );
              })}
            </div>
            <label className="relative flex h-12 items-center rounded-[10px] border border-zinc-200 bg-white px-4 dark:border-zinc-700 dark:bg-[#0f1318]">
              <span className="sr-only">급식 날짜</span>
              <CalendarDays
                className="mr-3 h-5 w-5 shrink-0 text-zinc-600 dark:text-zinc-300"
                strokeWidth={2}
              />
              <input
                type="date"
                className="h-full min-w-0 flex-1 bg-transparent text-base font-semibold text-zinc-800 outline-none dark:text-zinc-100"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>
            <span
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border px-4 text-sm font-extrabold ${isCollecting ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400" : "border-mint-500/25 bg-mint-500/10 text-mint-600 dark:text-mint-400"}`}
            >
              {isCollecting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
                  {isCollecting
                    ? "수집 대기"
                    : mealQuery?.collectionStatus === "READY"
                      ? "수집 완료"
                      : "조회 준비"}
            </span>
          </div>
        </Card>
        <Card
          className="p-5 md:p-7"
          aria-busy={activeMealQuery.isLoading || activeMealQuery.isFetching}
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Utensils
                className="h-5 w-5 text-zinc-700 dark:text-zinc-200"
                strokeWidth={2.1}
              />
              <h2 className="text-xl font-extrabold tracking-[-0.02em]">
                {mode === "daily"
                  ? `${selectedDate} 급식`
                  : `${mealQuery?.rangeStart ?? selectedDate} 주간 급식`}
              </h2>
            </div>
            {selectedMeal?.sourceReceivedAt ? (
              <p className="whitespace-nowrap text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                최근 수신{" "}
                <span className="ml-1.5 text-zinc-600 dark:text-zinc-300">
                  {formatDateTime(selectedMeal.sourceReceivedAt)}
                </span>
              </p>
            ) : null}
          </div>
          {activeMealQuery.isLoading ? (
            <p
              role="status"
              className="rounded-xl border border-dashed border-zinc-300 px-5 py-10 text-center text-sm font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
            >
              급식 정보를 불러오고 있습니다.
            </p>
          ) : null}
          {isNotFoundError(activeMealQuery.error) ? (
            <div
              role="alert"
              className="rounded-xl border border-dashed border-zinc-300 px-5 py-10 text-center dark:border-zinc-700"
            >
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                학교 또는 급식 정보를 찾을 수 없습니다.
              </p>
              <Link
                href="/schools"
                className="mt-4 inline-flex text-sm font-extrabold text-mint-600 dark:text-mint-400"
              >
                학교 다시 검색
              </Link>
            </div>
          ) : null}
          {activeMealQuery.isError &&
          !isNotFoundError(activeMealQuery.error) ? (
            <div
              role="alert"
              className="rounded-xl border border-dashed border-zinc-300 px-5 py-10 text-center dark:border-zinc-700"
            >
              <p className="text-sm font-semibold text-red-600">
                {getErrorMessage(activeMealQuery.error)}
              </p>
              <RetryButton onClick={handleRefresh} />
            </div>
          ) : null}
          {isCollecting && mealQuery ? (
            <div
              role="status"
              className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-5 py-6 text-center"
            >
              <p className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                급식 정보를 수집하고 있습니다.
              </p>
              <p className="mt-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                {mealQuery.retryAfterSeconds
                  ? `${mealQuery.retryAfterSeconds}초 후 다시 확인해 주세요.`
                  : "잠시 후 다시 확인해 주세요."}
              </p>
              {mealQuery.pendingTargets.length > 0 ? (
                <p className="mt-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  수집 대상:{" "}
                  {mealQuery.pendingTargets
                    .map((target) => `${target.date} ${target.typeLabel}`)
                    .join(", ")}
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleRefresh}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-[10px] border border-amber-500/40 bg-white px-4 text-sm font-bold text-amber-700 dark:bg-[#101419] dark:text-amber-300"
              >
                <RefreshCw className="h-4 w-4" strokeWidth={2.2} />
                다시 확인
              </button>
            </div>
          ) : null}
          {mealQuery && !isCollecting && mealQuery.meals.length === 0 ? (
            <div
              role="status"
              className="rounded-xl border border-dashed border-zinc-300 px-5 py-10 text-center dark:border-zinc-700"
            >
              <p className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                등록된 급식이 없습니다.
              </p>
              <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                다른 날짜를 선택해 다시 확인해 주세요.
              </p>
            </div>
          ) : null}
          {mealQuery && !isCollecting && selectedMeal ? (
            <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-start">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {mealQuery.meals.map((meal) => {
                  const selected = meal.id === selectedMeal.id;
                  return (
                    <button
                      key={meal.id}
                      type="button"
                      className={`flex min-h-[72px] flex-col items-start justify-center gap-1 rounded-[10px] border px-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 ${selected ? "border-mint-500 bg-mint-500/[0.04]" : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-[#0b0f13] dark:hover:border-zinc-700"}`}
                      aria-pressed={selected}
                      onClick={() => setSelectedMealId(meal.id)}
                    >
                      <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                        {meal.typeLabel}
                      </span>
                      <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                        {meal.date}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-[#0b0f13]">
                <div>
                  <p className="mb-2 text-sm font-bold text-zinc-500 dark:text-zinc-400">
                    메뉴
                  </p>
                  {selectedMeal.items.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {selectedMeal.items.map((menu, index) => (
                        <div
                          key={`${menu.rawText}-${index}`}
                          className="flex min-h-10 min-w-0 items-center gap-3 rounded-[10px] border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-[#101419]"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-xs font-bold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                            {index + 1}
                          </span>
                          <span className="min-w-0 text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                            <span className="block break-words">
                              {menu.name}
                            </span>
                            {menu.rawText !== menu.name ? (
                              <span className="block break-words text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                {menu.rawText}
                              </span>
                            ) : null}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-[10px] border border-dashed border-zinc-300 px-4 py-5 text-sm font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                      메뉴 정보가 없습니다.
                    </p>
                  )}
                </div>
                <div className="overflow-hidden rounded-[10px] border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0b0f13]">
                  {(["nutrition", "origin"] as DetailKey[]).map((detailKey) => (
                    <MealDetailRow
                      key={detailKey}
                      detailKey={detailKey}
                      meal={selectedMeal}
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
            </div>
          ) : null}
        </Card>
      </div>
    </PublicPageShell>
  );
}
