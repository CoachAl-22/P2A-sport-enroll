import bcrypt from "bcrypt";
import { randomUUID, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../server/db";
import { majCoaches, majAthletes, users, majParentLinks, majSkillAssessments } from "../shared/schema";

// Manual development-only smoke test with real sessions, using and cleaning up
// its own synthetic fixtures. No API key, actual roster data or cookie is printed.
async function verify() {
  if (!process.env.REPLIT_DEV_DOMAIN) throw new Error("Development preview domain required");
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  const coachId = randomUUID(), athleteId = randomUUID(), parentId = randomUUID();
  const username = `verify-${coachId}`, password = randomBytes(24).toString("hex");
  const hashed = await bcrypt.hash(password, 10);
  let coachCookie = "", parentCookie = "", athleteCookie = "";
  const call = (path: string, method = "GET", body?: unknown, cookie = "") => fetch(base + path, {
    method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const check = (ok: boolean, message: string) => { if (!ok) throw new Error(message); };
  const login = async (path: string, body: unknown) => {
    const response = await call(path, "POST", body);
    check(response.status === 200, `Synthetic sign-in failed (${response.status})`);
    // Consume the complete response before issuing another authenticated request:
    // fetch resolves at headers, before express-session's async store finishes.
    await response.json();
    const cookie = response.headers.get("set-cookie")?.split(";")[0] || "";
    check(!!cookie, "Synthetic sign-in cookie missing");
    return cookie;
  };
  try {
    await db.insert(majCoaches).values({ id: coachId, username, password: hashed, fullName: "Synthetic Live Coach" });
    await db.insert(majAthletes).values({ id: athleteId, username: `verify-${athleteId}`, password: hashed,
      fullName: "Synthetic Live Athlete", program: "Synthetic Group" });
    await db.insert(users).values({ id: parentId, email: `${parentId}@example.invalid`, password: hashed,
      firstName: "Synthetic", lastName: "Live Parent", role: "parent" });
    await db.insert(majParentLinks).values({ athleteId, parentId });
    coachCookie = await login("/api/maj/login", { username, password });
    check((await call(`/api/maj/athlete/${athleteId}/quick-notes`, "GET", undefined, coachCookie)).status === 200,
      "Live coach authorization failed");
    const p = { clientNoteId: randomUUID(), athlete_id: athleteId, athlete_name: "Synthetic Live Athlete",
      skill: "Synthetic Arms", working_well: "Synthetic private detail", to_improve: "Synthetic private focus",
      suggested_cue: "Synthetic cue", parent_message: "Synthetic shared message", send_to_parent: false };
    let saved = await call("/api/maj/observe/confirm", "POST", p, coachCookie);
    check(saved.status === 201, "Live private confirmation failed"); await saved.json();
    saved = await call("/api/maj/observe/confirm", "POST", { ...p, clientNoteId: randomUUID(), send_to_parent: true }, coachCookie);
    check(saved.status === 201, "Live shared confirmation failed"); await saved.json();
    parentCookie = await login("/api/auth/login", { identifier: `${parentId}@example.invalid`, password });
    const journey = await call(`/api/maj/parent/athlete/${athleteId}/journey`, "GET", undefined, parentCookie);
    check(journey.status === 200, "Live parent journey failed");
    const data = await journey.json() as any;
    check(data.notes.length === 1 && data.notes[0].parent_message === p.parent_message &&
      !JSON.stringify(data).includes("Synthetic private"), "Live privacy filter failed");
    const deactivated = await call(`/api/maj/coach/athletes/${athleteId}/active`, "PATCH", { active: false }, coachCookie);
    check(deactivated.status === 200, "Live soft deactivation failed"); await deactivated.json();
    athleteCookie = await login("/api/maj/login", { username: `verify-${athleteId}`, password });
    const js = await call("/maj-quick-notes.js");
    check(js.status === 200 && (js.headers.get("content-type") || "").includes("javascript"), "Feature script route failed");
    console.log("Live sign-in, private/shared notes, script serving and inactive athlete access verified.");
  } finally {
    for (const cookie of [coachCookie, athleteCookie]) if (cookie) {
      await (await call("/api/maj/logout", "POST", {}, cookie)).json();
    }
    if (parentCookie) await (await call("/api/auth/logout", "POST", {}, parentCookie)).json();
    await db.delete(majSkillAssessments).where(eq(majSkillAssessments.athleteId, athleteId));
    await db.delete(majParentLinks).where(eq(majParentLinks.athleteId, athleteId));
    await db.delete(majAthletes).where(eq(majAthletes.id, athleteId));
    await db.delete(majCoaches).where(eq(majCoaches.id, coachId));
    await db.delete(users).where(eq(users.id, parentId));
  }
}
verify().catch(error => { console.error(error instanceof Error ? error.message : "Live verification failed"); process.exitCode = 1; });
