"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";
import { AdminSelectMenu } from "@/components/admin/admin-select-menu";
import { filterExternalApiLogs } from "@/components/admin/external-api-log-utils";
import {
  AdminApiError,
  type ExternalApiLog,
  type ExternalApiLogPage,
  getExternalApiLogs,
} from "@/lib/admin-api";

const PAGE_SIZES = [10, 20, 50];
const mealLabels: Record<string, string> = {
  BREAKFAST: "아침",
  LUNCH: "점심",
  DINNER: "저녁",
};
const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101419]";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "medium",
    hour12: false,
  }).format(date);
}

function outcomeLabel(outcome: string) {
  if (outcome === "SUCCESS") return "성공";
  if (outcome === "FAILURE") return "실패";
  return outcome;
}

function outcomeClass(outcome: string) {
  return /success|succeed|ok/i.test(outcome)
    ? "border-mint-500/30 bg-mint-500/10 text-mint-700 dark:text-mint-300"
    : "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300";
}

function httpStatusClass(status: number) {
  if (status >= 200 && status < 400) return "text-mint-700 dark:text-mint-300";
  if (status >= 500) return "text-red-600 dark:text-red-400";
  return "text-amber-700 dark:text-amber-300";
}

function selectWithKeyboard(
  event: KeyboardEvent<HTMLElement>,
  onSelect: () => void,
) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onSelect();
  }
}

function ErrorState({
  error,
  retry,
}: {
  error: AdminApiError;
  retry: () => void;
}) {
  const auth = error.status === 401 || error.status === 403;
  return (
    <section className="rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-950 dark:bg-[#101419] dark:text-zinc-50">
      <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
      <h1 className="mt-4 text-xl font-extrabold">
        {auth
          ? "관리자 권한이 필요합니다"
          : "외부 API 로그를 불러오지 못했습니다"}
      </h1>
      <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {auth
          ? "관리자 계정으로 로그인한 후 다시 확인해 주세요."
          : error.message}
      </p>
      {!auth ? (
        <button
          type="button"
          onClick={retry}
          className={`mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 px-5 font-bold transition-colors hover:border-mint-500 dark:border-zinc-700 ${focusRing}`}
        >
          <RefreshCw className="h-4 w-4" /> 다시 시도
        </button>
      ) : null}
    </section>
  );
}

