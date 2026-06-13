// One-time backfill: creates enrollment_weeks rows (all weeks "selected",
// holiday weeks "holiday") for existing enrolments that have none.
// Existing enrolments paid for the full term, so every non-holiday week is selected.
//
// Run on Replit AFTER `npm run db:push` has created the table:
//   npx tsx scripts/backfill-enrollment-weeks.ts          # dry run (default)
//   npx tsx scripts/backfill-enrollment-weeks.ts --apply  # write rows
import { db } from "../server/db";
import { enrollments, enrollmentWeeks, classes, termConfigurations, termHolidays } from "../shared/schema";
import { computeTermWeeks } from "../shared/term-weeks";
import { eq, inArray, sql } from "drizzle-orm";

const APPLY = process.argv.includes("--apply");

async function main() {
  const rows = await db
    .select({
      enrollmentId: enrollments.id,
      status: enrollments.status,
      classId: classes.id,
      className: classes.name,
      dayOfWeek: classes.dayOfWeek,
      termConfigId: classes.termConfigId,
    })
    .from(enrollments)
    .innerJoin(classes, eq(enrollments.classId, classes.id))
    .where(inArray(enrollments.status, ["active", "completed"]));

  const existing = await db
    .select({ enrollmentId: enrollmentWeeks.enrollmentId })
    .from(enrollmentWeeks)
    .groupBy(enrollmentWeeks.enrollmentId);
  const alreadyDone = new Set(existing.map((r) => r.enrollmentId));

  let created = 0, skippedDone = 0, skippedNoTerm = 0;

  for (const row of rows) {
    if (alreadyDone.has(row.enrollmentId)) { skippedDone++; continue; }
    if (!row.termConfigId) { skippedNoTerm++; continue; }

    const [termConfig] = await db
      .select()
      .from(termConfigurations)
      .where(eq(termConfigurations.id, row.termConfigId));
    if (!termConfig) { skippedNoTerm++; continue; }

    const holidays = await db
      .select()
      .from(termHolidays)
      .where(eq(termHolidays.termConfigurationId, row.termConfigId));

    const weeks = computeTermWeeks({
      termStartDate: termConfig.startDate,
      weeksCount: termConfig.weeksCount,
      classDayOfWeek: row.dayOfWeek,
      holidays: holidays.map((h) => ({ holidayDate: h.holidayDate, name: h.name })),
    });

    if (APPLY) {
      await db.insert(enrollmentWeeks).values(
        weeks.map((w) => ({
          enrollmentId: row.enrollmentId,
          weekNumber: w.weekNumber,
          sessionDate: w.sessionDate,
          status: w.isHoliday ? ("holiday" as const) : ("selected" as const),
        })),
      );
    }
    created++;
    console.log(`${APPLY ? "backfilled" : "would backfill"} ${weeks.length} weeks: ${row.className} (enrollment ${row.enrollmentId})`);
  }

  console.log(`\n${APPLY ? "DONE" : "DRY RUN"}: ${created} enrolments ${APPLY ? "backfilled" : "to backfill"}, ${skippedDone} already had weeks, ${skippedNoTerm} skipped (no term config).`);
  if (!APPLY && created > 0) console.log("Re-run with --apply to write the rows.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
