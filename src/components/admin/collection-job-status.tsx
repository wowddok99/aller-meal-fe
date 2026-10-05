import type { CollectionJob } from "@/lib/admin-api";

export const collectionButtonStyle = "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-zinc-300 px-4 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:border-zinc-700";
export const collectionPanelStyle = "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419] md:p-6";

export function collectionStatus(status?: string | null) {
  return ({ PENDING: "대기", RUNNING: "수집 중", SUCCEEDED: "완료", FAILED: "실패" } as Record<string, string>)[status ?? ""] ?? "미제공";
}

export function collectionDate(value?: string | null) {
  if (!value) return "미제공";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "미제공" : new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short", hour12: false }).format(date);
}

export function CollectionJobStatus({ job }: { job: CollectionJob }) {
  const recovery = job.recovery;
  const label = recovery ? ({ NOT_REQUESTED: "재수집 미요청", IN_PROGRESS: "재수집 진행 중", SUCCEEDED: "재수집 성공", FAILED: "재수집 실패" })[recovery.status] : "복구 정보 미제공";
  return <><span>{collectionStatus(job.status)}</span>{job.status === "FAILED" ? <span className="mt-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">{label}</span> : null}</>;
}

export function collectionJobHref(id: string) {
  return `/admin/collection-jobs?collectionJobId=${encodeURIComponent(id.toLowerCase())}`;
}
