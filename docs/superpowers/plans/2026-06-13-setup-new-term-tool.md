# Set Up New Term Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin wizard that creates a new term config and clones the previous term's classes into it, with a per-class per-week toggle, so fortnightly enrolment works for a live term.

**Architecture:** A 4-step admin page (`/admin/setup-term`) drives existing term-config routes plus a new clone endpoint. Pure clone/default logic lives in a shared module so it is unit-testable. A new `classes.per_week_enabled` column gates the week-picker. All DB schema changes ship as hand-written SQL run in the Replit shell (never `drizzle-kit push`, due to live-vs-repo schema drift).

**Tech Stack:** TypeScript, Express, Drizzle ORM (Neon Postgres), React + wouter + TanStack Query + react-hook-form + zod, shadcn/ui. Tests run via `npx tsx` with `node:assert/strict` (no test framework installed).

---

## File Structure

- Create: `shared/term-setup.ts` — pure helpers: `defaultPerWeekEnabled(sportType)`, `cloneClassForTerm(source, targetConfig)`.
- Create: `scripts/test-term-setup.ts` — tsx assertion tests for the pure helpers.
- Modify: `shared/schema.ts` — add `perWeekEnabled` column to `classes`.
- Modify: `server/storage.ts` — add `getClassesByTermConfigId`, `cloneTermClasses`; add both to the `IStorage` interface.
- Modify: `server/routes.ts` — add `POST /api/admin/clone-term` and `GET /api/term-configurations/:id/classes`; gate `GET /api/classes/:id/term-weeks` and the `POST /api/enrollments` per-week branch on `perWeekEnabled`.
- Create: `client/src/pages/admin-setup-term.tsx` — the 4-step wizard.
- Modify: `client/src/App.tsx` — import and route `/admin/setup-term`.
- Run on Replit (not committed code): SQL `ALTER TABLE classes ADD COLUMN ...`.

---

## Task 1: Add `per_week_enabled` column

**Files:**
- Modify: `shared/schema.ts` (classes table, after `isMakeupEligible`)
- Run on Replit: SQL migration

- [ ] **Step 1: Add the column to the Drizzle schema**

In `shared/schema.ts`, inside `export const classes = pgTable("classes", {`, add after the `isMakeupEligible` line:

```typescript
  perWeekEnabled: boolean("per_week_enabled").default(false).notNull(),
```

- [ ] **Step 2: Typecheck**

Run: `npm run check`
Expected: PASS (no new errors referencing `perWeekEnabled`).

- [ ] **Step 3: Commit**

```bash
git add shared/schema.ts
git commit -m "feat: add per_week_enabled column to classes schema"
```

- [ ] **Step 4: Apply the SQL migration on Replit**

In the Replit shell, run (this is the only way to change the live DB — do NOT use `npm run db:push`):

```
psql "$DATABASE_URL" -c "ALTER TABLE classes ADD COLUMN IF NOT EXISTS per_week_enabled boolean NOT NULL DEFAULT false;"
```

Expected output: `ALTER TABLE`.

---

## Task 2: Pure clone/default helpers + tests

**Files:**
- Create: `shared/term-setup.ts`
- Create: `scripts/test-term-setup.ts`

- [ ] **Step 1: Write the failing test**

Create `scripts/test-term-setup.ts`:

