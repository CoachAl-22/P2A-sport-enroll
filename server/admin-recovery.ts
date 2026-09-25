import bcrypt from "bcrypt";
import { and, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";

// Temporary recovery for the existing Alistair account. Only a published
// deployment consumes the secret (npm start in the workspace must not touch
// development data). The conditional role change makes the reset one-time.
export async function recoverAdminFromSecret(): Promise<void> {
  if (process.env.NODE_ENV !== "production" || process.env.REPLIT_DEPLOYMENT !== "1") return;
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!password) return;
  if (password.length < 12) {
    throw new Error("Admin recovery password must be at least 12 characters.");
  }

  const matches = await db
    .select({ id: users.id, role: users.role, active: users.active })
    .from(users)
    .where(sql`lower(${users.email}) = lower(${"alistair@power2adapt.com"})`);

  if (matches.length !== 1) {
    throw new Error("Admin recovery requires exactly one matching account.");
  }
  const account = matches[0];
  if (account.role === "admin") {
    console.log("Admin recovery already completed; password left unchanged.");
    return;
  }
  if (account.role !== "parent" || !account.active) {
    throw new Error("Admin recovery account has an unexpected state.");
  }

  const hash = await bcrypt.hash(password, 12);
  const updated = await db
    .update(users)
    .set({ password: hash, role: "admin", updatedAt: new Date() })
    .where(and(eq(users.id, account.id), eq(users.role, "parent"), eq(users.active, true)))
    .returning({ id: users.id });

  if (updated.length === 1) {
    console.log("Admin recovery completed for the designated account.");
  } else {
    // A second instance may have completed recovery while we were hashing.
    const [current] = await db.select({ role: users.role }).from(users).where(eq(users.id, account.id));
    if (current?.role !== "admin") {
      throw new Error("Admin recovery could not update the designated account.");
    }
    console.log("Admin recovery already completed by another instance.");
  }
}