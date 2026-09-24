import { and, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { classes, termConfigurations, venues } from "@shared/schema";
import { cloneClassForTerm, type CloneableClass } from "@shared/term-setup";

// The approved eight-row public timetable expands to separate class records
// for the shared Junior Academy / Senior Squad / Team Sport Speed sessions.
// These records are for administration only; booking stays on SportsBiz/Setmore.
const offerings = [
  { sport: "foundation_prep_year2", venue: "Peninsula Grammar", day: 1, start: "15:30", end: "16:45" },
  { sport: "emerging_year3_6", venue: "Peninsula Grammar", day: 1, start: "15:30", end: "16:45" },
  { sport: "foundation_prep_year2", venue: "Toorak College", day: 4, start: "15:30", end: "16:45" },
  { sport: "emerging_year3_6", venue: "Toorak College", day: 4, start: "15:30", end: "16:45" },
  { sport: "junior_development", venue: "Ballam Park Athletic Track", day: 2, start: "16:30", end: "17:30" },
  ...[1, 2, 4].flatMap((day) => [
    { sport: "junior_development", venue: "Ballam Park Athletic Track", day, start: "17:30", end: "19:00" },
    { sport: "senior_squad", venue: "Ballam Park Athletic Track", day, start: "17:30", end: "19:00" },
  ]),
  { sport: "senior_squad", venue: "Mornington Athletic Track", day: 3, start: "17:30", end: "18:30" },
  { sport: "team_sport_speed", venue: "Mornington Athletic Track", day: 3, start: "17:30", end: "18:30" },
  { sport: "team_sport_speed", venue: "Mornington Athletic Track", day: 5, start: "16:30", end: "17:30" },
  { sport: "team_sport_speed", venue: "Mornington Athletic Track", day: 5, start: "17:30", end: "18:30" },
] as const;

const days = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export class Term4AlreadyConfiguredError extends Error {}

export async function getTerm4SetupStatus() {
  const [previous, next, configs] = await Promise.all([
    db.select({
      status: classes.status,
      isEnrollmentOpen: classes.isEnrollmentOpen,
    }).from(classes).where(and(eq(classes.term, "term_3"), eq(classes.year, 2026))),
    db.select({ id: classes.id }).from(classes)
      .where(and(eq(classes.term, "term_4"), eq(classes.year, 2026))),
    db.select({ term: termConfigurations.term, active: termConfigurations.active })
      .from(termConfigurations).where(eq(termConfigurations.year, 2026)),
  ]);
  return {
    term3ActiveCount: previous.filter((row) => row.status === "active").length,
    term3OpenCount: previous.filter((row) => row.isEnrollmentOpen).length,
    term4ClassCount: next.length,
    term3ConfigActive: configs.some((row) => row.term === "term_3" && row.active),
    term4ConfigExists: configs.some((row) => row.term === "term_4"),
    term4ConfigActive: configs.some((row) => row.term === "term_4" && row.active),
  };
}

export async function configureTerm4AndArchiveTerm3() {
  return db.transaction(async (tx) => {
    // Serialise two simultaneous admin requests before the no-duplicates check.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(2026, 4)`);
    const existing = await tx.select({ id: termConfigurations.id }).from(termConfigurations)
      .where(and(eq(termConfigurations.term, "term_4"), eq(termConfigurations.year, 2026)));
    const existingClasses = await tx.select({ id: classes.id }).from(classes)
      .where(and(eq(classes.term, "term_4"), eq(classes.year, 2026)));
    if (existing.length || existingClasses.length) {
      throw new Term4AlreadyConfiguredError("Term 4 records already exist. Review them in admin; no changes were made.");
    }
    const previousTerm = await tx.select({ id: termConfigurations.id, active: termConfigurations.active }).from(termConfigurations)
      .where(and(eq(termConfigurations.term, "term_3"), eq(termConfigurations.year, 2026)));
    if (previousTerm.length !== 1 || !previousTerm[0].active) {
      throw new Error("Expected one active Term 3 2026 configuration; no changes were made.");
    }

    const previous = await tx.select().from(classes)
      .where(and(eq(classes.term, "term_3"), eq(classes.year, 2026)));
    if (!previous.some((c) => c.status === "active")) {
      throw new Error("No active Term 3 2026 classes to archive; no changes were made.");
    }
    const locations = await tx.select().from(venues);
    const prepared = offerings.map((offering) => {
      const location = locations.find((v) => v.name === offering.venue);
      if (!location) throw new Error(`Missing venue: ${offering.venue}`);
      const sourceSport = offering.sport === "junior_development" ? "senior_squad"
        : offering.sport === "senior_squad" && offering.day === 3 ? "team_sport_speed"
        : offering.sport;
      const template = previous.find((c) => c.sportType === sourceSport && c.venueId === location.id && c.dayOfWeek === offering.day && c.status === "active");
      if (!template) throw new Error(`Missing previous-term template: ${offering.sport} ${offering.venue} ${offering.day}`);
      return { offering, location, template };
    });

    const [term] = await tx.insert(termConfigurations).values({
      term: "term_4",
      year: 2026,
      name: "Term 4 2026",
      startDate: "2026-10-05",
      endDate: "2026-12-18",
      weeksCount: 11,
      pricePerWeek: "30.00",
      gstRate: "0.10",
      active: true,
    }).returning();

    for (const { offering, location, template } of prepared) {
      const source = {
        ...template,
        name: `${offering.sport === "junior_development" ? "Junior Academy" : offering.sport === "senior_squad" ? "Senior Squad" : offering.sport === "team_sport_speed" ? "Team Sport Speed" : offering.sport === "foundation_prep_year2" ? "Foundation Class" : "Emerging Athletes"} — ${days[offering.day]} (${location.name})${offering.day === 5 || offering.sport === "junior_development" && offering.day === 2 ? ` ${offering.start}` : ""}`,
        sportType: offering.sport,
        startTime: offering.start,
        endTime: offering.end,
        minAge: offering.sport === "junior_development" ? 11 : offering.sport === "senior_squad" ? 16 : template.minAge,
        maxAge: offering.sport === "junior_development" ? 15 : offering.sport === "senior_squad" ? 99 : template.maxAge,
        pricePerSession: "30.00",
      } as CloneableClass;
      await tx.insert(classes).values(cloneClassForTerm(source, term));
    }

    await tx.update(termConfigurations).set({ active: false })
      .where(and(eq(termConfigurations.term, "term_3"), eq(termConfigurations.year, 2026)));
    // Legacy 2026 classes can point at an older configuration: archive by the
    // class's own term/year so none remain open after this switch.
    const archived = await tx.update(classes).set({ status: "completed", isEnrollmentOpen: false })
      .where(and(eq(classes.term, "term_3"), eq(classes.year, 2026), eq(classes.status, "active")))
      .returning({ id: classes.id });
    await tx.update(classes).set({ isEnrollmentOpen: false })
      .where(and(eq(classes.term, "term_3"), eq(classes.year, 2026)));
    return { created: prepared.length, archived: archived.length };
  });
}