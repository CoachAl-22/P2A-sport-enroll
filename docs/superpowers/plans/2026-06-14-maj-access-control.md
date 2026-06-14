# MAJ Access Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-create a MAJ athlete account when an enrolment is paid, gate MAJ login on an `enabled` flag, give admins a toggle + credential view per child, and backfill existing enrolled children.

**Architecture:** Pure helpers in `shared/maj-provisioning.ts` (username/password/school-code logic) are wrapped by a server-side `provisionMajAccess(childId, classId)` that runs at every enrolment→active transition. New columns link children to athletes and carry the enabled flag. Admin endpoints + the existing customers page expose the toggle and credentials. A tsx backfill script provisions current enrolments.

**Tech Stack:** TypeScript, Express, Drizzle (Neon Postgres), React + TanStack Query, shadcn/ui. Tests are `npx tsx` scripts with `node:assert/strict`. Schema changes ship as hand-written SQL in the Replit shell (never `drizzle-kit push`), then dev→prod copy.

---

## File Structure

- Modify: `shared/schema.ts` — add `enabled` + `schoolCode` to `maj_athletes`; add `majAthleteId` to `children`.
- Create: `shared/maj-provisioning.ts` — pure helpers (school code, username, password).
- Create: `scripts/test-maj-provisioning.ts` — tsx tests for the pure helpers.
- Modify: `server/storage.ts` — extend `createMajAthlete`; add `updateMajAthlete`, `getAllMajUsernames`, `getChildrenNeedingMaj`.
- Create: `server/maj-provisioning.ts` — `provisionMajAccess(childId, classId)`.
- Modify: `server/routes.ts` — call provisioning at the 3 enrolment→active sites; add the `enabled` login gate; add admin endpoints (toggle, reset password, provision-for-child, child-maj list).
- Modify: `client/src/pages/admin-customers.tsx` — MAJ controls in the students table.
- Create: `scripts/backfill-maj-access.ts` — one-off backfill (dry-run/apply).

---

## Task 1: Schema columns + SQL migration

**Files:** Modify `shared/schema.ts`; run SQL on Replit.

- [ ] **Step 1: Add columns to `maj_athletes`**

In `shared/schema.ts`, inside `export const majAthletes = pgTable("maj_athletes", {`, add after the `avatar` line:

```typescript
  enabled: boolean("enabled").notNull().default(true),
  schoolCode: varchar("school_code", { length: 20 }),
```

- [ ] **Step 2: Add the link column to `children`**

In `shared/schema.ts`, inside `export const children = pgTable("children", {`, add after the `active` line:

```typescript
  majAthleteId: uuid("maj_athlete_id").references(() => majAthletes.id),
```

If `children` is declared before `majAthletes` in the file and the reference errors, change it to a plain column without the inline reference:

```typescript
  majAthleteId: uuid("maj_athlete_id"),
```

- [ ] **Step 3: Typecheck**

Run: `cd /Users/alistairtait/P2A-sport-enroll && npm run check`
Expected: PASS (pre-existing unrelated errors are fine; no new errors referencing `enabled`, `schoolCode`, or `majAthleteId`).

- [ ] **Step 4: Commit**

```bash
cd /Users/alistairtait/P2A-sport-enroll && git add shared/schema.ts && git commit -m "feat: maj_athletes enabled + school_code, children maj_athlete_id"
```

- [ ] **Step 5: Apply SQL on Replit (not committed)**

In the Replit shell (do NOT use `npm run db:push`):

```
psql "$DATABASE_URL" -c "ALTER TABLE maj_athletes ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true; ALTER TABLE maj_athletes ADD COLUMN IF NOT EXISTS school_code varchar(20); ALTER TABLE children ADD COLUMN IF NOT EXISTS maj_athlete_id uuid REFERENCES maj_athletes(id);"
```

Expected: three `ALTER TABLE` lines.

---

## Task 2: Pure provisioning helpers + tests

**Files:** Create `shared/maj-provisioning.ts`, `scripts/test-maj-provisioning.ts`.

- [ ] **Step 1: Write the failing test**

Create `scripts/test-maj-provisioning.ts`:

