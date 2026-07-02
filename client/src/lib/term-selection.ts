import type { TermConfiguration } from "@shared/schema";

// Local calendar date (YYYY-MM-DD) for "today", avoiding timezone drift from
// toISOString (which is UTC). Term dates are stored as date-only strings.
export function todayLocalIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// The term whose date range contains today, if any.
export function findCurrentTerm<T extends Pick<TermConfiguration, "startDate" | "endDate">>(
  terms: T[],
  today: string = todayLocalIso(),
): T | undefined {
  return terms.find((t) => t.startDate <= today && today <= t.endDate);
}

// Terms offered in the class browser: the current term plus any that start in
// the future, ordered by start date. Past terms are excluded.
export function selectableTerms<T extends Pick<TermConfiguration, "startDate" | "endDate">>(
  terms: T[],
  today: string = todayLocalIso(),
): T[] {
  const current = findCurrentTerm(terms, today);
  return terms
    .filter((t) => t === current || t.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

// The term to show by default: current term if today is within one, otherwise
// the earliest upcoming term.
export function defaultTerm<T extends Pick<TermConfiguration, "startDate" | "endDate">>(
  terms: T[],
  today: string = todayLocalIso(),
): T | undefined {
  return findCurrentTerm(terms, today) ?? selectableTerms(terms, today)[0];
}
