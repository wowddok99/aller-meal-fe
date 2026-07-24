"use client";

import { AlertTriangle, Bell, CheckCircle2, LoaderCircle, Pencil, RefreshCw, School as SchoolIcon, Search, ShieldCheck, Trash2, Utensils } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ChildProfile, deleteChild, getChild, getSchool, MemberApiError, School, searchSchools, updateChild } from "@/lib/member-api";

const inputClass = "mt-2 h-12 w-full rounded-[10px] border border-zinc-300 bg-white px-4 font-semibold outline-none transition focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 dark:border-zinc-700 dark:bg-[#0b0f13]";

function errorMessage(error: MemberApiError) {
  if (error.status === 401) return "로그인이 필요합니다.";
  if (error.status === 403) return "이메일 인증 또는 접근 권한을 확인해 주세요.";
  if (error.status === 404) return "자녀 정보를 찾을 수 없습니다.";
  if (error.status === 409) return "현재 상태에서는 요청을 처리할 수 없습니다.";
  if (error.status === 429) return "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  return error.message;
}

export function ChildDetailForm({ childId }: { childId: string }) {
  const router = useRouter();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(1);
  const [classNumber, setClassNumber] = useState(1);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<MemberApiError | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [changingSchool, setChangingSchool] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const profile = await getChild(childId);
      setChild(profile); setName(profile.name); setGrade(profile.grade); setClassNumber(profile.classNumber);
      try { setSchool(await getSchool(profile.schoolId)); } catch { setSchool(null); }
    } catch (reason) {
      setLoadError(reason instanceof MemberApiError ? reason : new MemberApiError(0, "자녀 정보를 불러오지 못했습니다."));
    } finally { setLoading(false); }
  }, [childId]);

  useEffect(() => { void load(); }, [load]);

  const normalizedName = name.trim().replace(/\s+/g, " ");
  const dirty = useMemo(() => Boolean(child && (normalizedName !== child.name || grade !== child.grade || classNumber !== child.classNumber || (school?.id ?? child.schoolId) !== child.schoolId)), [child, normalizedName, grade, classNumber, school]);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    if (!keyword.trim()) { setSearchError("검색할 학교명을 입력해 주세요."); return; }
    setSearching(true); setSearchError("");
    try { setSchools((await searchSchools(keyword.trim())).schools); }
    catch (reason) { setSchools([]); setSearchError(reason instanceof MemberApiError ? errorMessage(reason) : "학교를 검색하지 못했습니다."); }
    finally { setSearching(false); }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!child || !normalizedName || normalizedName.length > 100) { setFormError("이름을 1자 이상 100자 이하로 입력해 주세요."); return; }
    setSaving(true); setFormError(""); setNotice("");
    try {
      const updated = await updateChild(childId, { name: normalizedName, grade, classNumber, schoolId: school?.id ?? child.schoolId });
      setChild(updated); setName(updated.name); setGrade(updated.grade); setClassNumber(updated.classNumber);
      setNotice("변경사항을 저장했습니다."); setChangingSchool(false); setSchools([]); router.refresh();
    } catch (reason) { setFormError(reason instanceof MemberApiError ? errorMessage(reason) : "변경사항을 저장하지 못했습니다."); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    setDeleting(true); setFormError("");
    try { await deleteChild(childId); router.replace("/children"); router.refresh(); }
    catch (reason) { setFormError(reason instanceof MemberApiError ? errorMessage(reason) : "자녀 정보를 삭제하지 못했습니다."); setConfirmingDelete(false); setDeleting(false); }
  }

  if (loading) return <div className="mx-auto flex min-h-80 max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />자녀 정보를 불러오고 있습니다.</div>;
  if (loadError) {
    const auth = loadError.status === 401 || loadError.status === 403;
    return <div className="mx-auto w-full max-w-[1220px] px-5 pt-5"><section className="rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-950 dark:bg-[#101419]"><AlertTriangle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-extrabold">{loadError.status === 404 ? "자녀 정보를 찾을 수 없습니다" : auth ? "로그인이 필요합니다" : "정보를 불러오지 못했습니다"}</h1><p className="mt-2 text-sm font-medium text-zinc-500">{errorMessage(loadError)}</p>{auth ? <Link href="/auth/login" className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-mint-500 px-5 font-bold text-white">로그인</Link> : <button onClick={() => void load()} className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 px-5 font-bold dark:border-zinc-700"><RefreshCw className="h-4 w-4" />다시 시도</button>}</section></div>;
  }
  if (!child) return null;

  return <form onSubmit={(event) => void handleSave(event)} className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
    <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">자녀 기본 정보를 확인하고 수정하세요.</p>
    <section className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 lg:flex-row lg:items-center lg:justify-between md:p-7 dark:border-zinc-800 dark:bg-[#101419]">
      <div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-mint-50 text-xl font-extrabold text-mint-700 dark:bg-mint-950/30 dark:text-mint-300">{child.name.slice(0, 1)}</span><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-extrabold">{child.name}</h1><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold dark:bg-zinc-900">{child.grade}학년 {child.classNumber}반</span></div></div></div>
      <div className="grid gap-2 sm:grid-cols-3"><Link href={`/children/${childId}/meals`} className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-zinc-300 px-4 font-bold dark:border-zinc-700"><Utensils className="h-4 w-4" />개인 급식</Link><Link href={`/children/${childId}/allergens`} className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-zinc-300 px-4 font-bold dark:border-zinc-700"><ShieldCheck className="h-4 w-4" />알레르기 설정</Link><Link href={`/children/${childId}/notification-preference`} className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-zinc-300 px-4 font-bold dark:border-zinc-700"><Bell className="h-4 w-4" />알림 설정</Link></div>
    </section>

    {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm font-bold text-mint-700 dark:border-mint-900 dark:bg-mint-950/30 dark:text-mint-300"><CheckCircle2 className="h-4 w-4" />{notice}</div>}
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-7 dark:border-zinc-800 dark:bg-[#101419]">
      <h2 className="flex items-center gap-2 text-xl font-extrabold"><Pencil className="text-mint-500" />기본 정보 수정</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-3"><label className="font-bold">이름 <span className="text-red-500">*</span><input className={inputClass} value={name} maxLength={100} onChange={(e) => { setName(e.target.value); setNotice(""); }} /><span className="mt-2 block text-xs font-medium text-zinc-500">1자 이상 100자 이하로 입력해 주세요.</span></label><label className="font-bold">학년 <span className="text-red-500">*</span><select className={inputClass} value={grade} onChange={(e) => setGrade(Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}학년</option>)}</select></label><label className="font-bold">반 <span className="text-red-500">*</span><input className={inputClass} type="number" min={1} max={99} value={classNumber} onChange={(e) => setClassNumber(Math.min(99, Math.max(1, Number(e.target.value) || 1)))} /></label></div>
      <div className="mt-6"><p className="font-bold">학교 <span className="text-red-500">*</span></p><div className="mt-2 flex items-center gap-3 rounded-[10px] border border-zinc-300 p-3 dark:border-zinc-700"><SchoolIcon className="h-5 w-5 text-zinc-400" /><div className="min-w-0 flex-1"><p className="font-extrabold">{school?.name ?? "학교 정보"}</p><p className="truncate text-xs font-medium text-zinc-500">{school?.address ?? child.schoolId}</p></div><button type="button" onClick={() => setChangingSchool((v) => !v)} className="h-10 rounded-[10px] border border-zinc-300 px-4 font-bold dark:border-zinc-700">학교 변경</button></div></div>
      {changingSchool && <div className="mt-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950"><div className="flex flex-col gap-2 sm:flex-row"><label className="flex h-12 flex-1 items-center gap-2 rounded-[10px] border border-zinc-300 bg-white px-4 dark:border-zinc-700 dark:bg-[#0b0f13]"><Search className="h-4 w-4 text-zinc-400" /><span className="sr-only">학교명</span><input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="h-full w-full bg-transparent font-semibold outline-none" placeholder="학교명을 입력해 주세요" /></label><button type="button" onClick={(e) => void handleSearch(e)} disabled={searching} className="h-12 rounded-[10px] bg-mint-500 px-6 font-extrabold text-white disabled:opacity-50">{searching ? "검색 중" : "검색"}</button></div>{searchError && <p role="alert" className="mt-3 text-sm font-bold text-red-600">{searchError}</p>} {!searching && schools.length > 0 && <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">{schools.map((item) => <div key={item.id} className="flex items-center gap-3 border-b border-zinc-200 p-3 last:border-0 dark:border-zinc-800"><div className="min-w-0 flex-1"><p className="font-extrabold">{item.name}</p><p className="truncate text-xs text-zinc-500">{item.address}</p></div><button type="button" onClick={() => { setSchool(item); setChangingSchool(false); setSchools([]); }} className="h-9 rounded-lg border border-mint-500 px-4 font-bold text-mint-600">선택</button></div>)}</div>}</div>}
    </section>

    {formError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><AlertTriangle className="mr-2 inline h-4 w-4" />{formError}</div>}
    <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 md:flex-row md:items-center md:justify-between dark:border-zinc-800 dark:bg-[#101419]"><div><h2 className="text-xl font-extrabold">저장 및 관리</h2><p className="mt-1 text-sm font-medium text-zinc-500">변경한 기본 정보를 저장하거나 자녀 정보를 삭제할 수 있습니다.</p></div><div className="flex flex-wrap gap-2"><button type="submit" disabled={!dirty || saving} className="h-12 rounded-[10px] bg-mint-500 px-6 font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "저장 중" : "변경사항 저장"}</button><Link href="/children" className="inline-flex h-12 items-center rounded-[10px] border border-zinc-300 px-6 font-bold dark:border-zinc-700">목록으로</Link><button type="button" onClick={() => setConfirmingDelete(true)} className="inline-flex h-12 items-center gap-2 rounded-[10px] px-4 font-bold text-red-600"><Trash2 className="h-4 w-4" />자녀 삭제</button></div></section>
    {confirmingDelete && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5" role="dialog" aria-modal="true" aria-labelledby="delete-title"><div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-[#101419]"><AlertTriangle className="h-9 w-9 text-red-500" /><h2 id="delete-title" className="mt-4 text-xl font-extrabold">자녀 삭제 확인</h2><p className="mt-2 text-sm font-medium text-zinc-500">{child.name} 자녀를 삭제하면 관련 설정도 함께 정리됩니다. 이 작업은 되돌릴 수 없습니다.</p><div className="mt-6 flex justify-end gap-2"><button type="button" disabled={deleting} onClick={() => setConfirmingDelete(false)} className="h-11 rounded-[10px] border border-zinc-300 px-5 font-bold dark:border-zinc-700">취소</button><button type="button" disabled={deleting} onClick={() => void handleDelete()} className="h-11 rounded-[10px] bg-red-600 px-5 font-extrabold text-white disabled:opacity-50">{deleting ? "삭제 중" : "삭제하기"}</button></div></div></div>}
  </form>;
}
