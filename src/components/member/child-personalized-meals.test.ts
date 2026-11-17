import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChildPersonalizedMeals } from "./child-personalized-meals";

const route = vi.hoisted(() => ({ query: "date=2026-11-09&mode=daily" }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/children/child-1/meals",
  useSearchParams: () => new URLSearchParams(route.query),
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("meal link rendering", () => {
  beforeEach(() => { route.query = "date=2026-11-09&mode=daily"; });

  it("renders the mail date and daily mode before profile or meal data is loaded", () => {
    const markup = renderToStaticMarkup(React.createElement(ChildPersonalizedMeals, { childId: "child-1" }));
    expect(markup).toContain('value="2026-11-09"');
    expect(markup).toMatch(/aria-pressed="true"[^>]*>일간<\/button>/);
    expect(markup).toContain("자녀 급식");
  });

  it("uses a later URL query instead of keeping the original mail date", () => {
    renderToStaticMarkup(React.createElement(ChildPersonalizedMeals, { childId: "child-1" }));
    route.query = "date=2026-11-10&mode=weekly";
    const markup = renderToStaticMarkup(React.createElement(ChildPersonalizedMeals, { childId: "child-1" }));
    expect(markup).toContain('value="2026-11-10"');
    expect(markup).toMatch(/aria-pressed="true"[^>]*>주간<\/button>/);
  });
});
