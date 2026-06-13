import assert from "node:assert/strict";
import { defaultPerWeekEnabled, cloneClassForTerm } from "../shared/term-setup";

// defaultPerWeekEnabled: ON for emerging + foundation, OFF for everything else
assert.equal(defaultPerWeekEnabled("emerging_year3_6"), true);
assert.equal(defaultPerWeekEnabled("foundation_prep_year2"), true);
assert.equal(defaultPerWeekEnabled("junior_development"), false);
assert.equal(defaultPerWeekEnabled("senior_squad"), false);
assert.equal(defaultPerWeekEnabled("team_sport_speed"), false);

// cloneClassForTerm: copies definition, resets enrolment, re-points term, recomputes price
const source = {
  name: "Emerging Athletes — Tuesday (Ballam Park)",
  description: "desc",
  sportType: "emerging_year3_6",
  venueId: "venue-1",
  coachId: "coach-1",
  dayOfWeek: 2,
  startTime: "16:30",
  endTime: "17:30",
  minAge: 8,
  maxAge: 12,
  maxCapacity: 12,
  pricePerSession: "30.00",
  imageUrl: "https://x/y.jpg",
  isHolidayProgram: false,
  isMakeupEligible: false,
};
const targetConfig = {
  id: "cfg-t3-2026",
  term: "term_3",
  year: 2026,
  startDate: "2026-07-13",
  endDate: "2026-09-18",
  weeksCount: 10,
  pricePerWeek: "30.00",
};
const cloned = cloneClassForTerm(source as any, targetConfig as any);

assert.equal(cloned.termConfigId, "cfg-t3-2026");
assert.equal(cloned.term, "term_3");
assert.equal(cloned.year, 2026);
assert.equal(cloned.currentEnrollment, 0);
assert.equal(cloned.coachId, "coach-1");
assert.equal(cloned.dayOfWeek, 2);
assert.equal(cloned.pricePerTerm, "300.00");
assert.equal(cloned.perWeekEnabled, true);
assert.equal(cloned.status, "active");
assert.equal(cloned.isEnrollmentOpen, false);
assert.equal((cloned.startDate as Date).toISOString().slice(0, 10), "2026-07-13");
assert.equal((cloned.endDate as Date).toISOString().slice(0, 10), "2026-09-18");

console.log("term-setup tests passed");
