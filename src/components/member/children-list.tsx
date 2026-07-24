"use client";

import { AlertTriangle, Bell, CalendarDays, Pencil, Plus, RefreshCw, ShieldCheck, Trash2, UsersRound, Utensils } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChildProfile, deleteChild, getChildren, MemberApiError } from "@/lib/member-api";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(date);
}

function ChildSkeleton() {
  return <div className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#101419]"><div className="h-7 w-32 rounded bg-zinc-200 dark:bg-zinc-800" /><div className="mt-4 h-12 rounded bg-zinc-100 dark:bg-zinc-900" /></div>;
}

export function ChildrenList() {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<MemberApiError | null>(null);
  const [target, setTarget] = useState<ChildProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setChildren(await getChildren()); } catch (reason) { setError(reason instanceof MemberApiError ? reason : new MemberApiError(0, "자녀 목록을 불러오지 못했습니다.")); } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function confirmDelete() {
    if (!target) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteChild(target.id);
      setChildren((items) => items.filter((item) => item.id !== target.id));
      setNotice(`${target.name} 자녀 정보를 삭제했습니다.`);
      setTarget(null);
    } catch (reason) {
      setDeleteError(reason instanceof Error ? reason.message : "삭제하지 못했습니다.");
    } finally { setDeleting(false); }
  }

  const authError = error?.status === 401 || error?.status === 403;

  return (
    <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
      <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">등록한 자녀의 급식과 알레르기 설정을 관리하세요.</p>
      <section className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-[#101419]">
          <div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-50 text-mint-600 dark:bg-mint-950/30 dark:text-mint-400"><UsersRound /></span><div><h1 className="text-2xl font-extrabold">자녀 목록</h1><p className="text-sm font-semibold text-zinc-500">{loading ? "불러오는 중" : `총 ${children.length}명`}</p></div></div>
          <Link href="/children/new" className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-mint-500 px-5 font-extrabold text-white hover:bg-mint-600"><Plus className="h-5 w-5" />자녀 등록</Link>
        </div>

        {notice && <div role="status" className="rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm font-bold text-mint-700 dark:border-mint-900 dark:bg-mint-950/30 dark:text-mint-300">{notice}</div>}
        {loading && <><ChildSkeleton /><ChildSkeleton /></>}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-950 dark:bg-[#101419]">
            <AlertTriangle className="mx-auto h-9 w-9 text-red-500" /><h2 className="mt-3 text-lg font-extrabold">{authError ? "로그인이 필요합니다" : "자녀 목록을 불러오지 못했습니다"}</h2><p className="mt-2 text-sm font-medium text-zinc-500">{error.status === 403 ? "이메일 인증 또는 접근 권한을 확인해 주세요." : error.message}</p>
            {authError ? <Link href="/auth/login" className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-mint-500 px-5 font-bold text-white">로그인</Link> : <button type="button" onClick={() => void load()} className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 px-5 font-bold dark:border-zinc-700"><RefreshCw className="h-4 w-4" />다시 시도</button>}
          </div>
        )}
        {!loading && !error && children.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-[#101419]"><UsersRound className="mx-auto h-10 w-10 text-zinc-400" /><h2 className="mt-4 text-xl font-extrabold">등록된 자녀가 없어요</h2><p className="mt-2 text-sm font-medium text-zinc-500">자녀를 등록하고 개인 맞춤 급식과 알레르기 설정을 관리해 보세요.</p><Link href="/children/new" className="mt-5 inline-flex h-11 items-center rounded-[10px] border border-mint-500 px-5 font-bold text-mint-600 dark:text-mint-400">자녀 등록하기</Link></div>
        )}
        {!loading && !error && children.map((child) => (
          <article key={child.id} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#101419]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-mint-50 text-xl font-extrabold text-mint-700 dark:bg-mint-950/30 dark:text-mint-300">{child.name.slice(0, 1)}</span><div className="min-w-0"><h2 className="text-xl font-extrabold">{child.name}</h2><span className="mt-1 inline-flex rounded-md border border-zinc-300 px-2 py-1 text-xs font-bold dark:border-zinc-700">{child.grade}학년 {child.classNumber}반</span><div className="mt-3 grid gap-2 text-xs font-semibold text-zinc-500 sm:grid-cols-2"><span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />등록일 {formatDate(child.createdAt)}</span><span className="truncate" title={child.schoolId}>학교 ID {child.schoolId}</span></div></div></div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
                <Link href={`/children/${child.id}/meals`} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3 text-sm font-bold dark:border-zinc-700"><Utensils className="h-4 w-4" />개인 급식</Link>
                <Link href={`/children/${child.id}/allergens`} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3 text-sm font-bold dark:border-zinc-700"><ShieldCheck className="h-4 w-4" />알레르기</Link>
                <Link href={`/children/${child.id}/notification-preference`} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3 text-sm font-bold dark:border-zinc-700"><Bell className="h-4 w-4" />알림 설정</Link>
                <Link href={`/children/${child.id}`} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3 text-sm font-bold dark:border-zinc-700"><Pencil className="h-4 w-4" />수정</Link>
                <button type="button" onClick={() => { setTarget(child); setDeleteError(""); }} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-red-300 px-3 text-sm font-bold text-red-600 dark:border-red-900 dark:text-red-400"><Trash2 className="h-4 w-4" />삭제</button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {target && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setTarget(null); }}><div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-[#101419]"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" /><div><h2 id="delete-title" className="text-lg font-extrabold">자녀 정보 삭제</h2><p className="mt-2 text-sm font-medium text-zinc-500">정말 {target.name} 자녀 정보를 삭제할까요? 관련 설정도 더 이상 이용할 수 없습니다.</p></div></div>{deleteError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">{deleteError}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" disabled={deleting} onClick={() => setTarget(null)} className="h-11 rounded-[10px] border border-zinc-300 px-5 font-bold disabled:opacity-50 dark:border-zinc-700">취소</button><button type="button" disabled={deleting} onClick={() => void confirmDelete()} className="h-11 rounded-[10px] bg-red-600 px-5 font-bold text-white disabled:opacity-50">{deleting ? "삭제 중" : "삭제"}</button></div></div></div>}
    </div>
  );
}
