// Pure helpers for the "Set Up New Term" tool. No DB, no side effects, so they
// can be unit-tested directly with tsx.
import type { InsertClass } from "./schema";

// Programs that offer per-week (fortnightly) enrolment by default.
const PER_WEEK_DEFAULT_PROGRAMS = new Set<string>([
  "foundation_prep_year2",
  "emerging_year3_6",
]);

export function defaultPerWeekEnabled(sportType: string): boolean {
  return PER_WEEK_DEFAULT_PROGRAMS.has(sportType);
}

// Minimal shape of a source class needed to clone it into a new term.
export interface CloneableClass {
  name: string;
  description: string | null;
  sportType: string;
  venueId: string;
  coachId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  minAge: number;
  maxAge: number;
  maxCapacity: number;
  pricePerSession: string | null;
  imageUrl: string | null;
  isHolidayProgram: boolean;
  isMakeupEligible: boolean;
}

export interface TargetTermConfig {
  id: string;
  term: string;
  year: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  weeksCount: number;
  pricePerWeek: string;
}

// Build the InsertClass for a cloned class: copy the definition, carry the
// coach, re-point to the new term, reset enrolment, and recompute the term
// price from the new config (price per week × weeks).
export function cloneClassForTerm(source: CloneableClass, target: TargetTermConfig): InsertClass {
  const pricePerTerm = (parseFloat(target.pricePerWeek) * target.weeksCount).toFixed(2);
  return {
    name: source.name,
    description: source.description,
    sportType: source.sportType as any,
    venueId: source.venueId,
    coachId: source.coachId,
    termConfigId: target.id,
    term: target.term as any,
    year: target.year,
    dayOfWeek: source.dayOfWeek,
    startTime: source.startTime,
    endTime: source.endTime,
    startDate: new Date(`${target.startDate}T00:00:00Z`),
    endDate: new Date(`${target.endDate}T00:00:00Z`),
    minAge: source.minAge,
    maxAge: source.maxAge,
    maxCapacity: source.maxCapacity,
    pricePerSession: source.pricePerSession,
    pricePerTerm,
    status: "active",
    imageUrl: source.imageUrl,
    isEnrollmentOpen: false,
    isHolidayProgram: source.isHolidayProgram,
    isMakeupEligible: source.isMakeupEligible,
    perWeekEnabled: defaultPerWeekEnabled(source.sportType),
    currentEnrollment: 0,
  } as InsertClass;
}
