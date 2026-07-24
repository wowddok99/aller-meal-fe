"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  LoaderCircle,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getDeadLetterEvents, type DeadLetterEvent } from "@/lib/admin-api";

const PAGE_SIZES = [10, 20, 50];
const statusLabels = { PENDING: "대기", REPROCESSED: "재처리 완료" } as const;
const eventTypeLabels = {
  ALL: "전체",
  ALERT_EMAIL_SEND: "ALERT_EMAIL_SEND",
  ALERT_EMAIL_BAD_ADDRESS: "ALERT_EMAIL_BAD_ADDRESS",
} as const;

type ReprocessResult = {
  kind: "success" | "duplicate" | "error";
  title: string;
  description: string;
  event: DeadLetterEvent;
};

function formatDateTime(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short", hour12: false }).format(date);
}

function statusClass(status: DeadLetterEvent["status"]) {
  return status === "PENDING"
    ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
    : "border-mint-500 bg-mint-500/10 text-mint-700 dark:border-mint-700 dark:text-mint-300";
}

function ResultPanel({ result }: { result: ReprocessResult }) {
  const Icon = result.kind === "success" ? CheckCircle2 : result.kind === "duplicate" ? AlertTriangle : XCircle;
  const panelClass = result.kind === "success" ? "border-mint-500/40" : result.kind === "duplicate" ? "border-amber-500/40" : "border-red-500/40";
  const iconClass = result.kind === "success" ? "text-mint-500" : result.kind === "duplicate" ? "text-amber-500" : "text-red-500";
  return (
    <section className={`rounded-2xl border ${panelClass} bg-white p-5 dark:bg-[#101419] md:p-6`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-6 w-6 shrink-0 ${iconClass}`} />
        <div>
          <h2 className="text-lg font-extrabold">{result.title}</h2>
          <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{result.description}</p>
        </div>
      </div>
      <dl className="mt-5 grid gap-4 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800 sm:grid-cols-2 lg:grid-cols-4">
        <div><dt className="font-semibold text-zinc-500 dark:text-zinc-400">이벤트 ID</dt><dd className="mt-1 break-all font-mono font-semibold">{result.event.deadLetterEventId}</dd></div>
        <div><dt className="font-semibold text-zinc-500 dark:text-zinc-400">메시지 ID</dt><dd className="mt-1 break-all font-mono font-semibold">{result.event.messageId}</dd></div>
        <div><dt className="font-semibold text-zinc-500 dark:text-zinc-400">상태</dt><dd className="mt-1"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${statusClass(result.event.status)}`}>{statusLabels[result.event.status]}</span></dd></div>
        <div><dt className="font-semibold text-zinc-500 dark:text-zinc-400">처리 시각</dt><dd className="mt-1 font-semibold">{formatDateTime(result.event.reprocessedAt)}</dd></div>
      </dl>
    </section>
  );
}

