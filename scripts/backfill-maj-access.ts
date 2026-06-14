// Backfill MAJ accounts for children with an active enrolment and no MAJ athlete.
//   npx tsx scripts/backfill-maj-access.ts           # dry run
//   npx tsx scripts/backfill-maj-access.ts --apply    # write
import { storage } from "../server/storage";
import { provisionMajAccess } from "../server/maj-provisioning";

const APPLY = process.argv.includes("--apply");

async function main() {
  const pending = await storage.getChildrenNeedingMaj();
  console.log(`${pending.length} children need MAJ access`);
  let created = 0;
  for (const { childId, classId } of pending) {
    if (APPLY) {
      const athlete = await provisionMajAccess(childId, classId);
      if (athlete) { created++; console.log(`provisioned ${athlete.username}`); }
    } else {
      console.log(`would provision child ${childId} (class ${classId})`);
      created++;
    }
  }
  console.log(`\n${APPLY ? "DONE" : "DRY RUN"}: ${created} ${APPLY ? "created" : "to create"}.`);
  process.exit(0);
}

main().catch((e) => { console.error("Backfill failed:", e); process.exit(1); });
