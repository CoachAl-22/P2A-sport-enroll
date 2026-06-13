# Class Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fixed in-code list of class presets and a "Choose a class template" dropdown in the Add Class admin form that auto-fills name, description, sport type, ages, per-session rate, and the per-week default.

**Architecture:** A single `shared/class-presets.ts` module holds the preset array and type. The Add Class form (`admin-classes.tsx`) gets a template dropdown that copies a preset into the existing form state. No schema or API changes; presets only populate existing `classes` fields, including the existing `per_week_enabled` column (added to the form state so it submits).

**Tech Stack:** TypeScript, React, shadcn/ui (`Select`, `Switch`), tsx + `node:assert/strict` for tests.

---

## File Structure

- Create: `shared/class-presets.ts` — `ClassPreset` type + `CLASS_PRESETS` array (single source of truth).
- Create: `scripts/test-class-presets.ts` — tsx assertion test validating the preset data.
- Modify: `client/src/pages/admin-classes.tsx` — add `perWeekEnabled` to the form state, a template dropdown that applies a preset, and a per-week toggle; ensure submit sends `perWeekEnabled`.

---

## Task 1: Presets module + test

**Files:**
- Create: `shared/class-presets.ts`
- Create: `scripts/test-class-presets.ts`

- [ ] **Step 1: Write the failing test**

Create `scripts/test-class-presets.ts`:

```typescript
import assert from "node:assert/strict";
import { CLASS_PRESETS } from "../shared/class-presets";

const VALID_SPORT_TYPES = new Set([
  "foundation_prep_year2", "emerging_year3_6", "team_sport_speed",
  "junior_development", "senior_squad", "empowered_athlete_program",
]);

// One preset per expected program
assert.equal(CLASS_PRESETS.length, 6);

for (const p of CLASS_PRESETS) {
  assert.ok(p.key && typeof p.key === "string", `preset missing key: ${JSON.stringify(p)}`);
  assert.ok(p.label && p.label.length > 0, `preset ${p.key} missing label`);
  assert.ok(p.name && p.name.length > 0, `preset ${p.key} missing name`);
  assert.ok(p.description && p.description.length > 20, `preset ${p.key} description too short`);
  assert.ok(VALID_SPORT_TYPES.has(p.sportType), `preset ${p.key} bad sportType: ${p.sportType}`);
  assert.ok(Number.isInteger(p.minAge) && Number.isInteger(p.maxAge), `preset ${p.key} ages must be ints`);
  assert.ok(p.minAge <= p.maxAge, `preset ${p.key} minAge > maxAge`);
  assert.equal(p.pricePerSession, "30.00", `preset ${p.key} pricePerSession must be "30.00"`);
  assert.equal(typeof p.perWeekEnabled, "boolean", `preset ${p.key} perWeekEnabled must be boolean`);
}

// per-week default ON only for Foundation and Emerging
const perWeekOn = CLASS_PRESETS.filter((p) => p.perWeekEnabled).map((p) => p.sportType).sort();
assert.deepEqual(perWeekOn, ["emerging_year3_6", "foundation_prep_year2"]);

// keys are unique
assert.equal(new Set(CLASS_PRESETS.map((p) => p.key)).size, CLASS_PRESETS.length);

console.log("class-presets tests passed");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/alistairtait/P2A-sport-enroll && npx tsx scripts/test-class-presets.ts`
Expected: FAIL with `Cannot find module '../shared/class-presets'`.

- [ ] **Step 3: Implement the presets module**

Create `shared/class-presets.ts`:

