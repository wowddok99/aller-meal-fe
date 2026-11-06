"use client";

import { SuccessToast, useSuccessToast } from "@/components/success-toast";

import { RefreshCw, ChevronLeft, ChevronRight, Inbox, LoaderCircle, MoreVertical, Search } from "lucide-react";
import { Suspense, useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ApiNotice } from "@/components/api-notice";
import { ModalDialog } from "@/components/modal-dialog";
import { PageHeading } from "@/components/page-heading";
import { DatePicker } from "@/components/date-picker";
import { AdminSelectMenu } from "@/components/admin/admin-select-menu";
import { canConfirmAdminOperation, createAdminOperationIntentTracker, createLatestAdminOperationRequestTracker, getAdminOperationDisplayId, getAdminOperationFailureKind, getAdminOperationItemKey, getAdminOperationLoadErrorState, getAdminOperationQueryErrors, getSchoolSearchQuery, hasSameAdminOperationId, normalizeAdminOperationSearch } from "@/components/admin/admin-operation-list-utils";
import { AdminApiError, createIdempotencyKey, type AdminOperationItem, type AdminOperationPage, type AdminOperationQuery, isAdminActionId, reprocessDeadLetterEvent, requestRecollection } from "@/lib/admin-api";

const PAGE_SIZES = [10, 20, 50];
const DETAIL_TIMESTAMP_FIELDS = new Set(["발생 시각", "발행 시각", "재처리 시각", "다음 시도", "발송 시각"]);
const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101419]";

type Filter = { key: Exclude<keyof AdminOperationQuery, "page" | "pageSize" | "query">; label: string; options?: Array<{ value: string; label: string }>; freeText?: boolean; inputType?: "date"; allowUnknownValue?: boolean };
type Action = { status: string; label: string; run: (id: string, idempotencyKey: string, options?: { mutationErrorDisplay: "local" }) => Promise<unknown>; success: string };
export type AdminOperationListProps = {
  title: string; description: string; itemName: string; statusOptions: Array<{ value: string; label: string }>;
  primaryColumnLabel?: string;
  idColumnLabel?: string;
  additionalColumns?: Array<"학교" | "채널" | "발송 사유">;
  notificationIdSearch?: boolean;
  filters?: Filter[]; schoolSearch?: boolean; load: (query: AdminOperationQuery) => Promise<AdminOperationPage>; action?: Action;
  renderDetail?: (selected: AdminOperationItem | undefined, refresh: () => Promise<void>) => ReactNode;
  renderStatus?: (item: AdminOperationItem) => ReactNode;
  getInitialStatus?: (params: Pick<URLSearchParams, "get">) => string;
};

function getFilterGridClass(filterCount: number) {
  if (filterCount >= 3) return "md:grid-cols-2 xl:grid-cols-4";
  if (filterCount === 2) return "md:grid-cols-2 xl:grid-cols-4";
  if (filterCount === 1) return "md:grid-cols-2 xl:grid-cols-3";
  return "md:grid-cols-2";
}

