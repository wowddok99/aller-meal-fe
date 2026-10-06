"use client";

import { PageHeading } from "@/components/page-heading";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  HelpCircle,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { GuardedLink as Link } from "./guarded-link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUnsavedChangesGuard } from "./edit-navigation-guard";
import {
  Allergen,
  ChildProfile,
  School,
  getAllergens,
  getChildAllergens,
  getChild,
  getSchool,
  MemberApiError,
  replaceChildAllergens,
} from "@/lib/member-api";

function errorMessage(error: MemberApiError) {
  if (error.status === 401) return "로그인이 필요합니다.";
  if (error.status === 403) return "이메일 인증 또는 접근 권한을 확인해 주세요.";
  if (error.status === 404) return "자녀 정보를 찾을 수 없습니다.";
  if (error.status === 409) return "현재 상태에서는 요청을 처리할 수 없습니다.";
  if (error.status === 422) return "선택한 알레르기 코드를 확인해 주세요.";
  if (error.status === 429) return "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  return error.message;
}

function sameCodes(left: number[], right: number[]) {
  return left.length === right.length && left.every((code, index) => code === right[index]);
}

function normalizeCodes(codes: number[]) { return [...new Set(codes)].sort((a, b) => a - b); }

export function ChildAllergenSettings({ childId }: { childId: string }) {
  const router = useRouter();
  const generationRef = useRef(0);
  const savingRef = useRef(false);
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<number[]>([]);
  const [savedCodes, setSavedCodes] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<MemberApiError | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const generation = ++generationRef.current;
    savingRef.current = false;
    setSaving(false); setChild(null); setSavedCodes(null); setSaveError(""); setNotice("");
    setLoading(true);
    setLoadError(null);
    try {
      const profile = await getChild(childId);
      const [allergenList, childAllergens, schoolInfo] = await Promise.all([
        getAllergens(),
        getChildAllergens(childId),
        getSchool(profile.schoolId).catch(() => null),
      ]);
      if (generation !== generationRef.current) return;
      setChild(profile);
      setSchool(schoolInfo);
      setAllergens([...allergenList].sort((a, b) => a.code - b.code));
      const serverCodes = normalizeCodes(childAllergens.allergenCodes);
      setSelectedCodes(serverCodes);
      setSavedCodes(serverCodes);
    } catch (reason) {
      if (generation !== generationRef.current) return;
      setLoadError(
        reason instanceof MemberApiError
          ? reason
          : new MemberApiError(0, "알레르기 설정 정보를 불러오지 못했습니다."),
      );
    } finally {
      if (generation === generationRef.current) setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    void load();
    return () => { generationRef.current += 1; };
  }, [load]);

  const selectedAllergens = useMemo(
    () => allergens.filter((allergen) => selectedCodes.includes(allergen.code)),
    [allergens, selectedCodes],
  );
  const dirty = Boolean(!loading && child?.id === childId && savedCodes !== null && !sameCodes(selectedCodes, savedCodes));
  const navigation = useUnsavedChangesGuard({ dirty, busy: saving });

  function toggleCode(code: number) {
    if (savingRef.current) return;
    setSelectedCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code].sort((a, b) => a - b),
    );
    setSaveError("");
    setNotice("");
  }

  function clearSelection() {
    if (savingRef.current) return;
    setSelectedCodes([]);
    setSaveError("");
    setNotice("");
  }

  async function save() {
    if (savingRef.current || !dirty || child?.id !== childId) return;
    savingRef.current = true;
    const generation = generationRef.current;
    setSaving(true);
    setSaveError("");
    setNotice("");
    try {
      const result = await replaceChildAllergens(childId, [...selectedCodes]);
      if (generation !== generationRef.current) return;
      const normalizedCodes = normalizeCodes(result.allergenCodes);
      setSelectedCodes(normalizedCodes);
      setSavedCodes(normalizedCodes);
      setNotice("알레르기 설정을 저장했습니다.");
    } catch (reason) {
      if (generation !== generationRef.current) return;
      setSaveError(
        reason instanceof MemberApiError
          ? errorMessage(reason)
          : "알레르기 설정을 저장하지 못했습니다.",
      );
    } finally {
      if (generation === generationRef.current) { savingRef.current = false; setSaving(false); }
    }
  }

  const heading = <PageHeading title="알레르기 설정" description="자녀의 알레르기 코드를 선택해 급식 위험 확인 기준으로 저장하세요." parents={[{ label: "자녀 관리", href: "/children" }, { label: "자녀 정보", href: `/children/${childId}` }]} />;
  if (loading || (child && child.id !== childId)) {
    return (
      <div className="mx-auto w-full max-w-[1220px] px-5 pb-12 pt-5">{heading}<div role="status" className="flex min-h-80 items-center justify-center text-sm font-bold text-zinc-500">
        <LoaderCircle aria-hidden="true" className="mr-2 h-5 w-5 animate-spin" />
        알레르기 설정을 불러오고 있습니다.
      </div></div>
    );
  }

  if (loadError) {
    const loginRequired = loadError.status === 401;
    return (
      <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">{heading}
        <section className="rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-950 dark:bg-[#101419]">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
          <h2 className="mt-4 text-xl font-extrabold">
            {loadError.status === 404
              ? "자녀 정보를 찾을 수 없습니다"
              : loadError.status === 403
                ? "알레르기 설정에 접근할 수 없습니다"
              : loginRequired
                ? "로그인이 필요합니다"
                : "정보를 불러오지 못했습니다"}
          </h2>
          <p className="mt-2 text-sm font-medium text-zinc-500">{errorMessage(loadError)}</p>
          {loginRequired ? (
            <Link href="/auth/login" className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-mint-500 px-5 font-bold text-white">
              로그인
            </Link>
          ) : loadError.status === 403 ? (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href="/children" className="inline-flex h-11 items-center rounded-[10px] border border-zinc-300 px-5 font-bold dark:border-zinc-700">자녀 관리로 돌아가기</Link>
              <button type="button" onClick={() => void load()} className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 px-5 font-bold dark:border-zinc-700"><RefreshCw className="h-4 w-4" /> 다시 시도</button>
            </div>
          ) : (
            <button type="button" onClick={() => void load()} className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 px-5 font-bold dark:border-zinc-700">
              <RefreshCw className="h-4 w-4" /> 다시 시도
            </button>
          )}
        </section>
      </div>
    );
  }

  if (!child) return null;

  return (
    <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
      {heading}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:px-7 dark:border-zinc-800 dark:bg-[#101419]">
        <div className="min-w-0">
          <h2 className="min-w-0 break-keep text-2xl font-extrabold tracking-[-0.02em] [overflow-wrap:anywhere]">{child.name}</h2>
          <p className="mt-1 truncate text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {school ? `${school.name} · ` : ""}{child.grade}학년 {child.classNumber}반
          </p>
        </div>
      </section>

      {notice && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm font-bold text-mint-700 dark:border-mint-900 dark:bg-mint-950/30 dark:text-mint-300">
          <CheckCircle2 className="h-4 w-4" /> {notice}
        </div>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-7 dark:border-zinc-800 dark:bg-[#101419]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold">알레르기 코드 선택</h2>
            <p className="mt-1 text-sm font-medium text-zinc-500">해당하는 알레르기 코드를 선택해 주세요. 복수 선택할 수 있습니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/allergens" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-zinc-300 px-4 text-sm font-bold transition-colors hover:border-mint-500 dark:border-zinc-700">
              코드 안내 <HelpCircle className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {allergens.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-zinc-300 px-5 py-10 text-center dark:border-zinc-700">
            <p className="font-extrabold">선택할 수 있는 알레르기 코드가 없습니다</p>
            <p className="mt-2 text-sm font-medium text-zinc-500">잠시 후 다시 불러와 주세요.</p>
            <button type="button" onClick={() => void load()} className="mt-4 inline-flex h-10 items-center gap-2 rounded-[10px] border border-zinc-300 px-4 text-sm font-bold dark:border-zinc-700">
              <RefreshCw className="h-4 w-4" /> 다시 불러오기
            </button>
          </div>
        ) : (
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {allergens.map((allergen) => {
              const checked = selectedCodes.includes(allergen.code);
              return (
                <label key={allergen.code} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-[10px] border px-4 transition-colors focus-within:ring-2 focus-within:ring-mint-500/20 ${checked ? "border-mint-500 bg-mint-50 text-mint-800 dark:bg-mint-950/30 dark:text-mint-200" : "border-zinc-200 hover:border-mint-400 dark:border-zinc-700"}`}>
                  <input type="checkbox" checked={checked} disabled={saving} onChange={() => toggleCode(allergen.code)} className="sr-only" />
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked ? "border-mint-500 bg-mint-500 text-white" : "border-zinc-400"}`} aria-hidden="true">
                    {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className={`inline-flex min-w-6 justify-center rounded-md px-1.5 py-0.5 text-xs font-extrabold ${checked ? "bg-mint-500/15 text-mint-800 dark:text-mint-200" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300"}`}>{allergen.code}</span>
                  <span className="truncate text-sm font-extrabold">{allergen.name}</span>
                </label>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 lg:flex-row lg:items-center lg:justify-between dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {selectedAllergens.length === 0 ? (
                <span className="text-sm font-semibold text-zinc-400">선택한 성분 없음</span>
              ) : (
                <>
                  <span className="text-sm font-bold text-zinc-500">선택한 성분 ({selectedCodes.length}개)</span>
                  {selectedAllergens.map((allergen) => (
                    <span key={allergen.code} className="rounded-full border border-mint-200 bg-mint-50 px-3 py-1 text-xs font-bold text-mint-700 dark:border-mint-900 dark:bg-mint-950/30 dark:text-mint-300">
                      {allergen.code} {allergen.name}
                    </span>
                  ))}
                </>
              )}
            </div>
            {saveError && <p role="alert" className="mt-2 text-sm font-bold text-red-600 dark:text-red-400"><AlertTriangle className="mr-1 inline h-4 w-4" />{saveError}</p>}
          </div>
          <div className="flex shrink-0 justify-end">
            <button type="button" onClick={clearSelection} disabled={saving || selectedCodes.length === 0} className="h-10 rounded-[10px] border border-zinc-300 px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700">선택 해제</button>
          </div>
        </div>
        <div className="mt-6 flex justify-end"><div className="grid w-full grid-cols-2 gap-3 md:flex md:w-auto">
          <button type="button" onClick={() => navigation.requestLeave(() => router.push(`/children/${childId}`))} disabled={saving} className="inline-flex h-11 w-full items-center justify-center rounded-[10px] border border-zinc-300 bg-white px-5 text-sm font-bold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-24 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-200">취소</button>
          <button type="button" onClick={() => void save()} disabled={saving || !dirty || allergens.length === 0} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-mint-500 px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50 md:w-24">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? "저장 중" : "저장"}</button>
        </div></div>
      </section>
    </div>
  );
}