```typescript
// Fixed, code-maintained class presets. Selecting one in the Add Class admin
// form auto-fills the canonical name, website-matching description, sport type,
// age range, per-session rate, and per-week default. pricePerSession is ex-GST;
// the system adds 10% GST at checkout ($30 -> $33/session).
export interface ClassPreset {
  key: string;            // stable dropdown key
  label: string;          // dropdown label
  name: string;           // default class name (admin appends day/venue)
  description: string;    // matches the website copy
  sportType: string;      // classes.sportType enum value
  minAge: number;
  maxAge: number;
  pricePerSession: string; // ex-GST, always "30.00"
  perWeekEnabled: boolean; // default ON only for Foundation + Emerging
}

export const CLASS_PRESETS: ClassPreset[] = [
  {
    key: "foundation",
    label: "Foundation (Prep–Year 2)",
    name: "Foundation Class",
    description: "Movement skills, games and confidence in a fun, welcoming environment. Designed for Prep–Year 2 athletes aged 5–8.",
    sportType: "foundation_prep_year2",
    minAge: 5, maxAge: 8, pricePerSession: "30.00", perWeekEnabled: true,
  },
  {
    key: "emerging",
    label: "Emerging Athletes (Year 3–6)",
    name: "Emerging Athletes",
    description: "Running, jumping, throwing and sport-specific athletic development for Year 3–6 athletes aged 8–12.",
    sportType: "emerging_year3_6",
    minAge: 8, maxAge: 12, pricePerSession: "30.00", perWeekEnabled: true,
  },
  {
    key: "team_sport_speed",
    label: "Team Sport Speed (12+)",
    name: "Team Sport Speed",
    description: "Speed, agility and athleticism training for team sport athletes. Ideal for AFL, soccer, basketball, netball and more.",
    sportType: "team_sport_speed",
    minAge: 12, maxAge: 99, pricePerSession: "30.00", perWeekEnabled: false,
  },
  {
    key: "junior_academy",
    label: "Junior Academy (12–16)",
    name: "Junior Academy",
    description: "The Power2ADAPT Junior Academy is an in-person athletic development programme for young athletes aged 12–16, designed for multi-sport athletes who want to build the physical foundations that make them better at every sport they play — not just one. Sessions run up to twice per week and focus on movement quality, speed, strength, and athletic confidence — skills that transfer across all sports and carry athletes forward as they grow.",
    sportType: "junior_development",
    minAge: 12, maxAge: 16, pricePerSession: "30.00", perWeekEnabled: false,
  },
  {
    key: "senior_squad",
    label: "Senior Squad (16+)",
    name: "Senior Squad",
    description: "High-level squad training for committed senior athletes aged 16+. Structured sessions focused on performance, competition preparation and athlete development.",
    sportType: "senior_squad",
    minAge: 16, maxAge: 99, pricePerSession: "30.00", perWeekEnabled: false,
  },
  {
    key: "elite_hp",
    label: "Elite HP Squad (16+)",
    name: "Elite HP Squad",
    description: "Next-level performance training for elite athletes. By application only. Advanced programming, individualised coaching and competition-ready conditioning.",
    sportType: "empowered_athlete_program",
    minAge: 16, maxAge: 99, pricePerSession: "30.00", perWeekEnabled: false,
  },
];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /Users/alistairtait/P2A-sport-enroll && npx tsx scripts/test-class-presets.ts`
Expected: `class-presets tests passed`.

- [ ] **Step 5: Typecheck and commit**

Run: `cd /Users/alistairtait/P2A-sport-enroll && npm run check`
Expected: PASS (pre-existing unrelated errors are fine; no new errors in the new files).

```bash
cd /Users/alistairtait/P2A-sport-enroll && git add shared/class-presets.ts scripts/test-class-presets.ts && git commit -m "feat: class presets data module with validation test"
```

---

## Task 2: Template dropdown in Add Class form

**Files:**
- Modify: `client/src/pages/admin-classes.tsx`

- [ ] **Step 1: Import the presets**

Near the top of `client/src/pages/admin-classes.tsx`, add this import alongside the other imports:

```typescript
import { CLASS_PRESETS } from "@shared/class-presets";
```

- [ ] **Step 2: Add `perWeekEnabled` to the form state**

In `admin-classes.tsx`, the `EMPTY_FORM` object currently ends with `pricePerSession: "", isEnrollmentOpen: true,`. Change that line to include `perWeekEnabled`:

```typescript
  minAge: "", maxAge: "", maxCapacity: "", pricePerSession: "", isEnrollmentOpen: true,
  perWeekEnabled: false,
```

