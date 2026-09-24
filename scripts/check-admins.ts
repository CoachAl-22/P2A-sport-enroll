// Read-only diagnostic for admin login problems.
//   npx tsx scripts/check-admins.ts
//
// Prints nothing that could leak a credential: no password hashes, no tokens.
// Run this BEFORE ensure-admin.ts so you know what is actually wrong.
import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq, or, sql } from "drizzle-orm";

const EXPECTED_ADMINS = ["alistair@power2adapt.com", "info@power2adapt.com"];

function oddities(value: string | null): string[] {
  if (!value) return [];
  const notes: string[] = [];
  if (value !== value.trim()) notes.push("HAS LEADING/TRAILING WHITESPACE");
  if (value !== value.toLowerCase()) notes.push("HAS UPPERCASE");
  return notes;
}

async function main() {
  console.log("=== Accounts for the two expected admin addresses ===\n");

  for (const email of EXPECTED_ADMINS) {
    // Case-insensitive so we find the row even if it was stored capitalised
    const rows = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = lower(${email})`);

    if (rows.length === 0) {
      console.log(`${email}`);
      console.log(`   NO ACCOUNT EXISTS -> login can never succeed for this address\n`);
      continue;
    }

    for (const u of rows) {
      const notes = oddities(u.email);
      console.log(`${email}`);
      console.log(`   stored email : ${JSON.stringify(u.email)}${notes.length ? "  <== " + notes.join(", ") : ""}`);
      console.log(`   user_id      : ${JSON.stringify(u.userId)}`);
      console.log(`   mobile       : ${u.mobile ? "set" : "not set"}`);
      console.log(`   role         : ${u.role}${u.role !== "admin" ? "  <== NOT ADMIN, would log in but not reach /admin" : ""}`);
      console.log(`   active       : ${u.active}`);
      console.log(`   password     : ${u.password ? `set (${u.password.slice(0, 4)}… bcrypt format: ${/^\$2[aby]\$/.test(u.password) ? "yes" : "NO — cannot be compared, login will always fail"})` : "NOT SET"}`);
      console.log(`   created      : ${u.createdAt?.toISOString?.() ?? u.createdAt}\n`);
    }
  }

  console.log("=== Every account with the admin role ===\n");
  const admins = await db.select().from(users).where(eq(users.role, "admin"));
  if (admins.length === 0) {
    console.log("   NONE. There is no admin account at all.\n");
  } else {
    for (const a of admins) {
      console.log(`   ${a.email ?? "(no email)"}  user_id=${a.userId ?? "-"}  active=${a.active}`);
    }
    console.log();
  }

  console.log("=== Duplicate-by-case check ===\n");
  const dupes = await db
    .select({ lower: sql<string>`lower(${users.email})`, n: sql<number>`count(*)` })
    .from(users)
    .groupBy(sql`lower(${users.email})`)
    .having(sql`count(*) > 1`);
  if (dupes.length === 0) {
    console.log("   No two accounts share an email differing only by case.\n");
  } else {
    for (const d of dupes) console.log(`   ${d.lower} appears ${d.n} times  <== DUPLICATE\n`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("check-admins failed:", err);
  process.exit(1);
});
