import { and, eq } from "drizzle-orm";
import { db, pool } from "../server/db";
import { classes, termConfigurations, venues } from "@shared/schema";
import { cloneClassForTerm, type CloneableClass } from "@shared/term-setup";

// One-time setup for the approved eight-row Term 4 table. Class enrolments
// remain on SportsBiz/Setmore; do not open duplicate checkout in this app.
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

async function main() {
  await db.transaction(async (tx) => {
    const existing = await tx.select().from(termConfigurations).where(and(eq(termConfigurations.term, "term_4"), eq(termConfigurations.year, 2026)));
    if (existing.length) throw new Error("Term 4 2026 already exists; review it in admin instead of running setup twice");

    const previous = await tx.select().from(classes).where(and(eq(classes.term, "term_3"), eq(classes.year, 2026)));
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

    await tx.update(termConfigurations).set({ active: false }).where(and(eq(termConfigurations.term, "term_3"), eq(termConfigurations.year, 2026)));
    await tx.update(classes).set({ isEnrollmentOpen: false }).where(and(eq(classes.term, "term_3"), eq(classes.year, 2026)));
    console.log(`Term 4 2026 configured with ${prepared.length} classes; Term 3 enrolment closed.`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => pool.end());