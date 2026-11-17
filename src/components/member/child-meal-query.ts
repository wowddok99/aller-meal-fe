import { parseDateValue } from "@/lib/date-picker-date";
import type { PersonalizedMealMode } from "@/lib/member-api";

type MealQuery = { mode: PersonalizedMealMode; date: string };
type QueryValues = Pick<URLSearchParams, "getAll">;

export function getChildMealQuery(params: QueryValues, today: string): MealQuery {
  const dates = params.getAll("date"), modes = params.getAll("mode");
  const date = dates[0], mode = modes[0];
  const fallback: MealQuery = { mode: "today", date: today };
  if (dates.length > 1 || modes.length > 1) return fallback;
  if (mode !== undefined && !["today", "daily", "weekly"].includes(mode)) return fallback;
  if (mode === "today") return fallback;
  if (date !== undefined && !parseDateValue(date)) return fallback;
  if (!mode && !date) return fallback;
  return { mode: mode === "weekly" ? "weekly" : "daily", date: date ?? today };
}

export function getChildMealUrl({ pathname, search, hash }: Pick<Location, "pathname" | "search" | "hash">, query: MealQuery) {
  const params = new URLSearchParams(search);
  params.set("mode", query.mode);
  if (query.mode === "today") params.delete("date");
  else params.set("date", query.date);
  return `${pathname}?${params}${hash}`;
}
