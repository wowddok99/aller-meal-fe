"use client";

import { GuardedLink } from "@/components/member/guarded-link";

type PageHeadingProps = {
  title: string;
  description?: string;
  parents?: Array<{ label: string; href: string }>;
};

export function PageHeading({ title, description, parents = [] }: PageHeadingProps) {
  const heading = <h1 className="min-w-0 break-keep text-2xl font-extrabold tracking-[-0.02em] [overflow-wrap:anywhere]">{title}</h1>;

  return <header className="min-w-0">
    {parents.length ? <nav aria-label="현재 위치">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {parents.map(({ label, href }) => <li key={href} className="flex min-w-0 items-center gap-3">
          <GuardedLink href={href} className="min-w-0 break-keep rounded text-base font-semibold text-zinc-500 transition-colors hover:text-mint-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:text-zinc-400 dark:hover:text-mint-300 sm:text-lg [overflow-wrap:anywhere]">{label}</GuardedLink>
          <span aria-hidden="true" className="shrink-0 text-lg text-zinc-400">/</span>
        </li>)}
        <li aria-current="page" className="min-w-0 max-w-full">{heading}</li>
      </ol>
    </nav> : heading}
    {description && <p className="mt-3 text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">{description}</p>}
  </header>;
}
