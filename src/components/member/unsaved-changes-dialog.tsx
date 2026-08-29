type UnsavedChangesDialogProps = {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
};

export function UnsavedChangesDialog({ open, onStay, onLeave }: UnsavedChangesDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-5" role="presentation">
      <section role="alertdialog" aria-modal="true" aria-labelledby="unsaved-changes-title" aria-describedby="unsaved-changes-description" className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl shadow-black/10 dark:border-zinc-800 dark:bg-[#101419] dark:shadow-black/30">
        <h2 id="unsaved-changes-title" className="text-lg font-extrabold tracking-[-0.02em]">변경 사항을 저장하지 않고 나갈까요?</h2>
        <p id="unsaved-changes-description" className="mt-2 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">저장하지 않은 내용은 반영되지 않습니다.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onLeave} className="h-11 rounded-[10px] border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-700 dark:border-zinc-700 dark:bg-[#101419] dark:text-zinc-200">나가기</button>
          <button type="button" onClick={onStay} className="h-11 rounded-[10px] bg-mint-500 px-4 text-sm font-extrabold text-white">계속 편집</button>
        </div>
      </section>
    </div>
  );
}