function formatDateTime(value: string) {
  if (!value || value === "미제공") return "미제공";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short", hour12: false }).format(date);
}
function formatDetailValue(label: string, value: string) {
  return DETAIL_TIMESTAMP_FIELDS.has(label) ? formatDateTime(value) : value;
}
function selectWithKeyboard(event: KeyboardEvent<HTMLElement>, select: () => void) {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); }
}
function getFilterOptions(filter: Filter, value: string) {
  const options = filter.options ?? [];
  const unknown = filter.allowUnknownValue && value && value !== "ALL" && !options.some((option) => option.value === value);
  return [{ value: "ALL", label: "전체" }, ...options, ...(unknown ? [{ value, label: `기타 (${value})` }] : [])];
}
function getInitialFilterValue(filter: Filter, params: Pick<URLSearchParams, "get">) {
  const value = params.get(filter.key)?.trim() ?? "";
  if (filter.freeText) return value;
  return value && (filter.allowUnknownValue || filter.options?.some((option) => option.value === value)) ? value : "ALL";
}
function AdminOperationItemTitle({ item }: { item: AdminOperationItem }) {
  return <><span className="block break-words font-bold">{item.title}</span>{item.subtitle ? <span className="mt-1 block break-all text-xs font-medium text-zinc-500 dark:text-zinc-400">{item.subtitle}</span> : null}</>;
}
function AdminOperationActionMenu({ label, itemName, processing, onAction }: { label: string; itemName: string; processing: boolean; onAction: () => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open || processing) return;
    itemRef.current?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
      else if (event.key === "Tab") setOpen(false);
      else if (menuRef.current?.contains(document.activeElement) && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) { event.preventDefault(); itemRef.current?.focus(); }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", handleKey); };
  }, [open, processing]);

  return <div ref={menuRef} className="relative -mr-2">
    <button ref={triggerRef} type="button" aria-label={processing ? `${itemName} 작업 요청 중` : `${itemName} 작업 메뉴`} aria-haspopup="menu" aria-controls={open && !processing ? menuId : undefined} aria-expanded={open && !processing} aria-busy={processing} disabled={processing} onClick={() => setOpen((value) => !value)} onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); } }} className={`inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-50 ${focusRing} dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white`}>{processing ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <MoreVertical className="h-5 w-5" aria-hidden="true" />}</button>
    {open && !processing ? <div id={menuId} role="menu" aria-label={`${itemName} 작업 메뉴`} className="absolute right-0 top-full z-20 mt-2 w-40 rounded-xl border border-zinc-200 bg-white p-1.5 text-left shadow-lg dark:border-zinc-700 dark:bg-[#151b22]"><button ref={itemRef} type="button" role="menuitem" onClick={() => { setOpen(false); triggerRef.current?.focus(); onAction(); }} className={`flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 ${focusRing}`}>{label}</button></div> : null}
  </div>;
}
function getAdditionalColumnValue(item: AdminOperationItem, label: string) {
  return item.fields.find(([field]) => field === label)?.[1] ?? "미제공";
}
function ErrorState({ error, retry, loginHref }: { error: AdminApiError; retry: () => void; loginHref: string }) {
  const state = getAdminOperationLoadErrorState(error.status);
  const title = state === "login-required" ? "로그인이 필요합니다" : state === "admin-forbidden" ? "관리자 권한이 필요합니다" : "목록을 불러오지 못했습니다";
  const copy = state === "login-required" ? "로그인한 후 다시 확인해 주세요." : state === "admin-forbidden" ? "이 화면은 관리자만 확인할 수 있습니다." : error.status === 0 ? "잠시 후 다시 시도해 주세요." : error.message;
  return <div className="px-5 py-8 sm:py-10">
    <ApiNotice centered title={title} action={state === "login-required" ? <Link href={loginHref} className={`inline-flex min-h-10 items-center rounded-[10px] border border-zinc-300 px-4 text-sm font-semibold dark:border-zinc-700 ${focusRing}`}>로그인</Link> : state === "generic-error" ? <button type="button" onClick={retry} className={`inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-zinc-300 px-3 text-xs font-semibold dark:border-zinc-700 ${focusRing}`}><RefreshCw aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> 다시 시도</button> : null}>{copy}</ApiNotice>
  </div>;
}

function AdminOperationListLoading({ title, description, itemName }: Pick<AdminOperationListProps, "title" | "description" | "itemName">) {
  return <div className="mx-auto w-full max-w-[1220px] px-5 pb-12 pt-5"><PageHeading title={title} description={description} parents={[{ label: "서비스 관리", href: "/admin" }]} /><div role="status" aria-live="polite" aria-busy="true" className="flex min-h-64 items-center justify-center text-sm font-bold text-zinc-500"><LoaderCircle aria-hidden="true" className="mr-2 h-5 w-5 animate-spin" /> {itemName} 목록을 불러오고 있습니다.</div></div>;
}

export function AdminOperationList(props: AdminOperationListProps) {
  return <Suspense fallback={<AdminOperationListLoading title={props.title} description={props.description} itemName={props.itemName} />}><AdminOperationListContent {...props} /></Suspense>;
}

