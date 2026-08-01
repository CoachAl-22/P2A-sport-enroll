import { storage } from "../server/storage";
import type { InsertEnrolmentLink } from "@shared/schema";

// Rung slugs resolve internally: a parent who does not yet know which class they
// want reads the program page first. Class slugs go straight out to SportsBiz or
// Setmore, because whoever followed that link already knows what they want.

// The SportsBiz term schedule: one page listing every class and venue. Confirmed by
// Alistair 2026-08-01 as where the Enrol button sends a customer. When a new term
// changes this URL, edit it in /admin/enrolment-links rather than here.
const SPORTSBIZ_TERM_SCHEDULE =
  "https://www.thinksmartsoftware-au.com/ocr/schedule_view.php?c=5D6DC72044045&p_id=1&t=sportsbiz&set=yes";

// Team Sport Speed books through Setmore, not SportsBiz.
const SETMORE_BOOKING =
  "https://booking.setmore.com/scheduleappointment/25c37fb9-f05a-4f3d-80a5-8b302288f337?utm_source=power2adapt&utm_medium=enrol-link&utm_campaign=team-sport-speed";

const LINKS: InsertEnrolmentLink[] = [
  { slug: "foundation", label: "Foundation", destinationUrl: "/foundation", kind: "internal", active: true, notes: null },
  { slug: "emerging-athletes", label: "Emerging Athletes", destinationUrl: "/emerging-athletes", kind: "internal", active: true, notes: null },
  { slug: "junior-academy", label: "Junior Academy", destinationUrl: "/junior-academy", kind: "internal", active: true, notes: null },
  { slug: "senior-squad", label: "Senior Squad", destinationUrl: "/senior-squad", kind: "internal", active: true, notes: null },
  { slug: "team-sport-speed", label: "Team Sport Speed", destinationUrl: "/team-sport-speed", kind: "internal", active: true, notes: null },
  { slug: "high-performance", label: "High Performance", destinationUrl: "/high-performance", kind: "internal", active: true, notes: null },

  // SportsBiz publishes ONE term schedule page listing every class and venue, so all
  // four school classes share a destination. They stay separate slugs on purpose: the
  // slug is what gets logged, so we still learn which class card a parent clicked even
  // though they all land in the same place. Collapsing them would save nothing and lose
  // exactly the attribution this layer exists for.
  //
  // The URL carries required query params (c, p_id, t, set). Do not append UTM tags to
  // it. Source attribution already comes from our own click log via ?src=.
  { slug: "pg-foundation-mon", label: "Peninsula Grammar, Foundation, Mon 3:30", destinationUrl: SPORTSBIZ_TERM_SCHEDULE, kind: "sportsbiz", active: true, notes: null },
  { slug: "pg-emerging-mon", label: "Peninsula Grammar, Emerging Athletes, Mon 3:30", destinationUrl: SPORTSBIZ_TERM_SCHEDULE, kind: "sportsbiz", active: true, notes: null },
  { slug: "toorak-foundation-thu", label: "Toorak College, Foundation, Thu 3:30", destinationUrl: SPORTSBIZ_TERM_SCHEDULE, kind: "sportsbiz", active: true, notes: null },
  { slug: "toorak-foundation-tue", label: "Toorak College, Foundation, Tue, waitlist", destinationUrl: SPORTSBIZ_TERM_SCHEDULE, kind: "sportsbiz", active: true, notes: "Waitlist class. The schedule page is shared, so the waitlist framing lives on the rung page, not here." },
  { slug: "team-speed-430", label: "Mornington, Team Sport Speed, Fri 4:30", destinationUrl: SETMORE_BOOKING, kind: "setmore", active: true, notes: "General Setmore booking link. If separate booking links exist for the 4:30 and 5:30 sessions, paste the specific one here per slug." },
  { slug: "team-speed-530", label: "Mornington, Team Sport Speed, Fri 5:30", destinationUrl: SETMORE_BOOKING, kind: "setmore", active: true, notes: "General Setmore booking link. If separate booking links exist for the 4:30 and 5:30 sessions, paste the specific one here per slug." },
];

async function main() {
  const results = { succeeded: [] as string[], failed: [] as { slug: string; error: string }[] };

  for (const link of LINKS) {
    try {
      await storage.upsertEnrolmentLink(link);
      results.succeeded.push(link.slug);
      console.log(`✓ ${link.active ? "active  " : "inactive"}  /enrol/${link.slug}  ->  ${link.destinationUrl}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      results.failed.push({ slug: link.slug, error: errorMsg });
      console.error(`✗ Failed to seed /enrol/${link.slug}: ${errorMsg}`);
    }
  }

  console.log(`\n${results.succeeded.length}/${LINKS.length} enrolment links seeded successfully.`);

  if (results.failed.length > 0) {
    console.error(`\nFailed slugs (${results.failed.length}):`);
    results.failed.forEach(({ slug, error }) => {
      console.error(`  ${slug}: ${error}`);
    });
    console.log(`\nNote: upsertEnrolmentLink updates on conflict, so this script is safe to re-run after fixing the cause.`);
    console.log(`The ${results.succeeded.length} rows already seeded will be skipped.`);
    process.exit(1);
  }

  console.log(`All links seeded. Script is safe to re-run if needed.`);
  process.exit(0);
}

main().catch((err) => {
  const errorMsg = err instanceof Error ? err.message : String(err);
  console.error(`\nUnexpected error: ${errorMsg}`);
  console.error(`Some rows may have been partially seeded. Script is safe to re-run.`);
  process.exit(1);
});
