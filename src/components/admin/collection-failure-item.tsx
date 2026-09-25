import { LoaderCircle, RotateCw } from "lucide-react";
import { isAdminActionId, type FailedCollectionJob } from "@/lib/admin-api";

const mealLabels: Record<string, string> = {
  BREAKFAST: "아침",
  LUNCH: "점심",
  DINNER: "저녁",
};

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  }).format(date);
}

function RecollectButton({
  job,
  pendingId,
  onRecollect,
}: {
  job: FailedCollectionJob;
  pendingId?: string;
  onRecollect: (job: FailedCollectionJob) => void;
}) {
  if (!isAdminActionId(job.collectionJobId)) return null;
  const pending = pendingId === job.collectionJobId;

  return (
    <button
      type="button"
      onClick={() => onRecollect(job)}
      disabled={Boolean(pendingId)}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-zinc-300 px-3.5 text-sm font-extrabold transition-colors hover:border-mint-500 hover:bg-mint-50 hover:text-mint-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500 disabled:cursor-wait disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-mint-500/10 dark:hover:text-mint-300"
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
      {pending ? "요청 중" : "재수집"}
    </button>
  );
}

export function CollectionFailureTableRow({
  job,
  pendingId,
  selected,
  onSelect,
  onRecollect,
}: {
  job: FailedCollectionJob;
  pendingId?: string;
  selected: boolean;
  onSelect: (job: FailedCollectionJob) => void;
  onRecollect: (job: FailedCollectionJob) => void;
}) {
  return (
    <tr className={`align-top ${selected ? "bg-mint-500/[0.06]" : "hover:bg-mint-500/[0.03]"}`}>
      <td className="px-5 py-4">
        <p className="text-sm font-bold" title={job.schoolId}>{job.schoolId}</p>
        <p className="mt-1 whitespace-nowrap text-sm font-semibold">{job.mealDate} · {mealLabels[job.mealType] ?? job.mealType}</p>
      </td>
      <td className="align-middle px-5 py-4">
        <p className="max-w-72 text-sm font-semibold leading-5">{job.failureMessage}</p>
      </td>
      <td className="whitespace-nowrap px-5 py-4">
        <p className="font-extrabold tabular-nums">{job.responseTimeMillis.toLocaleString()}ms</p>
        <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">수집 {job.collectionDurationMillis.toLocaleString()}ms</p>
      </td>
      <td className="px-5 py-4">
        <p className="whitespace-nowrap text-sm font-semibold">{formatDateTime(job.updatedAt)}</p>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onSelect(job)}
            aria-pressed={selected}
            className="h-10 rounded-[10px] border border-zinc-300 px-3.5 text-sm font-extrabold hover:border-mint-500 hover:text-mint-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500 dark:border-zinc-700 dark:hover:text-mint-300"
          >
            {selected ? "선택됨" : "선택"}
          </button>
          {selected ? <RecollectButton job={job} pendingId={pendingId} onRecollect={onRecollect} /> : null}
        </div>
      </td>
    </tr>
  );
}

export function CollectionFailureCard({
  job,
  pendingId,
  selected,
  onSelect,
  onRecollect,
}: {
  job: FailedCollectionJob;
  pendingId?: string;
  selected: boolean;
  onSelect: (job: FailedCollectionJob) => void;
  onRecollect: (job: FailedCollectionJob) => void;
}) {
  return (
    <article className={`border-b border-zinc-200 p-5 last:border-b-0 dark:border-zinc-800 ${selected ? "bg-mint-500/[0.06]" : "hover:bg-mint-500/[0.03]"}`}>
      <div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold" title={job.schoolId}>{job.schoolId}</p>
          <h3 className="mt-1 text-base font-extrabold">{job.mealDate} · {mealLabels[job.mealType] ?? job.mealType}</h3>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold leading-5">{job.failureMessage}</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
        <div><dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">응답 시간</dt><dd className="mt-1 font-extrabold tabular-nums">{job.responseTimeMillis.toLocaleString()}ms</dd></div>
        <div><dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">수집 소요</dt><dd className="mt-1 font-extrabold tabular-nums">{job.collectionDurationMillis.toLocaleString()}ms</dd></div>
        <div className="col-span-2"><dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">실패 시각</dt><dd className="mt-1 font-semibold">{formatDateTime(job.updatedAt)}</dd></div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelect(job)}
          aria-pressed={selected}
          className="h-10 rounded-[10px] border border-zinc-300 px-3.5 text-sm font-extrabold hover:border-mint-500 hover:text-mint-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500 dark:border-zinc-700 dark:hover:text-mint-300"
        >
          {selected ? "선택됨" : "상세 선택"}
        </button>
        {selected ? <RecollectButton job={job} pendingId={pendingId} onRecollect={onRecollect} /> : null}
      </div>
    </article>
  );
}
