"use client";

import { AlertTriangle, Bell, ChevronRight, MoreVertical, Pencil, Plus, RefreshCw, ShieldCheck, Trash2, UsersRound, Utensils } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChildProfile, deleteChild, getChildren, getSchool, MemberApiError } from "@/lib/member-api";

function ChildSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419]">
      <div className="h-14 bg-zinc-100 dark:bg-zinc-900" />
      <div className="space-y-3 p-5"><div className="h-5 w-36 rounded bg-zinc-200 dark:bg-zinc-800" /><div className="h-20 rounded bg-zinc-100 dark:bg-zinc-900" /><div className="h-20 rounded bg-zinc-100 dark:bg-zinc-900" /></div>
    </div>
  );
}

export function ChildrenList() {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<MemberApiError | null>(null);
  const [target, setTarget] = useState<ChildProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [schoolNames, setSchoolNames] = useState<Record<string, string>>({});
  const menuRef = useRef<HTMLDivElement>(null);

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
      const nextChildren = children.filter((item) => item.id !== target.id);
      await deleteChild(target.id);
      setChildren(nextChildren);
      if (selectedChildId === target.id) setSelectedChildId(nextChildren[0]?.id ?? null);
      setNotice(`${target.name} 자녀 정보를 삭제했습니다.`);
      setTarget(null);
    } catch (reason) {
      setDeleteError(reason instanceof Error ? reason.message : "삭제하지 못했습니다.");
    } finally { setDeleting(false); }
  }

  const authError = error?.status === 401 || error?.status === 403;
  const selectedChild = children.find((child) => child.id === selectedChildId) ?? children[0] ?? null;

  useEffect(() => {
    if (!selectedChild || schoolNames[selectedChild.schoolId]) return;
    let active = true;
    void getSchool(selectedChild.schoolId).then((school) => {
      if (active) setSchoolNames((current) => ({ ...current, [selectedChild.schoolId]: school.name }));
    }).catch(() => undefined);
    return () => { active = false; };
  }, [selectedChild, schoolNames]);

  useEffect(() => {
    if (!openMenuId) return;
    function closeOnOutsidePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpenMenuId(null);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenuId(null);
    }
    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openMenuId]);

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-[1220px] flex-col gap-5 px-5 pb-12 pt-5">
      <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">등록한 자녀의 급식과 알레르기 설정을 관리하세요.</p>
      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><h1 className="text-2xl font-extrabold">자녀 관리</h1><p className="mt-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400">{loading ? "불러오는 중" : `등록된 자녀 ${children.length}명`}</p></div>
          <Link href="/children/new" className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-[10px] bg-mint-500 px-4 text-sm font-bold text-white transition-colors hover:bg-mint-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 sm:self-auto dark:focus-visible:ring-offset-[#101419]"><Plus className="h-4 w-4" />자녀 등록</Link>
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
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-[#101419]"><UsersRound className="mx-auto h-10 w-10 text-zinc-400" /><h2 className="mt-4 text-xl font-extrabold">등록된 자녀가 없어요</h2><p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">자녀를 등록하고 개인 맞춤 급식과 알레르기 설정을 관리해 보세요.</p><Link href="/children/new" className="mt-5 inline-flex h-11 items-center rounded-[10px] border border-mint-500 px-5 font-bold text-mint-600 transition-colors hover:bg-mint-50 dark:text-mint-400 dark:hover:bg-mint-950/20">자녀 등록하기</Link></div>
        )}
        {!loading && !error && selectedChild && (
          <>
            <div aria-label="관리할 자녀 선택" className="flex gap-2 overflow-x-auto pb-1">
              {children.map((child) => {
                const selected = child.id === selectedChild.id;
                return <button key={child.id} type="button" aria-pressed={selected} onClick={() => { setSelectedChildId(child.id); setOpenMenuId(null); }} className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-[10px] border px-3 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 ${selected ? "border-mint-500 bg-mint-500/10 text-mint-700 dark:bg-mint-950/30 dark:text-mint-300" : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-300 dark:hover:text-white"}`}>{child.name}<span className="text-xs font-semibold opacity-70">{child.grade}-{child.classNumber}</span></button>;
              })}
            </div>

            <section aria-label={`${selectedChild.name} 자녀 관리`} className="overflow-visible rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419]">
              <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-5 dark:border-zinc-800">
                <div className="min-w-0"><h2 className="text-xl font-extrabold">{selectedChild.name}</h2><p className="mt-0.5 truncate text-sm font-semibold text-zinc-500 dark:text-zinc-400">{schoolNames[selectedChild.schoolId] ? `${schoolNames[selectedChild.schoolId]} · ` : ""}{selectedChild.grade}학년 {selectedChild.classNumber}반</p></div>
                <div ref={menuRef} className="relative -mr-2"><button type="button" aria-label={`${selectedChild.name} 자녀 관리 메뉴`} aria-expanded={openMenuId === selectedChild.id} onClick={() => setOpenMenuId((current) => current === selectedChild.id ? null : selectedChild.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"><MoreVertical className="h-5 w-5" aria-hidden="true" /></button>{openMenuId === selectedChild.id && <div role="menu" className="absolute right-0 top-full z-20 mt-2 w-28 rounded-xl border border-zinc-200 bg-white p-1.5 text-left shadow-lg dark:border-zinc-700 dark:bg-[#151b22]"><Link role="menuitem" href={`/children/${selectedChild.id}`} onClick={() => setOpenMenuId(null)} className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"><Pencil className="h-4 w-4" />수정</Link><button type="button" role="menuitem" onClick={() => { setOpenMenuId(null); setTarget(selectedChild); setDeleteError(""); }} className="flex h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-bold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"><Trash2 className="h-4 w-4" />삭제</button></div>}</div>
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                <Link href={`/children/${selectedChild.id}/meals`} className="group flex min-h-20 items-center gap-3 px-5 py-4 transition-colors hover:bg-mint-50/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint-500 dark:hover:bg-mint-950/10"><Utensils className="h-5 w-5 shrink-0 text-mint-600 dark:text-mint-300" /><div className="min-w-0 flex-1"><h3 className="font-extrabold">개인 급식</h3><p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">맞춤 급식과 식단 정보를 확인합니다.</p></div><ChevronRight className="h-5 w-5 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-mint-600 dark:group-hover:text-mint-300" aria-hidden="true" /></Link>
                <Link href={`/children/${selectedChild.id}/allergens`} className="group flex min-h-20 items-center gap-3 px-5 py-4 transition-colors hover:bg-mint-50/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint-500 dark:hover:bg-mint-950/10"><ShieldCheck className="h-5 w-5 shrink-0 text-mint-600 dark:text-mint-300" /><div className="min-w-0 flex-1"><h3 className="font-extrabold">알레르기</h3><p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">등록한 알레르기 항목을 관리합니다.</p></div><ChevronRight className="h-5 w-5 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-mint-600 dark:group-hover:text-mint-300" aria-hidden="true" /></Link>
                <Link href={`/children/${selectedChild.id}/notification-preference`} className="group flex min-h-20 items-center gap-3 px-5 py-4 transition-colors hover:bg-mint-50/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint-500 dark:hover:bg-mint-950/10"><Bell className="h-5 w-5 shrink-0 text-mint-600 dark:text-mint-300" /><div className="min-w-0 flex-1"><h3 className="font-extrabold">알림 설정</h3><p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">급식 알림 수신 방식을 관리합니다.</p></div><ChevronRight className="h-5 w-5 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-mint-600 dark:group-hover:text-mint-300" aria-hidden="true" /></Link>
              </div>
            </section>
          </>
        )}
      </section>

      {target && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setTarget(null); }}><div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-[#101419]"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" /><div><h2 id="delete-title" className="text-lg font-extrabold">자녀 정보 삭제</h2><p className="mt-2 text-sm font-medium text-zinc-500">정말 {target.name} 자녀 정보를 삭제할까요? 관련 설정도 더 이상 이용할 수 없습니다.</p></div></div>{deleteError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">{deleteError}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" disabled={deleting} onClick={() => setTarget(null)} className="h-11 rounded-[10px] border border-zinc-300 px-5 font-bold disabled:opacity-50 dark:border-zinc-700">취소</button><button type="button" disabled={deleting} onClick={() => void confirmDelete()} className="h-11 rounded-[10px] bg-red-600 px-5 font-bold text-white disabled:opacity-50">{deleting ? "삭제 중" : "삭제"}</button></div></div></div>}
    </div>
  );
}
