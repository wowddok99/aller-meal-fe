"use client";

import { useId, useRef } from "react";
import { ModalDialog } from "@/components/modal-dialog";

type UnsavedChangesDialogProps = {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
};

export function UnsavedChangesDialog({ open, onStay, onLeave }: UnsavedChangesDialogProps) {
  const stayRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <ModalDialog open={open} onClose={onStay} labelledBy={titleId} describedBy={descriptionId} initialFocusRef={stayRef}>
      <div className="border-b border-zinc-200 px-6 pb-4 pt-6 dark:border-zinc-800">
        <h2 id={titleId} className="break-keep text-xl font-extrabold">변경 사항을 저장하지 않고 나갈까요?</h2>
      </div>
      <div className="px-6 pb-6 pt-5">
        <p id={descriptionId} className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">저장하지 않은 내용은 반영되지 않습니다.</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onLeave} className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-zinc-300 px-4 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:focus-visible:ring-offset-[#101419]">나가기</button>
          <button ref={stayRef} type="button" onClick={onStay} className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-mint-500 px-4 text-sm font-extrabold text-white hover:bg-mint-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101419]">계속 편집</button>
        </div>
      </div>
    </ModalDialog>
  );
}