```typescript
import assert from "node:assert/strict";
import { schoolCodeForVenue, majUsernameBase, resolveUsername, majPassword } from "../shared/maj-provisioning";

// school code from venue name
assert.equal(schoolCodeForVenue("Peninsula Grammar"), "PG");
assert.equal(schoolCodeForVenue("Toorak College"), "TC");
assert.equal(schoolCodeForVenue("Mornington Athletic Track"), "P2A");
assert.equal(schoolCodeForVenue("Ballam Park Athletic Track"), "P2A");
assert.equal(schoolCodeForVenue(""), "P2A");

// username base: firstname + last initial, lowercased, alphanumeric only
assert.equal(majUsernameBase("Eddy", "Kovac"), "eddyk");
assert.equal(majUsernameBase("Mary-Jane", "O'Brien"), "maryjaneo");
assert.equal(majUsernameBase("  Sam ", "Lee"), "saml");

// collision resolution
const taken = new Set(["eddyk", "eddyk2"]);
assert.equal(resolveUsername("eddyk", (u) => taken.has(u)), "eddyk3");
assert.equal(resolveUsername("zoel", (u) => taken.has(u)), "zoel");

// password = code + year
assert.equal(majPassword("PG", 2026), "PG2026");
assert.equal(majPassword("P2A", 2026), "P2A2026");

console.log("maj-provisioning tests passed");
```

- [ ] **Step 2: Run to confirm failure**

Run: `cd /Users/alistairtait/P2A-sport-enroll && npx tsx scripts/test-maj-provisioning.ts`
Expected: FAIL with `Cannot find module '../shared/maj-provisioning'`.

- [ ] **Step 3: Implement**

Create `shared/maj-provisioning.ts`:

```typescript
// Pure helpers for MAJ account provisioning. No DB, no side effects.

// Map a class venue name to a white-label school code used for the shared password.
export function schoolCodeForVenue(venueName: string | null | undefined): string {
  const v = (venueName ?? "").toLowerCase();
  if (v.includes("peninsula grammar")) return "PG";
  if (v.includes("toorak college")) return "TC";
  return "P2A";
}

// firstname + first letter of last name, lowercased, alphanumeric only.
export function majUsernameBase(firstName: string, lastName: string): string {
  const clean = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const first = clean(firstName);
  const lastInitial = clean(lastName).charAt(0);
  return `${first}${lastInitial}`;
}

// Append the smallest integer suffix that is not taken (base, base2, base3, ...).
export function resolveUsername(base: string, isTaken: (u: string) => boolean): string {
  if (!isTaken(base)) return base;
  let n = 2;
  while (isTaken(`${base}${n}`)) n++;
  return `${base}${n}`;
}

// Shared per-school password: code + year.
export function majPassword(schoolCode: string, year: number): string {
  return `${schoolCode}${year}`;
}
```

- [ ] **Step 4: Run to confirm pass**

Run: `cd /Users/alistairtait/P2A-sport-enroll && npx tsx scripts/test-maj-provisioning.ts`
Expected: `maj-provisioning tests passed`.

- [ ] **Step 5: Typecheck and commit**

Run: `cd /Users/alistairtait/P2A-sport-enroll && npm run check` (no new errors in the two files).

```bash
cd /Users/alistairtait/P2A-sport-enroll && git add shared/maj-provisioning.ts scripts/test-maj-provisioning.ts && git commit -m "feat: pure MAJ provisioning helpers with tests"
```

---

## Task 3: Storage methods

**Files:** Modify `server/storage.ts` (and the `IStorage` interface).

- [ ] **Step 1: Widen `createMajAthlete` to accept the new fields**

In `server/storage.ts`, replace the `createMajAthlete` method (the one doing `db.insert(majAthletes).values(data)`) with:

```typescript
  async createMajAthlete(data: {
    username: string;
    password: string;
    fullName: string;
    grade?: string;
    program?: string;
    coach?: string;
    school?: string;
    schoolCode?: string;
    enabled?: boolean;
  }): Promise<MajAthlete> {
    const [athlete] = await db.insert(majAthletes).values(data).returning();
    return athlete;
  }
```

- [ ] **Step 2: Add `updateMajAthlete`, `getAllMajUsernames`, `getChildrenNeedingMaj`**

In `server/storage.ts`, immediately after `createMajAthlete`, add:

