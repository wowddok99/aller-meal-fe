"use client";

import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Inbox, LoaderCircle, Search, XCircle } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AdminSelectMenu } from "@/components/admin/admin-select-menu";
import { createLatestAdminOperationRequestTracker, getAdminOperationDisplayId, getAdminOperationFailureKind, getAdminOperationItemKey, getAdminOperationLoadErrorState, hasSameAdminOperationId } from "@/components/admin/admin-operation-list-utils";
import { AdminApiError, createIdempotencyKey, type AdminOperationItem, type AdminOperationPage, type AdminOperationQuery, isAdminActionId, reprocessDeadLetterEvent, requestRecollection } from "@/lib/admin-api";

const PAGE_SIZES = [10, 20, 50];
const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101419]";

type Filter = { key: Exclude<keyof AdminOperationQuery, "page" | "pageSize" | "query">; label: string; options?: Array<{ value: string; label: string }>; freeText?: boolean };
type Action = { status: string; label: string; run: (id: string, idempotencyKey: string) => Promise<unknown>; success: string };
export type AdminOperationListProps = {
  title: string; description: string; itemName: string; statusOptions: Array<{ value: string; label: string }>;
  filters?: Filter[]; load: (query: AdminOperationQuery) => Promise<AdminOperationPage>; action?: Action;
};

function formatDateTime(value: string) {
  if (!value || value === "미제공") return "미제공";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short", hour12: false }).format(date);
}
function selectWithKeyboard(event: KeyboardEvent<HTMLElement>, select: () => void) {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); }
}
function ErrorState({ error, retry, loginHref }: { error: AdminApiError; retry: () => void; loginHref: string }) {
  const state = getAdminOperationLoadErrorState(error.status);
  const title = state === "login-required" ? "로그인이 필요합니다" : state === "admin-forbidden" ? "관리자 권한이 필요합니다" : "목록을 불러오지 못했습니다";
  const copy = state === "login-required" ? "로그인한 후 다시 확인해 주세요." : state === "admin-forbidden" ? "이 화면은 관리자만 확인할 수 있습니다." : error.message;
  return <section role="alert" className="rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-950 dark:bg-[#101419]"><AlertTriangle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-extrabold">{title}</h1><p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">{copy}</p>{state === "login-required" ? <Link href={loginHref} className={`mt-5 inline-flex min-h-11 items-center rounded-[10px] border border-zinc-300 px-5 font-bold dark:border-zinc-700 ${focusRing}`}>로그인</Link> : state === "generic-error" ? <button type="button" onClick={retry} className={`mt-5 min-h-11 rounded-[10px] border border-zinc-300 px-5 font-bold dark:border-zinc-700 ${focusRing}`}>다시 시도</button> : null}</section>;
}

function AdminOperationListLoading({ itemName }: Pick<AdminOperationListProps, "itemName">) {
  return <div role="status" aria-live="polite" aria-busy="true" className="mx-auto flex min-h-[calc(100dvh-50px)] max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> {itemName} 목록을 준비하고 있습니다.</div>;
}

export function AdminOperationList(props: AdminOperationListProps) {
  return <Suspense fallback={<AdminOperationListLoading itemName={props.itemName} />}><AdminOperationListContent {...props} /></Suspense>;
}

