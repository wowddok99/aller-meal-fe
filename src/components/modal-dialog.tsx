"use client";

import { useEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";

const focusableSelector = "button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex='-1'])";

function focusableElements(dialog: HTMLDialogElement) {
  return Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => element.tabIndex >= 0 && !element.closest("[inert]") && element.getClientRects().length > 0);
}

function focusInside(dialog: HTMLDialogElement) {
  (focusableElements(dialog)[0] ?? dialog.querySelector<HTMLElement>("[tabindex='-1']") ?? dialog).focus();
}

type ModalDialogProps = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  initialFocusRef: RefObject<HTMLElement | null>;
  busy?: boolean;
  children: ReactNode;
};

export function ModalDialog({ open, onClose, labelledBy, describedBy, initialFocusRef, busy = false, children }: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedBackdrop = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const rootOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    const title = dialog.querySelector<HTMLElement>("h2");
    const titleTabIndex = title?.getAttribute("tabindex");
    title?.setAttribute("tabindex", "-1");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    // showModal makes the document outside this dialog inert.
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal
    if (!dialog.open) dialog.showModal();
    if (initialFocusRef.current && !initialFocusRef.current.matches(":disabled")) initialFocusRef.current.focus();
    else focusInside(dialog);
    const keepFocusInside = () => {
      if (dialog.open && !dialog.contains(document.activeElement)) focusInside(dialog);
    };
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialog.open) return;
      const elements = focusableElements(dialog);
      const first = elements[0];
      const last = elements.at(-1);
      if (!first) { event.preventDefault(); focusInside(dialog); }
      else if (!dialog.contains(document.activeElement) || document.activeElement === dialog) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("focusin", keepFocusInside);
    document.addEventListener("keydown", trapFocus, true);
    return () => {
      document.removeEventListener("focusin", keepFocusInside);
      document.removeEventListener("keydown", trapFocus, true);
      pressedBackdrop.current = false;
      dialog.close();
      if (titleTabIndex == null) title?.removeAttribute("tabindex");
      else title?.setAttribute("tabindex", titleTabIndex);
      document.documentElement.style.overflow = rootOverflow;
      document.body.style.overflow = bodyOverflow;
      if (origin?.isConnected && origin !== document.body && origin !== document.documentElement && !origin.matches(":disabled,[aria-disabled='true']") && !origin.closest("[inert]") && origin.getClientRects().length > 0 && origin.tabIndex >= 0) {
        origin.focus({ preventScroll: true });
      } else {
        const heading = document.querySelector<HTMLElement>("main h1, h1");
        if (heading) {
          if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
          heading.focus({ preventScroll: true });
        }
      }
    };
  }, [open, initialFocusRef]);

  return <dialog ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={labelledBy} aria-describedby={describedBy} aria-busy={busy || undefined}
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
    onPointerDown={(event) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      pressedBackdrop.current = event.target === event.currentTarget && (event.clientX < bounds.left || event.clientX >= bounds.right || event.clientY < bounds.top || event.clientY >= bounds.bottom);
    }}
    onPointerCancel={() => { pressedBackdrop.current = false; }}
    onClick={(event) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const outside = event.clientX < bounds.left || event.clientX >= bounds.right || event.clientY < bounds.top || event.clientY >= bounds.bottom;
      const dismiss = pressedBackdrop.current && event.target === event.currentTarget && outside;
      pressedBackdrop.current = false;
      if (dismiss && !busy) onClose();
    }}
    className="fixed inset-0 z-[60] m-auto max-h-[calc(100dvh_-_2.5rem)] w-[calc(100%_-_2.5rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-0 text-zinc-950 shadow-xl backdrop:bg-zinc-950/45 dark:bg-[#101419] dark:text-zinc-50">
    {children}
  </dialog>;
}
