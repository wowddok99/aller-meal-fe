"use client";

import {
  AlertTriangle,
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ChildProfile,
  getChild,
  getNotificationHistory,
  getSchool,
  MemberApiError,
  NotificationHistory,
  NotificationHistoryItem,
} from "@/lib/member-api";

const pageSize = 10;

const reasonLabels: Record<string, string> = {
  RISK_DETECTED: "주의 메뉴 감지",
  NO_RISK: "급식 데이터 갱신",
  RISK_UNKNOWN: "위험도 확인 필요",
  RISK_LABELING_FAILED: "알레르기 판별 실패",
  RISK_PENDING: "알레르기 판별 대기",
  NO_MEAL: "급식 정보 없음",
};

const statusLabels: Record<string, string> = {
  PENDING: "발송 대기",
  SENDING: "발송 중",
  RETRY_PENDING: "재시도 대기",
  SENT: "발송 완료",
  FAILED: "발송 실패",
  CANCELED: "발송 취소",
};

function errorMessage(error: MemberApiError) {
  if (error.status === 401) return "로그인이 필요합니다.";
  if (error.status === 403) return "이메일 인증 또는 자녀 접근 권한을 확인해 주세요.";
  if (error.status === 404) return "자녀 또는 알림 이력을 찾을 수 없습니다.";
  if (error.status === 429) return "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  return error.message;
}

