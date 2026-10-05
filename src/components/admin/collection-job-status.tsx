import type { CollectionJob } from "@/lib/admin-api";

export const collectionButtonStyle = "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-zinc-300 px-4 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:border-zinc-700";
export const collectionPanelStyle = "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-6";

export function collectionStatus(status?: string | null) {
  return ({ PENDING: "대기", RUNNING: "수집 중", SUCCEEDED: "완료", FAILED: "실패" } as Record<string, string>)[status ?? ""] ?? "미제공";
}

export function CollectionBadge({ status, label }: { status?: string | null; label?: string }) {
  const color = status === "SUCCEEDED"
    ? "border-mint-300 bg-mint-50 text-mint-800 dark:border-mint-800 dark:bg-mint-500/10 dark:text-mint-300"
    : status === "RUNNING" || status === "IN_PROGRESS"
      ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300"
      : status === "FAILED"
        ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        : "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold whitespace-nowrap ${color}`}>{label ?? collectionStatus(status)}</span>;
}

export function collectionDate(value?: string | null) {
  if (!value) return "미제공";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "미제공" : new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short", hour12: false }).format(date);
}

export function collectionJobDisplayStatus(job: CollectionJob) {
  const recovery = job.recovery;
  if (job.status === "FAILED") {
    if (recovery?.status === "SUCCEEDED") {
      const newerAttempt = recovery.latestCollectionJobId && recovery.latestCollectionJobId.toLowerCase() !== recovery.resolvedCollectionJobId?.toLowerCase();
      if (newerAttempt && recovery.latestStatus === "FAILED") return { status: "FAILED", label: "최근 재수집 실패" };
      if (newerAttempt && (recovery.latestStatus === "PENDING" || recovery.latestStatus === "RUNNING")) return { status: "RUNNING", label: "최근 재수집 진행 중" };
      return { status: "SUCCEEDED", label: "재수집 완료" };
    }
    if (recovery?.status === "IN_PROGRESS") return { status: "RUNNING", label: "재수집 진행 중" };
    return { status: "FAILED", label: recovery?.status === "FAILED" ? "재수집 실패" : "수집 실패" };
  }
  return { status: job.status, label: ({ PENDING: "수집 대기", RUNNING: "수집 중", SUCCEEDED: "수집 완료" } as Record<string, string>)[job.status ?? ""] ?? "상태 미제공" };
}

export function CollectionJobStatus({ job }: { job: CollectionJob }) {
  return <CollectionBadge {...collectionJobDisplayStatus(job)} />;
}

export function collectionJobHref(id: string) {
  return `/admin/collection-jobs?collectionJobId=${encodeURIComponent(id.toLowerCase())}`;
}