```typescript
  async updateMajAthlete(id: string, updates: Partial<{ enabled: boolean; password: string; school: string; schoolCode: string; fullName: string }>): Promise<MajAthlete> {
    const [updated] = await db
      .update(majAthletes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(majAthletes.id, id))
      .returning();
    return updated;
  }

  async getAllMajUsernames(): Promise<string[]> {
    const rows = await db.select({ username: majAthletes.username }).from(majAthletes);
    return rows.map((r) => r.username);
  }

  // Children with at least one active enrolment and no MAJ athlete linked yet.
  async getChildrenNeedingMaj(): Promise<{ childId: string; classId: string }[]> {
    const rows = await db
      .select({ childId: children.id, classId: enrollments.classId })
      .from(enrollments)
      .innerJoin(children, eq(enrollments.childId, children.id))
      .where(and(eq(enrollments.status, "active"), sql`${children.majAthleteId} is null`));
    // One row per child (first active class wins)
    const seen = new Set<string>();
    const out: { childId: string; classId: string }[] = [];
    for (const r of rows) {
      if (seen.has(r.childId)) continue;
      seen.add(r.childId);
      out.push({ childId: r.childId, classId: r.classId });
    }
    return out;
  }
```

(`children`, `enrollments`, `eq`, `and`, `sql` are already imported in this file.)

- [ ] **Step 3: Declare the new methods on `IStorage`**

In the `IStorage` interface, near the other MAJ method declarations, add:

```typescript
  updateMajAthlete(id: string, updates: Partial<{ enabled: boolean; password: string; school: string; schoolCode: string; fullName: string }>): Promise<MajAthlete>;
  getAllMajUsernames(): Promise<string[]>;
  getChildrenNeedingMaj(): Promise<{ childId: string; classId: string }[]>;
```

- [ ] **Step 4: Typecheck and commit**

Run: `cd /Users/alistairtait/P2A-sport-enroll && npm run check` (no new errors in storage.ts).

```bash
cd /Users/alistairtait/P2A-sport-enroll && git add server/storage.ts && git commit -m "feat: storage methods for MAJ provisioning + backfill"
```

---

## Task 4: provisionMajAccess + wire into enrolment activation

**Files:** Create `server/maj-provisioning.ts`; modify `server/routes.ts`.

- [ ] **Step 1: Create the server provisioning helper**

Create `server/maj-provisioning.ts`:

```typescript
import { storage } from "./storage";
import { schoolCodeForVenue, majUsernameBase, resolveUsername, majPassword } from "@shared/maj-provisioning";
import type { MajAthlete } from "@shared/schema";

// Create a MAJ athlete for a child if they don't already have one. Idempotent.
// Returns the athlete (new or existing-linked), or null if the child is missing.
export async function provisionMajAccess(childId: string, classId: string): Promise<MajAthlete | null> {
  const child = await storage.getChild(childId);
  if (!child) return null;
  if (child.majAthleteId) {
    return await storage.getMajAthleteById(child.majAthleteId) ?? null;
  }

  const cls = await storage.getClass(classId);
  const venue = cls?.venueId ? await storage.getVenue(cls.venueId) : undefined;
  const schoolCode = schoolCodeForVenue(venue?.name);
  const year = cls?.year ?? new Date().getFullYear();
  const password = majPassword(schoolCode, year);

  const taken = new Set(await storage.getAllMajUsernames());
  const username = resolveUsername(majUsernameBase(child.firstName, child.lastName), (u) => taken.has(u));

  const athlete = await storage.createMajAthlete({
    username,
    password,
    fullName: `${child.firstName} ${child.lastName}`,
    school: venue?.name ?? undefined,
    schoolCode,
    enabled: true,
  });
  await storage.updateChild(childId, { majAthleteId: athlete.id });
  return athlete;
}
```

- [ ] **Step 2: Import it in routes**

In `server/routes.ts`, add near the top imports:

```typescript
import { provisionMajAccess } from "./maj-provisioning";
```

- [ ] **Step 3: Call provisioning at each enrolment→active site**

In `server/routes.ts` there are three places that do `await storage.updateEnrollment(enrollmentId, { status: "active" })` (around lines 2021, 2049, 2114). After EACH of them, add a guarded provisioning call. The variable holding the enrolment id differs per site — use whichever id is in scope at that line (it is the same value passed to `updateEnrollment`). Insert:

```typescript
        try {
          const enr = await storage.getEnrollment(enrollmentId);
          if (enr?.childId) await provisionMajAccess(enr.childId, enr.classId);
        } catch (e) {
          console.error("MAJ provisioning failed for enrollment", enrollmentId, e);
        }
```

Match the indentation of each site, and use the exact id variable name used in that block's `updateEnrollment` call (e.g. if the block uses `enrollmentId`, keep `enrollmentId`).

- [ ] **Step 4: Typecheck and commit**

Run: `cd /Users/alistairtait/P2A-sport-enroll && npm run check` (no new errors in maj-provisioning.ts or routes.ts).

