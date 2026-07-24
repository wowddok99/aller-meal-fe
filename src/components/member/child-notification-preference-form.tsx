"use client";

import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Info,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Save,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChildNotificationPreference,
  ChildProfile,
  getChild,
  getChildNotificationPreference,
  MemberApiError,
  updateChildNotificationPreference,
} from "@/lib/member-api";

const FIXED_TIMEZONE = "Asia/Seoul" as const;
const DEFAULT_TIME = "08:30";

type FormValue = { emailEnabled: boolean; notificationTime: string };

function errorMessage(error: MemberApiError) {
  if (error.status === 401) return "로그인이 필요합니다.";
  if (error.status === 403) return "이메일 인증 또는 접근 권한을 확인해 주세요.";
  if (error.status === 404) return "자녀 정보를 찾을 수 없습니다.";
  if (error.status === 409) return "현재 상태에서는 알림 설정을 변경할 수 없습니다.";
  if (error.status === 422) return "알림 시간과 시간대 설정을 확인해 주세요.";
  if (error.status === 429) return "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  return error.message;
}

function normalizeTime(value: string | undefined) {
  return value?.match(/^\d{2}:\d{2}/)?.[0] ?? DEFAULT_TIME;
}

function formatDateTime(value?: string) {
  if (!value) return "아직 저장되지 않음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: FIXED_TIMEZONE,
  }).format(date);
}

