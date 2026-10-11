"use client";

import { Minus, Plus } from "lucide-react";
import { SelectMenu } from "@/components/select-menu";

type NumberStepperProps = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function NumberStepper({ id, label, value, min, max, suffix, onChange, disabled = false }: NumberStepperProps) {
  return <div className="mt-2 flex h-12 rounded-[10px] border border-zinc-300 bg-white transition focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/20 dark:border-zinc-700 dark:bg-[#0b0f13]">
    <button type="button" aria-label={`${label} 줄이기`} disabled={disabled || value <= min} onClick={() => onChange(Math.max(min, value - 1))} className="flex w-10 shrink-0 items-center justify-center rounded-l-[9px] border-r border-zinc-300 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-35 sm:w-12 dark:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"><Minus className="h-4 w-4" /></button>
    <div className="min-w-0 flex-1"><SelectMenu id={id} label={label} value={String(value)} options={Array.from({ length: max - min + 1 }, (_, index) => ({ value: String(min + index), label: `${min + index}${suffix}` }))} onChange={(next) => onChange(Number(next))} attached disabled={disabled} /></div>
    <button type="button" aria-label={`${label} 늘리기`} disabled={disabled || value >= max} onClick={() => onChange(Math.min(max, value + 1))} className="flex w-10 shrink-0 items-center justify-center rounded-r-[9px] border-l border-zinc-300 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-35 sm:w-12 dark:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"><Plus className="h-4 w-4" /></button>
  </div>;
}
