"use client";

import { GuardedLink } from "@/components/member/guarded-link";
import { useLayoutEffect, useRef, useState } from "react";

type PageHeadingProps = {
  title: string;
  description?: string;
  parents?: Array<{ label: string; href: string }>;
};

export function PageHeading({ title, description, parents = [] }: PageHeadingProps) {
  const home = { label: "홈", href: "/schools" };
  const navigationRef = useRef<HTMLElement>(null);
  const measurementRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  const standardParents: Array<{ label: string; href?: string; omitted?: string }> = parents.length > 1
    ? [home, { label: "…", omitted: parents.slice(0, -1).map((parent) => parent.label).join(" / ") }, parents[parents.length - 1]]
    : [home, ...parents];
  const breadcrumbParents: typeof standardParents = compact && parents.length
    ? [home, { label: "…", omitted: parents.map((parent) => parent.label).join(" / ") }]
    : standardParents;
  const measuredPath = [...standardParents.map((parent) => parent.label), title].join(" / ");

  // Measure the unwrapped path independently so collapsing it cannot cause resize loops.
  useLayoutEffect(() => {
    const navigation = navigationRef.current;
    const measurement = measurementRef.current;
    if (!navigation || !measurement) return;
    const mobile = window.matchMedia("(max-width: 767px)");
    const update = () => setCompact(mobile.matches && measurement.getBoundingClientRect().width > navigation.clientWidth);
    const observer = new ResizeObserver(update);
    observer.observe(navigation);
    observer.observe(measurement);
    mobile.addEventListener("change", update);
    update();
    return () => {
      observer.disconnect();
      mobile.removeEventListener("change", update);
    };
  }, [measuredPath]);

  const heading = <h1 className="min-w-0 break-keep text-xl font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]">{title}</h1>;

  return <header className="min-w-0">
    <nav ref={navigationRef} aria-label="현재 위치" className="relative min-w-0">
      <div aria-hidden="true" className="pointer-events-none invisible absolute inset-0 overflow-hidden">
        <div ref={measurementRef} className="flex w-max items-center gap-3 whitespace-nowrap text-xl font-semibold tracking-[-0.02em]">
          {standardParents.map(({ label }) => <span key={label} className="flex items-center gap-3"><span>{label}</span><span>/</span></span>)}
          <span>{title}</span>
        </div>
      </div>
      <ol className="flex items-center gap-3">
        {breadcrumbParents.map(({ label, href, omitted }) => <li key={`${label}:${href}`} className="flex shrink-0 items-center gap-3">
          {href ? <GuardedLink href={href} className="rounded text-xl font-semibold tracking-[-0.02em] text-zinc-500 transition-colors hover:text-mint-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:text-zinc-400 dark:hover:text-mint-300">{label}</GuardedLink>
            : <span className="text-xl font-semibold text-zinc-500 dark:text-zinc-400"><span aria-hidden="true">…</span><span className="sr-only">생략된 경로: {omitted}</span></span>}
          <span aria-hidden="true" className="shrink-0 text-xl text-zinc-400">/</span>
        </li>)}
        <li aria-current="page" className="min-w-0 max-w-full">{heading}</li>
      </ol>
    </nav>
    {description && <p className="mt-3 text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">{description}</p>}
  </header>;
}
