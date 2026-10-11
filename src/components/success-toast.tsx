"use client";

import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type SuccessNotice = { message: string; version: number } | null;

export function useSuccessToast() {
  const [notice, setNotice] = useState<SuccessNotice>(null);
  const version = useRef(0);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const notify = useCallback((message: string) => {
    if (mounted.current) setNotice(message ? { message, version: ++version.current } : null);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  return { notice, notify };
}

export function SuccessToast({ notice }: { notice: SuccessNotice }) {
  return <div role="status" aria-live="polite" aria-atomic="true" className="pointer-events-none fixed inset-x-5 bottom-6 z-50 flex justify-center">
    {notice && <div key={notice.version} className="withdrawal-toast flex max-w-full items-center gap-2 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm font-semibold text-mint-900 shadow-sm dark:border-mint-900 dark:bg-mint-950 dark:text-mint-200"><CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />{notice.message}</div>}
  </div>;
}