```typescript
import assert from "node:assert/strict";
import { defaultPerWeekEnabled, cloneClassForTerm } from "../shared/term-setup";

// defaultPerWeekEnabled: ON for emerging + foundation, OFF for everything else
assert.equal(defaultPerWeekEnabled("emerging_year3_6"), true);
assert.equal(defaultPerWeekEnabled("foundation_prep_year2"), true);
assert.equal(defaultPerWeekEnabled("junior_development"), false);
assert.equal(defaultPerWeekEnabled("senior_squad"), false);
assert.equal(defaultPerWeekEnabled("team_sport_speed"), false);

// cloneClassForTerm: copies definition, resets enrolment, re-points term, recomputes price
const source = {
  name: "Emerging Athletes — Tuesday (Ballam Park)",
  description: "desc",
  sportType: "emerging_year3_6",
  venueId: "venue-1",
  coachId: "coach-1",
  dayOfWeek: 2,
  startTime: "16:30",
  endTime: "17:30",
  minAge: 8,
  maxAge: 12,
  maxCapacity: 12,
  pricePerSession: "30.00",
  imageUrl: "https://x/y.jpg",
  isHolidayProgram: false,
  isMakeupEligible: false,
};
const targetConfig = {
  id: "cfg-t3-2026",
  term: "term_3",
  year: 2026,
  startDate: "2026-07-13",
  endDate: "2026-09-18",
  weeksCount: 10,
  pricePerWeek: "30.00",
};
const cloned = cloneClassForTerm(source as any, targetConfig as any);

assert.equal(cloned.termConfigId, "cfg-t3-2026");
assert.equal(cloned.term, "term_3");
assert.equal(cloned.year, 2026);
assert.equal(cloned.currentEnrollment, 0);
assert.equal(cloned.coachId, "coach-1");          // coach carried over
assert.equal(cloned.dayOfWeek, 2);
assert.equal(cloned.pricePerTerm, "300.00");        // 30 × 10 weeks, recomputed
assert.equal(cloned.perWeekEnabled, true);          // emerging defaults on
assert.equal(cloned.status, "active");
assert.equal(cloned.isEnrollmentOpen, false);       // opened later by admin
assert.equal((cloned.startDate as Date).toISOString().slice(0, 10), "2026-07-13");
assert.equal((cloned.endDate as Date).toISOString().slice(0, 10), "2026-09-18");

console.log("term-setup tests passed");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx scripts/test-term-setup.ts`
Expected: FAIL with `Cannot find module '../shared/term-setup'`.

- [ ] **Step 3: Implement the helpers**

Create `shared/term-setup.ts`:

```typescript
// Pure helpers for the "Set Up New Term" tool. No DB, no side effects, so they
// can be unit-tested directly with tsx.
import type { InsertClass } from "./schema";

// Programs that offer per-week (fortnightly) enrolment by default.
const PER_WEEK_DEFAULT_PROGRAMS = new Set<string>([
  "foundation_prep_year2",
  "emerging_year3_6",
]);

export function defaultPerWeekEnabled(sportType: string): boolean {
  return PER_WEEK_DEFAULT_PROGRAMS.has(sportType);
}

// Minimal shape of a source class needed to clone it into a new term.
export interface CloneableClass {
  name: string;
  description: string | null;
  sportType: string;
  venueId: string;
  coachId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  minAge: number;
  maxAge: number;
  maxCapacity: number;
  pricePerSession: string | null;
  imageUrl: string | null;
  isHolidayProgram: boolean;
  isMakeupEligible: boolean;
}

export interface TargetTermConfig {
  id: string;
  term: string;
  year: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  weeksCount: number;
  pricePerWeek: string;
}

// Build the InsertClass for a cloned class: copy the definition, carry the
// coach, re-point to the new term, reset enrolment, and recompute the term
// price from the new config (price per week × weeks).
export function cloneClassForTerm(source: CloneableClass, target: TargetTermConfig): InsertClass {
  const pricePerTerm = (parseFloat(target.pricePerWeek) * target.weeksCount).toFixed(2);
  return {
    name: source.name,
    description: source.description,
    sportType: source.sportType as any,
    venueId: source.venueId,
    coachId: source.coachId,
    termConfigId: target.id,
    term: target.term as any,
    year: target.year,
    dayOfWeek: source.dayOfWeek,
    startTime: source.startTime,
    endTime: source.endTime,
    startDate: new Date(`${target.startDate}T00:00:00Z`),
    endDate: new Date(`${target.endDate}T00:00:00Z`),
    minAge: source.minAge,
    maxAge: source.maxAge,
    maxCapacity: source.maxCapacity,
    pricePerSession: source.pricePerSession,
    pricePerTerm,
    status: "active",
    imageUrl: source.imageUrl,
    isEnrollmentOpen: false,
    isHolidayProgram: source.isHolidayProgram,
    isMakeupEligible: source.isMakeupEligible,
    perWeekEnabled: defaultPerWeekEnabled(source.sportType),
    currentEnrollment: 0,
  } as InsertClass;
}
```

