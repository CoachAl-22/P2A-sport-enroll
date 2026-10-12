import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import {
  users, majAthletes, majCoaches, majSkillAssessments, majParentLinks,
  majParentInvites, majPushSubscriptions,
} from "@shared/schema";

const ai = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@anthropic-ai/sdk", () => ({
  default: class { messages = { create: ai.create }; },
}));

// These tests only touch their own randomly named synthetic fixtures.
describe.skipIf(!process.env.DATABASE_URL)("Quick Note API against the development schema", () => {
  let db: typeof import("./db").db;
  let app: express.Express;
  let storage: typeof import("./storage").storage;
  const coachId = randomUUID(), parentId = randomUUID(), otherParentId = randomUUID();
  const athleteId = randomUUID(), otherAthleteId = randomUUID();
  const coachUsername = `quick-note-test-${randomUUID()}`;
  const createdAthletes: string[] = [athleteId, otherAthleteId];
  const createdParents: string[] = [parentId, otherParentId];
  const sendNotification = vi.fn(async () => {});
  const asCoach = { "x-test-coach": "1" };
  const asParent = { "x-test-parent": parentId };
  const payload = (shared = false) => ({
    clientNoteId: randomUUID(), athlete_id: athleteId, athlete_name: "Test James Prendergast",
    skill: "Running Arms", working_well: "Relaxed arms", to_improve: "Head position",
    suggested_cue: "Eyes forward", parent_message: "James worked well; we'll practise eyes forward.",
    send_to_parent: shared,
  });

  beforeAll(async () => {
    ({ db } = await import("./db"));
    ({ storage } = await import("./storage"));
    const { ensureMajQuickNoteSchema } = await import("./maj-quick-note-schema");
    await ensureMajQuickNoteSchema();
    await db.insert(majCoaches).values({ id: coachId, username: coachUsername, password: "test-fixture-not-a-login", fullName: "Synthetic Test Coach" });
    await db.insert(users).values([parentId, otherParentId].map(id => ({
      id, email: `${id}@example.invalid`, firstName: "Synthetic", lastName: "Parent",
      password: "test-fixture-not-a-login", role: "parent" as const,
    })));
    await db.insert(majAthletes).values([
      { id: athleteId, username: `test-${athleteId}`, password: "test-fixture-not-a-login",
        fullName: "Test James Prendergast", program: "Test Group", coach: coachUsername, xp: 42 },
      { id: otherAthleteId, username: `test-${otherAthleteId}`, password: "test-fixture-not-a-login",
        fullName: "Test Ava Archer", program: "Test Group", coach: coachUsername },
    ]);
    await db.insert(majParentLinks).values({ parentId, athleteId });
    await db.insert(majPushSubscriptions).values([
      { parentId, athleteId: null, endpoint: `https://web.push.apple.com/${parentId}`, auth: "test", p256dh: "test" },
      { parentId: null, athleteId, endpoint: `https://web.push.apple.com/${athleteId}`, auth: "test", p256dh: "test" },
    ]);
    const { registerMajQuickNoteRoutes } = await import("./maj-quick-notes");
    app = express();
    app.use(express.json());
    app.use((req: any, _res, next) => {
      req.session = req.headers["x-test-coach"]
        ? { majRole: "coach", majCoachUser: coachUsername }
        : { userId: req.headers["x-test-parent"] };
      req.session.regenerate = (callback: (error: Error | null) => void) => { req.session = {}; callback(null); };
      next();
    });
    registerMajQuickNoteRoutes(app, {
      isMajCoach: (req: any, res, next) => req.session.majRole === "coach" ? next() : void res.status(401).json({ message: "Coach sign-in required" }),
      getWebPush: async () => ({ sendNotification }),
      pushConfigured: () => true,
    });
  }, 60000);

  beforeEach(() => { sendNotification.mockClear(); ai.create.mockReset(); });
  afterAll(async () => {
    if (!db) return;
    await db.delete(majParentInvites).where(inArray(majParentInvites.athleteId, createdAthletes));
    await db.delete(majSkillAssessments).where(inArray(majSkillAssessments.athleteId, createdAthletes));
    await db.delete(majPushSubscriptions).where(inArray(majPushSubscriptions.athleteId, createdAthletes));
    await db.delete(majPushSubscriptions).where(inArray(majPushSubscriptions.parentId, createdParents));
    await db.delete(majParentLinks).where(inArray(majParentLinks.athleteId, createdAthletes));
    await db.delete(majAthletes).where(inArray(majAthletes.id, createdAthletes));
    await db.delete(majCoaches).where(eq(majCoaches.id, coachId));
    await db.delete(users).where(inArray(users.id, createdParents));
    vi.unstubAllEnvs();
  }, 60000);

  it("requires coach sign-in and does not let a parent confirm or see private history", async () => {
    expect((await request(app).post("/api/maj/observe").send({ note: "Test" })).status).toBe(401);
    expect((await request(app).post("/api/maj/observe/confirm").set(asParent).send(payload())).status).toBe(401);
    expect((await request(app).get(`/api/maj/athlete/${athleteId}/quick-notes`).set(asParent)).status).toBe(401);
  });
  it("fails explicitly when Claude is not configured", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const response = await request(app).post("/api/maj/observe").set(asCoach).send({ note: "Look at Test James" });
    expect(response.status).toBe(503);
    expect(response.body.code).toBe("AI_NOT_CONFIGURED");
    expect(ai.create).not.toHaveBeenCalled();
  });
  it("prepares multiple drafts, fuzzy-matches spoken names and trusts only active server roster IDs", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "synthetic-test-key-never-sent");
    const p = payload();
    ai.create.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify([
      { ...p, athlete_name: "Test James Pendergrass", athlete_id: otherAthleteId },
      { ...p, athlete_name: "Test Ava Archer", athlete_id: null },
      { ...p, athlete_name: "Unknown Nobody", athlete_id: athleteId },
    ]) }] });
    const response = await request(app).post("/api/maj/observe").set(asCoach).send({
      note: "Looked at Test James Pendergrass and Test Ava Archer", roster: [{ id: "forged" }],
    });
    expect(response.status).toBe(200);
    expect(response.body.observations.map((o: any) => o.athlete_id)).toEqual([athleteId, otherAthleteId, null]);
    expect(response.body.observations[2].matched).toBe(false);
    expect(ai.create.mock.calls[0][0].model).toBe("claude-sonnet-5-5");
    expect(JSON.stringify(ai.create.mock.calls[0][0])).not.toContain("forged");
  });
  it("never saves malformed model output", async () => {
    ai.create.mockResolvedValue({ content: [{ type: "text", text: "not json" }] });
    const response = await request(app).post("/api/maj/observe").set(asCoach).send({ note: "Invalid output test" });
    expect(response.status).toBe(502);
    expect(response.body.code).toBe("AI_INVALID_RESPONSE");
  });
  it("saves a coach-only note without parent visibility or push and blocks legacy history leakage", async () => {
    const p = payload(false);
    const saved = await request(app).post("/api/maj/observe/confirm").set(asCoach).send(p);
    expect(saved.status).toBe(201);
    expect(sendNotification).not.toHaveBeenCalled();
    const family = await request(app).get(`/api/maj/parent/athlete/${athleteId}/journey`).set(asParent);
    expect(family.status).toBe(200);
    expect(family.body.notes.some((n: any) => n.id === saved.body.saved.id)).toBe(false);
    const legacy = await storage.getSkillAssessmentsForAthlete(athleteId);
    expect(legacy.some(n => n.id === saved.body.saved.id)).toBe(false);
    const coach = await request(app).get(`/api/maj/athlete/${athleteId}/quick-notes`).set(asCoach);
    expect(coach.body.find((n: any) => n.id === saved.body.saved.id).strengths).toBe(p.working_well);
  });
  it("shares only the parent message, pushes only parent devices and handles safe retries once", async () => {
    const p = payload(true);
    const saved = await request(app).post("/api/maj/observe/confirm").set(asCoach).send(p);
    expect(saved.status).toBe(201);
    expect(saved.body.push.sent).toBe(1);
    expect(sendNotification.mock.calls[0][0]).toMatchObject({ endpoint: `https://web.push.apple.com/${parentId}` });
    const duplicate = await request(app).post("/api/maj/observe/confirm").set(asCoach).send(p);
    expect(duplicate.status).toBe(200);
    expect(duplicate.body.duplicate).toBe(true);
    expect(sendNotification).toHaveBeenCalledTimes(1);
    const journey = await request(app).get(`/api/maj/parent/athlete/${athleteId}/journey`).set(asParent);
    const note = journey.body.notes.find((n: any) => n.id === saved.body.saved.id);
    expect(note.parent_message).toBe(p.parent_message);
    expect(note).not.toHaveProperty("strengths");
    expect(note).not.toHaveProperty("to_improve");
    expect(journey.body.athlete).not.toHaveProperty("password");
    const conflicting = await request(app).post("/api/maj/observe/confirm").set(asCoach).send({ ...p, send_to_parent: false });
    expect(conflicting.status).toBe(409);
  });
  it("denies another parent's journey and shared notes", async () => {
    expect((await request(app).get(`/api/maj/parent/athlete/${athleteId}/journey`)
      .set({ "x-test-parent": otherParentId })).status).toBe(404);
  });
  it("preserves history, XP and account access when deactivating; excludes inactive matching", async () => {
    const before = (await db.select().from(majAthletes).where(eq(majAthletes.id, athleteId)))[0];
    const inactive = await request(app).patch(`/api/maj/coach/athletes/${athleteId}/active`).set(asCoach).send({ active: false });
    expect(inactive.body.rosterActive).toBe(false);
    const after = (await db.select().from(majAthletes).where(eq(majAthletes.id, athleteId)))[0];
    expect(after.enabled).toBe(before.enabled);
    expect(after.xp).toBe(before.xp);
    expect((await request(app).post("/api/maj/observe/confirm").set(asCoach).send(payload())).status).toBe(409);
    ai.create.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify([{ ...payload(), athlete_name: "Test James Prendergast" }]) }] });
    const parsed = await request(app).post("/api/maj/observe").set(asCoach).send({ note: "Test James" });
    expect(parsed.body.roster.some((a: any) => a.id === athleteId)).toBe(false);
    expect(parsed.body.observations[0].athlete_id).toBeNull();
    expect((await request(app).get(`/api/maj/athlete/${athleteId}/quick-notes`).set(asCoach)).body.length).toBeGreaterThan(0);
    await request(app).patch(`/api/maj/coach/athletes/${athleteId}/active`).set(asCoach).send({ active: true });
  });
  it("creates an athlete with just name and group, never exposing generated login credentials", async () => {
    const response = await request(app).post("/api/maj/coach/athletes").set(asCoach).send({ name: "Synthetic New Athlete", group: "Test Juniors" });
    expect(response.status).toBe(201);
    createdAthletes.push(response.body.id);
    expect(response.body).toMatchObject({ fullName: "Synthetic New Athlete", program: "Test Juniors", rosterActive: true });
    expect(response.body).not.toHaveProperty("password");
    expect(response.body).not.toHaveProperty("username");
  });
  it("does not accept a push URL targeting local infrastructure", async () => {
    const response = await request(app).post("/api/maj/parent/push/subscribe").set(asParent)
      .send({ subscription: { endpoint: "https://127.0.0.1/internal", keys: { auth: "test", p256dh: "test" } } });
    expect(response.status).toBe(400);
  });
  it("saves shared messages even if push fails, without claiming delivery", async () => {
    sendNotification.mockRejectedValueOnce({ statusCode: 500 });
    const response = await request(app).post("/api/maj/observe/confirm").set(asCoach).send(payload(true));
    expect(response.status).toBe(201);
    expect(response.body.push).toMatchObject({ sent: 0, failed: 1, configured: true });
  });
  it("lets the coach invite an existing parent later and requires the invited identity", async () => {
    const response = await request(app).post(`/api/maj/coach/athletes/${otherAthleteId}/parent-invite`)
      .set(asCoach).send({ email: `${parentId}@example.invalid` });
    expect(response.status).toBe(201);
    const token = new URL(response.body.invitePath, "https://example.invalid").searchParams.get("invite");
    const lookup = await request(app).get(`/api/maj/parent/invite?token=${token}`);
    expect(lookup.body.existingAccount).toBe(true);
    const wrong = await request(app).post("/api/maj/parent/accept-invite")
      .set({ "x-test-parent": otherParentId }).send({ token });
    expect(wrong.status).toBe(401);
    const accepted = await request(app).post("/api/maj/parent/accept-invite").set(asParent).send({ token });
    expect(accepted.status).toBe(200);
    expect((await request(app).get("/api/maj/parent/me").set(asParent)).body.athletes.map((a: any) => a.id)).toContain(otherAthleteId);
    expect((await request(app).get(`/api/maj/parent/invite?token=${token}`)).status).toBe(410);
  });
  it("creates a new parent only with a valid invitation, then consumes the invitation", async () => {
    const email = `${randomUUID()}@example.invalid`;
    const invite = await request(app).post(`/api/maj/coach/athletes/${otherAthleteId}/parent-invite`).set(asCoach).send({ email });
    const token = new URL(invite.body.invitePath, "https://example.invalid").searchParams.get("invite");
    const accepted = await request(app).post("/api/maj/parent/accept-invite")
      .send({ token, firstName: "Synthetic", lastName: "Invited Parent", password: "synthetic-test-password-10" });
    expect(accepted.status).toBe(200);
    const [created] = await db.select().from(users).where(eq(users.email, email));
    createdParents.push(created.id);
    expect(created.role).toBe("parent");
    expect(created.password).not.toBe("synthetic-test-password-10");
    expect((await request(app).post("/api/maj/parent/accept-invite").send({ token })).status).toBe(410);
  });
});
