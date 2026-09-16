"use client";

import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Inbox, LoaderCircle, Search, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { AdminSelectMenu } from "@/components/admin/admin-select-menu";
import { filterDeadLetterEvents } from "@/components/admin/dlq-event-utils";
import { AdminApiError, type DeadLetterEvent, type DeadLetterEventPage, getDeadLetterEvents, reprocessDeadLetterEvent } from "@/lib/admin-api";

const PAGE_SIZES = [10, 20, 50];
const statusLabels: Record<string, string> = { PENDING: "재처리 대기", REPROCESSED: "재처리 완료" };
const eventTypeLabels: Record<string, string> = { ALERT_EMAIL_SEND: "알림 이메일 발송", ALERT_EMAIL_BAD_ADDRESS: "수신 주소 오류" };
const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101419]";

function formatDateTime(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short", hour12: false }).format(date);
}
function statusClass(status: DeadLetterEvent["status"]) {
  return status === "PENDING" ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200" : "border-mint-500/50 bg-mint-500/10 text-mint-800 dark:border-mint-700 dark:text-mint-300";
}
function StatusBadge({ status }: { status: DeadLetterEvent["status"] }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-extrabold ${statusClass(status)}`}>{statusLabels[status] ?? status}</span>;
}
function selectWithKeyboard(event: KeyboardEvent<HTMLElement>, select: () => void) {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); }
}

export function NotificationDlqEvents() {
  const [result, setResult] = useState<DeadLetterEventPage>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminApiError>();
  const [selected, setSelected] = useState<DeadLetterEvent>();
  const [status, setStatus] = useState("ALL");
  const [eventType, setEventType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string>();
  const [actionResult, setActionResult] = useState<{ kind: "success" | "duplicate" | "error"; event: DeadLetterEvent }>();

  const load = useCallback(async () => {
    setLoading(true); setError(undefined);
    try {
      const next = await getDeadLetterEvents(page, pageSize, true);
      setResult(next);
      setSelected((current) => next.items.find((item) => item.deadLetterEventId === current?.deadLetterEventId));
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause : new AdminApiError(0, "DLQ 이벤트를 불러오지 못했습니다."));
    } finally { setLoading(false); }
  }, [page, pageSize]);
  useEffect(() => { void load(); }, [load]);

  const eventTypeOptions = useMemo(() => [
    { value: "ALL", label: "전체" },
    ...Array.from(new Set(result?.items.map((item) => item.eventType) ?? [])).map((value) => ({ value, label: eventTypeLabels[value] ?? value })),
  ], [result]);
  const events = useMemo(() => filterDeadLetterEvents(result?.items ?? [], { status, eventType, search }), [eventType, result, search, status]);
  useEffect(() => { setSelected((current) => current && !events.some((event) => event.deadLetterEventId === current.deadLetterEventId) ? undefined : current); }, [events]);

  const reprocess = async (event: DeadLetterEvent) => {
    if (event.status !== "PENDING" || processingId) return;
    setProcessingId(event.deadLetterEventId); setActionResult(undefined);
    try {
      const response = await reprocessDeadLetterEvent(event);
      const next = response.status === "REPROCESSED" ? { ...event, status: "REPROCESSED" as const, reprocessedByUserId: "admin@allermeal.io", reprocessedAt: response.reprocessedAt, updatedAt: response.reprocessedAt } : event;
      setResult((current) => current ? { ...current, items: current.items.map((item) => item.deadLetterEventId === event.deadLetterEventId ? next : item) } : current);
      setSelected(next); setActionResult({ kind: response.duplicate ? "duplicate" : "success", event: next });
    } catch { setActionResult({ kind: "error", event }); }
    finally { setProcessingId(undefined); }
  };

  if (loading && !result) return <div className="mx-auto flex min-h-[calc(100dvh-50px)] max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> DLQ 이벤트를 불러오고 있습니다.</div>;
  if (error && !result) return <div className="mx-auto w-full max-w-[1220px] px-5 pt-5"><section className="rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-950 dark:bg-[#101419]"><AlertTriangle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-extrabold">DLQ 이벤트를 불러오지 못했습니다</h1><p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">{error.message}</p><button type="button" onClick={() => void load()} className={`mt-5 h-11 rounded-[10px] border border-zinc-300 px-5 font-bold dark:border-zinc-700 ${focusRing}`}>다시 시도</button></section></div>;

  const totalCount = result?.totalCount ?? 0;
  const currentPage = result?.page ?? page;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const selectedPending = selected?.status === "PENDING";
  const resultCopy = actionResult?.kind === "success" ? [CheckCircle2, "재처리 요청을 등록했습니다", "선택한 DLQ 이벤트를 재처리 대기열에 등록했습니다.", "border-mint-500/50 text-mint-500"] as const : actionResult?.kind === "duplicate" ? [AlertTriangle, "재처리 요청이 이미 접수되었습니다", "같은 이벤트는 중복으로 등록하지 않았습니다.", "border-amber-300 text-amber-500"] as const : actionResult ? [XCircle, "재처리 요청에 실패했습니다", "이벤트 상태를 확인한 뒤 잠시 후 다시 시도해 주세요.", "border-red-200 text-red-500"] as const : undefined;
  const ResultIcon = resultCopy?.[0];

  return <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
    <header><p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">DLQ로 격리된 알림 이벤트를 확인하고 재처리하세요.</p><h1 className="mt-3 text-2xl font-extrabold tracking-[-0.02em]">DLQ 이벤트 목록</h1></header>
    {error && result ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">최신 목록을 갱신하지 못했습니다. 이전 목록을 표시합니다. {error.message}</p> : null}
    <section aria-label="DLQ 이벤트 목록" aria-busy={loading} className="overflow-visible rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419] dark:text-zinc-50">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-6"><p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">총 {totalCount.toLocaleString()}건</p><div className="flex items-center gap-2"><span className="text-sm font-bold">목록 표시 수</span><AdminSelectMenu label="목록 표시 수" value={String(pageSize)} options={PAGE_SIZES.map((size) => ({ value: String(size), label: `${size}개` }))} onChange={(value) => { setPage(1); setPageSize(Number(value)); }} compact /></div></div>
      <div className="border-y border-zinc-100 px-5 py-5 dark:border-zinc-800 md:px-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><div><p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">상태</p><AdminSelectMenu label="DLQ 상태" value={status} options={[{ value: "ALL", label: "전체" }, { value: "PENDING", label: statusLabels.PENDING }, { value: "REPROCESSED", label: statusLabels.REPROCESSED }]} onChange={setStatus} /></div><div><p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">이벤트 타입</p><AdminSelectMenu label="DLQ 이벤트 타입" value={eventType} options={eventTypeOptions} onChange={setEventType} /></div><div><p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">검색</p><div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="이벤트 또는 메시지 ID" aria-label="이벤트 또는 메시지 ID 검색" className={`h-11 w-full rounded-[10px] border border-zinc-300 bg-white pl-9 pr-3 text-sm font-medium text-zinc-950 placeholder:text-zinc-400 ${focusRing} dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-50`} /></div></div></div><p className="mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">현재 페이지 {result?.items.length ?? 0}건 중 {events.length}건 표시</p></div>
      {events.length ? <><div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[920px] table-fixed text-left text-sm"><thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400"><tr>{["생성 시각", "메시지 ID", "이벤트 타입", "재시도", "상태", "재처리 정보"].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-5 py-3 font-extrabold">{label}</th>)}</tr></thead><tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">{events.map((event) => <tr key={event.deadLetterEventId} role="button" tabIndex={0} aria-pressed={selected?.deadLetterEventId === event.deadLetterEventId} onClick={() => setSelected(event)} onKeyDown={(keyboardEvent) => selectWithKeyboard(keyboardEvent, () => setSelected(event))} className={`cursor-pointer align-top transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-mint-500 ${selected?.deadLetterEventId === event.deadLetterEventId ? "bg-mint-500/[0.06]" : "hover:bg-mint-500/[0.03]"}`}><td className="whitespace-nowrap px-5 py-4 font-semibold">{formatDateTime(event.createdAt)}</td><td className="px-5 py-4"><p className="truncate font-mono text-xs font-bold" title={event.messageId}>{event.messageId}</p><p className="mt-1 truncate font-mono text-xs text-zinc-500 dark:text-zinc-400" title={event.deadLetterEventId}>{event.deadLetterEventId}</p></td><td className="px-5 py-4 font-semibold">{eventTypeLabels[event.eventType] ?? event.eventType}</td><td className="whitespace-nowrap px-5 py-4 font-extrabold tabular-nums">{event.retryCount}회</td><td className="px-5 py-4"><StatusBadge status={event.status} /></td><td className="px-5 py-4"><p className="truncate font-mono text-xs font-bold" title={event.reprocessedByUserId || undefined}>{event.reprocessedByUserId || "-"}</p><p className="mt-1 whitespace-nowrap text-xs font-semibold text-zinc-500 dark:text-zinc-400">{formatDateTime(event.reprocessedAt)}</p></td></tr>)}</tbody></table></div><div className="lg:hidden">{events.map((event) => <article key={event.deadLetterEventId} role="button" tabIndex={0} aria-pressed={selected?.deadLetterEventId === event.deadLetterEventId} onClick={() => setSelected(event)} onKeyDown={(keyboardEvent) => selectWithKeyboard(keyboardEvent, () => setSelected(event))} className={`cursor-pointer border-b border-zinc-200 p-5 last:border-b-0 dark:border-zinc-800 ${selected?.deadLetterEventId === event.deadLetterEventId ? "bg-mint-500/[0.06]" : "hover:bg-mint-500/[0.03]"}`}><div className="flex items-start justify-between gap-3"><p className="font-semibold">{eventTypeLabels[event.eventType] ?? event.eventType}</p><StatusBadge status={event.status} /></div><p className="mt-3 break-all font-mono text-xs font-bold">{event.messageId}</p><div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800"><p><span className="block text-xs text-zinc-500">재시도</span><strong>{event.retryCount}회</strong></p><p><span className="block text-xs text-zinc-500">생성 시각</span><strong>{formatDateTime(event.createdAt)}</strong></p></div></article>)}</div></> : <div className="px-5 py-16 text-center"><Inbox className="mx-auto h-10 w-10 text-zinc-400" /><h2 className="mt-4 text-lg font-extrabold">표시할 DLQ 이벤트가 없습니다</h2><p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">현재 목록 필터 조건을 바꾸거나 다음 페이지를 확인해 주세요.</p></div>}
      <div className="flex justify-center border-t border-zinc-200 px-5 py-4 dark:border-zinc-800"><div className="flex items-center gap-2"><button type="button" aria-label="이전 페이지" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1 || loading} className={`flex h-10 w-10 items-center justify-center rounded-[10px] border border-zinc-300 disabled:opacity-40 dark:border-zinc-700 ${focusRing}`}><ChevronLeft className="h-4 w-4" /></button><span className="min-w-20 text-center text-sm font-bold">{currentPage} / {totalPages}</span><button type="button" aria-label="다음 페이지" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages || loading} className={`flex h-10 w-10 items-center justify-center rounded-[10px] border border-zinc-300 disabled:opacity-40 dark:border-zinc-700 ${focusRing}`}><ChevronRight className="h-4 w-4" /></button></div></div>
    </section>
    <section aria-labelledby="dlq-detail-title" className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419] dark:text-zinc-50"><div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 md:px-6"><h2 id="dlq-detail-title" className="text-xl font-extrabold">DLQ 이벤트 상세</h2>{selectedPending ? <button type="button" onClick={() => selected && void reprocess(selected)} disabled={Boolean(processingId)} className={`inline-flex h-10 items-center gap-2 rounded-[10px] bg-mint-500 px-4 text-sm font-extrabold text-white disabled:opacity-50 ${focusRing}`}>{processingId ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}{processingId ? "재처리 중" : "이 이벤트 재처리"}</button> : null}</div>{selected ? <dl className="grid gap-x-6 gap-y-5 border-t border-zinc-100 px-5 py-5 text-sm dark:border-zinc-800 md:px-6 sm:grid-cols-2 xl:grid-cols-4">{[["이벤트 ID", selected.deadLetterEventId], ["메시지 ID", selected.messageId], ["이벤트 타입", eventTypeLabels[selected.eventType] ?? selected.eventType], ["상태", statusLabels[selected.status] ?? selected.status], ["재시도 횟수", `${selected.retryCount}회`], ["재처리 담당", selected.reprocessedByUserId || "-"], ["재처리 시각", formatDateTime(selected.reprocessedAt)], ["생성 시각", formatDateTime(selected.createdAt)]].map(([label, value]) => <div key={label}><dt className="font-semibold text-zinc-500 dark:text-zinc-400">{label}</dt><dd className="mt-1 break-all font-extrabold">{value}</dd></div>)}</dl> : <div className="border-t border-zinc-100 px-5 py-12 text-center text-sm font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">DLQ 이벤트 행을 선택하면 상세 정보를 표시합니다.</div>}</section>
    {resultCopy && ResultIcon ? <section aria-live="polite" className={`rounded-2xl border bg-white p-5 dark:bg-[#101419] ${resultCopy[3]}`}><div className="flex items-start gap-3"><ResultIcon className="mt-0.5 h-6 w-6 shrink-0" /><div><h2 className="text-lg font-extrabold text-zinc-950 dark:text-zinc-50">{resultCopy[1]}</h2><p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{resultCopy[2]}</p></div></div></section> : null}
  </div>;
}
