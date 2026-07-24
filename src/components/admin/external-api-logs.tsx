"use client";

import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminApiError, type ExternalApiLog, type ExternalApiLogPage, getExternalApiLogs } from "@/lib/admin-api";

const PAGE_SIZES = [10, 20, 50];
const mealLabels: Record<string, string> = { BREAKFAST: "아침", LUNCH: "점심", DINNER: "저녁" };

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "medium", hour12: false }).format(date);
}

function statusClass(status: number) {
  if (status >= 200 && status < 400) return "text-mint-700 dark:text-mint-300";
  if (status >= 500) return "text-red-600 dark:text-red-400";
  return "text-amber-700 dark:text-amber-300";
}

function outcomeClass(outcome: string) {
  return /success|succeed|ok/i.test(outcome)
    ? "border-mint-500/30 bg-mint-500/10 text-mint-700 dark:text-mint-300"
    : "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300";
}

function ErrorState({ error, retry }: { error: AdminApiError; retry: () => void }) {
  const auth = error.status === 401 || error.status === 403;
  return <section className="rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-950 dark:bg-[#101419] dark:text-zinc-50"><AlertTriangle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-extrabold">{auth ? "관리자 권한이 필요합니다" : "외부 API 로그를 불러오지 못했습니다"}</h1><p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">{auth ? "관리자 계정으로 로그인한 후 다시 확인해 주세요." : error.message}</p>{!auth ? <button type="button" onClick={retry} className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 px-5 font-bold hover:border-mint-500 dark:border-zinc-700"><RefreshCw className="h-4 w-4" /> 다시 시도</button> : null}</section>;
}

export function ExternalApiLogs({ review = false }: { review?: boolean }) {
  const [result, setResult] = useState<ExternalApiLogPage>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [error, setError] = useState<AdminApiError>();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ExternalApiLog>();
  const [provider, setProvider] = useState("ALL");
  const [method, setMethod] = useState("ALL");
  const [outcome, setOutcome] = useState("ALL");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const next = await getExternalApiLogs(page, pageSize, review);
      setResult(next);
      setSelected((current) => next.items.find((item) => item.externalApiLogId === current?.externalApiLogId));
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause : new AdminApiError(0, "외부 API 로그를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, review]);

  useEffect(() => { void load(); }, [load]);

  const providers = useMemo(() => Array.from(new Set(result?.items.map((item) => item.provider) ?? [])), [result]);
  const methods = useMemo(() => Array.from(new Set(result?.items.map((item) => item.method) ?? [])), [result]);
  const items = useMemo(() => (result?.items ?? []).filter((item) => {
    const keyword = search.trim().toLowerCase();
    return (provider === "ALL" || item.provider === provider)
      && (method === "ALL" || item.method === method)
      && (outcome === "ALL" || item.outcome === outcome)
      && (!keyword || `${item.endpoint} ${item.schoolId} ${item.operation}`.toLowerCase().includes(keyword));
  }), [method, outcome, provider, result, search]);

  const totalPages = Math.max(1, Math.ceil((result?.totalCount ?? 0) / pageSize));
  const isInitialLoading = loading && !result;
  if (isInitialLoading) return <div className="mx-auto flex min-h-[calc(100dvh-50px)] max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> 외부 API 로그를 불러오고 있습니다.</div>;
  if (error && !result) return <div className="mx-auto w-full max-w-[1220px] px-5 pt-5"><ErrorState error={error} retry={() => void load()} /></div>;

  return <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5"><p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">NEIS 등 외부 API 호출 결과와 응답 시간을 확인하세요.</p><section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-3"><h1 className="text-2xl font-extrabold tracking-[-0.03em]">외부 API 로그</h1><span className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" /><p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">총 {result?.totalCount.toLocaleString() ?? 0}건</p></div><p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">필터와 검색은 현재 페이지에 표시된 로그에만 적용됩니다.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-zinc-300 px-4 text-sm font-extrabold hover:border-mint-500 disabled:opacity-50 dark:border-zinc-700"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> 새로고침</button></div><div className="mt-5 grid gap-4 border-t border-zinc-100 pt-5 dark:border-zinc-800 md:grid-cols-2 xl:grid-cols-5"><label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">제공자<select value={provider} onChange={(event) => setProvider(event.target.value)} className="mt-2 h-11 w-full rounded-[10px] border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-950 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-50"><option value="ALL">전체</option>{providers.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">결과<select value={outcome} onChange={(event) => setOutcome(event.target.value)} className="mt-2 h-11 w-full rounded-[10px] border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-950 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-50"><option value="ALL">전체</option><option value="SUCCESS">성공</option><option value="FAILURE">실패</option></select></label><label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">메서드<select value={method} onChange={(event) => setMethod(event.target.value)} className="mt-2 h-11 w-full rounded-[10px] border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-950 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-50"><option value="ALL">전체</option>{methods.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 xl:col-span-2">검색<div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="엔드포인트 또는 학교 ID 검색" className="h-11 w-full rounded-[10px] border border-zinc-300 bg-white pl-9 pr-3 text-sm font-medium placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-50" /></div></label></div></section>{error && result ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">최신 목록을 갱신하지 못했습니다. 이전 목록을 표시합니다. {error.message}</p> : null}<section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419] dark:text-zinc-50"><div className="flex items-center justify-between gap-3 px-5 py-5 md:px-6"><h2 className="text-xl font-extrabold">로그 목록</h2><p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{page} / {totalPages} 페이지</p></div>{items.length ? <div className="overflow-x-auto border-y border-zinc-200 dark:border-zinc-800"><table className="w-full min-w-[1120px] text-left text-sm"><thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400"><tr>{["호출 시각", "제공자", "작업", "메서드", "엔드포인트", "상태", "결과", "응답 시간", "대상 학교", ""].map((label) => <th key={label || "detail"} scope="col" className="whitespace-nowrap px-4 py-3 font-extrabold">{label}</th>)}</tr></thead><tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">{items.map((log) => <tr key={log.externalApiLogId} onClick={() => setSelected(log)} className={`cursor-pointer align-top transition-colors hover:bg-mint-500/[0.04] ${selected?.externalApiLogId === log.externalApiLogId ? "bg-mint-500/[0.07]" : ""}`}><td className="whitespace-nowrap px-4 py-4 font-medium">{formatDateTime(log.createdAt)}</td><td className="px-4 py-4 font-semibold">{log.provider}</td><td className="px-4 py-4 font-semibold">{log.operation}</td><td className="px-4 py-4"><span className="rounded-full border border-zinc-300 px-2.5 py-1 font-mono text-xs font-extrabold dark:border-zinc-700">{log.method}</span></td><td className="max-w-64 px-4 py-4 font-mono text-xs font-semibold"><p className="truncate" title={log.endpoint}>{log.endpoint}</p></td><td className={`px-4 py-4 font-extrabold ${statusClass(log.httpStatus)}`}>{log.httpStatus}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${outcomeClass(log.outcome)}`}>{log.outcome === "SUCCESS" ? "성공" : log.outcome === "FAILURE" ? "실패" : log.outcome}</span></td><td className="whitespace-nowrap px-4 py-4 font-semibold">{log.responseTimeMillis.toLocaleString()}ms</td><td className="max-w-44 truncate px-4 py-4 font-mono text-xs font-semibold" title={log.schoolId}>{log.schoolId}</td><td className="px-4 py-4 text-zinc-400"><ChevronRight className="h-5 w-5" /></td></tr>)}</tbody></table></div> : <div className="px-5 py-16 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-mint-500" /><h2 className="mt-4 text-lg font-extrabold">표시할 외부 API 로그가 없습니다</h2><p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">현재 페이지 또는 필터 조건에서 확인할 로그가 없습니다.</p></div>}<div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><label className="flex items-center gap-2 text-sm font-bold">목록 표시 수<select value={pageSize} onChange={(event) => { setPage(1); setPageSize(Number(event.target.value)); }} className="h-9 rounded-lg border border-zinc-300 bg-white px-2 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-50">{PAGE_SIZES.map((size) => <option key={size} value={size}>{size}개</option>)}</select></label><div className="flex items-center gap-2"><button type="button" aria-label="이전 페이지" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading} className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 disabled:opacity-40 dark:border-zinc-700"><ChevronLeft className="h-4 w-4" /></button><span className="min-w-20 text-center text-sm font-bold">{page} / {totalPages}</span><button type="button" aria-label="다음 페이지" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages || loading} className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 disabled:opacity-40 dark:border-zinc-700"><ChevronRight className="h-4 w-4" /></button></div></div></section><section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><h2 className="text-xl font-extrabold">로그 상세 정보</h2>{selected ? <span className="rounded-full border border-mint-500/30 bg-mint-500/10 px-2.5 py-1 text-xs font-extrabold text-mint-700 dark:text-mint-300">선택된 로그</span> : null}</div>{selected ? <p className="break-all font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-400">로그 ID: {selected.externalApiLogId}</p> : null}</div>{selected ? <dl className="mt-5 grid gap-x-6 gap-y-5 border-t border-zinc-100 pt-5 text-sm dark:border-zinc-800 sm:grid-cols-2 xl:grid-cols-5">{[["제공자", selected.provider], ["작업", selected.operation], ["메서드", selected.method], ["실패 코드", selected.failureCode || "-"], ["호출 시각", formatDateTime(selected.createdAt)], ["학교 ID", selected.schoolId], ["급식일", selected.mealDate], ["식사", mealLabels[selected.mealType] ?? selected.mealType], ["엔드포인트", selected.endpoint], ["HTTP 상태", String(selected.httpStatus)], ["결과", selected.outcome === "SUCCESS" ? "성공" : selected.outcome === "FAILURE" ? "실패" : selected.outcome], ["응답 시간", `${selected.responseTimeMillis.toLocaleString()}ms`]].map(([label, value]) => <div key={label}><dt className="font-bold text-zinc-500 dark:text-zinc-400">{label}</dt><dd className="mt-1 break-all font-extrabold">{value}</dd></div>)}</dl> : <div className="mt-5 border-t border-zinc-100 pt-10 text-center text-sm font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">로그 행을 선택하면 호출 상세 정보를 표시합니다.</div>}</section></div>;
}
