import { storage } from "../server/storage";
import type { InsertEnrolmentLink } from "@shared/schema";

// Rung slugs resolve internally: a parent who does not yet know which class they
// want reads the program page first. Class slugs go straight out to SportsBiz,
// because whoever followed that link already knows what they are enrolling in.
const LINKS: InsertEnrolmentLink[] = [
  { slug: "foundation", label: "Foundation", destinationUrl: "/foundation", kind: "internal", active: true, notes: null },
  { slug: "emerging-athletes", label: "Emerging Athletes", destinationUrl: "/emerging-athletes", kind: "internal", active: true, notes: null },
  { slug: "junior-academy", label: "Junior Academy", destinationUrl: "/junior-academy", kind: "internal", active: true, notes: null },
  { slug: "senior-squad", label: "Senior Squad", destinationUrl: "/senior-squad", kind: "internal", active: true, notes: null },
  { slug: "team-sport-speed", label: "Team Sport Speed", destinationUrl: "/team-sport-speed", kind: "internal", active: true, notes: null },
  { slug: "high-performance", label: "High Performance", destinationUrl: "/high-performance", kind: "internal", active: true, notes: null },

  // Class slugs: seeded INACTIVE with placeholder destinations on purpose.
  // Paste the real SportsBiz URL in /admin/enrolment-links, then activate.
  { slug: "pg-foundation-mon", label: "Peninsula Grammar, Foundation, Mon 3:30", destinationUrl: "https://www.power2adapt.online/classes", kind: "sportsbiz", active: false, notes: "Needs real SportsBiz URL" },
  { slug: "pg-emerging-mon", label: "Peninsula Grammar, Emerging Athletes, Mon 3:30", destinationUrl: "https://www.power2adapt.online/classes", kind: "sportsbiz", active: false, notes: "Needs real SportsBiz URL" },
  { slug: "toorak-foundation-thu", label: "Toorak College, Foundation, Thu 3:30", destinationUrl: "https://www.power2adapt.online/classes", kind: "sportsbiz", active: false, notes: "Needs real SportsBiz URL" },
  { slug: "toorak-foundation-tue", label: "Toorak College, Foundation, Tue, waitlist", destinationUrl: "https://www.power2adapt.online/classes", kind: "sportsbiz", active: false, notes: "Waitlist. Needs real SportsBiz URL" },
  { slug: "team-speed-430", label: "Mornington, Team Sport Speed, Fri 4:30", destinationUrl: "https://www.power2adapt.online/classes", kind: "sportsbiz", active: false, notes: "Needs real SportsBiz URL" },
  { slug: "team-speed-530", label: "Mornington, Team Sport Speed, Fri 5:30", destinationUrl: "https://www.power2adapt.online/classes", kind: "sportsbiz", active: false, notes: "Needs real SportsBiz URL" },
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
