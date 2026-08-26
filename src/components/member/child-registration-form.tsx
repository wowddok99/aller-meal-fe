"use client";

import { AlertTriangle, Check, ChevronDown, Info, LoaderCircle, Minus, Plus, School as SchoolIcon, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createChild, MemberApiError, School, searchSchools } from "@/lib/member-api";

const inputClass = "h-12 w-full rounded-[10px] border border-zinc-300 bg-white px-4 font-semibold outline-none transition focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 dark:border-zinc-700 dark:bg-[#0b0f13]";

function StepTitle({ step, children }: { step: number; children: React.ReactNode }) {
  return <h2 className="flex items-center gap-2.5 text-lg font-extrabold tracking-[-0.02em]"><span className="flex h-6 w-6 items-center justify-center rounded-full border border-mint-500/30 bg-mint-50 text-xs font-extrabold text-mint-700 dark:bg-mint-950/30 dark:text-mint-300">{step}</span>{children}</h2>;
}

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
  return (
    <div className="mt-2 flex h-12 overflow-hidden rounded-[10px] border border-zinc-300 bg-white transition focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/20 dark:border-zinc-700 dark:bg-[#0b0f13]">
      <button
        type="button"
        aria-label={`${label} 줄이기`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex w-10 shrink-0 items-center justify-center border-r border-zinc-300 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-35 sm:w-12 dark:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="relative min-w-0 flex-1">
        <select
          id={id}
          aria-label={label}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-full w-full appearance-none bg-transparent px-8 text-center font-extrabold outline-none [text-align-last:center] sm:pl-9 sm:pr-10"
        >
          {Array.from({ length: max - min + 1 }, (_, index) => {
            const optionValue = min + index;
            return <option key={optionValue} value={optionValue}>{optionValue}{suffix}</option>;
          })}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      </div>
      <button
        type="button"
        aria-label={`${label} 늘리기`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex w-10 shrink-0 items-center justify-center border-l border-zinc-300 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-35 sm:w-12 dark:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function messageFor(error: MemberApiError) {
  if (error.status === 401) return "로그인이 필요합니다.";
  if (error.status === 403) return "이메일 인증 또는 접근 권한을 확인해 주세요.";
  if (error.status === 404) return "선택한 학교를 찾을 수 없습니다. 다시 검색해 주세요.";
  if (error.status === 409) return "현재 상태에서는 자녀를 등록할 수 없습니다.";
  if (error.status === 429) return "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  return error.message;
}

export function ChildRegistrationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(1);
  const [classNumber, setClassNumber] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [selected, setSelected] = useState<School | null>(null);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    const value = keyword.trim();
    if (!value) { setSearchError("검색할 학교명을 입력해 주세요."); return; }
    setSearching(true); setSearchError(""); setSearched(true);
    try { setSchools((await searchSchools(value)).schools); }
    catch (reason) { setSchools([]); setSearchError(reason instanceof MemberApiError ? messageFor(reason) : "학교를 검색하지 못했습니다."); }
    finally { setSearching(false); }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalizedName = name.trim().replace(/\s+/g, " ");
    if (!normalizedName || normalizedName.length > 100) { setFormError("이름을 1자 이상 100자 이하로 입력해 주세요."); return; }
    if (!selected) { setFormError("학교를 검색하고 선택해 주세요."); return; }
    setSaving(true); setFormError("");
    try {
      const child = await createChild({ name: normalizedName, grade, classNumber, schoolId: selected.id });
      router.push(`/children/${child.id}/allergens`);
      router.refresh();
    } catch (reason) { setFormError(reason instanceof MemberApiError ? messageFor(reason) : "자녀를 등록하지 못했습니다."); setSaving(false); }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
      <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">자녀 정보와 학교를 등록하세요.</p>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-7 dark:border-zinc-800 dark:bg-[#101419]">
        <StepTitle step={1}>자녀 등록</StepTitle>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <label className="font-bold">이름 <span className="text-red-500">*</span><input className={`${inputClass} mt-2`} value={name} maxLength={100} onChange={(event) => setName(event.target.value)} placeholder="자녀 이름" autoComplete="off" /><span className="mt-2 block text-xs font-medium text-zinc-500">1자 이상 100자 이하로 입력해 주세요.</span></label>
          <div className="font-bold"><label htmlFor="child-grade">학년 <span className="text-red-500">*</span></label><NumberStepper id="child-grade" label="학년" value={grade} min={1} max={6} suffix="학년" onChange={setGrade} /><span className="mt-2 block text-xs font-medium text-zinc-500">현재 학년을 선택해 주세요.</span></div>
          <div className="font-bold"><label htmlFor="child-class-number">반 <span className="text-red-500">*</span></label><NumberStepper id="child-class-number" label="반" value={classNumber} min={1} max={20} suffix="반" onChange={setClassNumber} /><span className="mt-2 block text-xs font-medium text-zinc-500">현재 반을 선택해 주세요.</span></div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-7 dark:border-zinc-800 dark:bg-[#101419]">
        <StepTitle step={2}>학교 선택</StepTitle>
        <div className="mt-5 flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex h-12 flex-1 items-center gap-3 rounded-[10px] border border-zinc-300 px-4 transition focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/20 dark:border-zinc-700"><Search className="h-4 w-4 shrink-0 text-zinc-400" /><span className="sr-only">학교명</span><input type="search" className="h-full w-full bg-transparent font-semibold outline-none" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="학교명을 입력해 주세요" /></label>
            <button type="button" onClick={(event) => void handleSearch(event)} disabled={searching} className="h-12 min-w-24 rounded-[10px] bg-mint-500 px-5 text-sm font-bold text-white transition-colors hover:bg-mint-600 disabled:opacity-50">{searching ? "검색 중" : "검색"}</button>
          </div>
          {searchError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300"><AlertTriangle className="mr-2 inline h-4 w-4" />{searchError}</p>}
          {searching && <div className="flex h-28 items-center justify-center text-sm font-bold text-zinc-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />학교를 검색하고 있습니다.</div>}
          {!searching && searched && !searchError && schools.length === 0 && <div className="rounded-xl border border-dashed border-zinc-300 p-7 text-center text-sm font-semibold text-zinc-500 dark:border-zinc-700">검색 결과가 없습니다. 학교명을 다시 확인해 주세요.</div>}
          {!searching && schools.length > 0 && <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">{schools.map((school) => <article key={school.id} className="flex flex-col gap-3 border-b border-zinc-200 p-4 last:border-0 sm:flex-row sm:items-center dark:border-zinc-800"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"><SchoolIcon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold">{school.name}</h3><span className="rounded-full border border-zinc-300 px-2 py-0.5 text-xs font-bold dark:border-zinc-700">{school.region}</span></div><p className="truncate text-sm font-medium text-zinc-500">{school.address}</p><p className="mt-1 text-xs font-medium text-zinc-400">NEIS {school.neisSchoolCode} · 교육청 {school.educationOfficeCode}</p></div><button type="button" onClick={() => { setSelected(school); setFormError(""); }} className={`h-10 rounded-[10px] border px-5 text-sm font-bold transition-colors ${selected?.id === school.id ? "border-mint-500 bg-mint-50 text-mint-700 dark:bg-mint-950/30 dark:text-mint-300" : "border-zinc-300 text-mint-600 hover:border-mint-500 dark:border-zinc-700 dark:text-mint-400"}`}>{selected?.id === school.id ? "선택됨" : "선택"}</button></article>)}</div>}
          {selected && <div role="status" className="flex items-center gap-3 rounded-xl border border-mint-400/60 bg-mint-50 p-4 dark:bg-mint-950/20"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-500 text-white"><Check className="h-4 w-4" /></span><div><p className="text-xs font-bold text-mint-700 dark:text-mint-300">선택된 학교</p><p className="font-extrabold">{selected.name}</p></div></div>}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 md:p-7 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-[#101419]">
        <div><StepTitle step={3}>저장</StepTitle><p className="mt-2 grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-1 text-sm font-medium text-zinc-500"><Info className="h-4 w-4 justify-self-center" /><span>저장 후 알레르기 설정으로 이어서 진행할 수 있어요.</span></p></div>
        <div className="flex gap-3"><Link href="/children" className="inline-flex h-12 min-w-28 items-center justify-center rounded-[10px] border border-zinc-300 px-6 font-bold dark:border-zinc-700">취소</Link><button type="submit" disabled={saving || !name.trim() || !selected} className="h-12 min-w-32 rounded-[10px] bg-mint-500 px-7 font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "저장 중" : "저장"}</button></div>
      </section>
      {formError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><AlertTriangle className="mr-2 inline h-4 w-4" />{formError}{(formError === "로그인이 필요합니다." || formError.includes("인증")) && <Link href="/auth/login" className="ml-3 underline">로그인</Link>}</div>}
    </form>
  );
}