Note: `insertClassSchema` omits `currentEnrollment`, but `InsertClass` from Drizzle still permits it; `storage.createClass` passes the object straight to `db.insert`. Setting `currentEnrollment: 0` is explicit and safe.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx scripts/test-term-setup.ts`
Expected: `term-setup tests passed`.

- [ ] **Step 5: Typecheck and commit**

Run: `npm run check`
Expected: PASS.

```bash
git add shared/term-setup.ts scripts/test-term-setup.ts
git commit -m "feat: pure clone + per-week-default helpers for term setup"
```

---

## Task 3: Storage methods

**Files:**
- Modify: `server/storage.ts` (IStorage interface near line 132; implementation near `createClass` ~line 567)

- [ ] **Step 1: Add interface declarations**

In `server/storage.ts`, in the `IStorage` interface after `createClass(classData: InsertClass): Promise<Class>;`, add:

```typescript
  getClassesByTermConfigId(termConfigId: string): Promise<Class[]>;
  cloneTermClasses(sourceTermConfigId: string, targetTermConfigId: string): Promise<Class[]>;
```

- [ ] **Step 2: Add the import for the clone helper**

At the top of `server/storage.ts`, alongside the existing `@shared/schema` import block, add this import (separate line is fine):

```typescript
import { cloneClassForTerm, type CloneableClass } from "@shared/term-setup";
```

- [ ] **Step 3: Implement the methods**

In `server/storage.ts`, immediately after the `createClass` implementation (the method that does `db.insert(classes)`), add:

```typescript
  async getClassesByTermConfigId(termConfigId: string): Promise<Class[]> {
    return await db
      .select()
      .from(classes)
      .where(eq(classes.termConfigId, termConfigId))
      .orderBy(classes.dayOfWeek, classes.startTime);
  }

  async cloneTermClasses(sourceTermConfigId: string, targetTermConfigId: string): Promise<Class[]> {
    const target = await this.getTermConfigurationById(targetTermConfigId);
    if (!target) throw new Error("Target term configuration not found");

    // Guard: never clone into a term that already has classes (prevents duplicates).
    const existing = await this.getClassesByTermConfigId(targetTermConfigId);
    if (existing.length > 0) {
      throw new Error("Target term already has classes. Clone aborted to avoid duplicates.");
    }

    const sources = await this.getClassesByTermConfigId(sourceTermConfigId);
    if (sources.length === 0) throw new Error("Source term has no classes to clone");

    const created: Class[] = [];
    for (const src of sources) {
      const insert = cloneClassForTerm(src as unknown as CloneableClass, {
        id: target.id,
        term: target.term,
        year: target.year,
        startDate: target.startDate,
        endDate: target.endDate,
        weeksCount: target.weeksCount,
        pricePerWeek: target.pricePerWeek,
      });
      created.push(await this.createClass(insert));
    }
    return created;
  }