function AdminOperationListContent({ title, description, itemName, statusOptions, primaryColumnLabel = "항목", idColumnLabel, additionalColumns = [], filters = [], schoolSearch = false, notificationIdSearch = false, load, action, renderDetail, renderStatus, getInitialStatus }: AdminOperationListProps) {
  const customDetail = Boolean(renderDetail);
  const searchInputId = useId();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const renderedFilters = schoolSearch ? filters.filter((filter) => filter.key !== "schoolId") : filters;
  const initial = useMemo(() => {
    const status = getInitialStatus?.(searchParams) ?? searchParams.get("status") ?? "ALL";
    const pageValue = Number(searchParams.get("page"));
    const pageSizeValue = Number(searchParams.get("pageSize"));
    return {
      status: statusOptions.some((option) => option.value === status) ? status : "ALL",
      values: Object.fromEntries(renderedFilters.map((filter) => [filter.key, getInitialFilterValue(filter, searchParams)])) as Record<string, string>,
      query: searchParams.get("query") ?? (schoolSearch ? searchParams.get("schoolId") ?? "" : ""),
      page: Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1,
      pageSize: PAGE_SIZES.includes(pageSizeValue) ? pageSizeValue : 10,
    };
  }, [getInitialStatus, renderedFilters, schoolSearch, searchParams, statusOptions]);
  const [result, setResult] = useState<AdminOperationPage>();
  const [page, setPage] = useState(initial.page);
  const [pageSize, setPageSize] = useState(initial.pageSize);
  const [status, setStatus] = useState(initial.status);
  const [filterValues, setFilterValues] = useState(initial.values);
  const [search, setSearch] = useState(initial.query);
  const [submittedSearch, setSubmittedSearch] = useState(normalizeAdminOperationSearch(initial.query, notificationIdSearch));
  const [selected, setSelected] = useState<AdminOperationItem>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminApiError>();
  const [actionMessage, setActionMessage] = useState<{ kind: "error"; text: string }>();
  const { notice, notify } = useSuccessToast();
  const [processingId, setProcessingId] = useState<string>();
  const [confirmationId, setConfirmationId] = useState<string>();
  const cancelActionRef = useRef<HTMLButtonElement>(null);
  const actionPending = useRef(false);
  const actionIntents = useRef(createAdminOperationIntentTracker());
  const tracker = useRef(createLatestAdminOperationRequestTracker());

  const searchQuery = useMemo(() => schoolSearch ? getSchoolSearchQuery(submittedSearch) : (submittedSearch ? { query: submittedSearch } : {}), [schoolSearch, submittedSearch]);
  const query = useMemo<AdminOperationQuery>(() => ({
    page, pageSize,
    ...(status !== "ALL" ? { status } : {}),
    ...Object.fromEntries(Object.entries(filterValues).filter(([, value]) => value && value !== "ALL")),
    ...(filterValues.unresolvedFailure === "true" ? { unresolvedFailure: true } : filterValues.unresolvedFailure === "false" ? { unresolvedFailure: false } : {}),
    ...searchQuery,
  }), [filterValues, page, pageSize, searchQuery, status]);
  const queryErrors = getAdminOperationQueryErrors(query, notificationIdSearch);
  const invalidQuery = Object.keys(queryErrors).length > 0;
  const searchError = normalizeAdminOperationSearch(search, notificationIdSearch) === submittedSearch ? queryErrors.query : undefined;
  const loginHref = useMemo(() => {
    const params = new URLSearchParams();
    if (renderDetail && searchParams.get("collectionJobId")) params.set("collectionJobId", searchParams.get("collectionJobId")!);
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 10) params.set("pageSize", String(pageSize));
    if (status !== "ALL") params.set("status", status);
    Object.entries(filterValues).forEach(([key, value]) => { if (value && value !== "ALL") params.set(key, value); });
    Object.entries(searchQuery).forEach(([key, value]) => params.set(key, value));
    const next = params.toString() ? `${pathname}?${params}` : pathname;
    return `/auth/login?next=${encodeURIComponent(next)}`;
  }, [filterValues, page, pageSize, pathname, searchQuery, status, renderDetail, searchParams]);
  const latestQuery = useRef(query); latestQuery.current = query;

  const loadCurrent = useCallback(async (requested = latestQuery.current) => {
    const requestId = tracker.current.begin(); setLoading(true); setError(undefined);
    if (Object.keys(getAdminOperationQueryErrors(requested, notificationIdSearch)).length) {
      setResult(undefined); setSelected(undefined); setActionMessage(undefined); setLoading(false);
      return;
    }
    try {
      const next = await load(requested);
      if (!tracker.current.isCurrent(requestId)) return;
      setResult(next);
      setSelected((current) => next.items.find((item) => hasSameAdminOperationId(item.id, current?.id)) ?? (customDetail ? current : undefined));
    } catch (cause) {
      if (!tracker.current.isCurrent(requestId)) return;
      setResult(undefined); setSelected(undefined); setError(cause instanceof AdminApiError ? cause : new AdminApiError(0, `${itemName} 목록을 불러오지 못했습니다.`));
    } finally { if (tracker.current.isCurrent(requestId)) setLoading(false); }
  }, [itemName, load, customDetail, notificationIdSearch]);

  useEffect(() => { const requestTracker = tracker.current; void loadCurrent(query); return () => requestTracker.invalidate(); }, [loadCurrent, query]);
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 10) params.set("pageSize", String(pageSize));
    if (status !== "ALL") params.set("status", status);
    Object.entries(filterValues).forEach(([key, value]) => { if (value && value !== "ALL") params.set(key, value); });
    if (renderDetail && searchParams.get("collectionJobId")) params.set("collectionJobId", searchParams.get("collectionJobId")!);
    if (submittedSearch) params.set("query", submittedSearch);
    const next = params.toString() ? `${pathname}?${params}` : pathname;
    window.history.replaceState(null, "", next);
  }, [filterValues, page, pageSize, pathname, status, submittedSearch, renderDetail, searchParams]);

  const prepareQueryChange = () => { tracker.current.invalidate(); setSelected(undefined); setActionMessage(undefined); setError(undefined); setLoading(true); };
  const changeFilter = (key: string, value: string) => {
    if (filterValues[key] === value) return;
    prepareQueryChange(); setPage(1); setFilterValues((current) => ({ ...current, [key]: value }));
  };
  const changeStatus = (value: string) => { if (value !== status) { prepareQueryChange(); setPage(1); setStatus(value); } };
  const changePage = (value: number) => { if (value !== page) { prepareQueryChange(); setPage(value); } };
  const changePageSize = (value: number) => { if (value !== pageSize) { prepareQueryChange(); setPage(1); setPageSize(value); } };
  const clearFilters = () => {
    prepareQueryChange(); setPage(1); setStatus("ALL"); setFilterValues(Object.fromEntries(renderedFilters.map((filter) => [filter.key, filter.freeText ? "" : "ALL"]))); setSearch(""); setSubmittedSearch("");
  };
  const totalCount = result?.totalCount ?? 0;
  const currentPage = result?.page ?? page;
  const totalPages = Math.max(1, Math.ceil(totalCount / (result?.pageSize ?? pageSize)));
  const items = result?.items ?? [];
  const selectedItemId = customDetail ? searchParams.get("collectionJobId")?.toLowerCase() : selected?.id;
  const isItemSelected = (item: AdminOperationItem) => hasSameAdminOperationId(selectedItemId, customDetail ? item.id?.toLowerCase() : item.id);
  const selectItem = (item: AdminOperationItem) => {
    if (!customDetail) { setSelected(item); return; }
    if (!item.id) return;
    const params = new URLSearchParams(window.location.search);
    const collectionJobId = item.id.toLowerCase();
    if (params.get("collectionJobId") === collectionJobId) return;
    params.set("collectionJobId", collectionJobId);
    window.history.pushState(null, "", `${pathname}?${params}`);
  };
  const filterGridClass = getFilterGridClass(renderedFilters.length);
  const searchGridClass = renderedFilters.length >= 3 ? "xl:col-span-2" : "";
  const applySearch = () => {
    const normalized = normalizeAdminOperationSearch(search, notificationIdSearch);
    prepareQueryChange(); setSearch(normalized);
    if (normalized === submittedSearch && page === 1) { void loadCurrent(); return; }
    setPage(1); setSubmittedSearch(normalized);
    if (getAdminOperationQueryErrors({ query: normalized }, notificationIdSearch).query) { setResult(undefined); setLoading(false); }
  };
  const actionItem = selected && selected.status === action?.status && isAdminActionId(selected.actionId) ? selected : undefined;
  const runAction = async () => {
    if (!action || !actionItem?.actionId || !canConfirmAdminOperation(confirmationId, actionItem.actionId, actionPending.current) || !actionIntents.current.canStart(actionItem.actionId)) return;
    setConfirmationId(undefined);
    actionPending.current = true;
    const targetId = actionItem.actionId;
    const key = actionIntents.current.keyFor(targetId, createIdempotencyKey);
    setProcessingId(actionItem.actionId); setActionMessage(undefined); notify("");
    try { await action.run(targetId, key, { mutationErrorDisplay: "local" }); actionIntents.current.complete(targetId); notify(action.success); await loadCurrent(latestQuery.current); }
    catch (cause) {
      const actionError = cause instanceof AdminApiError ? cause : new AdminApiError(0, "요청을 처리하지 못했습니다.");
      const kind = getAdminOperationFailureKind(actionError.status);
      if (actionError.code !== "MUTATION_RESULT_UNKNOWN") actionIntents.current.complete(targetId);
      if (actionError.status === 401 || actionError.status === 403) { setActionMessage(undefined); setSelected(undefined); setResult(undefined); setError(actionError); return; }
      setActionMessage({ kind: "error", text: actionError.code === "MUTATION_RESULT_UNKNOWN" ? actionError.message : kind === "conflict" ? "상태가 이미 변경되어 최신 목록을 다시 불러왔습니다." : kind === "not-found" ? "대상을 찾을 수 없어 최신 목록을 다시 불러왔습니다." : "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." });
      if (actionError.code === "MUTATION_RESULT_UNKNOWN") setSelected(undefined);
      if (kind === "conflict" || kind === "not-found" || actionError.code === "MUTATION_RESULT_UNKNOWN") await loadCurrent(latestQuery.current);
    }
    finally { actionPending.current = false; setProcessingId(undefined); }
  };


  return <div className={`mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pt-5 ${customDetail ? "pb-40" : "pb-12"}`}>
    <SuccessToast notice={notice} />
    <PageHeading title={title} description={description} parents={[{ label: "서비스 관리", href: "/admin" }]} />
    <section aria-label={`${itemName} 목록`} aria-busy={loading} className="overflow-visible rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419] dark:text-zinc-50">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-6"><p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{invalidQuery ? "검색 조건 확인 필요" : error ? "목록 조회 실패" : loading && !result ? "불러오는 중" : <>총 {totalCount.toLocaleString()}건</>}</p><div className="flex items-center gap-2"><span className="text-sm font-bold">목록 표시 수</span><AdminSelectMenu label="목록 표시 수" value={String(pageSize)} options={PAGE_SIZES.map((size) => ({ value: String(size), label: `${size}개` }))} onChange={(value) => changePageSize(Number(value))} compact /></div></div>
      <form onSubmit={(event) => { event.preventDefault(); applySearch(); }} className="border-y border-zinc-100 p-5 dark:border-zinc-800 md:px-6"><div className={`grid gap-3 ${filterGridClass}`}><div><p className="text-sm font-bold">상태</p><div className="mt-2"><AdminSelectMenu label={`${itemName} 상태`} value={status} options={[{ value: "ALL", label: "전체" }, ...statusOptions]} onChange={changeStatus} /></div></div>{renderedFilters.map((filter) => <div key={filter.key}>{filter.freeText ? <><label className="block text-sm font-bold" htmlFor={`${title}-${filter.key}`}>{filter.label}</label>{filter.inputType === "date" ? <DatePicker id={`${title}-${filter.key}`} label={filter.label} value={filterValues[filter.key] ?? ""} onChange={(value) => changeFilter(filter.key, value)} allowClear className="mt-2 h-11" /> : <input id={`${title}-${filter.key}`} type="text" value={filterValues[filter.key] ?? ""} onChange={(event) => changeFilter(filter.key, event.target.value)} placeholder={filter.inputType ? undefined : `${filter.label} 입력해 주세요.`} className={`mt-2 h-11 w-full rounded-[10px] border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-50 ${focusRing}`} />}</> : <><p className="text-sm font-bold">{filter.label}</p><div className="mt-2"><AdminSelectMenu label={filter.label} value={filterValues[filter.key] ?? "ALL"} options={getFilterOptions(filter, filterValues[filter.key] ?? "ALL")} onChange={(value) => changeFilter(filter.key, value)} /></div></>}{queryErrors[filter.key as keyof typeof queryErrors] ? <p role="alert" className="mt-2 text-sm font-medium text-red-700 dark:text-red-300">{queryErrors[filter.key as keyof typeof queryErrors]}</p> : null}</div>)}<div className={searchGridClass}><label className="block text-sm font-bold" htmlFor={searchInputId}>{schoolSearch ? "학교" : notificationIdSearch ? "알림 ID 검색" : "검색"}</label><div className="relative mt-2"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><input id={searchInputId} type="search" maxLength={100} aria-invalid={Boolean(searchError)} aria-describedby={searchError ? `${searchInputId}-error` : undefined} enterKeyHint="search" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applySearch(); } }} placeholder={schoolSearch ? "학교명을 입력해 주세요." : notificationIdSearch ? "알림 ID를 입력해 주세요." : "검색어를 입력해 주세요."} className={`h-11 w-full rounded-[10px] border border-zinc-300 bg-white pl-9 pr-3 text-sm font-medium text-zinc-950 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-50 ${focusRing}`} /></div>{searchError ? <p id={`${searchInputId}-error`} role="alert" className="mt-2 text-sm font-medium text-red-700 dark:text-red-300">{searchError}</p> : null}</div></div></form>
      {!items.length || error ? <div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[760px] table-fixed text-left text-sm"><thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400"><tr>{[...(idColumnLabel ? [idColumnLabel] : []), primaryColumnLabel, ...additionalColumns, "상태", "생성 시각", "갱신 시각"].map((label) => <th key={label} scope="col" className="px-5 py-3 font-extrabold">{label}</th>)}</tr></thead><tbody /></table></div> : null}
      {invalidQuery ? <div role="status" className="px-5 py-12 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400"><p>검색 조건을 확인한 뒤 다시 검색해 주세요.</p><button type="button" onClick={clearFilters} className={`mt-4 min-h-11 rounded-[10px] border border-zinc-300 px-4 font-extrabold dark:border-zinc-700 ${focusRing}`}>필터 지우기</button></div> : error ? <ErrorState error={error} retry={() => void loadCurrent()} loginHref={loginHref} /> : loading && !result ? <p role="status" className="px-5 py-12 text-center text-sm text-zinc-500">{itemName} 목록을 불러오는 중입니다.</p> : items.length ? <><div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[760px] table-fixed text-left text-sm"><thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400"><tr>{[...(idColumnLabel ? [idColumnLabel] : []), primaryColumnLabel, ...additionalColumns, "상태", "생성 시각", "갱신 시각"].map((label) => <th key={label} scope="col" className="px-5 py-3 font-extrabold">{label}</th>)}</tr></thead><tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">{items.map((item, index) => <tr key={getAdminOperationItemKey(title, index, item.id)} onClick={() => selectItem(item)} className={`cursor-pointer align-top transition-colors ${isItemSelected(item) ? "bg-mint-500/[0.06]" : "hover:bg-mint-500/[0.03]"}`}>{idColumnLabel ? <td className="break-all px-5 py-4 font-semibold">{getAdminOperationDisplayId(item.id)}</td> : null}<td className="break-all px-5 py-4 font-bold"><button type="button" onClick={() => selectItem(item)} aria-pressed={isItemSelected(item)} aria-label={`${idColumnLabel ? `${idColumnLabel} ${getAdminOperationDisplayId(item.id)} ` : ""}${item.title}${item.subtitle ? ` ${item.subtitle}` : ""} 상세 보기`} className={`w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 ${focusRing}`}><AdminOperationItemTitle item={item} />{!item.hideListId ? <span className="mt-1 block font-mono text-xs font-medium text-zinc-500">{getAdminOperationDisplayId(item.id)}</span> : null}</button></td>{additionalColumns.map((label) => <td key={label} className="break-words px-5 py-4 font-semibold">{getAdditionalColumnValue(item, label)}</td>)}<td className="px-5 py-4 font-bold">{renderStatus ? renderStatus(item) : item.status}</td><td className="px-5 py-4 font-semibold">{formatDateTime(item.createdAt)}</td><td className="px-5 py-4 font-semibold">{formatDateTime(item.updatedAt)}</td></tr>)}</tbody></table></div><div className="lg:hidden">{items.map((item, index) => <article key={getAdminOperationItemKey(title, index, item.id)} role="button" tabIndex={0} aria-pressed={isItemSelected(item)} onClick={() => selectItem(item)} onKeyDown={(event) => selectWithKeyboard(event, () => selectItem(item))} className={`cursor-pointer border-b border-zinc-200 p-5 last:border-b-0 dark:border-zinc-800 ${isItemSelected(item) ? "bg-mint-500/[0.06]" : "hover:bg-mint-500/[0.03]"}`}>{idColumnLabel ? <dl className="mb-4 text-sm"><dt className="font-medium text-zinc-500 dark:text-zinc-400">{idColumnLabel}</dt><dd className="mt-1 break-all font-semibold">{getAdminOperationDisplayId(item.id)}</dd></dl> : null}<div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><AdminOperationItemTitle item={item} /></div><div className="shrink-0 text-right text-sm font-bold">{renderStatus ? renderStatus(item) : item.status}</div></div>{!item.hideListId ? <p className="mt-2 break-all font-mono text-xs text-zinc-500">{getAdminOperationDisplayId(item.id)}</p> : null}{additionalColumns.length ? <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{additionalColumns.map((label) => <div key={label}><dt className="font-medium text-zinc-500 dark:text-zinc-400">{label}</dt><dd className="mt-1 break-words font-semibold">{getAdditionalColumnValue(item, label)}</dd></div>)}</dl> : null}<p className="mt-4 text-sm font-semibold text-zinc-500">{formatDateTime(item.updatedAt)}</p></article>)}</div></> : <div className="px-5 py-16 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"><Inbox aria-hidden="true" className="h-6 w-6" /></span><h2 className="mt-3 text-base font-bold text-zinc-800 dark:text-zinc-100">조건에 맞는 {itemName}이 없습니다</h2><p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">서버 전체 결과에서 조건에 맞는 항목을 찾지 못했습니다.</p><button type="button" onClick={clearFilters} className={`mt-5 min-h-11 rounded-[10px] border border-zinc-300 px-4 text-sm font-extrabold dark:border-zinc-700 ${focusRing}`}>필터 지우기</button></div>}
      {!invalidQuery && !error && result ? <div className="flex justify-center border-t border-zinc-200 px-5 py-4 dark:border-zinc-800"><div className="flex items-center gap-2"><button type="button" aria-label="이전 페이지" onClick={() => changePage(Math.max(1, page - 1))} disabled={currentPage <= 1 || loading} className={`flex h-11 w-11 items-center justify-center gap-1.5 rounded-[10px] border border-zinc-300 disabled:opacity-40 dark:border-zinc-700 ${focusRing}`}><ChevronLeft className="h-4 w-4" /></button><span className="min-w-20 text-center text-sm font-bold">{currentPage} / {totalPages}</span><button type="button" aria-label="다음 페이지" onClick={() => changePage(Math.min(totalPages, page + 1))} disabled={currentPage >= totalPages || loading} className={`flex h-11 w-11 items-center justify-center gap-1.5 rounded-[10px] border border-zinc-300 disabled:opacity-40 dark:border-zinc-700 ${focusRing}`}><ChevronRight className="h-4 w-4" /></button></div></div> : null}
    </section>
    {invalidQuery ? null : renderDetail && !error ? renderDetail(selected, loadCurrent) : <section aria-labelledby={`${title}-detail`} className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419] dark:text-zinc-50"><div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 md:px-6"><h2 id={`${title}-detail`} className="text-xl font-extrabold">{itemName} 상세</h2>{actionItem && (Boolean(processingId) || actionIntents.current.canStart(actionItem.actionId!)) ? <AdminOperationActionMenu key={actionItem.actionId} label={action!.label} itemName={itemName} processing={Boolean(processingId)} onAction={() => setConfirmationId(actionItem.actionId)} /> : null}</div>{selected ? <dl className="grid gap-x-6 gap-y-5 border-t border-zinc-100 px-5 py-5 text-sm dark:border-zinc-800 md:px-6 sm:grid-cols-2 xl:grid-cols-4">{[[selected.idLabel ?? "ID", getAdminOperationDisplayId(selected.id)], ...selected.fields, ["생성 시각", formatDateTime(selected.createdAt)], ["갱신 시각", formatDateTime(selected.updatedAt)]].map(([label, value]) => <div key={label}><dt className="font-medium text-zinc-500 dark:text-zinc-400">{label}</dt><dd className="mt-1 break-all font-semibold">{label === "상태" && renderStatus ? renderStatus(selected) : formatDetailValue(label, value)}</dd></div>)}</dl> : <div className="border-t border-zinc-100 px-5 py-12 text-center text-sm font-medium text-zinc-500 dark:border-zinc-800">행을 선택하면 상세 정보를 표시합니다.</div>}</section>}
    {actionMessage ? <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419]"><ApiNotice title={actionMessage.text} /></section> : null}
    <ModalDialog open={Boolean(confirmationId && actionItem?.actionId === confirmationId)} onClose={() => setConfirmationId(undefined)} initialFocusRef={cancelActionRef} labelledBy="admin-operation-confirm-title" describedBy="admin-operation-confirm-description">
      <div className="border-b border-zinc-200 px-6 pb-4 pt-6 dark:border-zinc-800"><h2 id="admin-operation-confirm-title" className="text-xl font-extrabold">이벤트 재처리 요청</h2></div>
      <div className="px-6 py-5"><p id="admin-operation-confirm-description" className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">선택한 이벤트를 재처리하시겠습니까?</p><p className="mt-3 break-all text-sm font-semibold text-zinc-700 dark:text-zinc-200">{confirmationId}</p></div>
      <div className="flex flex-wrap justify-end gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800"><button ref={cancelActionRef} type="button" onClick={() => setConfirmationId(undefined)} className={`h-11 min-w-16 rounded-[10px] border border-zinc-300 px-4 text-sm font-bold dark:border-zinc-700 dark:hover:bg-zinc-900 ${focusRing}`}>취소</button><button type="button" onClick={() => void runAction()} className={`inline-flex h-11 min-w-16 items-center justify-center gap-1.5 rounded-[10px] bg-mint-500 px-4 text-sm font-extrabold text-white hover:bg-mint-600 ${focusRing}`}>확인</button></div>
    </ModalDialog>
  </div>;
}

export const collectionRecollectionAction: Action = { status: "FAILED", label: "재수집 요청", success: "재수집 요청을 등록하고 최신 목록을 불러왔습니다.", run: requestRecollection };
export const dlqReprocessAction: Action = { status: "PENDING", label: "이 이벤트 재처리", success: "재처리 요청을 등록했습니다.", run: reprocessDeadLetterEvent };
