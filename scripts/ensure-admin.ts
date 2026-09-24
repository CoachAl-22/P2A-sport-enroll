// Guarantee that alistair@power2adapt.com and info@power2adapt.com are active
// admin accounts, and optionally set their password.
//
//   npx tsx scripts/ensure-admin.ts                 # dry run, changes nothing
//   npx tsx scripts/ensure-admin.ts --apply         # create/repair the accounts
//
// A missing account cannot be created without a password. Put it in a Replit
// Secret first, so it never lands in the code or in git history:
//   ADMIN_INITIAL_PASSWORD=<a strong password>
//   npx tsx scripts/ensure-admin.ts --apply --set-password
//
// --set-password applies to accounts being CREATED only. An existing account's
// password is never touched, because that would lock you out of an account whose
// password already works. To deliberately reset an existing one:
//   npx tsx scripts/ensure-admin.ts --apply --set-password --reset-existing-password
//
// Deliberately a script and NOT an HTTP endpoint: an endpoint that can mint an
// admin password is a remote takeover risk, no matter how it is guarded.
import bcrypt from "bcrypt";
import { db } from "../server/db";
import { storage } from "../server/storage";
import { users } from "@shared/schema";
import { sql } from "drizzle-orm";

const APPLY = process.argv.includes("--apply");
const SET_PASSWORD = process.argv.includes("--set-password");
const RESET_EXISTING = process.argv.includes("--reset-existing-password");

const TARGETS = [
  { email: "alistair@power2adapt.com", firstName: "Alistair", lastName: "Tait", userId: "alistair" },
  { email: "info@power2adapt.com", firstName: "Power2ADAPT", lastName: "Admin", userId: "info" },
];

async function main() {
  const password = process.env.ADMIN_INITIAL_PASSWORD;

  if (SET_PASSWORD && !password) {
    console.error("--set-password given but ADMIN_INITIAL_PASSWORD is not set. Add it as a Replit Secret and re-run.");
    process.exit(1);
  }
  if (SET_PASSWORD && password && password.length < 12) {
    console.error(`ADMIN_INITIAL_PASSWORD is only ${password.length} characters. Use at least 12.`);
    process.exit(1);
  }

  const hash = SET_PASSWORD && password ? await bcrypt.hash(password, 10) : null;

  for (const t of TARGETS) {
    const [existing] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = lower(${t.email})`);

    if (!existing) {
      if (!hash) {
        console.log(`${t.email}: MISSING. Re-run with --apply --set-password to create it (a new account needs a password).`);
        continue;
      }
      if (!APPLY) {
        console.log(`${t.email}: would CREATE as active admin`);
        continue;
      }
      const created = await storage.createUser({
        email: t.email,
        userId: t.userId,
        password: hash,
        firstName: t.firstName,
        lastName: t.lastName,
        role: "admin",
        active: true,
      } as any);
      console.log(`${t.email}: CREATED as active admin (id ${created.id})`);
      continue;
    }

    // Account exists. Work out the minimum set of repairs.
    const updates: Record<string, unknown> = {};
    const why: string[] = [];

    if (existing.email !== existing.email?.trim().toLowerCase()) {
      updates.email = existing.email?.trim().toLowerCase();
      why.push(`normalise stored email to ${JSON.stringify(updates.email)}`);
    }
    if (existing.role !== "admin") {
      updates.role = "admin";
      why.push(`role ${existing.role} -> admin`);
    }
    if (!existing.active) {
      updates.active = true;
      why.push("active false -> true");
    }
    // An existing password is left alone unless the reset is asked for
    // explicitly. Overwriting a working password while only trying to fix a
    // role would be a self-inflicted lockout.
    if (hash && RESET_EXISTING) {
      updates.password = hash;
      why.push("RESET password from ADMIN_INITIAL_PASSWORD");
    } else if (hash) {
      console.log(`${t.email}: account exists, leaving its password untouched (pass --reset-existing-password to change it)`);
    }

    if (why.length === 0) {
      console.log(`${t.email}: already an active admin, nothing to change`);
      continue;
    }
    if (!APPLY) {
      console.log(`${t.email}: would update -> ${why.join("; ")}`);
      continue;
    }
    await storage.updateUser(existing.id, updates as any);
    console.log(`${t.email}: UPDATED -> ${why.join("; ")}`);
  }

  console.log(`\n${APPLY ? "DONE." : "DRY RUN — nothing was written. Re-run with --apply."}`);
  if (APPLY && SET_PASSWORD) {
    console.log("Now sign in, change the password in the app, then DELETE the ADMIN_INITIAL_PASSWORD secret from Replit.");
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("ensure-admin failed:", err);
  process.exit(1);
});
