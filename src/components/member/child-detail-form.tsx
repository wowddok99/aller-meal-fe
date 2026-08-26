"use client";

import { AlertTriangle, CheckCircle2, ChevronDown, LoaderCircle, Minus, Plus, RefreshCw, School as SchoolIcon, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ChildProfile, getChild, getSchool, MemberApiError, School, searchSchools, updateChild } from "@/lib/member-api";

const inputClass = "mt-2 h-12 w-full rounded-[10px] border border-zinc-300 bg-white px-4 font-semibold outline-none transition focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 dark:border-zinc-700 dark:bg-[#0b0f13]";

function NumberStepper({
  id,
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return <div className="mt-2 flex h-12 overflow-hidden rounded-[10px] border border-zinc-300 bg-white transition focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/20 dark:border-zinc-700 dark:bg-[#0b0f13]"><button type="button" aria-label={`${label} 줄이기`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} className="flex w-10 shrink-0 items-center justify-center border-r border-zinc-300 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-35 sm:w-12 dark:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"><Minus className="h-4 w-4" /></button><div className="relative min-w-0 flex-1"><select id={id} aria-label={label} value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-full w-full appearance-none bg-transparent px-8 text-center font-extrabold outline-none [text-align-last:center] sm:pl-9 sm:pr-10">{Array.from({ length: max - min + 1 }, (_, index) => { const optionValue = min + index; return <option key={optionValue} value={optionValue}>{optionValue}{suffix}</option>; })}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" /></div><button type="button" aria-label={`${label} 늘리기`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} className="flex w-10 shrink-0 items-center justify-center border-l border-zinc-300 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-35 sm:w-12 dark:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"><Plus className="h-4 w-4" /></button></div>;
}

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

  if (loading) return <div className="mx-auto flex min-h-80 max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />자녀 정보를 불러오고 있습니다.</div>;
  if (loadError) {
    const auth = loadError.status === 401 || loadError.status === 403;
    return <div className="mx-auto w-full max-w-[1220px] px-5 pt-5"><section className="rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-950 dark:bg-[#101419]"><AlertTriangle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-extrabold">{loadError.status === 404 ? "자녀 정보를 찾을 수 없습니다" : auth ? "로그인이 필요합니다" : "정보를 불러오지 못했습니다"}</h1><p className="mt-2 text-sm font-medium text-zinc-500">{errorMessage(loadError)}</p>{auth ? <Link href="/auth/login" className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-mint-500 px-5 font-bold text-white">로그인</Link> : <button onClick={() => void load()} className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 px-5 font-bold dark:border-zinc-700"><RefreshCw className="h-4 w-4" />다시 시도</button>}</section></div>;
  }
  if (!child) return null;

  return <form onSubmit={(event) => void handleSave(event)} className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
    <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">자녀 기본 정보를 확인하고 수정하세요.</p>
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-6 dark:border-zinc-800 dark:bg-[#101419]">
      <div>
        <div className="flex flex-wrap items-center gap-2.5"><h1 className="text-2xl font-extrabold tracking-[-0.02em]">{child.name}</h1><span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-bold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">{child.grade}학년 {child.classNumber}반</span></div>
        <p className="mt-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">{school?.name ?? "학교 정보를 확인해 주세요."}</p>
      </div>
    </section>

    {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm font-bold text-mint-700 dark:border-mint-900 dark:bg-mint-950/30 dark:text-mint-300"><CheckCircle2 className="h-4 w-4" />{notice}</div>}
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-7 dark:border-zinc-800 dark:bg-[#101419]">
      <h2 className="text-xl font-extrabold tracking-[-0.02em]">기본 정보</h2>
      <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">이름, 학년·반과 소속 학교를 수정할 수 있어요.</p>
      <div className="mt-5 grid gap-5 md:grid-cols-3"><label className="font-bold">이름 <span className="text-red-500">*</span><input className={inputClass} value={name} maxLength={100} onChange={(e) => { setName(e.target.value); setNotice(""); }} /><span className="mt-2 block text-xs font-medium text-zinc-500">1자 이상 100자 이하로 입력해 주세요.</span></label><div className="font-bold"><label htmlFor="child-grade">학년 <span className="text-red-500">*</span></label><NumberStepper id="child-grade" label="학년" value={grade} min={1} max={6} suffix="학년" onChange={setGrade} /></div><div className="font-bold"><label htmlFor="child-class-number">반 <span className="text-red-500">*</span></label><NumberStepper id="child-class-number" label="반" value={classNumber} min={1} max={20} suffix="반" onChange={setClassNumber} /></div></div>
      <div className="mt-6"><p className="font-bold">학교 <span className="text-red-500">*</span></p><div className="mt-2 flex items-center gap-3 rounded-[10px] border border-zinc-300 p-3 dark:border-zinc-700"><SchoolIcon className="h-4 w-4 shrink-0 text-zinc-400" /><div className="min-w-0 flex-1"><p className="font-extrabold">{school?.name ?? "학교 정보"}</p><p className="truncate text-xs font-medium text-zinc-500">{school?.address ?? child.schoolId}</p></div><button type="button" onClick={() => setChangingSchool((v) => !v)} className="h-10 shrink-0 rounded-[10px] border border-zinc-300 px-4 text-sm font-bold transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900">학교 변경</button></div></div>
      {changingSchool && <div className="mt-4"><div className="flex gap-2"><label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-zinc-300 bg-white px-4 transition focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/20 dark:border-zinc-700 dark:bg-[#0b0f13]"><Search className="h-4 w-4 shrink-0 text-zinc-400" /><span className="sr-only">학교명</span><input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" placeholder="학교명을 입력해 주세요" /></label><button type="button" onClick={(e) => void handleSearch(e)} disabled={searching} className="h-12 w-20 shrink-0 rounded-[10px] bg-mint-500 px-3 text-sm font-bold text-white transition hover:bg-mint-600 disabled:opacity-50">{searching ? "검색 중" : "검색"}</button></div>{searchError && <p role="alert" className="mt-3 text-sm font-bold text-red-600">{searchError}</p>} {!searching && schools.length > 0 && <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">{schools.map((item) => <div key={item.id} className="flex items-center gap-3 border-b border-zinc-200 p-3 last:border-0 dark:border-zinc-800"><div className="min-w-0 flex-1"><p className="font-extrabold">{item.name}</p><p className="truncate text-xs text-zinc-500">{item.address}</p></div><button type="button" onClick={() => { setSchool(item); setChangingSchool(false); setSchools([]); }} className="h-9 rounded-lg border border-mint-500 px-4 font-bold text-mint-600">선택</button></div>)}</div>}</div>}
      <div className="mt-7 flex justify-end border-t border-zinc-200 pt-5 dark:border-zinc-800"><div className="grid w-full grid-cols-2 gap-3 md:flex md:w-auto"><Link href="/children" className="inline-flex h-11 w-full items-center justify-center rounded-[10px] border border-zinc-300 px-5 text-sm font-bold transition hover:bg-zinc-50 md:w-24 dark:border-zinc-700 dark:hover:bg-zinc-900">취소</Link><button type="submit" disabled={saving} className="h-11 w-full rounded-[10px] bg-mint-500 px-5 text-sm font-extrabold text-white transition hover:bg-mint-600 disabled:cursor-not-allowed disabled:opacity-50 md:w-24">{saving ? "수정 중" : "수정"}</button></div></div>
    </section>

    {formError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><AlertTriangle className="mr-2 inline h-4 w-4" />{formError}</div>}
  </form>;
}