- [ ] **Step 3: Populate `perWeekEnabled` when editing an existing class**

In the `openEdit`/edit handler that does `setFormData({ name: cls.name || "", ... })` (around line 199), add this property so the toggle reflects the saved value (place it next to `pricePerSession`):

```typescript
      perWeekEnabled: !!cls.perWeekEnabled,
```

- [ ] **Step 4: Add the template dropdown + per-week toggle to the form**

In the Add/Edit `<form onSubmit={handleSubmit} ...>` (around line 561), immediately inside the form and BEFORE the Name `<Input>`, add the template picker. (`Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` and `Switch` are already used/available in this file's imports — if `Switch` is not imported, add `import { Switch } from "@/components/ui/switch";`.)

```tsx
            {!editingClass && (
              <div className="rounded-lg border border-dashed p-3 bg-gray-50">
                <label className="text-sm font-medium">Choose a class template <span className="text-gray-400 font-normal">(optional — fills the fields below, all editable)</span></label>
                <Select
                  value=""
                  onValueChange={(key) => {
                    const preset = CLASS_PRESETS.find((p) => p.key === key);
                    if (!preset) return;
                    setFormData((prev) => ({
                      ...prev,
                      name: preset.name,
                      description: preset.description,
                      sportType: preset.sportType,
                      minAge: String(preset.minAge),
                      maxAge: String(preset.maxAge),
                      pricePerSession: preset.pricePerSession,
                      perWeekEnabled: preset.perWeekEnabled,
                    }));
                  }}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select a program template…" /></SelectTrigger>
                  <SelectContent>
                    {CLASS_PRESETS.map((p) => (
                      <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
```

Then add a per-week toggle so the preset's default is visible and editable. Place it right after the `pricePerSession` field's containing block (search for the input bound to `formData.pricePerSession` and add this after its wrapping `<div>`):

```tsx
            <div className="flex items-center gap-2">
              <Switch
                checked={!!formData.perWeekEnabled}
                onCheckedChange={(v) => setFormData((p) => ({ ...p, perWeekEnabled: v }))}
              />
              <label className="text-sm">Offer per-week (fortnightly) enrolment</label>
            </div>
```

- [ ] **Step 5: Verify submit sends `perWeekEnabled`**

In `handleSubmit` (around line 232), the payload is built with `{ ...formData, ... }`. Because `perWeekEnabled` is now part of `formData`, it is already included in the payload as a boolean — no change needed. Confirm by reading the function that no line strips it out.

- [ ] **Step 6: Typecheck**

Run: `cd /Users/alistairtait/P2A-sport-enroll && npm run check`
Expected: PASS (no new errors in `admin-classes.tsx`).

- [ ] **Step 7: Commit**

```bash
cd /Users/alistairtait/P2A-sport-enroll && git add client/src/pages/admin-classes.tsx && git commit -m "feat: class template dropdown + per-week toggle in Add Class form"
```

---

## Task 3: Manual verification

**Files:** none (runtime)

- [ ] **Step 1: Deploy**

Merge to `main`, pull on Replit, **tick Copy dev → prod**, republish. (No DB migration needed — no schema change.)

- [ ] **Step 2: Verify**

In Admin → Classes → Add Class: pick each template and confirm name, description, sport type, ages, per-session rate ($30), and the per-week toggle populate correctly. Edit a field after applying a template (confirm it is not locked). Create one class from a template and confirm it saves with the expected values and `perWeekEnabled`.

---

## Notes for the implementer

- `@shared/*` is a tsconfig path alias already used across the project (e.g. `@shared/schema`, `@shared/term-setup`), so `@shared/class-presets` resolves.
- The form fields store strings (`minAge: ""`, `pricePerSession: ""`); apply preset numbers as strings (`String(preset.minAge)`) to match, and `handleSubmit` already parses them.
- `perWeekEnabled` is a boolean passed straight through `handleSubmit`'s `{ ...formData }` spread; the `PUT`/`POST` class routes accept arbitrary fields, so no API change is required.
- Reuse the existing `Select` components; do not add a new dropdown library.