```

- [ ] **Step 4: Typecheck and commit**

Run: `npm run check`
Expected: PASS (no new errors in `storage.ts`).

```bash
git add server/storage.ts
git commit -m "feat: storage methods to list and clone classes by term config"
```

---

## Task 4: Routes — clone endpoint, classes-by-term, per-week gating

**Files:**
- Modify: `server/routes.ts`

- [ ] **Step 1: Add the clone + classes-by-term endpoints**

In `server/routes.ts`, after the existing `app.put("/api/term-configurations/:id", ...)` block, add:

```typescript
  // List the classes linked to a term config (for the setup-term wizard).
  app.get("/api/term-configurations/:id/classes", isAdmin, async (req, res) => {
    try {
      const list = await storage.getClassesByTermConfigId(req.params.id);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Clone all classes from a source term config into a target term config.
  app.post("/api/admin/clone-term", isAdmin, async (req, res) => {
    try {
      const { sourceTermConfigId, targetTermConfigId } = req.body as {
        sourceTermConfigId?: string;
        targetTermConfigId?: string;
      };
      if (!sourceTermConfigId || !targetTermConfigId) {
        return res.status(400).json({ message: "sourceTermConfigId and targetTermConfigId are required" });
      }
      if (sourceTermConfigId === targetTermConfigId) {
        return res.status(400).json({ message: "Source and target terms must be different" });
      }
      const created = await storage.cloneTermClasses(sourceTermConfigId, targetTermConfigId);
      res.status(201).json({ created: created.length, classes: created });
    } catch (error: any) {
      // Duplicate guard and "not found" surface as 409/400 to the wizard.
      const status = /already has classes/.test(error.message) ? 409 : 400;
      res.status(status).json({ message: error.message });
    }
  });
```

- [ ] **Step 2: Gate the term-weeks endpoint on `perWeekEnabled`**

In `server/routes.ts`, inside `app.get("/api/classes/:id/term-weeks", ...)`, immediately after the `if (!cls.termConfigId) { ... }` check, add:

```typescript
      if (!(cls as any).perWeekEnabled) {
        return res.status(404).json({ message: "Per-week enrolment is not enabled for this class" });
      }
```

This makes the enrolment form's term-weeks query fail quietly for classes without per-week, so the week-picker only shows on enabled classes.

- [ ] **Step 3: Gate the enrolment per-week branch on `perWeekEnabled`**

In `server/routes.ts`, inside `app.post("/api/enrollments", ...)`, find the block `if (selectedWeekNumbers && selectedWeekNumbers.length > 0) {` and add as its first statement (before the `if (!classData.termConfigId)` check):

```typescript
        if (!(classData as any).perWeekEnabled) {
          return res.status(400).json({ message: "Per-week enrolment is not enabled for this class." });
        }
```

- [ ] **Step 4: Typecheck and commit**

Run: `npm run check`
Expected: PASS (no new errors in `routes.ts`).

```bash
git add server/routes.ts
git commit -m "feat: clone-term + classes-by-term routes, gate per-week on perWeekEnabled"
```

---

## Task 5: Admin wizard page

**Files:**
- Create: `client/src/pages/admin-setup-term.tsx`
- Modify: `client/src/App.tsx` (import near other admin imports ~line 22; route near `/admin/term-config` ~line 116)

- [ ] **Step 1: Create the wizard page**

Create `client/src/pages/admin-setup-term.tsx`:

```tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AdminSetupTerm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 state — new term config
  const [term, setTerm] = useState("term_3");
  const [year, setYear] = useState(2026);
  const [name, setName] = useState("Term 3 2026");
  const [startDate, setStartDate] = useState("2026-07-13");
  const [endDate, setEndDate] = useState("2026-09-18");
  const [weeksCount, setWeeksCount] = useState(10);
  const [pricePerWeek, setPricePerWeek] = useState(30);
  const [gstRate, setGstRate] = useState(0.1);
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>([]);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [newConfigId, setNewConfigId] = useState<string | null>(null);

  // Step 2 state — source term
  const [sourceConfigId, setSourceConfigId] = useState<string>("");

  const { data: termConfigs = [] } = useQuery<any[]>({ queryKey: ["/api/term-configurations"] });
  const { data: newClasses = [] } = useQuery<any[]>({
    queryKey: ["/api/term-configurations", newConfigId, "classes"],
    queryFn: async () => {
      const r = await apiRequest("GET", `/api/term-configurations/${newConfigId}/classes`);
      return r.json();
    },
    enabled: !!newConfigId && step >= 3,
  });

  // Step 1: create config + holidays
  const createConfig = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/term-configurations", {
        term, year, name, startDate, endDate, weeksCount, pricePerWeek, gstRate, active: true,
      });
      const cfg = await r.json();
      for (const h of holidays) {
        await apiRequest("POST", `/api/term-configurations/${cfg.id}/holidays`, {
          holidayDate: h.date, name: h.name, type: "public_holiday",
        });
      }
      return cfg;
    },
    onSuccess: (cfg) => {
      setNewConfigId(cfg.id);
      queryClient.invalidateQueries({ queryKey: ["/api/term-configurations"] });
      setStep(2);
    },
    onError: (e: any) => toast({ title: "Could not create term", description: e.message, variant: "destructive" }),
  });

  // Step 2: clone classes from source into the new config
  const cloneTerm = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/admin/clone-term", {
        sourceTermConfigId: sourceConfigId, targetTermConfigId: newConfigId,
      });
      return r.json();
    },
    onSuccess: (res) => {
      toast({ title: "Classes cloned", description: `${res.created} classes created.` });
      queryClient.invalidateQueries({ queryKey: ["/api/term-configurations", newConfigId, "classes"] });
      setStep(3);
    },
    onError: (e: any) => toast({ title: "Clone failed", description: e.message, variant: "destructive" }),
  });

  // Step 3: per-class edits (per-week toggle, capacity)
  const updateClass = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const r = await apiRequest("PUT", `/api/classes/${id}`, updates);
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/term-configurations", newConfigId, "classes"] }),
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const addHoliday = () => {
    if (!holidayDate || !holidayName) return;
    setHolidays((h) => [...h, { date: holidayDate, name: holidayName }]);
    setHolidayDate(""); setHolidayName("");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Set Up New Term — Step {step} of 4</h1>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>1. Create the term</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="term_1">Term 1</SelectItem>
                    <SelectItem value="term_2">Term 2</SelectItem>
                    <SelectItem value="term_3">Term 3</SelectItem>
                    <SelectItem value="term_4">Term 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Year</Label><Input type="number" value={year} onChange={(e) => setYear(+e.target.value)} /></div>
              <div className="col-span-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Start date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
              <div><Label>End date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
              <div><Label>Weeks</Label><Input type="number" value={weeksCount} onChange={(e) => setWeeksCount(+e.target.value)} /></div>
              <div><Label>Price / week</Label><Input type="number" value={pricePerWeek} onChange={(e) => setPricePerWeek(+e.target.value)} /></div>
              <div><Label>GST rate</Label><Input type="number" step="0.01" value={gstRate} onChange={(e) => setGstRate(+e.target.value)} /></div>
            </div>
            <div className="border-t pt-4">
              <Label>Holidays (no-class weeks)</Label>
              <div className="flex gap-2 mt-2">
                <Input type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} />
                <Input placeholder="Name e.g. Public Holiday" value={holidayName} onChange={(e) => setHolidayName(e.target.value)} />
                <Button type="button" variant="outline" onClick={addHoliday}>Add</Button>
              </div>
              <ul className="mt-2 text-sm text-gray-600">
                {holidays.map((h, i) => <li key={i}>{h.date} — {h.name}</li>)}
              </ul>
            </div>
            <Button onClick={() => createConfig.mutate()} disabled={createConfig.isPending} className="w-full">
              {createConfig.isPending ? "Creating…" : "Create term & continue →"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>2. Clone classes from a previous term</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Label>Copy classes from</Label>
            <Select value={sourceConfigId} onValueChange={setSourceConfigId}>
              <SelectTrigger><SelectValue placeholder="Choose a source term" /></SelectTrigger>
              <SelectContent>
                {termConfigs.filter((c) => c.id !== newConfigId).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => cloneTerm.mutate()} disabled={!sourceConfigId || cloneTerm.isPending} className="w-full">
              {cloneTerm.isPending ? "Cloning…" : "Clone classes →"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>3. Review classes ({newClasses.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {newClasses.map((c) => (
              <div key={c.id} className="flex items-center gap-3 border rounded-lg p-3 text-sm">
                <div className="flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-gray-500">{DAY_NAMES[c.dayOfWeek]} {c.startTime}–{c.endTime} · cap {c.maxCapacity} · ${c.pricePerTerm} + GST</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Per-week</Label>
                  <Switch
                    checked={!!c.perWeekEnabled}
                    onCheckedChange={(v) => updateClass.mutate({ id: c.id, updates: { perWeekEnabled: v } })}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-500 mt-2">
              Need to change a class's day, time, venue, coach, or add/remove a class? Use the{" "}
              <a href="/admin/classes" className="underline text-primary-600">Classes admin</a> page — it edits the full class details.
            </p>
            <Button onClick={() => setStep(4)} className="w-full mt-4">Looks good →</Button>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader><CardTitle>4. Done</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              {name} created with {newClasses.length} classes. Per-week enrolment is on for{" "}
              {newClasses.filter((c) => c.perWeekEnabled).length} of them.
            </p>
            <p className="text-sm text-gray-600">
              Next: open enrolments on each class when you are ready, and test one fortnightly booking.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Register the route**

In `client/src/App.tsx`, add the import near the other admin imports:

```tsx
import AdminSetupTerm from "@/pages/admin-setup-term";
```

And add the route next to `/admin/term-config`:

```tsx
          <Route path="/admin/setup-term" component={AdminSetupTerm} />
```

- [ ] **Step 3: Typecheck and commit**

Run: `npm run check`
Expected: PASS (no new errors in `admin-setup-term.tsx` or `App.tsx`).

```bash
git add client/src/pages/admin-setup-term.tsx client/src/App.tsx
git commit -m "feat: Set Up New Term admin wizard page and route"
```

---

## Task 6: Manual verification on Replit

**Files:** none (runtime verification)

- [ ] **Step 1: Deploy**

Merge the feature branch to `main`, pull on Replit, and confirm Task 1's SQL migration has been run (`per_week_enabled` column exists). Republish.

- [ ] **Step 2: Run the wizard**

Go to `/admin/setup-term`. Step 1: create "Term 3 2026" (13 Jul → 18 Sep, 10 weeks, $30, 0.10), add any holidays. Step 2: clone from "Term 2 2026". Step 3: confirm Emerging/Foundation show per-week ON and others OFF; toggle one to check it persists. Step 4: confirm summary.

- [ ] **Step 3: Verify per-week gating**

As a parent, open a cloned Emerging class enrolment: the week-picker appears. Open a Junior Academy / POWER2ADAPT class: no week-picker.

- [ ] **Step 4: End-to-end fortnightly enrolment**

Enrol a test child fortnightly on an Emerging class. Confirm the price is `selected weeks × $30 × 1.10` and Stripe charges the GST-inclusive amount.

- [ ] **Step 5: Verify duplicate guard**

Re-run the wizard targeting Term 3 2026 again and attempt to clone: it must refuse with "Target term already has classes".

---

## Notes for the implementer

- **Never run `npm run db:push`.** The live DB and repo schema have drifted; `db:push` proposes destructive changes. Apply schema changes with the `psql "$DATABASE_URL" -c "ALTER TABLE ..."` statements given in the tasks.
- The `PUT /api/classes/:id` route already accepts arbitrary fields (`const updates = { ...req.body }`), so the per-week toggle in Step 3 works without route changes.
- `apiRequest(method, url, body?)` is the project's fetch wrapper in `client/src/lib/queryClient.ts`; it throws on non-2xx, which the mutations' `onError` handles.
- **Deviation from spec (deliberate, DRY):** the spec described a full SportsBiz-style per-class edit form (day/time/venue/coach) and add/remove inside the wizard. The project already has an `/admin/classes` page that does all of that. Rather than duplicate it, the wizard's Step 3 reviews the cloned classes and toggles per-week, and links out to `/admin/classes` for deeper edits. This keeps one class editor, not two.