function formatTime(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SENT: "border-mint-500/30 bg-mint-500/10 text-mint-700 dark:text-mint-300",
    PENDING: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    SENDING: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    FAILED: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
    RETRY_PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    CANCELED: "border-zinc-400/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
  };
  return <span title={status} className={`inline-flex h-8 items-center rounded-[9px] border px-3 text-xs font-extrabold ${styles[status] ?? "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}>{statusLabels[status] ?? status}</span>;
}

function NotificationRow({ item }: { item: NotificationHistoryItem }) {
  const reason = reasonLabels[item.reason] ?? item.reason;
  return <div className="grid gap-3 border-t border-zinc-200 px-6 py-4 text-sm font-semibold dark:border-zinc-800 md:grid-cols-[130px_100px_minmax(150px,1fr)_150px_80px_100px_minmax(130px,0.8fr)] md:items-center md:gap-4 md:px-8">
    <Detail label="알림일" value={item.notificationDate} />
    <Detail label="채널" value={item.channel} />
    <Detail label="알림 발생 사유" value={<span title={item.reason}>{reason}</span>} />
    <Detail label="발송 상태" value={<StatusBadge status={item.status} />} />
    <Detail label="시도" value={`${item.attemptCount}회`} />
    <Detail label="발송 시각" value={formatTime(item.sentAt)} />
    <Detail label="실패 코드" value={item.failureCode ?? "-"} />
  </div>;
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex min-w-0 items-center justify-between gap-3 md:block"><span className="text-xs font-bold text-zinc-500 md:hidden">{label}</span><span className="min-w-0 truncate text-right md:text-left">{value}</span></div>;
}

export function ChildNotificationHistory({ childId }: { childId: string }) {
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [history, setHistory] = useState<NotificationHistory | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<MemberApiError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profile, notificationHistory] = await Promise.all([
        getChild(childId),
        getNotificationHistory(childId, page, pageSize),
      ]);
      const school = await getSchool(profile.schoolId).catch(() => null);
      setChild(profile);
      setSchoolName(school?.name ?? "");
      setHistory(notificationHistory);
    } catch (reason) {
      setError(reason instanceof MemberApiError ? reason : new MemberApiError(0, "알림 이력을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }, [childId, page]);

  useEffect(() => { void load(); }, [load]);

  const notifications = history?.notifications ?? [];
  const totalPages = Math.max(1, Math.ceil((history?.totalCount ?? 0) / pageSize));

  if (loading && !history) return <div className="mx-auto flex min-h-80 max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> 알림 이력을 불러오고 있습니다.</div>;
  if (error) {
    const auth = error.status === 401 || error.status === 403;
    return <div className="mx-auto w-full max-w-[1220px] px-5 pt-5"><section className="rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-950 dark:bg-[#101419]"><AlertTriangle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-extrabold">{auth ? "로그인이 필요합니다" : "알림 이력을 불러오지 못했습니다"}</h1><p className="mt-2 text-sm font-medium text-zinc-500">{errorMessage(error)}</p>{auth ? <Link href="/auth/login" className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-mint-500 px-5 font-bold text-white">로그인</Link> : <button type="button" onClick={() => void load()} className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 px-5 font-bold dark:border-zinc-700"><RefreshCw className="h-4 w-4" /> 다시 시도</button>}</section></div>;
  }
  if (!child || !history) return null;

  return <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
    <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">자녀별 급식 알림 발송 이력을 확인하세요.</p>
    <section className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 md:px-8 md:py-6 dark:border-zinc-800 dark:bg-[#101419]"><div className="flex flex-wrap items-center justify-between gap-5"><div><div className="flex flex-wrap items-center gap-2.5"><h1 className="text-2xl font-extrabold tracking-[-0.02em]">{child.name}</h1><span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-bold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">{child.grade}학년 {child.classNumber}반</span></div>{schoolName && <p className="mt-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">{schoolName}</p>}</div><Link href={`/children/${childId}/notification-preference`} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[10px] border border-zinc-300 px-4 text-sm font-extrabold transition-colors hover:border-mint-500 hover:text-mint-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:border-zinc-700 dark:hover:text-mint-300"><Bell className="h-5 w-5 text-mint-600 dark:text-mint-400" /> 알림 설정</Link></div></section>
    <section aria-labelledby="notification-history-heading" className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419]"><div className="border-b border-zinc-200 px-6 py-5 md:px-8 dark:border-zinc-800"><h2 id="notification-history-heading" className="text-xl font-extrabold tracking-[-0.02em]">알림 발송 이력</h2><p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">총 {history.totalCount}건</p></div>{loading ? <div className="flex min-h-48 items-center justify-center text-sm font-bold text-zinc-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> 페이지를 불러오고 있습니다.</div> : notifications.length ? <><div className="hidden grid-cols-[130px_100px_minmax(150px,1fr)_150px_80px_100px_minmax(130px,0.8fr)] gap-4 bg-zinc-50 px-6 py-4 text-sm font-bold text-zinc-500 dark:bg-black/20 md:px-8 md:grid"><span>알림일</span><span>채널</span><span>알림 발생 사유</span><span>발송 상태</span><span>시도</span><span>발송 시각</span><span>실패 코드</span></div><div aria-live="polite">{notifications.map((item) => <NotificationRow key={item.notificationId} item={item} />)}</div></> : <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center md:px-8"><CircleDashed className="h-9 w-9 text-zinc-400" /><h3 className="mt-3 font-extrabold">표시할 알림 이력이 없습니다</h3><p className="mt-1 text-sm font-medium text-zinc-500">알림이 발송되면 이곳에서 확인할 수 있어요.</p></div>}{totalPages > 1 ? <nav aria-label="알림 이력 페이지 이동" className="flex items-center justify-center gap-2 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800 md:px-8"><button type="button" aria-label="이전 페이지" disabled={page === 1 || loading} onClick={() => setPage((value) => value - 1)} className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-zinc-300 transition-colors hover:border-mint-500 hover:text-mint-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:text-mint-300"><ChevronLeft className="h-5 w-5" /></button><span className="min-w-10 text-center text-sm font-extrabold">{page} / {totalPages}</span><button type="button" aria-label="다음 페이지" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-zinc-300 transition-colors hover:border-mint-500 hover:text-mint-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:text-mint-300"><ChevronRight className="h-5 w-5" /></button></nav> : null}</section>
  </div>;
}
