type StatusTone = "neutral" | "progress" | "success" | "danger" | "warning";
type StatusOption = { value: string; label: string; tone: StatusTone };

export const labelingStatusOptions: StatusOption[] = [
  { value: "PENDING", label: "라벨링 대기", tone: "neutral" },
  { value: "LABELED", label: "라벨링 완료", tone: "success" },
  { value: "UNKNOWN", label: "확인 필요", tone: "warning" },
  { value: "LABELING_FAILED", label: "라벨링 실패", tone: "danger" },
];
export const outboxStatusOptions: StatusOption[] = [
  { value: "PENDING", label: "발행 대기", tone: "neutral" },
  { value: "PUBLISHED", label: "발행 완료", tone: "success" },
];
export const dlqStatusOptions: StatusOption[] = [
  { value: "PENDING", label: "재처리 대기", tone: "neutral" },
  { value: "REPROCESSED", label: "재처리 완료", tone: "success" },
];
export const notificationStatusOptions: StatusOption[] = [
  { value: "PENDING", label: "발송 대기", tone: "neutral" },
  { value: "SENDING", label: "발송 중", tone: "progress" },
  { value: "RETRY_PENDING", label: "재시도 대기", tone: "neutral" },
  { value: "SENT", label: "발송 완료", tone: "success" },
  { value: "FAILED", label: "발송 실패", tone: "danger" },
  { value: "CANCELED", label: "발송 취소", tone: "neutral" },
];

const toneStyles: Record<StatusTone, string> = {
  neutral: "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  progress: "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300",
  success: "border-mint-300 bg-mint-50 text-mint-800 dark:border-mint-800 dark:bg-mint-500/10 dark:text-mint-300",
  danger: "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300",
  warning: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
};

export function AdminOperationStatus({ status, options }: { status?: string | null; options: StatusOption[] }) {
  const option = options.find((item) => item.value === status);
  const label = option?.label ?? (!status || status === "미제공" ? "상태 미제공" : `알 수 없는 상태 (${status})`);
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${option ? "whitespace-nowrap" : "break-all"} ${toneStyles[option?.tone ?? "neutral"]}`}>{label}</span>;
}
