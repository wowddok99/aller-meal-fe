import { Info } from "lucide-react";
import type { ReactNode } from "react";

/** A quiet, persistent notice placed beside the content or action it describes. */
export function ApiNotice({ title, children, action, centered = false }: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  centered?: boolean;
}) {
  const Title = centered ? "h2" : "p";
  return (
    <div role="alert" className={centered ? "text-center" : "flex items-start gap-2.5"}>
      {centered ? <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900"><Info aria-hidden="true" className="h-6 w-6 text-zinc-500 dark:text-zinc-400" strokeWidth={1.8} /></span> : <span className="flex h-6 shrink-0 items-center"><Info aria-hidden="true" className="h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.8} /></span>}
      <div className="min-w-0">
        <Title className={`${centered ? "text-base font-bold" : "text-sm font-semibold"} leading-6 text-zinc-700 dark:text-zinc-200`}>{title}</Title>
        {children ? <div className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{children}</div> : null}
        {action ? <div className={centered ? "mt-3 flex flex-wrap items-center justify-center gap-2" : "mt-3"}>{action}</div> : null}
      </div>
    </div>
  );
}