export function ChildNotificationPreferenceForm({ childId }: { childId: string }) {
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [preference, setPreference] = useState<ChildNotificationPreference | null>(null);
  const [form, setForm] = useState<FormValue>({ emailEnabled: false, notificationTime: DEFAULT_TIME });
  const [saved, setSaved] = useState<FormValue>({ emailEnabled: false, notificationTime: DEFAULT_TIME });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<MemberApiError | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const profile = await getChild(childId);
      setChild(profile);
      try {
        const result = await getChildNotificationPreference(childId);
        const next = {
          emailEnabled: result.emailEnabled,
          notificationTime: normalizeTime(result.notificationTime),
        };
        setPreference(result);
        setForm(next);
        setSaved(next);
      } catch (reason) {
        if (!(reason instanceof MemberApiError) || reason.status !== 404) throw reason;
        const initial = { emailEnabled: false, notificationTime: DEFAULT_TIME };
        setPreference(null);
        setForm(initial);
        setSaved(initial);
      }
    } catch (reason) {
      setLoadError(
        reason instanceof MemberApiError
          ? reason
          : new MemberApiError(0, "알림 설정을 불러오지 못했습니다."),
      );
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(
    () => form.emailEnabled !== saved.emailEnabled || form.notificationTime !== saved.notificationTime,
    [form, saved],
  );

  function updateForm(next: Partial<FormValue>) {
    setForm((current) => ({ ...current, ...next }));
    setSaveError("");
    setNotice("");
  }

  function reset() {
    setForm(saved);
    setSaveError("");
    setNotice("");
  }

  async function save() {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.notificationTime)) {
      setSaveError("알림 시간을 올바르게 입력해 주세요.");
      return;
    }
    setSaving(true);
    setSaveError("");
    setNotice("");
    try {
      const result = await updateChildNotificationPreference(childId, {
        ...form,
        timezone: FIXED_TIMEZONE,
      });
      const next = {
        emailEnabled: result.emailEnabled,
        notificationTime: normalizeTime(result.notificationTime),
      };
      setPreference(result);
      setForm(next);
      setSaved(next);
      setNotice("알림 설정을 저장했습니다.");
    } catch (reason) {
      setSaveError(
        reason instanceof MemberApiError
          ? errorMessage(reason)
          : "알림 설정을 저장하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-80 max-w-[1220px] items-center justify-center px-5 text-sm font-bold text-zinc-500">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> 알림 설정을 불러오고 있습니다.
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
            {loadError.status === 404 ? "자녀 정보를 찾을 수 없습니다" : authError ? "로그인이 필요합니다" : "알림 설정을 불러오지 못했습니다"}
          </h1>
          <p className="mt-2 text-sm font-medium text-zinc-500">{errorMessage(loadError)}</p>
          {authError ? (
            <Link href="/auth/login" className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-mint-500 px-5 font-bold text-white">로그인</Link>
          ) : (
            <button type="button" onClick={() => void load()} className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-zinc-300 px-5 font-bold dark:border-zinc-700"><RefreshCw className="h-4 w-4" /> 다시 시도</button>
          )}
        </section>
      </div>
    );
  }

  if (!child) return null;

  return (
    <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
      <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">급식 알림을 받을 시간과 사용 여부를 설정하세요.</p>

      <section className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 md:p-7 lg:flex-row lg:items-center lg:justify-between dark:border-zinc-800 dark:bg-[#101419]">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-mint-50 text-xl font-extrabold text-mint-700 dark:bg-mint-950/30 dark:text-mint-300">{child.name.slice(0, 1)}</span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold">{child.name}</h1>
              <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-bold dark:border-zinc-700">{child.grade}학년 {child.classNumber}반</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={`/children/${childId}/meals`} className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-zinc-300 px-4 text-sm font-bold dark:border-zinc-700"><Utensils className="h-4 w-4" /> 개인 급식 <ChevronRight className="h-4 w-4" /></Link>
          <Link href={`/children/${childId}/allergens`} className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-zinc-300 px-4 text-sm font-bold dark:border-zinc-700"><ShieldCheck className="h-4 w-4" /> 알레르기 설정 <ChevronRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm font-bold text-mint-700 dark:border-mint-900 dark:bg-mint-950/30 dark:text-mint-300"><CheckCircle2 className="h-4 w-4" /> {notice}</div>}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-7 dark:border-zinc-800 dark:bg-[#101419]">
        <div className="flex items-center gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <Bell className="h-6 w-6 text-mint-500" /><h2 className="text-xl font-extrabold">알림 설정</h2>
        </div>
        <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          <div className="flex min-h-20 items-center justify-between gap-5 p-4 md:px-5">
            <div><h3 className="font-extrabold">이메일 알림</h3><p className="mt-1 text-sm font-medium text-zinc-500">이메일로 위험 메뉴 알림을 받아요.</p></div>
            <button type="button" role="switch" aria-checked={form.emailEnabled} aria-label="이메일 알림 사용" onClick={() => updateForm({ emailEnabled: !form.emailEnabled })} disabled={saving} className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${form.emailEnabled ? "bg-mint-500" : "bg-zinc-300 dark:bg-zinc-700"}`}><span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${form.emailEnabled ? "translate-x-7" : "translate-x-1"}`} /></button>
          </div>
          <label className="flex min-h-20 flex-col justify-between gap-3 p-4 md:flex-row md:items-center md:px-5">
            <span><span className="block font-extrabold">알림 발송 시간</span><span className="mt-1 block text-sm font-medium text-zinc-500">위험 메뉴 알림을 받을 시간을 설정해요.</span></span>
            <span className="relative block w-full md:w-52"><Clock3 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" /><input type="time" value={form.notificationTime} onChange={(event) => updateForm({ notificationTime: event.target.value })} disabled={saving || !form.emailEnabled} required className="h-12 w-full rounded-[10px] border border-zinc-300 bg-transparent pl-12 pr-4 font-bold outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700" /></span>
          </label>
          <div className="flex min-h-20 flex-col justify-between gap-3 p-4 md:flex-row md:items-center md:px-5">
            <div><h3 className="font-extrabold">시간대</h3><p className="mt-1 text-sm font-medium text-zinc-500">서비스 기본 시간대로 고정되어 있어요.</p></div>
            <div className="flex h-12 w-full items-center gap-3 rounded-[10px] border border-zinc-300 bg-zinc-50 px-4 font-bold text-zinc-600 md:w-52 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-300"><LockKeyhole className="h-4 w-4" /> {FIXED_TIMEZONE}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-zinc-500 md:flex-row md:items-center md:justify-between">
          <p className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0" /> 매일 설정한 시간에 위험 메뉴가 있으면 이메일로 알려드려요.</p>
          <p>마지막 수정 {formatDateTime(preference?.updatedAt)}</p>
        </div>
      </section>

      <section className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 md:flex-row md:items-center md:justify-between md:p-7 dark:border-zinc-800 dark:bg-[#101419]">
        <div><div className="flex items-center gap-3"><Save className="h-6 w-6 text-mint-500" /><h2 className="text-xl font-extrabold">설정 저장</h2></div><p className="mt-2 text-sm font-medium text-zinc-500">변경한 알림 설정을 저장합니다.</p>{saveError && <p role="alert" className="mt-2 flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400"><AlertTriangle className="h-4 w-4" /> {saveError}</p>}</div>
        <div className="grid grid-cols-2 gap-2 md:min-w-80">
          <button type="button" onClick={reset} disabled={saving || !dirty} className="h-12 rounded-[10px] border border-zinc-300 px-6 font-bold disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700">취소</button>
          <button type="button" onClick={() => void save()} disabled={saving || !dirty} className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-mint-500 px-8 font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? "저장 중" : "저장"}</button>
        </div>
      </section>
    </div>
  );
}