```bash
cd /Users/alistairtait/P2A-sport-enroll && git add server/maj-provisioning.ts server/routes.ts && git commit -m "feat: provisionMajAccess on paid enrolment"
```

---

## Task 5: Login gate

**Files:** Modify `server/routes.ts` (the `/api/maj/login` handler around line 351).

- [ ] **Step 1: Add the enabled check**

In `app.post("/api/maj/login", ...)`, the athlete branch fetches the athlete and sets `s.majAthleteId = athlete.id`. Immediately BEFORE setting the session for a matched athlete (after the password is verified and `athlete` is confirmed truthy), add:

```typescript
        if (athlete && (athlete as any).enabled === false) {
          return res.status(403).json({ message: "Your MAJ access is currently inactive — speak to your coach to re-enrol." });
        }
```

- [ ] **Step 2: Typecheck and commit**

Run: `cd /Users/alistairtait/P2A-sport-enroll && npm run check` (no new errors).

```bash
cd /Users/alistairtait/P2A-sport-enroll && git add server/routes.ts && git commit -m "feat: gate MAJ login on enabled flag"
```

---

## Task 6: Admin endpoints + customers UI

**Files:** Modify `server/routes.ts`, `client/src/pages/admin-customers.tsx`.

- [ ] **Step 1: Add admin MAJ endpoints**

In `server/routes.ts`, after the existing `app.post("/api/maj/athletes", isAdmin, ...)` block, add:

```typescript
  // Toggle / reset a MAJ athlete (admin)
  app.patch("/api/maj/athletes/:id", isAdmin, async (req, res) => {
    try {
      const { enabled, password } = req.body as { enabled?: boolean; password?: string };
      const updates: { enabled?: boolean; password?: string } = {};
      if (typeof enabled === "boolean") updates.enabled = enabled;
      if (typeof password === "string" && password.length > 0) updates.password = password;
      const athlete = await storage.updateMajAthlete(req.params.id, updates);
      res.json(athlete);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Provision MAJ access for a specific child (admin)
  app.post("/api/admin/children/:id/maj-access", isAdmin, async (req, res) => {
    try {
      const child = await storage.getChild(req.params.id);
      if (!child) return res.status(404).json({ message: "Child not found" });
      // Find an active enrolment to derive school/venue; fall back to any enrolment's class.
      const enrolments = await storage.getEnrollmentsByParent(child.parentId);
      const match = enrolments.find((e: any) => e.enrollment?.childId === child.id);
      const classId = match?.class?.id ?? match?.enrollment?.classId;
      if (!classId) return res.status(400).json({ message: "No enrolment found for this child to derive their school." });
      const athlete = await provisionMajAccess(child.id, classId);
      res.json(athlete);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // MAJ status per child for the admin students list
  app.get("/api/admin/children-maj", isAdmin, async (_req, res) => {
    try {
      const rows = await storage.getChildrenMajStatus();
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
```

- [ ] **Step 2: Add `getChildrenMajStatus` to storage**

In `server/storage.ts`, after `getChildrenNeedingMaj`, add:

```typescript
  async getChildrenMajStatus(): Promise<{ childId: string; majAthleteId: string | null; username: string | null; enabled: boolean | null; password: string | null }[]> {
    const rows = await db
      .select({
        childId: children.id,
        majAthleteId: children.majAthleteId,
        username: majAthletes.username,
        enabled: majAthletes.enabled,
        password: majAthletes.password,
      })
      .from(children)
      .leftJoin(majAthletes, eq(children.majAthleteId, majAthletes.id));
    return rows as any;
  }
```

Declare it on `IStorage`:

```typescript
  getChildrenMajStatus(): Promise<{ childId: string; majAthleteId: string | null; username: string | null; enabled: boolean | null; password: string | null }[]>;
```

- [ ] **Step 3: Wire MAJ controls into the students table**

In `client/src/pages/admin-customers.tsx`, add a query for MAJ status and mutations, then render controls per student row.

Near the other `useQuery` calls, add:

```typescript
  const { data: childrenMaj = [] } = useQuery<any[]>({ queryKey: ["/api/admin/children-maj"] });
  const majByChild = new Map((childrenMaj as any[]).map((r) => [r.childId, r]));
```

Near the other mutations, add:

```typescript
  const toggleMaj = useMutation({
    mutationFn: async ({ majAthleteId, enabled }: { majAthleteId: string; enabled: boolean }) => {
      const res = await apiRequest("PATCH", `/api/maj/athletes/${majAthleteId}`, { enabled });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/children-maj"] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const createMaj = useMutation({
    mutationFn: async (childId: string) => {
      const res = await apiRequest("POST", `/api/admin/children/${childId}/maj-access`, {});
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/children-maj"] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const resetMajPassword = useMutation({
    mutationFn: async ({ majAthleteId, password }: { majAthleteId: string; password: string }) => {
      const res = await apiRequest("PATCH", `/api/maj/athletes/${majAthleteId}`, { password });
      return res.json();
    },
    onSuccess: () => { toast({ title: "Password updated" }); queryClient.invalidateQueries({ queryKey: ["/api/admin/children-maj"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
```

In the students table, inside the row render for each `student` (where `student.firstName` is shown, around line 436), add a MAJ cell:

```tsx
                              {(() => {
                                const maj = majByChild.get(student.id);
                                if (!maj || !maj.majAthleteId) {
                                  return (
                                    <Button size="sm" variant="outline" onClick={() => createMaj.mutate(student.id)} disabled={createMaj.isPending}>
                                      Create MAJ access
                                    </Button>
                                  );
                                }
                                return (
                                  <div className="flex items-center gap-2 text-xs">
                                    <Switch checked={!!maj.enabled} onCheckedChange={(v) => toggleMaj.mutate({ majAthleteId: maj.majAthleteId, enabled: v })} />
                                    <span className="text-gray-600">{maj.username}</span>
                                    <span className="text-gray-400">· {maj.password}</span>
                                    <Button size="sm" variant="ghost" onClick={() => { const p = window.prompt("New password", maj.password ?? ""); if (p) resetMajPassword.mutate({ majAthleteId: maj.majAthleteId, password: p }); }}>
                                      Reset
                                    </Button>
                                  </div>
                                );
                              })()}
```

Place this cell within the existing student row markup (a new `<td>`/`<div>` consistent with how the row is structured — match the surrounding table cell pattern).

- [ ] **Step 4: Typecheck and commit**

Run: `cd /Users/alistairtait/P2A-sport-enroll && npm run check` (no new errors in routes.ts, storage.ts, admin-customers.tsx).

```bash
cd /Users/alistairtait/P2A-sport-enroll && git add server/routes.ts server/storage.ts client/src/pages/admin-customers.tsx && git commit -m "feat: admin MAJ access toggle, credentials, and provision-for-child"
```

---

## Task 7: Backfill script

**Files:** Create `scripts/backfill-maj-access.ts`.

- [ ] **Step 1: Implement the backfill**

Create `scripts/backfill-maj-access.ts`:

```typescript
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
```

- [ ] **Step 2: Typecheck and commit**

Run: `cd /Users/alistairtait/P2A-sport-enroll && npm run check` (no new errors).

```bash
cd /Users/alistairtait/P2A-sport-enroll && git add scripts/backfill-maj-access.ts && git commit -m "feat: MAJ access backfill script"
```

---

## Task 8: Manual verification (Replit)

**Files:** none (runtime).

- [ ] **Step 1: Deploy.** Merge to `main`, pull on Replit, run the Task 1 SQL, tick Copy dev→prod, republish.
- [ ] **Step 2: Backfill.** In the Replit shell: `npx tsx scripts/backfill-maj-access.ts` (dry run), check the count (~235), then `npx tsx scripts/backfill-maj-access.ts --apply`.
- [ ] **Step 3: Admin.** Admin → customers/students: each child shows a MAJ toggle, username, and password; toggling off, resetting password, and "Create MAJ access" all work.
- [ ] **Step 4: Login gate.** Log into the MAJ app as a provisioned athlete (username + `PG2026`/`P2A2026`); toggle the athlete off in admin; retry login → see the "inactive" message; toggle on → login works.
- [ ] **Step 5: Auto-provision.** Complete a new test enrolment + payment; confirm a MAJ athlete is auto-created and linked.

---

## Notes for the implementer

- Never run `npm run db:push`; apply schema via the Task 1 SQL, then dev→prod copy.
- `@shared/*` and relative `./` imports both work in tsx scripts (see existing `scripts/backfill-enrollment-weeks.ts`).
- `provisionMajAccess` is idempotent — safe to call from multiple activation sites and the backfill.
- Passwords stay plain text (per the spec); the admin UI shows them deliberately.
- `getEnrollmentsByParent` returns rows shaped `{ enrollment, class, ... }` (see its usage in routes); adjust the field access in Step 1 of Task 6 if the shape differs when you read it.
