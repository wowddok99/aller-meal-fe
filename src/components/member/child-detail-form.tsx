"use client";

import { PageHeading } from "@/components/page-heading";

import { AlertTriangle, CheckCircle2, LoaderCircle, RefreshCw, School as SchoolIcon, Search } from "lucide-react";
import { GuardedLink as Link } from "./guarded-link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ChildProfile, getChild, getSchool, MemberApiError, School, searchSchools, updateChild } from "@/lib/member-api";
import { useUnsavedChangesGuard } from "./edit-navigation-guard";
import { NumberStepper } from "./number-stepper";

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
  const savingRef = useRef(false);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [changingSchool, setChangingSchool] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const generationRef = useRef(0);
  const searchGenerationRef = useRef(0);
  const searchingRef = useRef(false);

  const load = useCallback(async () => {
    const generation = ++generationRef.current;
    searchGenerationRef.current += 1;
    savingRef.current = false; searchingRef.current = false;
    setSaving(false); setSearching(false); setChild(null); setSchool(null);
    setNotice(""); setFormError(""); setSearchError(""); setSchools([]); setKeyword(""); setChangingSchool(false);
    setLoading(true); setLoadError(null);
    try {
      const profile = await getChild(childId);
      let loadedSchool: School | null = null;
      try { loadedSchool = await getSchool(profile.schoolId); } catch { /* Keep the profile editable when school lookup fails. */ }
      if (generation !== generationRef.current) return;
      setChild(profile); setName(profile.name); setGrade(profile.grade); setClassNumber(profile.classNumber); setSchool(loadedSchool);
    } catch (reason) {
      if (generation === generationRef.current) setLoadError(reason instanceof MemberApiError ? reason : new MemberApiError(0, "자녀 정보를 불러오지 못했습니다."));
    } finally { if (generation === generationRef.current) setLoading(false); }
  }, [childId]);

  useEffect(() => { void load(); return () => { generationRef.current += 1; searchGenerationRef.current += 1; }; }, [load]);

  const normalizedName = name.trim().replace(/\s+/g, " ");
  const dirty = Boolean(!loading && child?.id === childId && (normalizedName !== child.name.trim().replace(/\s+/g, " ") || grade !== child.grade || classNumber !== child.classNumber || (school?.id ?? child.schoolId) !== child.schoolId));
  const navigation = useUnsavedChangesGuard({ dirty, busy: saving });

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    if (savingRef.current || searchingRef.current) return;
    if (!keyword.trim()) { setSearchError("검색할 학교명을 입력해 주세요."); return; }
    setSearching(true); setSearchError("");
    searchingRef.current = true;
    const generation = generationRef.current;
    const searchGeneration = ++searchGenerationRef.current;
    const current = () => generation === generationRef.current && searchGeneration === searchGenerationRef.current;
    try { const result = await searchSchools(keyword.trim()); if (current() && !savingRef.current) setSchools(result.schools); }
    catch (reason) { if (current() && !savingRef.current) { setSchools([]); setSearchError(reason instanceof MemberApiError ? errorMessage(reason) : "학교를 검색하지 못했습니다."); } }
    finally { if (current()) { searchingRef.current = false; setSearching(false); } }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (savingRef.current) return;
    if (!child || child.id !== childId || !normalizedName || normalizedName.length > 100) { setFormError("이름을 1자 이상 100자 이하로 입력해 주세요."); return; }
    const generation = generationRef.current;
    savingRef.current = true;
    setSaving(true); setFormError(""); setNotice("");
    try {
      const updated = await updateChild(childId, { name: normalizedName, grade, classNumber, schoolId: school?.id ?? child.schoolId });
      if (generation !== generationRef.current) return;
      let updatedSchool = school;
      if (updated.schoolId !== school?.id) { try { updatedSchool = await getSchool(updated.schoolId); } catch { updatedSchool = null; } }
      if (generation !== generationRef.current) return;
      setChild(updated); setName(updated.name); setGrade(updated.grade); setClassNumber(updated.classNumber); setSchool(updatedSchool);
      setNotice("변경사항을 저장했습니다."); setChangingSchool(false); setSchools([]); router.refresh();
    } catch (reason) { if (generation === generationRef.current) setFormError(reason instanceof MemberApiError ? errorMessage(reason) : "변경사항을 저장하지 못했습니다."); }
    finally { if (generation === generationRef.current) { savingRef.current = false; setSaving(false); } }
  }

  function requestLeave() {
    navigation.requestLeave(() => router.push("/children"));
  }

  const heading = <PageHeading title="자녀 정보" description="자녀 기본 정보를 확인하고 수정하세요." parents={[{ label: "자녀 관리", href: "/children" }]} />;
  if (loading || (child && child.id !== childId)) return <div className="mx-auto w-full max-w-[1220px] px-5 pb-12 pt-5">{heading}<div role="status" className="flex min-h-80 items-center justify-center text-sm font-bold text-zinc-500"><LoaderCircle aria-hidden="true" className="mr-2 h-5 w-5 animate-spin" />자녀 정보를 불러오고 있습니다.</div></div>;
  if (loadError) {
    const loginRequired = loadError.status === 401;
    return <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">{heading}<section className="rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-950 dark:bg-[#101419]"><AlertTriangle className="mx-auto h-10 w-10 text-red-500" /><h2 className="mt-4 text-xl font-extrabold">{loadError.status === 404 ? "자녀 정보를 찾을 수 없습니다" : loadError.status === 403 ? "자녀 정보에 접근할 수 없습니다" : loginRequired ? "로그인이 필요합니다" : "정보를 불러오지 못했습니다"}</h2><p className="mt-2 text-sm font-medium text-zinc-500">{errorMessage(loadError)}</p>{loginRequired ? <Link href="/auth/login" className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-mint-500 px-5 font-bold text-white">로그인</Link> : <button onClick={() => void load()} className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 px-5 font-bold dark:border-zinc-700"><RefreshCw className="h-4 w-4" />다시 시도</button>}</section></div>;
  }
  if (!child) return null;

  return <form onSubmit={(event) => void handleSave(event)} className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
    {heading}
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-6 dark:border-zinc-800 dark:bg-[#101419]">
      <div>
        <div className="flex flex-wrap items-center gap-2.5"><h2 className="min-w-0 break-keep text-2xl font-extrabold tracking-[-0.02em] [overflow-wrap:anywhere]">{child.name}</h2><span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-bold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">{child.grade}학년 {child.classNumber}반</span></div>
        <p className="mt-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">{school?.name ?? "학교 정보를 확인해 주세요."}</p>
      </div>
    </section>

    {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm font-bold text-mint-700 dark:border-mint-900 dark:bg-mint-950/30 dark:text-mint-300"><CheckCircle2 className="h-4 w-4" />{notice}</div>}
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-7 dark:border-zinc-800 dark:bg-[#101419]">
      <h2 className="text-xl font-extrabold tracking-[-0.02em]">기본 정보</h2>
      <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">이름, 학년·반과 소속 학교를 수정할 수 있어요.</p>
      <div className="mt-5 grid gap-5 md:grid-cols-3"><label className="font-bold">이름 <span className="text-red-500">*</span><input className={inputClass} value={name} disabled={saving} maxLength={100} onChange={(e) => { setName(e.target.value); setNotice(""); }} /><span className="mt-2 block text-xs font-medium text-zinc-500">1자 이상 100자 이하로 입력해 주세요.</span></label><div className="font-bold"><label htmlFor="child-grade">학년 <span className="text-red-500">*</span></label><NumberStepper id="child-grade" label="학년" value={grade} min={1} max={6} suffix="학년" onChange={setGrade} disabled={saving} /></div><div className="font-bold"><label htmlFor="child-class-number">반 <span className="text-red-500">*</span></label><NumberStepper id="child-class-number" label="반" value={classNumber} min={1} max={20} suffix="반" onChange={setClassNumber} disabled={saving} /></div></div>
      <div className="mt-6"><p className="font-bold">학교 <span className="text-red-500">*</span></p><div className="mt-2 flex items-center gap-3 rounded-[10px] border border-zinc-300 p-3 dark:border-zinc-700"><SchoolIcon className="h-4 w-4 shrink-0 text-zinc-400" /><div className="min-w-0 flex-1"><p className="font-extrabold">{school?.name ?? "학교 정보"}</p><p className="truncate text-xs font-medium text-zinc-500">{school?.address ?? child.schoolId}</p></div><button type="button" disabled={saving} onClick={() => setChangingSchool((v) => !v)} className="h-10 shrink-0 rounded-[10px] border border-zinc-300 px-4 text-sm font-bold transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900">학교 변경</button></div></div>
      {changingSchool && <div className="mt-4"><div className="flex gap-2"><label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-zinc-300 bg-white px-4 transition focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/20 dark:border-zinc-700 dark:bg-[#0b0f13]"><Search className="h-4 w-4 shrink-0 text-zinc-400" /><span className="sr-only">학교명</span><input value={keyword} disabled={saving} onChange={(e) => setKeyword(e.target.value)} className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" placeholder="학교명을 입력해 주세요" /></label><button type="button" onClick={(e) => void handleSearch(e)} disabled={searching || saving} className="h-12 w-20 shrink-0 rounded-[10px] bg-mint-500 px-3 text-sm font-bold text-white transition hover:bg-mint-600 disabled:opacity-50">{searching ? "검색 중" : "검색"}</button></div>{searchError && <p role="alert" className="mt-3 text-sm font-bold text-red-600">{searchError}</p>} {!searching && schools.length > 0 && <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">{schools.map((item) => <div key={item.id} className="flex items-center gap-3 border-b border-zinc-200 p-3 last:border-0 dark:border-zinc-800"><div className="min-w-0 flex-1"><p className="font-extrabold">{item.name}</p><p className="truncate text-xs text-zinc-500">{item.address}</p></div><button type="button" disabled={saving} onClick={() => { setSchool(item); setChangingSchool(false); setSchools([]); }} className="h-9 rounded-lg border border-mint-500 px-4 font-bold text-mint-600">선택</button></div>)}</div>}</div>}
      <div className="mt-7 flex justify-end border-t border-zinc-200 pt-5 dark:border-zinc-800"><div className="grid w-full grid-cols-2 gap-3 md:flex md:w-auto"><button type="button" onClick={requestLeave} disabled={saving} className="inline-flex h-11 w-full items-center justify-center rounded-[10px] border border-zinc-300 bg-white px-5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 md:w-24 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-200 dark:hover:bg-zinc-900">취소</button><button type="submit" disabled={saving} className="h-11 w-full rounded-[10px] bg-mint-500 px-5 text-sm font-extrabold text-white transition hover:bg-mint-600 disabled:cursor-not-allowed disabled:opacity-50 md:w-24">{saving ? "저장 중" : "저장"}</button></div></div>
    </section>

    {formError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><AlertTriangle className="mr-2 inline h-4 w-4" />{formError}</div>}
  </form>;
}
