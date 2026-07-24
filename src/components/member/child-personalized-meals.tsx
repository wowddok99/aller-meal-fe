"use client";

import {
  AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, ChevronRight,
  CircleHelp, Info, LoaderCircle, RefreshCw, ShieldAlert, ShieldCheck, Utensils,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChildProfile, getChild, getPersonalizedMeals, MemberApiError, PersonalizedMeal,
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

function risk(value: string, labeling?: string) {
  if (value === "SAFE" && labeling !== "PENDING" && labeling !== "LABELING_FAILED") {
    return { label: "안전", Icon: CheckCircle2, style: "border-mint-500/40 bg-mint-500/10 text-mint-700 dark:text-mint-300" };
  }
  if (value === "RISKY") return { label: "주의", Icon: ShieldAlert, style: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300" };
  if (labeling === "LABELING_FAILED" || value === "LABELING_FAILED") return { label: "판별 실패", Icon: AlertTriangle, style: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300" };
  if (labeling === "PENDING" || value === "PENDING") return { label: "확인 중", Icon: LoaderCircle, style: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300" };
  return { label: "확인 필요", Icon: CircleHelp, style: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300" };
}

function RiskBadge({ value, labeling }: { value: string; labeling?: string }) {
  const item = risk(value, labeling);
  return <span className={`inline-flex h-8 items-center gap-1.5 rounded-[9px] border px-3 text-xs font-extrabold ${item.style}`}><item.Icon className={`h-4 w-4 ${item.label === "확인 중" ? "animate-spin" : ""}`} />{item.label}</span>;
}

function Detail({ label, value }: { label: string; value: string }) {
  const [open, setOpen] = useState(false);
  return <div className="border-t border-zinc-200 dark:border-zinc-800"><button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex h-12 w-full items-center justify-between px-4 text-sm font-extrabold"><span>{label}</span><ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} /></button>{open && <p className="border-t border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium leading-6 text-zinc-600 dark:border-zinc-800 dark:bg-black/20 dark:text-zinc-300">{value || "제공된 정보가 없습니다."}</p>}</div>;
}

function MealCard({ meal }: { meal: PersonalizedMeal }) {
  const items = [...(meal.items ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
  return <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419]">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800"><div className="flex items-center gap-3"><h2 className="text-xl font-extrabold">{mealType(meal.mealType)}</h2><span className="text-sm font-semibold text-zinc-500">{meal.mealDate}</span></div><div className="flex items-center gap-3"><RiskBadge value={meal.riskLevel} labeling={meal.labelingStatus} /><span className="text-xs font-semibold text-zinc-500">수신 {new Date(meal.sourceReceivedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</span></div></div>
    {items.length ? <div className="divide-y divide-zinc-200 dark:divide-zinc-800">{items.map((item, index) => <MealRow key={`${item.displayOrder}-${item.name}`} item={item} index={index} />)}</div> : <p className="p-8 text-center text-sm font-semibold text-zinc-500">표시할 메뉴가 없습니다.</p>}
    <Detail label="영양 정보" value={meal.nutritionInfo} /><Detail label="원산지 정보" value={meal.originInfo} />
  </section>;
}

function MealRow({ item, index }: { item: PersonalizedMealItem; index: number }) {
  return <div className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_130px_minmax(160px,0.7fr)] md:items-center">
    <div className="flex min-w-0 items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold dark:bg-zinc-800">{index + 1}</span><div className="min-w-0"><p className="font-extrabold">{item.name}</p>{item.rawText && item.rawText !== item.name && <p className="truncate text-xs font-medium text-zinc-500">{item.rawText}</p>}</div></div>
    <RiskBadge value={item.riskLevel} labeling={item.labelingStatus} />
    <div className="flex flex-wrap gap-1.5">{item.matchedAllergenCodes?.length ? item.matchedAllergenCodes.map((code) => <span key={code} className="rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">알레르기 {code}</span>) : <span className="text-xs font-semibold text-zinc-500">매칭 코드 없음</span>}</div>
  </div>;
}

export function ChildPersonalizedMeals({ childId }: { childId: string }) {
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [data, setData] = useState<PersonalizedMealQuery | null>(null);
  const [mode, setMode] = useState<PersonalizedMealMode>("today");
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<MemberApiError | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [profile, meals] = await Promise.all([getChild(childId), getPersonalizedMeals(childId, mode, date)]);
      setChild(profile); setData(meals);
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

  if (loading && !data) return <div className="mx-auto flex min-h-80 max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> 개인화 급식을 불러오고 있습니다.</div>;
  if (error) {
    const auth = error.status === 401 || error.status === 403;
    return <div className="mx-auto w-full max-w-[1220px] px-5 pt-5"><section className="rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-950 dark:bg-[#101419]"><AlertTriangle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-extrabold">{auth ? "로그인이 필요합니다" : "개인화 급식을 불러오지 못했습니다"}</h1><p className="mt-2 text-sm font-medium text-zinc-500">{message(error)}</p>{auth ? <Link href="/auth/login" className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-mint-500 px-5 font-bold text-white">로그인</Link> : <button type="button" onClick={() => void load()} className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 px-5 font-bold dark:border-zinc-700"><RefreshCw className="h-4 w-4" /> 다시 시도</button>}</section></div>;
  }
  if (!child || !data) return null;
  const collecting = data.collectionStatus === "COLLECTING";

  return <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
    <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">자녀의 알레르기 기준으로 급식 위험 여부를 확인하세요.</p>
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-7 dark:border-zinc-800 dark:bg-[#101419]">
      <div className="grid gap-5 lg:grid-cols-[minmax(250px,0.75fr)_minmax(420px,1.25fr)] lg:items-center">
        <div className="flex items-center gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-mint-50 text-xl font-extrabold text-mint-700 dark:bg-mint-950/30 dark:text-mint-300">{child.name.slice(0, 1)}</span><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-extrabold">{child.name}</h1><span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-bold dark:border-zinc-700">{child.grade}학년 {child.classNumber}반</span></div></div></div>
        <div className="grid gap-3 sm:grid-cols-[1fr_190px]"><div className="grid h-12 grid-cols-3 rounded-[10px] border border-zinc-300 p-0.5 dark:border-zinc-700">{[["today","오늘"],["daily","일간"],["weekly","주간"]].map(([value,label]) => <button key={value} type="button" onClick={() => setMode(value as PersonalizedMealMode)} className={`rounded-[8px] font-extrabold ${mode === value ? "bg-mint-500 text-white" : "text-zinc-500"}`}>{label}</button>)}</div><label className="flex h-12 items-center gap-2 rounded-[10px] border border-zinc-300 px-3 dark:border-zinc-700"><CalendarDays className="h-4 w-4 text-zinc-500" /><input aria-label="조회 날짜" type="date" value={date} disabled={mode === "today"} onChange={(event) => setDate(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none disabled:opacity-50" /></label></div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-zinc-500"><span>조회 범위 {data.rangeStart} ~ {data.rangeEnd}</span><div className="flex gap-2"><Link href={`/children/${childId}/allergens`} className="inline-flex items-center gap-1 font-bold text-mint-700 dark:text-mint-300"><ShieldCheck className="h-4 w-4" /> 알레르기 설정 <ChevronRight className="h-4 w-4" /></Link><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-1 font-bold disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> 새로고침</button></div></div>
    </section>
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-7 dark:border-zinc-800 dark:bg-[#101419]"><div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /><h2 className="text-xl font-extrabold">위험 요약</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Summary label="주의" value={summary.risky} tone="red" /><Summary label="안전" value={summary.safe} tone="mint" /><Summary label="확인 필요" value={summary.unknown} tone="amber" /></div>{collecting && <div role="status" className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm font-bold text-amber-800 dark:text-amber-300 md:flex-row md:items-center md:justify-between"><span className="flex items-center gap-2"><Info className="h-5 w-5" /> 급식 정보를 준비 중입니다. 확인 전 항목은 안전으로 판단하지 마세요.</span><span>{data.pendingTargets?.length ?? 0}건 대기 · 약 {data.retryAfterSeconds ?? 0}초 후 재확인</span></div>}</section>
    {!data.meals?.length ? <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-[#101419]"><Utensils className="mx-auto h-9 w-9 text-zinc-400" /><h2 className="mt-3 text-lg font-extrabold">{collecting ? "급식을 수집하고 있습니다" : "조회된 급식이 없습니다"}</h2><p className="mt-2 text-sm font-medium text-zinc-500">{collecting ? "잠시 후 새로고침해 주세요." : "다른 날짜나 조회 범위를 선택해 주세요."}</p></section> : data.meals.map((meal) => <MealCard key={meal.mealId} meal={meal} />)}
  </div>;
}

function Summary({ label, value, tone }: { label: string; value: number; tone: "red" | "mint" | "amber" }) {
  const styles = { red: "text-red-600 dark:text-red-300", mint: "text-mint-700 dark:text-mint-300", amber: "text-amber-700 dark:text-amber-300" };
  return <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"><p className="text-sm font-bold text-zinc-500">{label}</p><p className={`mt-1 text-2xl font-extrabold ${styles[tone]}`}>{value}</p></div>;
}
