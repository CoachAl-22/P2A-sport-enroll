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

// Team Sport Speed books through Setmore, not SportsBiz. Each session has its own
// Setmore class link, confirmed by Alistair 2026-08-01. Do not append UTM tags: these
// are per-class booking URLs and source attribution already comes from our click log.
// Waitlist classes have no SportsBiz waitlist path, and the site's own class browser
// already answers "I want a spot that does not exist yet" with a discovery call. Confirmed
// by Alistair 2026-08-01. A parent tapping "Join waitlist" gets a conversation, not a
// schedule page offering them a different class.
const SETMORE_DISCOVERY_CALL =
  "https://power2adapt.setmore.com/services/a9a6a66a-9c61-4bec-829a-84d78687c2c0";

const SETMORE_TEAM_SPEED_WED_530 =
  "https://power2adapt.setmore.com/classes/f1ce9df4-2ef7-43c6-a4db-217f44abb3aa";
const SETMORE_TEAM_SPEED_FRI_430 =
  "https://power2adapt.setmore.com/classes/5fc1dff4-4ba9-4202-8377-befe2415e4d2";
const SETMORE_TEAM_SPEED_FRI_530 =
  "https://power2adapt.setmore.com/classes/309e4fdb-39fe-4cbe-8531-b48cdb9d5a62";

const LINKS: InsertEnrolmentLink[] = [
  { slug: "book-a-call", label: "Book a 10 minute discovery call", destinationUrl: SETMORE_DISCOVERY_CALL, kind: "setmore", active: true, notes: null },
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
  { slug: "toorak-foundation-thu", label: "Toorak College, Foundation, Thu 3:30", destinationUrl: SPORTSBIZ_TERM_SCHEDULE, kind: "sportsbiz", active: true, notes: null },
  { slug: "toorak-foundation-tue", label: "Toorak College, Foundation, Tue 3:30, waitlist", destinationUrl: SETMORE_DISCOVERY_CALL, kind: "setmore", active: true, notes: "Waitlist. Goes to a discovery call, not SportsBiz: there is no SportsBiz waitlist path and the class is not running yet." },
  { slug: "ballam-foundation-thu", label: "Ballam Park, Foundation, Thu 4:30", destinationUrl: SPORTSBIZ_TERM_SCHEDULE, kind: "sportsbiz", active: true, notes: null },
  { slug: "ballam-foundation-tue", label: "Ballam Park, Foundation, Tue 4:30, waitlist", destinationUrl: SETMORE_DISCOVERY_CALL, kind: "setmore", active: true, notes: "Waitlist. Goes to a discovery call, not SportsBiz: there is no SportsBiz waitlist path and the class is not running yet." },
  { slug: "mornington-foundation-wed", label: "Mornington Athletics Track, Foundation, Wed 4:30", destinationUrl: SPORTSBIZ_TERM_SCHEDULE, kind: "sportsbiz", active: true, notes: null },

  { slug: "pg-emerging-mon", label: "Peninsula Grammar, Emerging Athletes, Mon 3:30", destinationUrl: SPORTSBIZ_TERM_SCHEDULE, kind: "sportsbiz", active: true, notes: null },
  { slug: "toorak-emerging-thu", label: "Toorak College, Emerging Athletes, Thu 3:30", destinationUrl: SPORTSBIZ_TERM_SCHEDULE, kind: "sportsbiz", active: true, notes: null },
  { slug: "ballam-emerging-thu", label: "Ballam Park, Emerging Athletes, Thu 4:30", destinationUrl: SPORTSBIZ_TERM_SCHEDULE, kind: "sportsbiz", active: true, notes: null },
  { slug: "ballam-emerging-tue", label: "Ballam Park, Emerging Athletes, Tue 4:30, waitlist", destinationUrl: SETMORE_DISCOVERY_CALL, kind: "setmore", active: true, notes: "Waitlist. Goes to a discovery call, not SportsBiz: there is no SportsBiz waitlist path and the class is not running yet." },
  { slug: "mornington-emerging-wed", label: "Mornington Athletics Track, Emerging Athletes, Wed 4:30", destinationUrl: SPORTSBIZ_TERM_SCHEDULE, kind: "sportsbiz", active: true, notes: null },
  // Three Team Sport Speed sessions, each with its own Setmore class link. Slugs carry
  // the day as well as the time: two sessions share 5:30 and a time-only slug would be
  // ambiguous the moment it appeared in a newsletter.
  { slug: "team-speed-wed-530", label: "Mornington, Team Sport Speed, Wed 5:30", destinationUrl: SETMORE_TEAM_SPEED_WED_530, kind: "setmore", active: true, notes: null },
  { slug: "team-speed-fri-430", label: "Mornington, Team Sport Speed, Fri 4:30", destinationUrl: SETMORE_TEAM_SPEED_FRI_430, kind: "setmore", active: true, notes: null },
  { slug: "team-speed-fri-530", label: "Mornington, Team Sport Speed, Fri 5:30", destinationUrl: SETMORE_TEAM_SPEED_FRI_530, kind: "setmore", active: true, notes: null },
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