function Outcome({ log }: { log: ExternalApiLog }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${outcomeClass(log.outcome)}`}
      >
        {outcomeLabel(log.outcome)}
      </span>
      <span
        className={`text-sm font-extrabold tabular-nums ${httpStatusClass(log.httpStatus)}`}
      >
        {log.httpStatus}
      </span>
    </div>
  );
}

function RequestSummary({ log }: { log: ExternalApiLog }) {
  return (
    <div className="min-w-0">
      <p className="font-extrabold">{log.provider}</p>
      <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {log.operation}
      </p>
    </div>
  );
}

function TargetSummary({ log }: { log: ExternalApiLog }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-mono text-xs font-bold" title={log.schoolId}>
        {log.schoolId}
      </p>
      <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {log.mealDate} · {mealLabels[log.mealType] ?? log.mealType}
      </p>
    </div>
  );
}

function EndpointSummary({ log }: { log: ExternalApiLog }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="shrink-0 rounded-full border border-zinc-300 px-2 py-1 font-mono text-[11px] font-extrabold dark:border-zinc-700">
        {log.method}
      </span>
      <p
        className="min-w-0 truncate font-mono text-xs font-semibold leading-5"
        title={log.endpoint}
      >
        {log.endpoint}
      </p>
    </div>
  );
}

function LogCard({
  log,
  selected,
  onSelect,
}: {
  log: ExternalApiLog;
  selected: boolean;
  onSelect: (log: ExternalApiLog) => void;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onSelect(log)}
      onKeyDown={(event) => selectWithKeyboard(event, () => onSelect(log))}
      className={`cursor-pointer border-b border-zinc-200 p-5 transition-colors last:border-b-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-mint-500 dark:border-zinc-800 ${selected ? "bg-mint-500/[0.06]" : "hover:bg-mint-500/[0.03]"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <RequestSummary log={log} />
        <Outcome log={log} />
      </div>
      <div className="mt-4">
        <EndpointSummary log={log} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
        <div>
          <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            호출 시각
          </dt>
          <dd className="mt-1 font-semibold">
            {formatDateTime(log.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            응답 시간
          </dt>
          <dd className="mt-1 font-extrabold tabular-nums">
            {log.responseTimeMillis.toLocaleString()}ms
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            대상 학교
          </dt>
          <dd className="mt-1">
            <TargetSummary log={log} />
          </dd>
        </div>
      </dl>
    </article>
  );
}

function LogDetails({ selected }: { selected?: ExternalApiLog }) {
  const details = selected
    ? [
        ["제공자", selected.provider],
        ["작업", selected.operation],
        ["메서드", selected.method],
        ["엔드포인트", selected.endpoint],
        ["학교 ID", selected.schoolId],
        ["급식일", selected.mealDate],
        ["식사", mealLabels[selected.mealType] ?? selected.mealType],
        ["HTTP 상태", String(selected.httpStatus)],
        ["결과", outcomeLabel(selected.outcome)],
        ["실패 코드", selected.failureCode || "-"],
        ["응답 시간", `${selected.responseTimeMillis.toLocaleString()}ms`],
        ["호출 시각", formatDateTime(selected.createdAt)],
      ]
    : [];

  return (
    <section
      aria-labelledby="external-api-log-details-title"
      aria-live="polite"
      className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419] dark:text-zinc-50"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 md:px-6">
        <h2
          id="external-api-log-details-title"
          className="text-xl font-extrabold tracking-[-0.02em]"
        >
          로그 상세 정보
        </h2>
        {selected ? (
          <p className="break-all font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            로그 ID: {selected.externalApiLogId}
          </p>
        ) : null}
      </div>
      {selected ? (
        <dl className="grid gap-x-6 gap-y-5 border-t border-zinc-100 px-5 py-5 text-sm dark:border-zinc-800 md:px-6 sm:grid-cols-2 xl:grid-cols-4">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className="font-semibold text-zinc-500 dark:text-zinc-400">
                {label}
              </dt>
              <dd className="mt-1 break-all font-extrabold">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="border-t border-zinc-100 px-5 py-12 text-center text-sm font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          로그 행을 선택하면 호출 정보를 표시합니다.
        </div>
      )}
    </section>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      {children}
    </div>
  );
}

export function ExternalApiLogs() {
  const [result, setResult] = useState<ExternalApiLogPage>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
      const next = await getExternalApiLogs(page, pageSize);
      setResult(next);
      setSelected((current) =>
        next.items.find(
          (item) => item.externalApiLogId === current?.externalApiLogId,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause
          : new AdminApiError(0, "외부 API 로그를 불러오지 못했습니다."),
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const providers = useMemo(
    () => [
      { value: "ALL", label: "전체" },
      ...Array.from(
        new Set(result?.items.map((item) => item.provider) ?? []),
      ).map((value) => ({ value, label: value })),
    ],
    [result],
  );
  const methods = useMemo(
    () => [
      { value: "ALL", label: "전체" },
      ...Array.from(
        new Set(result?.items.map((item) => item.method) ?? []),
      ).map((value) => ({ value, label: value })),
    ],
    [result],
  );
  const items = useMemo(
    () =>
      filterExternalApiLogs(result?.items ?? [], {
        provider,
        method,
        outcome,
        search,
      }),
    [method, outcome, provider, result, search],
  );
  const totalCount = result?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = result?.page ?? page;
  const isInitialLoading = loading && !result;

  useEffect(() => {
    setSelected((current) =>
      current &&
      !items.some((item) => item.externalApiLogId === current.externalApiLogId)
        ? undefined
        : current,
    );
  }, [items]);

  if (isInitialLoading)
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-50px)] max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> 외부 API 로그를
        불러오고 있습니다.
      </div>
    );
  if (error && !result)
    return (
      <div className="mx-auto w-full max-w-[1220px] px-5 pt-5">
        <ErrorState error={error} retry={() => void load()} />
      </div>
    );

  return (
    <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
      <header>
        <div>
          <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">
            NEIS 등 외부 API 호출 결과와 응답 시간을 확인하세요.
          </p>
          <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.02em]">
            외부 API 로그 목록
          </h1>
        </div>
      </header>
      {error && result ? (
        <p
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
        >
          최신 목록을 갱신하지 못했습니다. 이전 목록을 표시합니다.{" "}
          {error.message}
        </p>
      ) : null}
      <section
        aria-label="외부 API 로그 목록"
        aria-busy={loading}
        className="overflow-visible rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419] dark:text-zinc-50"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-6">
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
            총 {totalCount.toLocaleString()}건
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">목록 표시 수</span>
            <AdminSelectMenu
              label="목록 표시 수"
              value={String(pageSize)}
              options={PAGE_SIZES.map((size) => ({
                value: String(size),
                label: `${size}개`,
              }))}
              onChange={(value) => {
                setPage(1);
                setPageSize(Number(value));
              }}
              compact
            />
          </div>
        </div>
        <div className="border-y border-zinc-100 px-5 py-5 dark:border-zinc-800 md:px-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterField label="제공자">
              <AdminSelectMenu
                label="제공자"
                value={provider}
                options={providers}
                onChange={setProvider}
              />
            </FilterField>
            <FilterField label="결과">
              <AdminSelectMenu
                label="결과"
                value={outcome}
                options={[
                  { value: "ALL", label: "전체" },
                  { value: "SUCCESS", label: "성공" },
                  { value: "FAILURE", label: "실패" },
                ]}
                onChange={setOutcome}
              />
            </FilterField>
            <FilterField label="메서드">
              <AdminSelectMenu
                label="메서드"
                value={method}
                options={methods}
                onChange={setMethod}
              />
            </FilterField>
            <FilterField label="검색">
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="엔드포인트, 작업 또는 학교 ID"
                  aria-label="엔드포인트, 작업 또는 학교 ID 검색"
                  className={`h-11 w-full rounded-[10px] border border-zinc-300 bg-white pl-9 pr-3 text-sm font-medium text-zinc-950 placeholder:text-zinc-400 transition-colors hover:border-zinc-400 ${focusRing} dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-50`}
                />
              </div>
            </FilterField>
          </div>
          <p className="mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            현재 페이지 {result?.items.length ?? 0}건 중 {items.length}건 표시
          </p>
        </div>
        {items.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[28%]" />
                  <col className="w-[16%]" />
                  <col className="w-[11%]" />
                  <col className="w-[15%]" />
                </colgroup>
                <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
                  <tr>
                    {[
                      "호출 시각",
                      "요청",
                      "엔드포인트",
                      "결과",
                      "응답 시간",
                      "대상 학교",
                    ].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className="whitespace-nowrap px-5 py-3 font-extrabold"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {items.map((log) => {
                    const isSelected =
                      selected?.externalApiLogId === log.externalApiLogId;
                    return (
                      <tr
                        key={log.externalApiLogId}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onClick={() => setSelected(log)}
                        onKeyDown={(event) =>
                          selectWithKeyboard(event, () => setSelected(log))
                        }
                        className={`cursor-pointer align-top transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-mint-500 ${isSelected ? "bg-mint-500/[0.06]" : "hover:bg-mint-500/[0.03]"}`}
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-semibold">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <RequestSummary log={log} />
                        </td>
                        <td className="px-5 py-4">
                          <EndpointSummary log={log} />
                        </td>
                        <td className="px-5 py-4">
                          <Outcome log={log} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-extrabold tabular-nums">
                          {log.responseTimeMillis.toLocaleString()}ms
                        </td>
                        <td className="px-5 py-4">
                          <TargetSummary log={log} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="lg:hidden">
              {items.map((log) => (
                <LogCard
                  key={log.externalApiLogId}
                  log={log}
                  selected={selected?.externalApiLogId === log.externalApiLogId}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="px-5 py-16 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-mint-500" />
            <h3 className="mt-4 text-lg font-extrabold">
              표시할 외부 API 로그가 없습니다
            </h3>
            <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              현재 목록 필터 조건을 바꾸거나 다음 페이지를 확인해 주세요.
            </p>
          </div>
        )}
        <div className="flex justify-center border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="이전 페이지"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage <= 1 || loading}
              className={`flex h-10 w-10 items-center justify-center rounded-[10px] border border-zinc-300 transition-colors hover:border-mint-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 ${focusRing}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-20 text-center text-sm font-bold">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              aria-label="다음 페이지"
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              disabled={currentPage >= totalPages || loading}
              className={`flex h-10 w-10 items-center justify-center rounded-[10px] border border-zinc-300 transition-colors hover:border-mint-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 ${focusRing}`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
      <LogDetails selected={selected} />
    </div>
  );
}
