"use client";

import { DayPicker } from "@daypicker/react";
import { ko } from "@daypicker/react/locale/ko";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getSeoulToday } from "@/components/public/school-meals/school-meals-date";
import { formatDateValue, isDateValueAllowed, parseDateValue } from "@/lib/date-picker-date";

type DatePickerProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  allowClear?: boolean;
  min?: string;
  max?: string;
  className?: string;
};

export function DatePicker({ id, label, value, onChange, disabled = false, allowClear = false, min, max, className = "h-11" }: DatePickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const dialogId = `${inputId}-calendar`;
  const fieldRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLButtonElement>(null);
  const monthRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<"year" | "month" | null>(null);
  const today = parseDateValue(getSeoulToday())!;
  const selected = parseDateValue(value);
  const minimum = parseDateValue(min ?? "");
  const maximum = parseDateValue(max ?? "");
  const firstYear = minimum?.getFullYear() ?? 1;
  const lastYear = maximum?.getFullYear() ?? 9999;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [invalid, setInvalid] = useState(false);
  const [month, setMonth] = useState(() => clampMonth(selected ?? today));
  const [view, setView] = useState<"days" | "years" | "months">("days");
  const [calendarAutoFocus, setCalendarAutoFocus] = useState(true);
  const [yearPage, setYearPage] = useState(0);
  const [position, setPosition] = useState({ left: 8, top: 8, maxHeight: 400 });

  function monthDate(year: number, index: number) {
    const date = new Date(0);
    date.setHours(12, 0, 0, 0);
    date.setFullYear(year, index, 1);
    return date;
  }

  function allowedMonth(date: Date) {
    return date.getFullYear() >= firstYear && date.getFullYear() <= lastYear
      && (!minimum || date >= monthDate(firstYear, minimum.getMonth()))
      && (!maximum || date <= monthDate(lastYear, maximum.getMonth()));
  }

  function clampMonth(date: Date) {
    const next = monthDate(date.getFullYear(), date.getMonth());
    if (minimum && next < monthDate(firstYear, minimum.getMonth())) return monthDate(firstYear, minimum.getMonth());
    if (maximum && next > monthDate(lastYear, maximum.getMonth())) return monthDate(lastYear, maximum.getMonth());
    return next;
  }

  function selectMonth(year: number, index: number, from: "year" | "month") {
    returnTo.current = from;
    setMonth(clampMonth(monthDate(year, index)));
    setView("days");
  }

  useEffect(() => {
    if (!open) return;
    if (view !== "days") (panelRef.current?.querySelector<HTMLButtonElement>("[data-calendar-option][aria-pressed='true']:not(:disabled)") ?? panelRef.current?.querySelector<HTMLButtonElement>("[data-calendar-option]:not(:disabled)"))?.focus({ preventScroll: true });
    else if (returnTo.current) {
      (returnTo.current === "year" ? yearRef : monthRef).current?.focus({ preventScroll: true });
      returnTo.current = null;
    }
  }, [open, view]);

  useEffect(() => { setDraft(value); setInvalid(false); }, [value]);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  function close(restoreFocus = true) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  }

  function choose(date: Date | undefined) {
    const next = date ? formatDateValue(date) : "";
    if (!next && !allowClear) return;
    if (next && !isDateValueAllowed(next, min, max)) return;
    setDraft(next);
    setInvalid(false);
    onChange(next);
    close();
  }

  function commitInput() {
    if ((!draft && allowClear) || isDateValueAllowed(draft, min, max)) {
      setInvalid(false);
      if (draft !== value) onChange(draft);
    } else {
      setDraft(value);
      setInvalid(false);
    }
  }

  useLayoutEffect(() => {
    if (!open || disabled) return;
    function positionPanel() {
      const field = fieldRef.current, panel = panelRef.current;
      if (!field || !panel) return;
      const bounds = field.getBoundingClientRect();
      const width = panel.getBoundingClientRect().width;
      const viewportHeight = Math.max(80, window.innerHeight - 16);
      const below = Math.max(0, Math.min(viewportHeight, window.innerHeight - bounds.bottom - 16));
      const above = Math.max(0, Math.min(viewportHeight, bounds.top - 16));
      const maxHeight = Math.max(80, Math.max(above, below));
      const height = Math.min(panel.scrollHeight, maxHeight);
      const top = below >= height || below >= above ? bounds.bottom + 8 : bounds.top - height - 8;
      const next = { left: Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8)), top: Math.max(8, Math.min(top, window.innerHeight - height - 8)), maxHeight };
      setPosition(previous => previous.left === next.left && previous.top === next.top && previous.maxHeight === next.maxHeight ? previous : next);
    }
    positionPanel();
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    const observer = new ResizeObserver(positionPanel);
    if (panelRef.current) observer.observe(panelRef.current);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
    };
  }, [open, disabled, view]);

  useEffect(() => {
    if (!open || disabled) return;
    function outside(event: Event) {
      const target = event.target as Node;
      if (!fieldRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [open, disabled]);

  function openCalendar() {
    if (disabled) return;
    setMonth(clampMonth(selected ?? today));
    setView("days");
    setCalendarAutoFocus(true);
    returnTo.current = null;
    setOpen(true);
  }

  function shift(direction: number) {
    if (view === "years") {
      const nextPage = Math.max(firstYear, Math.min(lastYear - 11, yearPage + direction * 12));
      if (direction < 0 ? nextPage === firstYear : nextPage + 11 >= lastYear) yearRef.current?.focus({ preventScroll: true });
      setYearPage(nextPage);
    } else {
      const next = clampMonth(monthDate(month.getFullYear() + (view === "months" ? direction : 0), month.getMonth() + (view === "days" ? direction : 0)));
      const atBoundary = view === "months" ? next.getFullYear() === (direction < 0 ? firstYear : lastYear) : !allowedMonth(monthDate(next.getFullYear(), next.getMonth() + direction));
      if (atBoundary) monthRef.current?.focus({ preventScroll: true });
      setMonth(next);
    }
  }

  const previousAllowed = view === "years" ? yearPage > firstYear : view === "months" ? month.getFullYear() > firstYear : allowedMonth(monthDate(month.getFullYear(), month.getMonth() - 1));
  const nextAllowed = view === "years" ? yearPage + 11 < lastYear : view === "months" ? month.getFullYear() < lastYear : allowedMonth(monthDate(month.getFullYear(), month.getMonth() + 1));
  const navigationUnit = view === "years" ? "12년" : view === "months" ? "연도" : "달";

  const controlClass = "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800";
  return <div ref={fieldRef} className={`flex min-w-0 items-center gap-2 rounded-[10px] border bg-white px-3 transition focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/20 dark:bg-[#101419] ${invalid ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"} ${className}`}>
    <input id={inputId} type="text" autoComplete="off" aria-label={label} aria-invalid={invalid} aria-describedby={`${inputId}-format`} value={draft} disabled={disabled} placeholder="YYYY-MM-DD" maxLength={10}
      className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-45 dark:text-zinc-100"
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        setInvalid(Boolean(next) && !isDateValueAllowed(next, min, max));
        if (isDateValueAllowed(next, min, max) && next !== value) onChange(next);
      }} onBlur={commitInput} onKeyDown={(event) => {
        if (event.key === "ArrowDown") { event.preventDefault(); openCalendar(); }
        if (event.key === "Enter") { event.preventDefault(); commitInput(); }
      }} />
    <span id={`${inputId}-format`} className="sr-only">날짜 형식: YYYY-MM-DD</span>
    <button ref={triggerRef} type="button" disabled={disabled} aria-label={`${label} 달력 열기`} aria-haspopup="dialog" aria-expanded={open && !disabled} aria-controls={open && !disabled ? dialogId : undefined} className={controlClass} onClick={() => open ? close() : openCalendar()}><CalendarDays aria-hidden="true" className="h-4 w-4" /></button>
    {open && !disabled && createPortal(<div ref={panelRef} id={dialogId} role="dialog" aria-label={`${label} 선택`} style={position} className="fixed z-[60] w-80 max-w-[calc(100vw-16px)] overflow-y-auto overscroll-contain rounded-xl border border-zinc-200 bg-white p-3 text-zinc-950 shadow-lg dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-50"
      onKeyDown={(event) => { if (event.key === "Escape" && !event.defaultPrevented) { event.preventDefault(); event.stopPropagation(); if (view === "days") close(); else { returnTo.current = view === "years" ? "year" : "month"; setView("days"); } } }}>
      <div className="mb-1 grid grid-cols-[36px_minmax(0,1fr)_36px] items-center gap-1">
        <button type="button" aria-label={`이전 ${navigationUnit}`} disabled={!previousAllowed} className={controlClass} onClick={() => shift(-1)}><ChevronLeft aria-hidden="true" className="h-4 w-4" /></button>
        <div className="flex min-w-0 items-center justify-center gap-0">
          <button ref={yearRef} type="button" aria-label={`${month.getFullYear()}년 연도 선택`} aria-expanded={view === "years"} className="inline-flex h-9 items-center gap-0.5 rounded-lg px-0.5 text-base font-bold hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-mint-500 dark:hover:bg-zinc-800" onClick={() => { setCalendarAutoFocus(false); setYearPage(Math.max(firstYear, Math.min(lastYear - 11, month.getFullYear() - 5))); setView(view === "years" ? "days" : "years"); }}>{month.getFullYear()}년<ChevronDown aria-hidden="true" className="h-3 w-3 text-zinc-400" /></button>
          <button ref={monthRef} type="button" aria-label={`${month.getMonth() + 1}월 월 선택`} aria-expanded={view === "months"} className="inline-flex h-9 items-center gap-0.5 rounded-lg px-0.5 text-base font-bold hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-mint-500 dark:hover:bg-zinc-800" onClick={() => { setCalendarAutoFocus(false); setView(view === "months" ? "days" : "months"); }}>{month.getMonth() + 1}월<ChevronDown aria-hidden="true" className="h-3 w-3 text-zinc-400" /></button>
        </div>
        <button type="button" aria-label={`다음 ${navigationUnit}`} disabled={!nextAllowed} className={controlClass} onClick={() => shift(1)}><ChevronRight aria-hidden="true" className="h-4 w-4" /></button>
      </div>
      {view === "days" ? <DayPicker className="service-date-calendar" locale={ko} mode="single" required={!allowClear} selected={selected} today={today} month={month} onMonthChange={setMonth} onSelect={choose} autoFocus={calendarAutoFocus} hideNavigation classNames={{ month_caption: "sr-only" }} fixedWeeks showOutsideDays
        startMonth={minimum ?? monthDate(1, 0)} endMonth={maximum ?? monthDate(9999, 11)} disabled={[...(minimum ? [{ before: minimum }] : []), ...(maximum ? [{ after: maximum }] : [])]} /> : <div className="grid grid-cols-3 gap-1 py-2" aria-label={view === "years" ? "연도 선택" : "월 선택"}>
        {Array.from({ length: 12 }, (_, index) => {
          const number = view === "years" ? yearPage + index : index + 1;
          const active = number === (view === "years" ? month.getFullYear() : month.getMonth() + 1);
          const unavailable = view === "years" ? number < firstYear || number > lastYear : !allowedMonth(monthDate(month.getFullYear(), index));
          return <button key={number} type="button" data-calendar-option aria-pressed={active} disabled={unavailable} className={`h-11 rounded-lg text-sm font-semibold focus-visible:outline-2 focus-visible:outline-mint-500 disabled:opacity-30 ${active ? "bg-mint-500 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`} onClick={() => selectMonth(view === "years" ? number : month.getFullYear(), view === "years" ? month.getMonth() : index, view === "years" ? "year" : "month")}>{number}{view === "years" ? "년" : "월"}</button>;
        })}
      </div>}
      <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 dark:border-zinc-700">
        <button type="button" className="rounded-lg px-3 py-2 text-sm font-bold text-mint-700 hover:bg-mint-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 disabled:opacity-40 dark:text-mint-300 dark:hover:bg-mint-500/10" disabled={!isDateValueAllowed(formatDateValue(today), min, max)} onClick={() => choose(today)}>오늘</button>
        {allowClear && <button type="button" className="rounded-lg px-3 py-2 text-sm font-bold text-zinc-500 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:text-zinc-400 dark:hover:bg-zinc-800" onClick={() => choose(undefined)}>초기화</button>}
      </div>
    </div>, document.body)}
  </div>;
}
