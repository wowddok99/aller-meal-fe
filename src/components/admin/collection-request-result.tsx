"use client";

import { useEffect, useRef } from "react";

export function CollectionRequestResult({ title, message, failureReason, onClose }: { title: string; message: string; failureReason?: string | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (dialog && !dialog.open) dialog.showModal();
    confirmRef.current?.focus();
    return () => {
      dialog?.close();
      if (returnFocus?.isConnected && returnFocus !== document.body && returnFocus !== document.documentElement && !returnFocus.matches(":disabled,[aria-disabled='true']") && !returnFocus.closest("[inert]") && (returnFocus.tabIndex >= 0 || returnFocus.hasAttribute("tabindex"))) returnFocus.focus();
      else document.getElementById("collection-detail-title")?.focus();
    };
  }, []);

  return <dialog ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="collection-result-dialog-title" aria-describedby="collection-result-dialog-message" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }} onKeyDown={(event) => { if (event.key === "Tab") { event.preventDefault(); confirmRef.current?.focus(); } }} className="fixed inset-0 z-[60] m-auto max-h-[calc(100dvh_-_2.5rem)] w-[calc(100%_-_2.5rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-0 text-zinc-950 shadow-xl backdrop:bg-zinc-950/45 dark:bg-[#101419] dark:text-zinc-50">
    <div className="border-b border-zinc-200 px-6 pb-4 pt-6 dark:border-zinc-800"><h2 id="collection-result-dialog-title" className="text-xl font-extrabold">{title}</h2></div>
    <div className="px-6 pb-6 pt-5">
    <div id="collection-result-dialog-message" className="space-y-3 break-words text-sm leading-6 text-zinc-600 dark:text-zinc-300"><p>{message}</p>{failureReason ? <p>실패 사유: {failureReason}</p> : null}</div>
    <div className="mt-6 flex justify-end"><button ref={confirmRef} type="button" onClick={onClose} className="inline-flex min-h-11 w-16 items-center justify-center rounded-[10px] bg-mint-500 px-4 text-sm font-extrabold text-white hover:bg-mint-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101419]">확인</button></div>
    </div>
  </dialog>;
}
