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
import { filterFailedNotifications } from "@/components/admin/failed-notification-utils";
import {
  AdminApiError,
  type FailedNotification,
  type FailedNotificationPage,
  getFailedNotifications,
} from "@/lib/admin-api";

const PAGE_SIZES = [10, 20, 50];
const reasonLabels: Record<string, string> = {
  RISK_DETECTED: "위험 메뉴 감지",
  NO_RISK: "위험 없음",
  RISK_UNKNOWN: "위험 확인 실패",
  RISK_LABELING_FAILED: "알레르기 분석 실패",
  RISK_PENDING: "위험 분석 대기",
  NO_MEAL: "급식 없음",
};
const statusLabels: Record<string, string> = {
  PENDING: "대기",
  SENDING: "발송 중",
  RETRY_PENDING: "재시도 대기",
  SENT: "발송 완료",
  FAILED: "실패",
  CANCELED: "취소됨",
};
const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101419]";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  }).format(date);
}

function statusClass(status: string) {
  if (status === "RETRY_PENDING") {
    return "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200";
  }
  if (status === "CANCELED") {
    return "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
  return "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300";
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
          : "실패 알림을 불러오지 못했습니다"}
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

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-extrabold ${statusClass(status)}`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

function RecipientSummary({ item }: { item: FailedNotification }) {
  const relatedId = item.userId || item.childId;
  const relatedLabel = item.userId ? "사용자 ID" : "자녀 ID";

  return (
    <div className="min-w-0">
      <p
        className="truncate font-mono text-xs font-bold"
        title={item.notificationTargetId}
      >
        {item.notificationTargetId}
      </p>
      <p
        className="mt-1 truncate text-xs font-semibold text-zinc-500 dark:text-zinc-400"
        title={relatedId || undefined}
      >
        {relatedId ? `${relatedLabel} ${relatedId}` : "관련 대상 정보 없음"}
      </p>
    </div>
  );
}

function ReasonSummary({ item }: { item: FailedNotification }) {
  return (
    <p className="font-semibold">
      {reasonLabels[item.reason] ?? item.reason}
    </p>
  );
}

function FailureCard({
  item,
  selected,
  onSelect,
}: {
  item: FailedNotification;
  selected: boolean;
  onSelect: (item: FailedNotification) => void;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onSelect(item)}
      onKeyDown={(event) => selectWithKeyboard(event, () => onSelect(item))}
      className={`cursor-pointer border-b border-zinc-200 p-5 transition-colors last:border-b-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-mint-500 dark:border-zinc-800 ${selected ? "bg-mint-500/[0.06]" : "hover:bg-mint-500/[0.03]"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <ReasonSummary item={item} />
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-3">
        <RecipientSummary item={item} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
        <div>
          <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            생성 시각
          </dt>
          <dd className="mt-1 font-semibold">{formatDateTime(item.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            시도
          </dt>
          <dd className="mt-1 font-extrabold tabular-nums">
            {item.attemptCount} / {item.maxAttempts}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            실패 코드
          </dt>
          <dd className="mt-1 break-all font-mono text-xs font-bold">
            {item.failureCode || "-"}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function NotificationDetails({ selected }: { selected?: FailedNotification }) {
  const details = selected
    ? [
        ["알림 ID", selected.notificationId],
        ["대상 ID", selected.notificationTargetId],
        ["사용자 ID", selected.userId || "-"],
        ["자녀 ID", selected.childId || "-"],
        ["알림 기준일", selected.notificationDate],
        ["채널", selected.channel],
        ["알림 사유", reasonLabels[selected.reason] ?? selected.reason],
        ["사유 코드", selected.reason],
        ["상태", statusLabels[selected.status] ?? selected.status],
        ["시도", `${selected.attemptCount} / ${selected.maxAttempts}`],
        ["실패 코드", selected.failureCode || "-"],
        ["생성 시각", formatDateTime(selected.createdAt)],
        ["갱신 시각", formatDateTime(selected.updatedAt)],
      ]
    : [];

  return (
    <section
      aria-labelledby="failed-notification-details-title"
      aria-live="polite"
      className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419] dark:text-zinc-50"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 md:px-6">
        <h2
          id="failed-notification-details-title"
          className="text-xl font-extrabold tracking-[-0.02em]"
        >
          알림 상세 정보
        </h2>
        {selected ? (
          <p className="break-all font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            알림 ID: {selected.notificationId}
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
          알림 행을 선택하면 상세 정보를 표시합니다.
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

export function FailedNotifications() {
  const [result, setResult] = useState<FailedNotificationPage>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [error, setError] = useState<AdminApiError>();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FailedNotification>();
  const [reason, setReason] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const next = await getFailedNotifications(page, pageSize);
      setResult(next);
      setSelected((current) =>
        next.items.find(
          (item) => item.notificationId === current?.notificationId,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof AdminApiError
          ? cause
          : new AdminApiError(0, "실패 알림을 불러오지 못했습니다."),
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const reasonOptions = useMemo(
    () => [
      { value: "ALL", label: "전체" },
      ...Array.from(
        new Set(result?.items.map((item) => item.reason) ?? []),
      ).map((value) => ({ value, label: reasonLabels[value] ?? value })),
    ],
    [result],
  );
  const statusOptions = useMemo(
    () => [
      { value: "ALL", label: "전체" },
      ...Array.from(
        new Set(result?.items.map((item) => item.status) ?? []),
      ).map((value) => ({ value, label: statusLabels[value] ?? value })),
    ],
    [result],
  );
  const items = useMemo(
    () =>
      filterFailedNotifications(result?.items ?? [], {
        reason,
        status,
        search,
      }),
    [reason, result, search, status],
  );
  const totalCount = result?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = result?.page ?? page;
  const isInitialLoading = loading && !result;
  useEffect(() => {
    setSelected((current) =>
      current && !items.some((item) => item.notificationId === current.notificationId)
        ? undefined
        : current,
    );
  }, [items]);

  if (isInitialLoading) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-50px)] max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> 실패 알림을
        불러오고 있습니다.
      </div>
    );
  }
  if (error && !result) {
    return (
      <div className="mx-auto w-full max-w-[1220px] px-5 pt-5">
        <ErrorState error={error} retry={() => void load()} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
      <header>
        <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">
          실패한 알림 요청과 재시도 상태를 확인하세요.
        </p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.02em]">
          실패 알림 목록
        </h1>
      </header>
      {error && result ? (
        <p
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
        >
          최신 목록을 갱신하지 못했습니다. 이전 목록을 표시합니다. {error.message}
        </p>
      ) : null}
      <section
        aria-label="실패 알림 목록"
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FilterField label="사유">
              <AdminSelectMenu
                label="알림 사유"
                value={reason}
                options={reasonOptions}
                onChange={setReason}
              />
            </FilterField>
            <FilterField label="상태">
              <AdminSelectMenu
                label="알림 상태"
                value={status}
                options={statusOptions}
                onChange={setStatus}
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
                  placeholder="알림, 대상 또는 사용자 ID"
                  aria-label="알림, 대상 또는 사용자 ID 검색"
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
              <table className="w-full min-w-[920px] table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[16%]" />
                  <col className="w-[19%]" />
                  <col className="w-[17%]" />
                  <col className="w-[14%]" />
                  <col className="w-[10%]" />
                  <col className="w-[14%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
                  <tr>
                    {[
                      "생성 시각",
                      "대상",
                      "사유",
                      "상태",
                      "시도",
                      "실패 코드",
                      "알림일",
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
                  {items.map((item) => {
                    const isSelected = selected?.notificationId === item.notificationId;

                    return (
                      <tr
                        key={item.notificationId}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onClick={() => setSelected(item)}
                        onKeyDown={(event) =>
                          selectWithKeyboard(event, () => setSelected(item))
                        }
                        className={`cursor-pointer align-top transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-mint-500 ${isSelected ? "bg-mint-500/[0.06]" : "hover:bg-mint-500/[0.03]"}`}
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-semibold">
                          {formatDateTime(item.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <RecipientSummary item={item} />
                        </td>
                        <td className="px-5 py-4">
                          <ReasonSummary item={item} />
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-extrabold tabular-nums">
                          {item.attemptCount} / {item.maxAttempts}
                        </td>
                        <td className="px-5 py-4">
                          <p
                            className="truncate font-mono text-xs font-bold"
                            title={item.failureCode || undefined}
                          >
                            {item.failureCode || "-"}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-semibold">
                          {item.notificationDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="lg:hidden">
              {items.map((item) => (
                <FailureCard
                  key={item.notificationId}
                  item={item}
                  selected={selected?.notificationId === item.notificationId}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="px-5 py-16 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-mint-500" />
            <h3 className="mt-4 text-lg font-extrabold">
              표시할 실패 알림이 없습니다
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
      <NotificationDetails selected={selected} />
    </div>
  );
}
