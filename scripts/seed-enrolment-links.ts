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
  for (const link of LINKS) {
    await storage.upsertEnrolmentLink(link);
    console.log(`${link.active ? "active  " : "inactive"}  /enrol/${link.slug}  ->  ${link.destinationUrl}`);
  }
  console.log(`\nSeeded ${LINKS.length} enrolment links.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