export function NotificationDlqEvents() {
  const [rows, setRows] = useState<DeadLetterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<"ALL" | DeadLetterEvent["status"]>("ALL");
  const [eventTypeFilter, setEventTypeFilter] = useState<keyof typeof eventTypeLabels>("ALL");
  const [messageQuery, setMessageQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<DeadLetterEvent>();
  const [processingId, setProcessingId] = useState<string>();
  const [result, setResult] = useState<ReprocessResult>();

  const load = useCallback(async () => {
    setLoading(true);
    const response = await getDeadLetterEvents(1, 100);
    setRows(response.items);
    setSelectedEvent(response.items[0]);
    setSelectedIds([]);
    setResult(undefined);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filteredRows = useMemo(() => rows.filter((row) => {
    const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;
    const matchesType = eventTypeFilter === "ALL" || row.eventType === eventTypeFilter;
    const matchesMessage = !messageQuery.trim() || row.messageId.toLowerCase().includes(messageQuery.trim().toLowerCase());
    return matchesStatus && matchesType && matchesMessage;
  }), [eventTypeFilter, messageQuery, rows, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedPending = rows.filter((row) => selectedIds.includes(row.deadLetterEventId) && row.status === "PENDING");

  const processEvent = (event: DeadLetterEvent) => {
    if (event.status !== "PENDING") return;
    setProcessingId(event.deadLetterEventId);
    setResult(undefined);
    window.setTimeout(() => {
      const outcome = event.reprocessOutcome ?? "SUCCESS";
      if (outcome === "SUCCESS") {
        const processedAt = "2026-07-04T09:10:00+09:00";
        const next = { ...event, status: "REPROCESSED" as const, reprocessedByUserId: "admin@allermeal.io", reprocessedAt: processedAt, updatedAt: processedAt };
        setRows((current) => current.map((row) => row.deadLetterEventId === event.deadLetterEventId ? next : row));
        setSelectedEvent(next);
        setResult({ kind: "success", title: "재처리 완료", description: "DLQ 이벤트를 재처리 대기열에 등록했습니다.", event: next });
      } else if (outcome === "DUPLICATE") {
        setResult({ kind: "duplicate", title: "중복 요청", description: "동일한 이벤트의 재처리 요청이 이미 접수되어 있습니다.", event });
      } else {
        setResult({ kind: "error", title: "재처리 실패", description: "이벤트를 재처리하지 못했습니다. 잠시 후 다시 시도해 주세요.", event });
      }
      setProcessingId(undefined);
    }, 300);
  };

  const toggleSelected = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const togglePage = () => {
    const ids = visibleRows.filter((row) => row.status === "PENDING").map((row) => row.deadLetterEventId);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    setSelectedIds((current) => allSelected ? current.filter((id) => !ids.includes(id)) : Array.from(new Set([...current, ...ids])));
  };

  if (loading) return <div className="mx-auto flex min-h-[calc(100dvh-50px)] max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> DLQ 이벤트를 불러오고 있습니다.</div>;

  return (
    <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
      <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">DLQ에 쌓인 알림 이벤트를 확인하고 재처리하세요.</p>
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-mint-500/10 text-mint-600 dark:text-mint-400"><Inbox className="h-6 w-6" /></span><div><h1 className="text-2xl font-extrabold tracking-[-0.03em]">DLQ 이벤트</h1><p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">총 {rows.length.toLocaleString()}건</p></div></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-zinc-300 px-4 text-sm font-extrabold hover:border-mint-500 disabled:opacity-50 dark:border-zinc-700"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> 새로고침</button></div>
        <div className="mt-5 grid gap-4 border-t border-zinc-100 pt-5 dark:border-zinc-800 md:grid-cols-[1.1fr_1fr_1.5fr_auto] md:items-end">
          <div><span className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">상태</span><div className="mt-2 flex h-11 overflow-hidden rounded-[10px] border border-zinc-300 dark:border-zinc-700">{(["ALL", "PENDING", "REPROCESSED"] as const).map((status) => <button key={status} type="button" onClick={() => { setStatusFilter(status); setPage(1); }} className={`flex-1 whitespace-nowrap px-3 text-sm font-bold ${statusFilter === status ? "bg-mint-500/10 text-mint-700 dark:text-mint-300" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}>{status === "ALL" ? "전체" : status === "REPROCESSED" ? "완료" : statusLabels[status]}</button>)}</div></div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">이벤트 타입<select value={eventTypeFilter} onChange={(event) => { setEventTypeFilter(event.target.value as keyof typeof eventTypeLabels); setPage(1); }} className="mt-2 h-11 w-full rounded-[10px] border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-950 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-50">{Object.entries(eventTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">메시지 ID<div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><input value={messageQuery} onChange={(event) => { setMessageQuery(event.target.value); setPage(1); }} placeholder="메시지 ID 입력" className="h-11 w-full rounded-[10px] border border-zinc-300 bg-white pl-9 pr-3 text-sm font-medium text-zinc-950 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-50" /></div></label>
          <div className="flex items-center justify-end gap-3"><span className="whitespace-nowrap text-sm font-semibold text-zinc-500 dark:text-zinc-400">{selectedPending.length}건 선택됨</span><button type="button" onClick={() => selectedPending[0] && processEvent(selectedPending[0])} disabled={!selectedPending.length || Boolean(processingId)} className="h-11 whitespace-nowrap rounded-[10px] bg-mint-500 px-4 text-sm font-extrabold text-white hover:bg-mint-600 disabled:cursor-not-allowed disabled:opacity-40">선택 재처리</button></div>
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419]">
        <div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-left text-sm"><thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400"><tr><th className="w-12 px-4 py-3"><input type="checkbox" aria-label="현재 페이지 전체 선택" checked={visibleRows.filter((row) => row.status === "PENDING").length > 0 && visibleRows.filter((row) => row.status === "PENDING").every((row) => selectedIds.includes(row.deadLetterEventId))} onChange={togglePage} /></th>{["이벤트 ID", "메시지 ID", "이벤트 타입", "재시도", "상태", "재처리 담당", "재처리 시각", "생성 시각", "작업"].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-4 py-3 font-extrabold">{label}</th>)}</tr></thead><tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">{visibleRows.map((row) => <tr key={row.deadLetterEventId} onClick={() => setSelectedEvent(row)} className={`cursor-pointer align-top transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50 ${selectedEvent?.deadLetterEventId === row.deadLetterEventId ? "bg-mint-500/5" : ""}`}><td className="px-4 py-4"><input type="checkbox" aria-label={`${row.deadLetterEventId} 선택`} checked={selectedIds.includes(row.deadLetterEventId)} disabled={row.status !== "PENDING"} onClick={(event) => event.stopPropagation()} onChange={() => toggleSelected(row.deadLetterEventId)} /></td><td className="max-w-44 truncate px-4 py-4 font-mono text-xs font-semibold" title={row.deadLetterEventId}>{row.deadLetterEventId}</td><td className="max-w-44 truncate px-4 py-4 font-mono text-xs font-semibold" title={row.messageId}>{row.messageId}</td><td className="whitespace-nowrap px-4 py-4 font-semibold">{row.eventType}</td><td className="px-4 py-4 text-center font-semibold">{row.retryCount}</td><td className="px-4 py-4"><span className={`inline-flex whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-extrabold ${statusClass(row.status)}`}>{statusLabels[row.status]}</span><p className="mt-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">{row.status}</p></td><td className="whitespace-nowrap px-4 py-4 font-medium">{row.reprocessedByUserId || "-"}</td><td className="whitespace-nowrap px-4 py-4 font-medium">{formatDateTime(row.reprocessedAt)}</td><td className="whitespace-nowrap px-4 py-4 font-medium">{formatDateTime(row.createdAt)}</td><td className="px-4 py-4"><button type="button" onClick={(event) => { event.stopPropagation(); processEvent(row); }} disabled={row.status !== "PENDING" || Boolean(processingId)} className="rounded-lg border border-mint-600 px-3 py-1.5 text-xs font-extrabold text-mint-700 hover:bg-mint-500/10 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400 dark:border-mint-700 dark:text-mint-300 dark:disabled:border-zinc-700">{processingId === row.deadLetterEventId ? "처리 중" : row.status === "PENDING" ? "재처리" : "완료"}</button></td></tr>)}</tbody></table></div>
        {!visibleRows.length ? <div className="px-5 py-16 text-center"><Inbox className="mx-auto h-10 w-10 text-zinc-400" /><h2 className="mt-4 text-lg font-extrabold">조건에 맞는 DLQ 이벤트가 없습니다</h2><p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">필터를 조정해 다시 확인해 주세요.</p></div> : null}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-5 py-4 dark:border-zinc-800"><label className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">페이지당 보기<select value={pageSize} onChange={(event) => { setPage(1); setPageSize(Number(event.target.value)); }} className="h-9 rounded-lg border border-zinc-300 bg-white px-2 font-bold text-zinc-800 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-100">{PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}</select></label><div className="flex items-center gap-2"><button type="button" aria-label="이전 페이지" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1} className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 disabled:opacity-40 dark:border-zinc-700"><ChevronLeft className="h-4 w-4" /></button><span className="min-w-20 text-center text-sm font-bold">{currentPage} / {totalPages}</span><button type="button" aria-label="다음 페이지" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages} className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 disabled:opacity-40 dark:border-zinc-700"><ChevronRight className="h-4 w-4" /></button></div></div>
      </section>
      {result ? <ResultPanel result={result} /> : selectedEvent ? <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-6"><div className="flex items-center gap-3"><CheckCircle2 className={`h-6 w-6 ${selectedEvent.status === "REPROCESSED" ? "text-mint-500" : "text-zinc-400"}`} /><h2 className="text-lg font-extrabold">이벤트 상세</h2></div><dl className="mt-5 grid gap-4 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800 sm:grid-cols-2 lg:grid-cols-4"><div><dt className="font-semibold text-zinc-500 dark:text-zinc-400">이벤트 ID</dt><dd className="mt-1 break-all font-mono font-semibold">{selectedEvent.deadLetterEventId}</dd></div><div><dt className="font-semibold text-zinc-500 dark:text-zinc-400">메시지 ID</dt><dd className="mt-1 break-all font-mono font-semibold">{selectedEvent.messageId}</dd></div><div><dt className="font-semibold text-zinc-500 dark:text-zinc-400">이벤트 타입</dt><dd className="mt-1 font-semibold">{selectedEvent.eventType}</dd></div><div><dt className="font-semibold text-zinc-500 dark:text-zinc-400">상태</dt><dd className="mt-1"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${statusClass(selectedEvent.status)}`}>{statusLabels[selectedEvent.status]}</span></dd></div><div><dt className="font-semibold text-zinc-500 dark:text-zinc-400">재시도 횟수</dt><dd className="mt-1 font-semibold">{selectedEvent.retryCount}회</dd></div><div><dt className="font-semibold text-zinc-500 dark:text-zinc-400">재처리 담당</dt><dd className="mt-1 font-semibold">{selectedEvent.reprocessedByUserId || "-"}</dd></div><div><dt className="font-semibold text-zinc-500 dark:text-zinc-400">재처리 시각</dt><dd className="mt-1 font-semibold">{formatDateTime(selectedEvent.reprocessedAt)}</dd></div><div><dt className="font-semibold text-zinc-500 dark:text-zinc-400">생성 시각</dt><dd className="mt-1 font-semibold">{formatDateTime(selectedEvent.createdAt)}</dd></div></dl></section> : null}
    </div>
  );
}
