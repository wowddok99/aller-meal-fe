"use client";

import { useEffect, useRef } from "react";
import type { CollectionJob } from "@/lib/admin-api";
import { collectionButtonStyle } from "./collection-job-status";

export function CollectionRequestConfirmation({ job, kind, onClose, onConfirm }: { job: CollectionJob; kind: "recollection" | "execution"; onClose: () => void; onConfirm: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const pressedBackdrop = useRef(false);
  const recollect = kind === "recollection";
  const mealType = job.mealType ? ({ BREAKFAST: "아침", LUNCH: "점심", DINNER: "저녁" })[job.mealType] : "급식 구분 미제공";

  useEffect(() => {
    const dialog = dialogRef.current;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (dialog && !dialog.open) dialog.showModal();
    cancelRef.current?.focus();
    return () => {
      dialog?.close();
      if (returnFocus?.isConnected && returnFocus !== document.body && returnFocus !== document.documentElement && !returnFocus.matches(":disabled,[aria-disabled='true']") && !returnFocus.closest("[inert]") && (returnFocus.tabIndex >= 0 || returnFocus.hasAttribute("tabindex"))) returnFocus.focus();
      else document.getElementById("collection-detail-title")?.focus();
    };
  }, []);

  return <dialog ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="collection-confirm-title" aria-describedby="collection-confirm-description" onPointerDown={(event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    pressedBackdrop.current = event.target === event.currentTarget && (event.clientX < bounds.left || event.clientX >= bounds.right || event.clientY < bounds.top || event.clientY >= bounds.bottom);
  }} onClick={(event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX >= bounds.right || event.clientY < bounds.top || event.clientY >= bounds.bottom;
    const cancel = pressedBackdrop.current && event.target === event.currentTarget && outside;
    pressedBackdrop.current = false;
    if (cancel) onClose();
  }} onCancel={(event) => { event.preventDefault(); onClose(); }} onKeyDown={(event) => {
    if (event.key !== "Tab") return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
    const first = buttons[0];
    const last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }} className="fixed inset-0 z-[60] m-auto max-h-[calc(100dvh_-_2.5rem)] w-[calc(100%_-_2.5rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-0 text-zinc-950 shadow-xl backdrop:bg-zinc-950/45 dark:bg-[#101419] dark:text-zinc-50">
    <div className="border-b border-zinc-200 px-6 pb-4 pt-6 dark:border-zinc-800"><h2 id="collection-confirm-title" className="text-xl font-extrabold">{recollect ? "급식 재수집 요청" : "급식 수집 실행"}</h2></div>
    <div className="px-6 pb-6 pt-5">
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-3 text-sm">{[["학교", job.schoolName || "학교 미제공"], ["급식 날짜", job.mealDate || "날짜 미제공"], ["급식 구분", mealType]].map(([label, value]) => <div key={label} className="contents"><dt className="text-zinc-500 dark:text-zinc-400">{label}</dt><dd className="break-words font-bold">{value}</dd></div>)}</dl>
    <p id="collection-confirm-description" className="mt-5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{recollect ? "해당 급식의 재수집을 요청합니다." : "대기 중인 급식 수집을 실행합니다."}</p>
    <div className="mt-6 flex flex-wrap justify-end gap-3"><button ref={cancelRef} type="button" className={`${collectionButtonStyle} w-16`} onClick={onClose}>취소</button><button type="button" className="inline-flex min-h-11 w-16 items-center justify-center rounded-[10px] bg-mint-500 px-4 text-sm font-extrabold text-white hover:bg-mint-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101419]" onClick={onConfirm}>확인</button></div>
    </div>
  </dialog>;
}
