"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { getNextOptionIndex } from "@/components/admin/admin-select-menu-utils";

export type SelectOption = { value: string; label: string };

type SelectMenuProps = {
  id?: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  compact?: boolean;
  attached?: boolean;
  disabled?: boolean;
};

export function SelectMenu({
  id,
  label,
  value,
  options,
  onChange,
  compact = false,
  attached = false,
  disabled = false,
}: SelectMenuProps) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selectedLabel = options[selectedIndex]?.label ?? value;

  useEffect(() => {
    if (!open || disabled) return;

    optionRefs.current[selectedIndex]?.focus({ preventScroll: true });
    optionRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, selectedIndex, disabled]);

  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  const closeMenu = () => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  const moveFocus = (currentIndex: number, key: string) => {
    const nextIndex = getNextOptionIndex(currentIndex, options.length, key);
    if (nextIndex !== currentIndex || key === "Home" || key === "End") {
      optionRefs.current[nextIndex]?.focus();
    }
  };

  const triggerHeight = attached ? "h-full w-full" : compact ? "h-9 min-w-28" : "h-11 w-full";

  return (
    <div ref={menuRef} className={`relative ${attached ? "h-full" : ""}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={`${label}: ${selectedLabel}`}
        aria-haspopup="listbox"
        aria-controls={open && !disabled ? menuId : undefined}
        aria-expanded={open && !disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={`inline-flex ${triggerHeight} items-center justify-between gap-2 ${attached ? "border-0 bg-transparent" : "rounded-[10px] border bg-white dark:bg-[#101419]"} px-3 text-sm font-extrabold text-zinc-950 transition-colors hover:border-mint-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-50 dark:focus-visible:ring-offset-[#101419] ${open ? "border-mint-500" : "border-zinc-300"}`}
      >
        <span className="truncate whitespace-nowrap">{selectedLabel}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && !disabled ? (
        <div
          role="listbox"
          id={menuId}
          aria-label={label}
          className={`absolute right-0 z-20 mt-2 max-h-60 ${compact ? "min-w-28" : "min-w-full"} overflow-y-auto rounded-[10px] border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-950/8 dark:border-zinc-700 dark:bg-[#101419] dark:shadow-black/30`}
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                type="button"
                tabIndex={-1}
                disabled={disabled}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  closeMenu();
                }}
                onKeyDown={(event) => {
                  if (
                    ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
                  ) {
                    event.preventDefault();
                    moveFocus(index, event.key);
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    closeMenu();
                  }
                  if (event.key === "Tab") closeMenu();
                }}
                className={`flex h-9 w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 text-left text-sm font-bold transition-colors hover:bg-mint-50 hover:text-mint-800 focus:bg-mint-50 focus:outline-none dark:hover:bg-mint-500/10 dark:hover:text-mint-300 dark:focus:bg-mint-500/10 ${selected ? "bg-mint-500/10 text-mint-800 dark:text-mint-300" : "text-zinc-700 dark:text-zinc-200"}`}
              >
                <span className="w-4 shrink-0">
                  {selected ? (
                    <Check aria-hidden="true" className="h-4 w-4" />
                  ) : null}
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
