"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Info,
  LoaderCircle,
  RefreshCw,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Allergen,
  ChildProfile,
  getAllergens,
  getChild,
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

export function ChildAllergenSettings({ childId }: { childId: string }) {
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<number[]>([]);
  const [savedCodes, setSavedCodes] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<MemberApiError | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [profile, allergenList] = await Promise.all([
        getChild(childId),
        getAllergens(childId === "preview"),
      ]);
      setChild(profile);
      setAllergens([...allergenList].sort((a, b) => a.code - b.code));
      setSelectedCodes([]);
      setSavedCodes(null);
    } catch (reason) {
      setLoadError(
        reason instanceof MemberApiError
          ? reason
          : new MemberApiError(0, "알레르기 설정 정보를 불러오지 못했습니다."),
      );
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedAllergens = useMemo(
    () => allergens.filter((allergen) => selectedCodes.includes(allergen.code)),
    [allergens, selectedCodes],
  );
  const dirty = savedCodes === null || !sameCodes(selectedCodes, savedCodes);

  function toggleCode(code: number) {
    setSelectedCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code].sort((a, b) => a - b),
    );
    setSaveError("");
    setNotice("");
  }

  function resetSelection() {
    setSelectedCodes(savedCodes ?? []);
    setSaveError("");
    setNotice("");
  }

  async function save() {
    setSaving(true);
    setSaveError("");
    setNotice("");
    try {
      const result = await replaceChildAllergens(childId, selectedCodes);
      const normalizedCodes = [...result.allergenCodes].sort((a, b) => a - b);
      setSelectedCodes(normalizedCodes);
      setSavedCodes(normalizedCodes);
      setNotice("알레르기 설정을 저장했습니다.");
    } catch (reason) {
      setSaveError(
        reason instanceof MemberApiError
          ? errorMessage(reason)
          : "알레르기 설정을 저장하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-80 max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
        알레르기 설정을 불러오고 있습니다.
      </div>
    );
  }

  if (loadError) {
    const authError = loadError.status === 401 || loadError.status === 403;
    return (
      <div className="mx-auto w-full max-w-[1220px] px-5 pt-5">
        <section className="rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-950 dark:bg-[#101419]">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-4 text-xl font-extrabold">
            {loadError.status === 404
              ? "자녀 정보를 찾을 수 없습니다"
              : authError
                ? "로그인이 필요합니다"
                : "정보를 불러오지 못했습니다"}
          </h1>
          <p className="mt-2 text-sm font-medium text-zinc-500">{errorMessage(loadError)}</p>
          {authError ? (
            <Link href="/auth/login" className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-mint-500 px-5 font-bold text-white">
              로그인
            </Link>
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
      <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">
        자녀의 알레르기 코드를 선택해 급식 위험 확인 기준으로 저장하세요.
      </p>

      <section className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 md:p-7 lg:flex-row lg:items-center lg:justify-between dark:border-zinc-800 dark:bg-[#101419]">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-mint-50 text-xl font-extrabold text-mint-700 dark:bg-mint-950/30 dark:text-mint-300">
            {child.name.slice(0, 1)}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold">{child.name}</h1>
              <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-bold dark:border-zinc-700">
                {child.grade}학년 {child.classNumber}반
              </span>
            </div>
          </div>
        </div>
        <Link href={`/children/${childId}/meals`} className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-zinc-300 px-5 font-bold text-mint-600 dark:border-zinc-700 dark:text-mint-400">
          <Utensils className="h-4 w-4" /> 개인 급식 보기 <ChevronRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="flex gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6 dark:border-blue-900 dark:bg-blue-950/20">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-300 text-blue-600 dark:border-blue-800 dark:text-blue-300">
          <Info className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-extrabold">알레르기 설정 안내</h2>
          <p className="mt-1 text-sm font-medium leading-6 text-zinc-600 dark:text-zinc-300">
            자녀에게 해당하는 알레르기 유발 성분을 선택해 주세요.
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
          <Link href="/allergens" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-zinc-300 px-4 text-sm font-bold dark:border-zinc-700">
            알레르기 코드 안내 <HelpCircle className="h-4 w-4" />
          </Link>
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
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {allergens.map((allergen) => {
              const checked = selectedCodes.includes(allergen.code);
              return (
                <label key={allergen.code} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-[10px] border px-4 transition-colors ${checked ? "border-mint-500 bg-mint-50 text-mint-800 dark:bg-mint-950/30 dark:text-mint-200" : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700"}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleCode(allergen.code)} className="sr-only" />
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked ? "border-mint-500 bg-mint-500 text-white" : "border-zinc-400"}`} aria-hidden="true">
                    {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="inline-flex min-w-7 justify-center rounded-md border border-zinc-300 px-1.5 py-0.5 text-xs font-extrabold dark:border-zinc-600">{allergen.code}</span>
                  <span className="truncate text-sm font-extrabold">{allergen.name}</span>
                </label>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 lg:flex-row lg:items-center lg:justify-between dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-zinc-500">선택 코드</span>
              {selectedAllergens.length === 0 ? (
                <span className="text-sm font-semibold text-zinc-400">선택 없음</span>
              ) : (
                selectedAllergens.map((allergen) => (
                  <span key={allergen.code} className="rounded-full border border-mint-200 bg-mint-50 px-3 py-1 text-xs font-bold text-mint-700 dark:border-mint-900 dark:bg-mint-950/30 dark:text-mint-300">
                    {allergen.code} {allergen.name}
                  </span>
                ))
              )}
              <span className="text-sm font-bold text-mint-600 dark:text-mint-400">총 {selectedCodes.length}개</span>
            </div>
            {saveError && <p role="alert" className="mt-2 text-sm font-bold text-red-600 dark:text-red-400"><AlertTriangle className="mr-1 inline h-4 w-4" />{saveError}</p>}
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2">
            <button type="button" onClick={resetSelection} disabled={saving || !dirty} className="h-12 rounded-[10px] border border-zinc-300 px-6 font-bold disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700">취소</button>
            <button type="button" onClick={() => void save()} disabled={saving || !dirty || allergens.length === 0} className="h-12 rounded-[10px] bg-mint-500 px-8 font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "저장 중" : "저장"}</button>
          </div>
        </div>
      </section>
    </div>
  );
}
