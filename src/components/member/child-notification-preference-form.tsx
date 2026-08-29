"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Info,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChildNotificationPreference,
  ChildProfile,
  getChild,
  getChildNotificationPreference,
  getSchool,
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
  const router = useRouter();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [preference, setPreference] = useState<ChildNotificationPreference | null>(null);
  const [form, setForm] = useState<FormValue>({ emailEnabled: false, notificationTime: DEFAULT_TIME });
  const [saved, setSaved] = useState<FormValue>({ emailEnabled: false, notificationTime: DEFAULT_TIME });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<MemberApiError | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const profile = await getChild(childId);
      setChild(profile);
      try {
        const school = await getSchool(profile.schoolId);
        setSchoolName(school.name);
      } catch {
        setSchoolName("");
      }
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

  useEffect(() => {
    if (!dirty) return;
    const preventUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventUnload);
    return () => window.removeEventListener("beforeunload", preventUnload);
  }, [dirty]);

  function updateForm(next: Partial<FormValue>) {
    setForm((current) => ({ ...current, ...next }));
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

  function requestLeave() {
    if (dirty) {
      setLeaveConfirmOpen(true);
      return;
    }
    navigateAway();
  }

  function leaveWithoutSaving() {
    setLeaveConfirmOpen(false);
    navigateAway();
  }

  function navigateAway() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(`/children/${childId}`);
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

  const notificationSummary = form.emailEnabled
    ? `매일 ${form.notificationTime}에 위험 메뉴가 있을 때 이메일로 알려드려요.`
    : "이메일 알림이 꺼져 있어요. 켜면 위험 메뉴를 미리 알려드릴게요.";

  return (
    <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-4 px-5 pb-12 pt-5">
      <h1 className="sr-only">알림 설정</h1>
      <p className="text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">급식 알림을 받을 시간과 사용 여부를 설정하세요.</p>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-6 dark:border-zinc-800 dark:bg-[#101419]">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl font-extrabold tracking-[-0.02em]">{child.name}</h2>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-bold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">{child.grade}학년 {child.classNumber}반</span>
          </div>
          {schoolName && <p className="mt-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">{schoolName}</p>}
        </div>
      </section>

      {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm font-bold text-mint-700 dark:border-mint-900 dark:bg-mint-950/30 dark:text-mint-300"><CheckCircle2 className="h-4 w-4" /> {notice}</div>}

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#101419]">
        <div className="border-b border-zinc-200 p-5 md:p-7 dark:border-zinc-800">
          <div><h2 className="text-xl font-extrabold tracking-[-0.02em]">알림 설정</h2><p className="mt-0.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">위험 메뉴를 미리 확인할 수 있도록 설정해요.</p></div>
        </div>
        <div className="p-5 md:p-7">
        <div className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          <div className="flex min-h-20 items-center justify-between gap-5 p-4 md:px-5">
            <div><h3 className="font-extrabold">이메일 알림</h3><p className="mt-1 text-sm font-medium text-zinc-500">이메일로 위험 메뉴 알림을 받아요.</p></div>
            <button type="button" role="switch" aria-checked={form.emailEnabled} aria-label="이메일 알림 사용" onClick={() => updateForm({ emailEnabled: !form.emailEnabled })} disabled={saving} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${form.emailEnabled ? "bg-mint-500" : "bg-zinc-300 dark:bg-zinc-700"}`}><span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${form.emailEnabled ? "translate-x-5" : "translate-x-0"}`} /></button>
          </div>
          <label className="flex min-h-20 flex-col justify-between gap-3 p-4 md:flex-row md:items-center md:px-5">
            <span><span className="block font-extrabold">알림 발송 시간</span><span className="mt-1 block text-sm font-medium text-zinc-500">위험 메뉴 알림을 받을 시간을 설정해요.</span></span>
            <span className="relative block w-full md:w-52"><Clock3 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" /><input type="time" value={form.notificationTime} onChange={(event) => updateForm({ notificationTime: event.target.value })} disabled={saving || !form.emailEnabled} required className="h-12 w-full appearance-none rounded-[10px] border border-zinc-300 bg-white pl-11 pr-4 text-sm font-bold text-zinc-700 outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:opacity-0 dark:border-zinc-700 dark:bg-[#0b0f13] dark:text-zinc-200" /></span>
          </label>
          <div className="flex min-h-20 flex-col justify-between gap-3 p-4 md:flex-row md:items-center md:px-5">
            <div><h3 className="font-extrabold">시간대</h3><p className="mt-1 text-sm font-medium text-zinc-500">서비스 기본 시간대로 고정되어 있어요.</p></div>
            <div className="flex h-12 w-full items-center gap-3 rounded-[10px] border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-700 md:w-52 dark:border-zinc-700 dark:bg-[#0b0f13] dark:text-zinc-200"><LockKeyhole className="h-4 w-4 shrink-0" /> <span>{FIXED_TIMEZONE}</span></div>
          </div>
        </div>
        <div className={`mt-4 flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm font-semibold md:flex-row md:items-center md:justify-between ${form.emailEnabled ? "border-mint-500/30 bg-mint-500/[0.08] text-mint-600 dark:border-mint-500/30 dark:bg-mint-500/10 dark:text-mint-400" : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300"}`}>
          <p className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0" /> {notificationSummary}</p>
          <p className="shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">마지막 수정 {formatDateTime(preference?.updatedAt)}</p>
        </div>
        </div>
      </section>

      {saveError && <p role="alert" className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400"><AlertTriangle className="h-4 w-4" /> {saveError}</p>}
      <div className="flex justify-end">
        <div className="grid w-full grid-cols-2 gap-3 md:flex md:w-auto">
          <button type="button" onClick={requestLeave} disabled={saving} className="inline-flex h-11 w-full items-center justify-center rounded-[10px] border border-zinc-300 bg-white px-5 text-sm font-bold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-24 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-200">취소</button>
          <button type="button" onClick={() => void save()} disabled={saving || !dirty} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-mint-500 px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50 md:w-24">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? "저장 중" : "저장"}</button>
        </div>
      </div>

      {leaveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-5" role="presentation">
          <section role="alertdialog" aria-modal="true" aria-labelledby="leave-confirm-title" aria-describedby="leave-confirm-description" className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl shadow-black/10 dark:border-zinc-800 dark:bg-[#101419] dark:shadow-black/30">
            <h2 id="leave-confirm-title" className="text-lg font-extrabold tracking-[-0.02em]">변경 사항을 저장하지 않고 나갈까요?</h2>
            <p id="leave-confirm-description" className="mt-2 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">저장하지 않은 알림 설정은 반영되지 않습니다.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={leaveWithoutSaving} className="h-11 rounded-[10px] border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-700 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-200">나가기</button>
              <button type="button" onClick={() => setLeaveConfirmOpen(false)} className="h-11 rounded-[10px] bg-mint-500 px-4 text-sm font-extrabold text-white">계속 편집</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
