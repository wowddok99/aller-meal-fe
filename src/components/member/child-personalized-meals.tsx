"use client";

import {
  AlertTriangle, CalendarDays, ChevronDown, Info, LoaderCircle, RefreshCw, Utensils,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChildProfile, getAllergens, getChild, getPersonalizedMeals, getSchool, MealOrigin, MemberApiError, PersonalizedMeal,
  PersonalizedMealItem, PersonalizedMealMode, PersonalizedMealQuery,
} from "@/lib/member-api";

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());

function message(error: MemberApiError) {
  if (error.status === 401) return "로그인이 필요합니다.";
  if (error.status === 403) return "이메일 인증 또는 자녀 접근 권한을 확인해 주세요.";
  if (error.status === 404) return "자녀 또는 급식 정보를 찾을 수 없습니다.";
  if (error.status === 429) return "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  if (error.status === 502) return "급식 제공 기관과 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  return error.message;
}

function mealType(value: string) {
  return ({ BREAKFAST: "아침", LUNCH: "점심", DINNER: "저녁" } as Record<string, string>)[value] ?? value;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(date);
}

function formatMealDate(value: string) {
  const date = new Date(`${value}T12:00:00+09:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function risk(value: string, labeling?: string) {
  if (value === "SAFE" && labeling !== "PENDING" && labeling !== "LABELING_FAILED") {
    return { label: "안전", style: "border-mint-500/50 text-mint-700 dark:text-mint-300" };
  }
  if (value === "RISKY") return { label: "주의", style: "border-amber-500/60 text-amber-800 dark:text-amber-300" };
  if (labeling === "LABELING_FAILED" || value === "LABELING_FAILED") return { label: "판별 실패", style: "border-amber-500/50 text-amber-800 dark:text-amber-300" };
  if (labeling === "PENDING" || value === "PENDING") return { label: "확인 중", style: "border-amber-500/50 text-amber-800 dark:text-amber-300" };
  return { label: "확인 필요", style: "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300" };
}

function RiskBadge({ value, labeling }: { value: string; labeling?: string }) {
  const item = risk(value, labeling);
  return <span className={`inline-flex h-8 w-fit items-center justify-self-start rounded-[9px] border px-3 text-xs font-extrabold ${item.style}`}>{item.label}</span>;
}

function Detail({ label, value, asList = false }: { label: string; value: string; asList?: boolean }) {
  const [open, setOpen] = useState(false);
  return <div className="border-t border-zinc-200 dark:border-zinc-800"><button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex h-12 w-full items-center justify-between px-6 text-sm font-extrabold transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint-500 md:px-8 dark:hover:bg-white/[0.02]"><span>{label}</span><ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} /></button>{open && <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-3 text-sm font-medium leading-6 text-zinc-600 md:px-8 dark:border-zinc-800 dark:bg-black/20 dark:text-zinc-300">{value ? asList ? <ul className="space-y-1.5">{value.split(" · ").map((item) => <li key={item}>{item}</li>)}</ul> : <p>{value}</p> : <p>제공된 정보가 없습니다.</p>}</div>}</div>;
}

function OriginDetail({ origins, fallback }: { origins?: MealOrigin[]; fallback: string }) {
  const [open, setOpen] = useState(false);
  const hasOrigins = Boolean(origins?.length);
  return <div className="border-t border-zinc-200 dark:border-zinc-800"><button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex h-12 w-full items-center justify-between px-6 text-sm font-extrabold transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint-500 md:px-8 dark:hover:bg-white/[0.02]"><span>원산지 정보</span><ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} /></button>{open && <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-3 text-sm font-medium leading-6 text-zinc-600 md:px-8 dark:border-zinc-800 dark:bg-black/20 dark:text-zinc-300">{hasOrigins ? <dl className="space-y-1.5">{origins?.map((item) => <div key={`${item.ingredients.join(",")}-${item.origin}`} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1"><dt>{item.ingredients.join(", ")}:</dt><dd>{item.origin}</dd></div>)}</dl> : <p>{fallback || "제공된 정보가 없습니다."}</p>}</div>}</div>;
}

function MealCard({ meal, allergenNames, showDate = true }: { meal: PersonalizedMeal; allergenNames: ReadonlyMap<number, string>; showDate?: boolean }) {
  const items = [...(meal.items ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
  return <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419]">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4 md:px-8 dark:border-zinc-800"><div className="flex items-center gap-3"><h3 className="text-xl font-extrabold tracking-[-0.02em]">{mealType(meal.mealType)}</h3>{showDate && <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{meal.mealDate}</span>}</div><div className="flex flex-wrap items-center gap-3"><RiskBadge value={meal.riskLevel} labeling={meal.labelingStatus} /><span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">수신 {formatDateTime(meal.sourceReceivedAt)}</span></div></div>
    {items.length ? <><div className="hidden grid-cols-3 gap-3 border-b border-zinc-200 bg-zinc-50 px-6 py-3 text-xs font-bold text-zinc-500 md:gap-x-5 md:px-8 dark:border-zinc-800 dark:bg-black/20 dark:text-zinc-400 md:grid"><span>메뉴</span><span>알레르기 위험</span><span>주의 성분</span></div><div className="divide-y divide-zinc-200 dark:divide-zinc-800">{items.map((item, index) => <MealRow key={`${item.displayOrder}-${item.name}`} item={item} index={index} allergenNames={allergenNames} />)}</div></> : <p className="p-8 text-center text-sm font-semibold text-zinc-500">표시할 메뉴가 없습니다.</p>}
    <Detail label="영양 정보" value={meal.nutritionInfo} asList /><OriginDetail origins={meal.origins} fallback={meal.originInfo} />
  </section>;
}

function MealDay({ date, meals, allergenNames }: { date: string; meals: PersonalizedMeal[]; allergenNames: ReadonlyMap<number, string> }) {
  return <section aria-labelledby={`meal-date-${date}`} className="space-y-3">
    <div className="flex items-baseline justify-between gap-3 px-1">
      <h2 id={`meal-date-${date}`} className="text-base font-extrabold tracking-[-0.02em]">{formatMealDate(date)}</h2>
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{meals.length}식</span>
    </div>
    <div className="space-y-3">{meals.map((meal) => <MealCard key={meal.mealId} meal={meal} allergenNames={allergenNames} showDate={false} />)}</div>
  </section>;
}

function MealRow({ item, index, allergenNames }: { item: PersonalizedMealItem; index: number; allergenNames: ReadonlyMap<number, string> }) {
  const matchedAllergens = item.matchedAllergenCodes?.map((code) => allergenNames.get(code) ?? `${code}번 성분`) ?? [];
  return <div className="grid gap-3 px-6 py-3.5 md:grid-cols-3 md:gap-x-5 md:px-8 md:items-center">
    <div className="flex min-w-0 items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold dark:bg-zinc-800">{index + 1}</span><div className="min-w-0"><p className="font-extrabold">{item.name}</p>{item.rawText && item.rawText !== item.name && <p className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">{item.rawText}</p>}</div></div>
    <RiskBadge value={item.riskLevel} labeling={item.labelingStatus} />
    {matchedAllergens.length ? <p className="text-sm font-bold text-amber-800 dark:text-amber-300">{matchedAllergens.join(", ")}</p> : <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">해당 없음</p>}
  </div>;
}

export function ChildPersonalizedMeals({ childId }: { childId: string }) {
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [allergenNames, setAllergenNames] = useState<ReadonlyMap<number, string>>(() => new Map());
  const [data, setData] = useState<PersonalizedMealQuery | null>(null);
  const [mode, setMode] = useState<PersonalizedMealMode>("today");
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<MemberApiError | null>(null);

  const selectMode = (nextMode: PersonalizedMealMode) => {
    setMode(nextMode);
    if (nextMode === "today") setDate(today);
  };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [profile, meals, allergens] = await Promise.all([getChild(childId), getPersonalizedMeals(childId, mode, date), getAllergens(childId === "preview")]);
      const school = await getSchool(profile.schoolId).catch(() => null);
      setChild(profile); setSchoolName(school?.name ?? ""); setAllergenNames(new Map(allergens.map((allergen) => [allergen.code, allergen.name]))); setData(meals);
    } catch (reason) {
      setError(reason instanceof MemberApiError ? reason : new MemberApiError(0, "개인화 급식을 불러오지 못했습니다."));
    } finally { setLoading(false); }
  }, [childId, date, mode]);

  useEffect(() => { void load(); }, [load]);

  const summary = useMemo(() => (data?.meals ?? []).flatMap((meal) => meal.items ?? []).reduce((acc, item) => {
    const key = risk(item.riskLevel, item.labelingStatus).label;
    if (key === "안전") acc.safe += 1; else if (key === "주의") acc.risky += 1; else acc.unknown += 1;
    return acc;
  }, { safe: 0, risky: 0, unknown: 0 }), [data]);
  const mealDays = useMemo(() => {
    const grouped = new Map<string, PersonalizedMeal[]>();
    for (const meal of data?.meals ?? []) grouped.set(meal.mealDate, [...(grouped.get(meal.mealDate) ?? []), meal]);
    return [...grouped.entries()].map(([mealDate, meals]) => ({ mealDate, meals }));
  }, [data]);

  if (loading && !data) return <div className="mx-auto flex min-h-80 max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> 개인화 급식을 불러오고 있습니다.</div>;
  if (error) {
    const auth = error.status === 401 || error.status === 403;
    return <div className="mx-auto w-full max-w-[1220px] px-5 pt-5"><section className="rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-950 dark:bg-[#101419]"><AlertTriangle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-extrabold">{auth ? "로그인이 필요합니다" : "개인화 급식을 불러오지 못했습니다"}</h1><p className="mt-2 text-sm font-medium text-zinc-500">{message(error)}</p>{auth ? <Link href="/auth/login" className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-mint-500 px-5 font-bold text-white">로그인</Link> : <button type="button" onClick={() => void load()} className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 px-5 font-bold dark:border-zinc-700"><RefreshCw className="h-4 w-4" /> 다시 시도</button>}</section></div>;
  }
  if (!child || !data) return null;
  const collecting = data.collectionStatus === "COLLECTING";

  return <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
    <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">자녀의 알레르기 기준으로 급식 위험 여부를 확인하세요.</p>
    <section className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 md:px-8 md:py-6 dark:border-zinc-800 dark:bg-[#101419]">
      <div className="grid gap-5 lg:grid-cols-[minmax(220px,0.7fr)_minmax(460px,1.3fr)] lg:items-center">
        <div><div className="flex flex-wrap items-center gap-2.5"><h1 className="text-2xl font-extrabold tracking-[-0.02em]">{child.name}</h1><span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-bold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">{child.grade}학년 {child.classNumber}반</span></div>{schoolName && <p className="mt-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">{schoolName}</p>}</div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]"><div className="grid h-11 grid-cols-3 rounded-[10px] border border-zinc-300 p-0.5 dark:border-zinc-700">{[["today","오늘"],["daily","일간"],["weekly","주간"]].map(([value,label]) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => selectMode(value as PersonalizedMealMode)} className={`rounded-[8px] text-sm font-extrabold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 ${mode === value ? "bg-mint-500 text-white" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"}`}>{label}</button>)}</div><label className="flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 bg-white px-3 transition focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/20 dark:border-zinc-700 dark:bg-[#0b0f13]"><CalendarDays className="h-4 w-4 shrink-0 text-zinc-500" /><input aria-label={mode === "weekly" ? "기준 날짜" : "조회 날짜"} type="date" value={date} disabled={mode === "today"} onChange={(event) => setDate(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none disabled:cursor-not-allowed disabled:opacity-45" /></label></div>
      </div>
      <div className="mt-4 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800"><p className="font-medium text-zinc-500 dark:text-zinc-400">{mode === "weekly" ? "조회 기간" : "조회 날짜"} <span className="font-bold text-zinc-700 dark:text-zinc-200">{mode === "weekly" ? `${data.rangeStart} ~ ${data.rangeEnd}` : data.rangeStart}</span></p></div>
    </section>
    <section className="rounded-2xl border border-zinc-200 bg-white px-6 py-6 md:px-8 dark:border-zinc-800 dark:bg-[#101419]"><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-extrabold tracking-[-0.02em]">{mode === "weekly" ? "주간 위험 요약" : "위험 요약"}</h2><Link href={`/children/${childId}/allergens`} className="text-sm font-bold text-mint-700 underline-offset-4 transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:text-mint-300">알레르기 기준 수정</Link></div><div className="mt-5 grid divide-y divide-zinc-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-zinc-800"><Summary label="주의" description="알레르기 확인이 필요한 메뉴" value={summary.risky} tone="amber" /><Summary label="안전" description="등록된 알레르기 성분이 없는 메뉴" value={summary.safe} tone="mint" /><Summary label="확인 필요" description="정보 확인 또는 판별이 필요한 메뉴" value={summary.unknown} tone="zinc" /></div>{collecting && <div role="status" className="mt-5 flex flex-col gap-3 border-l-2 border-amber-500 bg-amber-500/[0.06] px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"><p className="flex items-start gap-2 font-bold text-amber-900 dark:text-amber-300"><Info className="mt-0.5 h-4 w-4 shrink-0" /> 급식 정보를 준비 중입니다. 확인 전 항목은 안전으로 판단하지 마세요.</p><div className="flex items-center gap-3"><p className="shrink-0 text-xs font-bold text-amber-800 dark:text-amber-300">{data.pendingTargets?.length ?? 0}건 대기 · 약 {data.retryAfterSeconds ?? 0}초 후 재확인</p><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-amber-500/60 bg-white px-3 text-xs font-extrabold text-amber-900 transition-colors hover:bg-amber-500/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50 dark:bg-[#101419] dark:text-amber-300"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> 다시 확인</button></div></div>}</section>
    {!data.meals?.length ? <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-[#101419]"><Utensils className="mx-auto h-9 w-9 text-zinc-400" /><h2 className="mt-3 text-lg font-extrabold">{collecting ? "급식을 수집하고 있습니다" : "조회된 급식이 없습니다"}</h2><p className="mt-2 text-sm font-medium text-zinc-500">{collecting ? "잠시 후 새로고침해 주세요." : "다른 날짜나 조회 범위를 선택해 주세요."}</p></section> : <div className="space-y-7">{mealDays.map(({ mealDate, meals }) => <MealDay key={mealDate} date={mealDate} meals={meals} allergenNames={allergenNames} />)}</div>}
  </div>;
}

function Summary({ label, description, value, tone }: { label: string; description: string; value: number; tone: "mint" | "amber" | "zinc" }) {
  const config = {
    mint: { value: "text-mint-700 dark:text-mint-300" },
    amber: { value: "text-amber-800 dark:text-amber-300" },
    zinc: { value: "text-zinc-800 dark:text-zinc-100" },
  }[tone];
  return <div className="min-h-[116px] px-0 py-4 first:pt-0 sm:px-6 sm:py-0 sm:first:pl-0 sm:[&:not(:first-child)]:pl-6"><p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">{label}</p><p className={`mt-1.5 text-2xl font-extrabold leading-none tracking-[-0.03em] ${config.value}`}>{value}<span className="ml-0.5 text-base font-bold">개</span></p><p className="mt-2 text-sm font-medium leading-5 text-zinc-500 dark:text-zinc-400">{description}</p></div>;
}