function AdminOperationListContent({ title, description, itemName, statusOptions, filters = [], load, action }: AdminOperationListProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initial = useMemo(() => {
    const status = searchParams.get("status") ?? "ALL";
    const pageValue = Number(searchParams.get("page"));
    const pageSizeValue = Number(searchParams.get("pageSize"));
    return {
      status: statusOptions.some((option) => option.value === status) ? status : "ALL",
      values: Object.fromEntries(filters.map((filter) => [filter.key, filter.freeText ? (searchParams.get(filter.key) ?? "") : (filter.options?.some((option) => option.value === searchParams.get(filter.key)) ? searchParams.get(filter.key)! : "ALL")])) as Record<string, string>,
      query: searchParams.get("query") ?? "",
      page: Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1,
      pageSize: PAGE_SIZES.includes(pageSizeValue) ? pageSizeValue : 20,
    };
  }, [filters, searchParams, statusOptions]);
  const [result, setResult] = useState<AdminOperationPage>();
  const [page, setPage] = useState(initial.page);
  const [pageSize, setPageSize] = useState(initial.pageSize);
  const [status, setStatus] = useState(initial.status);
  const [filterValues, setFilterValues] = useState(initial.values);
  const [search, setSearch] = useState(initial.query);
  const [submittedSearch, setSubmittedSearch] = useState(initial.query.trim());
  const [selected, setSelected] = useState<AdminOperationItem>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminApiError>();
  const [actionMessage, setActionMessage] = useState<{ kind: "success" | "error"; text: string }>();
  const [processingId, setProcessingId] = useState<string>();
  const tracker = useRef(createLatestAdminOperationRequestTracker());

  const query = useMemo<AdminOperationQuery>(() => ({
    page, pageSize,
    ...(status !== "ALL" ? { status } : {}),
    ...Object.fromEntries(Object.entries(filterValues).filter(([, value]) => value && value !== "ALL")),
    ...(submittedSearch ? { query: submittedSearch } : {}),
  }), [filterValues, page, pageSize, status, submittedSearch]);
  const loginHref = useMemo(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 20) params.set("pageSize", String(pageSize));
    if (status !== "ALL") params.set("status", status);
    Object.entries(filterValues).forEach(([key, value]) => { if (value && value !== "ALL") params.set(key, value); });
    if (submittedSearch) params.set("query", submittedSearch);
    const next = params.toString() ? `${pathname}?${params}` : pathname;
    return `/auth/login?next=${encodeURIComponent(next)}`;
  }, [filterValues, page, pageSize, pathname, status, submittedSearch]);
  const latestQuery = useRef(query); latestQuery.current = query;

  const loadCurrent = useCallback(async (requested = latestQuery.current) => {
    const requestId = tracker.current.begin(); setLoading(true); setError(undefined); setResult(undefined);
    try {
      const next = await load(requested);
      if (!tracker.current.isCurrent(requestId)) return;
      setResult(next);
      setSelected((current) => next.items.find((item) => hasSameAdminOperationId(item.id, current?.id)));
    } catch (cause) {
      if (!tracker.current.isCurrent(requestId)) return;
      setSelected(undefined); setError(cause instanceof AdminApiError ? cause : new AdminApiError(0, `${itemName} 목록을 불러오지 못했습니다.`));
    } finally { if (tracker.current.isCurrent(requestId)) setLoading(false); }
  }, [itemName, load]);

  useEffect(() => { void loadCurrent(query); }, [loadCurrent, query]);
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 20) params.set("pageSize", String(pageSize));
    if (status !== "ALL") params.set("status", status);
    Object.entries(filterValues).forEach(([key, value]) => { if (value && value !== "ALL") params.set(key, value); });
    if (submittedSearch) params.set("query", submittedSearch);
    const next = params.toString() ? `${pathname}?${params}` : pathname;
    window.history.replaceState(null, "", next);
  }, [filterValues, page, pageSize, pathname, status, submittedSearch]);

  const changeFilter = (key: string, value: string) => { setPage(1); setSelected(undefined); setFilterValues((current) => ({ ...current, [key]: value })); };
  const clearFilters = () => { setPage(1); setStatus("ALL"); setFilterValues(Object.fromEntries(filters.map((filter) => [filter.key, filter.freeText ? "" : "ALL"]))); setSearch(""); setSubmittedSearch(""); };
  const totalCount = result?.totalCount ?? 0;
  const currentPage = result?.page ?? page;
  const totalPages = Math.max(1, Math.ceil(totalCount / (result?.pageSize ?? pageSize)));
  const items = result?.items ?? [];
  const actionItem = selected && selected.status === action?.status && isAdminActionId(selected.actionId) ? selected : undefined;
  const runAction = async () => {
    if (!action || !actionItem?.actionId || processingId) return;
    setProcessingId(actionItem.actionId); setActionMessage(undefined);
    try { await action.run(actionItem.actionId, createIdempotencyKey()); setActionMessage({ kind: "success", text: action.success }); await loadCurrent(latestQuery.current); }
    catch (cause) {
      const actionError = cause instanceof AdminApiError ? cause : new AdminApiError(0, "요청을 처리하지 못했습니다.");
      const kind = getAdminOperationFailureKind(actionError.status);
      if (actionError.status === 401 || actionError.status === 403) { setActionMessage(undefined); setSelected(undefined); setResult(undefined); setError(actionError); return; }
      setActionMessage({ kind: "error", text: kind === "conflict" ? "상태가 이미 변경되어 최신 목록을 다시 불러왔습니다." : kind === "not-found" ? "대상을 찾을 수 없어 최신 목록을 다시 불러왔습니다." : "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." });
      if (kind === "conflict" || kind === "not-found") await loadCurrent(latestQuery.current);
    }
    finally { setProcessingId(undefined); }
  };

  if (loading && !result) return <div role="status" aria-busy="true" className="mx-auto flex min-h-[calc(100dvh-50px)] max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> {itemName} 목록을 불러오고 있습니다.</div>;
  if (error && !result) return <div className="mx-auto w-full max-w-[1220px] px-5 pt-5"><ErrorState error={error} retry={() => void loadCurrent()} loginHref={loginHref} /></div>;

  return <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
    <header><p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">{description}</p><h1 className="mt-3 text-2xl font-extrabold tracking-[-0.02em]">{title}</h1></header>
    <section aria-label={`${itemName} 목록`} aria-busy={loading} className="overflow-visible rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419] dark:text-zinc-50">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-6"><p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">총 {totalCount.toLocaleString()}건</p><div className="flex items-center gap-2"><span className="text-sm font-bold">목록 표시 수</span><AdminSelectMenu label="목록 표시 수" value={String(pageSize)} options={PAGE_SIZES.map((size) => ({ value: String(size), label: `${size}개` }))} onChange={(value) => { setPage(1); setPageSize(Number(value)); }} compact /></div></div>
      <form onSubmit={(event) => { event.preventDefault(); setPage(1); setSubmittedSearch(search.trim()); }} className="border-y border-zinc-100 px-5 py-5 dark:border-zinc-800 md:px-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div><p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">상태</p><AdminSelectMenu label={`${itemName} 상태`} value={status} options={[{ value: "ALL", label: "전체" }, ...statusOptions]} onChange={(value) => { setPage(1); setSelected(undefined); setStatus(value); }} /></div>{filters.map((filter) => <div key={filter.key}><label className="mb-2 block text-xs font-semibold text-zinc-500 dark:text-zinc-400" htmlFor={`${title}-${filter.key}`}>{filter.label}</label>{filter.freeText ? <input id={`${title}-${filter.key}`} value={filterValues[filter.key] ?? ""} onChange={(event) => changeFilter(filter.key, event.target.value)} placeholder={`${filter.label} 입력`} className={`h-11 w-full rounded-[10px] border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-50 ${focusRing}`} /> : <AdminSelectMenu label={filter.label} value={filterValues[filter.key] ?? "ALL"} options={[{ value: "ALL", label: "전체" }, ...(filter.options ?? [])]} onChange={(value) => changeFilter(filter.key, value)} />}</div>)}<div><label className="mb-2 block text-xs font-semibold text-zinc-500 dark:text-zinc-400" htmlFor={`${title}-query`}>검색</label><div className="flex gap-2"><div className="relative min-w-0 flex-1"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><input id={`${title}-query`} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="검색어 입력" className={`h-11 w-full rounded-[10px] border border-zinc-300 bg-white pl-9 pr-3 text-sm font-medium text-zinc-950 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-50 ${focusRing}`} /></div><button type="submit" className={`min-h-11 rounded-[10px] border border-zinc-300 px-3 text-sm font-extrabold dark:border-zinc-700 ${focusRing}`}>검색</button></div></div></div></form>
      {items.length ? <><div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[760px] table-fixed text-left text-sm"><thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400"><tr>{["항목", "상태", "생성 시각", "갱신 시각"].map((label) => <th key={label} scope="col" className="px-5 py-3 font-extrabold">{label}</th>)}</tr></thead><tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">{items.map((item, index) => <tr key={getAdminOperationItemKey(title, index, item.id)} onClick={() => setSelected(item)} className={`cursor-pointer align-top transition-colors ${hasSameAdminOperationId(selected?.id, item.id) ? "bg-mint-500/[0.06]" : "hover:bg-mint-500/[0.03]"}`}><td className="break-all px-5 py-4 font-bold"><button type="button" onClick={() => setSelected(item)} aria-pressed={hasSameAdminOperationId(selected?.id, item.id)} aria-label={`${item.title} 상세 보기`} className={`w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 ${focusRing}`}>{item.title}<span className="mt-1 block font-mono text-xs font-medium text-zinc-500">{getAdminOperationDisplayId(item.id)}</span></button></td><td className="px-5 py-4 font-bold">{item.status}</td><td className="px-5 py-4 font-semibold">{formatDateTime(item.createdAt)}</td><td className="px-5 py-4 font-semibold">{formatDateTime(item.updatedAt)}</td></tr>)}</tbody></table></div><div className="lg:hidden">{items.map((item, index) => <article key={getAdminOperationItemKey(title, index, item.id)} role="button" tabIndex={0} aria-pressed={hasSameAdminOperationId(selected?.id, item.id)} onClick={() => setSelected(item)} onKeyDown={(event) => selectWithKeyboard(event, () => setSelected(item))} className={`cursor-pointer border-b border-zinc-200 p-5 last:border-b-0 dark:border-zinc-800 ${hasSameAdminOperationId(selected?.id, item.id) ? "bg-mint-500/[0.06]" : "hover:bg-mint-500/[0.03]"}`}><div className="flex items-start justify-between gap-3"><p className="break-all font-bold">{item.title}</p><strong className="text-sm">{item.status}</strong></div><p className="mt-2 break-all font-mono text-xs text-zinc-500">{getAdminOperationDisplayId(item.id)}</p><p className="mt-4 text-sm font-semibold text-zinc-500">{formatDateTime(item.updatedAt)}</p></article>)}</div></> : <div className="px-5 py-16 text-center"><Inbox className="mx-auto h-10 w-10 text-zinc-400" /><h2 className="mt-4 text-lg font-extrabold">조건에 맞는 {itemName}이 없습니다</h2><p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">서버 전체 결과에서 조건에 맞는 항목을 찾지 못했습니다.</p><button type="button" onClick={clearFilters} className={`mt-5 min-h-11 rounded-[10px] border border-zinc-300 px-4 text-sm font-extrabold dark:border-zinc-700 ${focusRing}`}>필터 지우기</button></div>}
      <div className="flex justify-center border-t border-zinc-200 px-5 py-4 dark:border-zinc-800"><div className="flex items-center gap-2"><button type="button" aria-label="이전 페이지" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1 || loading} className={`flex h-11 w-11 items-center justify-center rounded-[10px] border border-zinc-300 disabled:opacity-40 dark:border-zinc-700 ${focusRing}`}><ChevronLeft className="h-4 w-4" /></button><span className="min-w-20 text-center text-sm font-bold">{currentPage} / {totalPages}</span><button type="button" aria-label="다음 페이지" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages || loading} className={`flex h-11 w-11 items-center justify-center rounded-[10px] border border-zinc-300 disabled:opacity-40 dark:border-zinc-700 ${focusRing}`}><ChevronRight className="h-4 w-4" /></button></div></div>
    </section>
    <section aria-labelledby={`${title}-detail`} className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419] dark:text-zinc-50"><div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 md:px-6"><h2 id={`${title}-detail`} className="text-xl font-extrabold">{itemName} 상세</h2>{actionItem ? <button type="button" onClick={() => void runAction()} disabled={Boolean(processingId)} className={`min-h-11 rounded-[10px] bg-mint-500 px-4 text-sm font-extrabold text-white disabled:opacity-50 ${focusRing}`}>{processingId ? "처리 중" : action?.label}</button> : null}</div>{selected ? <dl className="grid gap-x-6 gap-y-5 border-t border-zinc-100 px-5 py-5 text-sm dark:border-zinc-800 md:px-6 sm:grid-cols-2 xl:grid-cols-4">{[["ID", getAdminOperationDisplayId(selected.id)], ...selected.fields, ["생성 시각", formatDateTime(selected.createdAt)], ["갱신 시각", formatDateTime(selected.updatedAt)]].map(([label, value]) => <div key={label}><dt className="font-semibold text-zinc-500 dark:text-zinc-400">{label}</dt><dd className="mt-1 break-all font-extrabold">{value}</dd></div>)}</dl> : <div className="border-t border-zinc-100 px-5 py-12 text-center text-sm font-medium text-zinc-500 dark:border-zinc-800">행을 선택하면 상세 정보를 표시합니다.</div>}</section>
    {actionMessage ? <section aria-live="polite" className={`rounded-2xl border bg-white p-5 dark:bg-[#101419] ${actionMessage.kind === "success" ? "border-mint-500/50 text-mint-700 dark:text-mint-300" : "border-red-200 text-red-700 dark:border-red-900 dark:text-red-300"}`}><div className="flex items-start gap-3">{actionMessage.kind === "success" ? <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" /> : <XCircle className="mt-0.5 h-6 w-6 shrink-0" />}<p className="font-bold">{actionMessage.text}</p></div></section> : null}
  </div>;
}

export const collectionRecollectionAction: Action = { status: "FAILED", label: "이 작업 재수집", success: "재수집 요청을 등록하고 최신 목록을 불러왔습니다.", run: requestRecollection };
export const dlqReprocessAction: Action = { status: "PENDING", label: "이 이벤트 재처리", success: "재처리 요청을 등록하고 최신 목록을 불러왔습니다.", run: reprocessDeadLetterEvent };
