import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";

// Temporary recovery for the existing Alistair account. Only a published
// deployment consumes the secret (npm start in the workspace must not touch
// development data). The conditional role change makes the reset one-time.
export async function recoverAdminFromSecret(): Promise<void> {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.REPLIT_DEPLOYMENT !== "1") {
    throw new Error("Admin recovery must run in a published deployment.");
  }
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!password) {
    const [realAdmin, fictionalAdmin] = await Promise.all([
      db
        .select({ role: users.role, active: users.active })
        .from(users)
        .where(sql`lower(${users.email}) = lower(${"alistair@power2adapt.com"})`),
      db
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.email}) = lower(${"admin@power2adapt.com"})`),
    ]);
    if (realAdmin.length === 1 && realAdmin[0].role === "admin" && realAdmin[0].active && fictionalAdmin.length === 0) {
      console.log("Admin recovery already complete; secret no longer required.");
      return;
    }
    throw new Error("Admin recovery is incomplete and ADMIN_INITIAL_PASSWORD is unavailable.");
  }
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
  if (account.role !== "parent" && account.role !== "admin") {
    throw new Error("Admin recovery account has an unexpected state.");
  }
  if (!account.active) {
    throw new Error("Admin recovery account is inactive.");
  }
  if (account.role === "admin") {
    console.log("Admin recovery already completed; password left unchanged.");
  } else {
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

  await retireFictionalAdmin();
}

export async function retireFictionalAdmin(): Promise<void> {
  // Keep historical children and enrolments, but retire the fictional login.
  // In production this runs only after the real account has admin access.
  const fictional = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(sql`lower(${users.email}) = lower(${"admin@power2adapt.com"})`);
  if (fictional.length === 0) return;
  if (fictional.length !== 1 || fictional[0].role !== "admin") {
    throw new Error("Fictional admin account has an unexpected state; no retirement performed.");
  }
  const unusableHash = await bcrypt.hash(randomBytes(48).toString("base64url"), 12);
  const retired = await db
    .update(users)
    .set({
      email: null,
      mobile: null,
      userId: null,
      password: unusableHash,
      role: "parent",
      active: false,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, fictional[0].id), eq(users.role, "admin")))
    .returning({ id: users.id });
  if (retired.length !== 1) {
    const [current] = await db
      .select({ email: users.email, active: users.active })
      .from(users)
      .where(eq(users.id, fictional[0].id));
    if (current?.email !== null || current?.active !== false) {
      throw new Error("Fictional admin account could not be retired.");
    }
    console.log("Fictional admin login already retired by another instance.");
    return;
  }
  console.log("Fictional admin login retired; linked records preserved.");
}