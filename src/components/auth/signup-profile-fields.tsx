"use client";

import { CircleHelp, UserRound } from "lucide-react";
import { useState } from "react";

type UsageType = "STUDENT" | "PARENT";

type Props = {
  displayName: string;
  usageType: UsageType | "";
  onDisplayNameChange: (value: string) => void;
  onUsageTypeChange: (value: UsageType) => void;
  disabled?: boolean;
  displayNameError?: string;
  usageTypeError?: string;
  maxLength?: number;
};

export function SignupProfileFields({ displayName, usageType, onDisplayNameChange, onUsageTypeChange, disabled, displayNameError, usageTypeError, maxLength }: Props) {
  const [showUsageHelp, setShowUsageHelp] = useState(false);
  return <>
    <label className="flex flex-col gap-2" htmlFor="signup-display-name">
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">닉네임</span>
      <span className={`flex h-12 items-center gap-3 rounded-[10px] border bg-white px-4 focus-within:border-mint-500 dark:bg-[#0b0f13] dark:focus-within:border-mint-400 ${displayNameError ? "border-red-500 dark:border-red-500" : "border-zinc-200 dark:border-zinc-700"}`}>
        <UserRound aria-hidden="true" className="h-5 w-5 shrink-0 text-zinc-400" strokeWidth={1.8} />
        <input id="signup-display-name" name="displayName" autoComplete="nickname" value={displayName} onChange={(event) => onDisplayNameChange(event.target.value)} disabled={disabled} maxLength={maxLength} placeholder="닉네임을 입력해 주세요" aria-invalid={Boolean(displayNameError)} aria-describedby={displayNameError ? "signup-display-name-error" : undefined} className="auth-autofill h-full min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-70 dark:placeholder:text-zinc-600" />
      </span>
      {displayNameError ? <span id="signup-display-name-error" className="text-[13px] font-semibold text-red-600 dark:text-red-400">{displayNameError}</span> : null}
    </label>
    <fieldset disabled={disabled} aria-describedby={usageTypeError ? "signup-usage-type-error" : undefined} className="min-w-0">
      <legend className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        <span className="inline-flex items-center gap-0.5">가입 유형
          <span className="relative inline-flex" onMouseEnter={() => setShowUsageHelp(true)} onMouseLeave={() => setShowUsageHelp(false)} onKeyDown={(event) => { if (event.key === "Escape") setShowUsageHelp(false); }}>
            <button type="button" aria-label="가입 유형 안내" aria-expanded={showUsageHelp} aria-describedby={showUsageHelp ? "signup-usage-help" : undefined} onFocus={() => setShowUsageHelp(true)} onBlur={() => setShowUsageHelp(false)} onClick={() => setShowUsageHelp(true)} className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-600 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500 dark:text-slate-300 dark:hover:text-slate-100">
              <CircleHelp aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
            </button>
            {showUsageHelp && <span id="signup-usage-help" role="tooltip" className="absolute left-0 top-full z-10 mt-2 w-72 max-w-[calc(100vw-4rem)] rounded-xl border border-zinc-200 bg-white p-4 text-left text-xs font-medium leading-5 text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              <span className="block">학생: 본인의 급식과 알림을 이용하려는 경우</span>
              <span className="mt-1 block">학부모: 자녀의 급식과 알림을 확인하려는 경우</span>
            </span>}
          </span>
        </span>
      </legend>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {([ ["STUDENT", "학생"], ["PARENT", "학부모"] ] as const).map(([value, label]) => <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[10px] border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 has-[:disabled]:cursor-not-allowed dark:border-zinc-700 dark:text-zinc-300">
          <input type="radio" name="usageType" value={value} checked={usageType === value} onChange={() => onUsageTypeChange(value)} className="h-4 w-4 shrink-0 appearance-none rounded-full border border-zinc-400 bg-white checked:border-mint-500 checked:bg-mint-500 checked:shadow-[inset_0_0_0_3px_white] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-500 disabled:opacity-50 dark:border-zinc-500 dark:bg-[#0b0f13] dark:checked:border-mint-400 dark:checked:bg-mint-400 dark:checked:shadow-[inset_0_0_0_3px_#0b0f13] forced-colors:appearance-auto" />{label}
        </label>)}
      </div>
      {usageTypeError ? <p id="signup-usage-type-error" className="mt-2 text-[13px] font-semibold text-red-600 dark:text-red-400">{usageTypeError}</p> : null}
    </fieldset>
  </>;
}
