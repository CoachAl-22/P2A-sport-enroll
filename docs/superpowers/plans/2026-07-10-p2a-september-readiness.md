# P2A September-Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get the P2A sport-enroll platform ready to run a low-risk **September parallel dry-run** — verified per-week/GST money math, deployed per-week schema, confirmed credits/makeup, Stripe→Xero accounting live, and one program routed through the new flow — while SportsBiz keeps handling everything else.

**Architecture:** The platform already exists (Express + React + Drizzle/Neon + Stripe + Twilio + Resend, deploying to Fly.io). This plan does NOT build new product surface. It (1) extracts the inline enrolment price/GST calculation into a pure, unit-tested function to lock down a documented latent bug, (2) is a runbook of verification + deployment steps the owner runs against live infrastructure, and (3) makes one small routing change so a single program's "Enroll Now" points at the new flow.

**Tech Stack:** TypeScript, Express, React, Drizzle ORM, Neon Postgres, Stripe, Vitest (added here for the one regression test), Stripe→Xero native connector.

## Global Constraints

- Currency is **AUD**; all displayed/charged amounts are **GST-inclusive**. Verbatim rule from spec: charge `ex-GST base × (1 + gstRate)`, `gstRate` from term config, default **0.10**.
- Half-term minimum: a per-week enrolment must keep **at least `Math.ceil(payableWeeks / 2)`** weeks (min 1). Verbatim from `shared/term-weeks.ts`.
- Full-term enrolments (no `selectedWeekNumbers`) must retain **exact original flat-price behaviour** — no regression.
- The server is the **source of truth for price** — never trust a client-supplied amount. Payment intents charge the **stored** `payments.amount`, not a recomputed flat price.
- **Do NOT flip all 8 landing buttons.** September routes exactly ONE program to `/classes`; the other 7 stay on SportsBiz until the December hard cutover.
- Repo: `~/1_AI-OS/apps/sport-enroll`. Commit granularly. `npm run check` (tsc) must stay clean for any file this plan creates or edits.

## Ownership Legend

Each step is tagged: **[AGENT]** = code/test an implementer or subagent does in the repo · **[OWNER]** = Alistair runs against live infra (Neon/Fly/Stripe/Xero dashboards) — an agent cannot and must not do these.

## File Structure

- `shared/enrolment-pricing.ts` — **create.** Pure function `computeEnrolmentAmount()` holding the exact price/GST/half-term rules. No DB, no Stripe. Single responsibility: money math.
- `shared/enrolment-pricing.test.ts` — **create.** Vitest unit tests for the above.
- `server/routes.ts` — **modify** (POST `/api/enrollments`, lines ~1961–2022) to call `computeEnrolmentAmount()` instead of the inline arithmetic. Behaviour-preserving.
- `package.json` — **modify.** Add `vitest` dev dependency + `"test": "vitest run"` script.
- `vitest.config.ts` — **create.** Minimal config with the `@shared` path alias.
- `client/src/pages/landing.tsx` — **modify.** Repoint ONE program's Enroll button to `/classes`.
- `docs/september-dry-run-runbook.md` — **create.** The owner-run verification checklist (deploy, e2e, Xero) captured as a durable artifact.

---

### Task 1: Extract and unit-test the enrolment price/GST calculation

Locks down the documented latent bug (payment intents once recomputed from flat price) by moving the money math into one pure function with tests, then pointing the route at it.

**Files:**
- Create: `shared/enrolment-pricing.ts`
- Create: `shared/enrolment-pricing.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` (add vitest + test script)
- Modify: `server/routes.ts:1961-2022`

**Interfaces:**
- Produces: `computeEnrolmentAmount(input: EnrolmentPriceInput): EnrolmentPriceResult`
  - `EnrolmentPriceInput = { pricePerTerm: string; pricePerWeek: string | null; gstRate: number; payableWeekCount: number; selectedWeekNumbers?: number[] }`
  - `EnrolmentPriceResult = { baseExGst: number; gstRate: number; amount: string; selectedWeekCount: number; isFullTerm: boolean }` where `amount` is GST-inclusive, 2 dp, as a string.
  - Throws `Error` when a per-week selection is below `minimumSelectableWeeks(payableWeekCount)` or above `payableWeekCount`.
- Consumes: `minimumSelectableWeeks` from `@shared/term-weeks`.

- [ ] **Step 1: [AGENT] Add vitest tooling**

Run:
```bash
cd ~/1_AI-OS/apps/sport-enroll
npm install -D vitest
```
Add to `package.json` scripts (next to `"check"`):
```json
"test": "vitest run",
```
Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@shared": path.resolve(__dirname, "shared") },
  },
  test: { environment: "node", include: ["shared/**/*.test.ts"] },
});
```

- [ ] **Step 2: [AGENT] Write the failing test**

Create `shared/enrolment-pricing.test.ts`. These cases mirror the live rules (default GST 0.10; half-term min = ceil(payable/2)):
```ts
import { describe, it, expect } from "vitest";
import { computeEnrolmentAmount } from "./enrolment-pricing";

describe("computeEnrolmentAmount", () => {
  it("full term = pricePerTerm + GST, unchanged behaviour", () => {
    const r = computeEnrolmentAmount({
      pricePerTerm: "200.00", pricePerWeek: "20.00", gstRate: 0.1, payableWeekCount: 10,
    });
    expect(r.isFullTerm).toBe(true);
    expect(r.amount).toBe("220.00"); // 200 * 1.1
  });

  it("per-week = pricePerWeek x selected + GST", () => {
    const r = computeEnrolmentAmount({
      pricePerTerm: "200.00", pricePerWeek: "20.00", gstRate: 0.1, payableWeekCount: 10,
      selectedWeekNumbers: [1, 3, 5, 7, 9], // 5 weeks, meets half-term min
    });
    expect(r.isFullTerm).toBe(false);
    expect(r.selectedWeekCount).toBe(5);
    expect(r.amount).toBe("110.00"); // 20 * 5 * 1.1
  });

  it("dedupes repeated week numbers before pricing", () => {
    const r = computeEnrolmentAmount({
      pricePerTerm: "200.00", pricePerWeek: "20.00", gstRate: 0.1, payableWeekCount: 10,
      selectedWeekNumbers: [1, 1, 3, 5, 7, 9],
    });
    expect(r.selectedWeekCount).toBe(5);
    expect(r.amount).toBe("110.00");
  });

  it("rejects a selection below the half-term minimum", () => {
    expect(() => computeEnrolmentAmount({
      pricePerTerm: "200.00", pricePerWeek: "20.00", gstRate: 0.1, payableWeekCount: 10,
      selectedWeekNumbers: [1, 2, 3, 4], // 4 < ceil(10/2)=5
    })).toThrow(/minimum/i);
  });

  it("rejects selecting more weeks than are payable", () => {
    expect(() => computeEnrolmentAmount({
      pricePerTerm: "200.00", pricePerWeek: "20.00", gstRate: 0.1, payableWeekCount: 8,
      selectedWeekNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    })).toThrow(/payable/i);
  });

  it("applies a non-default gstRate", () => {
    const r = computeEnrolmentAmount({
      pricePerTerm: "100.00", pricePerWeek: null, gstRate: 0, payableWeekCount: 8,
    });
    expect(r.amount).toBe("100.00"); // 100 * 1.0
  });
});
```

- [ ] **Step 3: [AGENT] Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./enrolment-pricing"` (module does not exist yet).

- [ ] **Step 4: [AGENT] Write the minimal implementation**

Create `shared/enrolment-pricing.ts`:
```ts
import { minimumSelectableWeeks } from "@shared/term-weeks";

export interface EnrolmentPriceInput {
  pricePerTerm: string;
  pricePerWeek: string | null;
  gstRate: number;
  payableWeekCount: number;
  selectedWeekNumbers?: number[];
}

export interface EnrolmentPriceResult {
  baseExGst: number;
  gstRate: number;
  amount: string; // GST-inclusive, 2dp
  selectedWeekCount: number;
  isFullTerm: boolean;
}

export function computeEnrolmentAmount(input: EnrolmentPriceInput): EnrolmentPriceResult {
  const { pricePerTerm, pricePerWeek, gstRate, payableWeekCount, selectedWeekNumbers } = input;

  const isPerWeek = Array.isArray(selectedWeekNumbers) && selectedWeekNumbers.length > 0;

  if (!isPerWeek) {
    const baseExGst = parseFloat(pricePerTerm);
    return {
      baseExGst,
      gstRate,
      amount: (baseExGst * (1 + gstRate)).toFixed(2),
      selectedWeekCount: payableWeekCount,
      isFullTerm: true,
    };
  }

  if (pricePerWeek == null) {
    throw new Error("Per-week enrolment requires a pricePerWeek on the term config");
  }

  const unique = Array.from(new Set(selectedWeekNumbers));
  const minWeeks = minimumSelectableWeeks(payableWeekCount);
  if (unique.length < minWeeks) {
    throw new Error(`Selection below half-term minimum: ${unique.length} < ${minWeeks}`);
  }
  if (unique.length > payableWeekCount) {
    throw new Error(`Selection exceeds payable weeks: ${unique.length} > ${payableWeekCount}`);
  }

  const baseExGst = parseFloat(pricePerWeek) * unique.length;
  return {
    baseExGst,
    gstRate,
    amount: (baseExGst * (1 + gstRate)).toFixed(2),
    selectedWeekCount: unique.length,
    isFullTerm: false,
  };
}
```

- [ ] **Step 5: [AGENT] Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 6 passed.

- [ ] **Step 6: [AGENT] Point the route at the pure function**

In `server/routes.ts` POST `/api/enrollments` (~1961–2022), replace the inline `baseExGst`/`gstRate`/`amountToCharge` arithmetic with a call to `computeEnrolmentAmount(...)`, feeding it `classData.pricePerTerm`, `termConfig.pricePerWeek`, the resolved `gstRate`, `payable.length`, and `selectedWeekNumbers`. Use `result.amount` where `amountToCharge` was used and keep the existing `createEnrollmentWeeks` write. Import at top: `import { computeEnrolmentAmount } from "@shared/enrolment-pricing";`

- [ ] **Step 7: [AGENT] Verify types + tests still clean**

Run: `npm run check && npm test`
Expected: tsc exits 0 (no NEW errors introduced by these files); vitest 6 passed. (Pre-existing unrelated admin TS errors are out of scope — Stage D. Confirm the count did not increase: `npm run check 2>&1 | grep -c "error TS"` should be ≤ 118.)

- [ ] **Step 8: [AGENT] Commit**

```bash
git add shared/enrolment-pricing.ts shared/enrolment-pricing.test.ts vitest.config.ts package.json package-lock.json server/routes.ts
git commit -m "refactor: extract enrolment price/GST math into tested pure fn"
```

---

### Task 2: Deploy per-week schema + backfill existing enrolments

Brings the `enrollment_weeks` table live and backfills existing enrolments so per-week is usable end-to-end. **Owner-run against the live database** — an agent must not touch production data.

**Files:**
- Uses: `scripts/backfill-enrollment-weeks.ts` (already exists)
- Reference: `drizzle.config.ts`, `shared/schema.ts:238`

**Interfaces:**
- Consumes: `DATABASE_URL` (Neon) in the deploy environment.
- Produces: populated `enrollment_weeks` table.

- [ ] **Step 1: [OWNER] Confirm you are pointed at the intended database**

Run (in the deploy shell / Fly console):
```bash
echo "$DATABASE_URL" | sed -E 's/:[^:@]*@/:***@/'
```
Expected: prints the Neon host you intend to migrate, password masked. Stop if it is not the live DB you mean to change.

- [ ] **Step 2: [OWNER] Push the schema**

Run: `npm run db:push`
Expected: drizzle-kit reports creating `enrollment_weeks` (and any pending diffs). Review the diff before confirming — abort if it proposes dropping columns/tables.

- [ ] **Step 3: [OWNER] Backfill — dry run first**

Run: `npx tsx scripts/backfill-enrollment-weeks.ts`
Expected: prints how many enrolments WOULD be backfilled, writes nothing. Sanity-check the count against your active enrolment count.

- [ ] **Step 4: [OWNER] Backfill — apply**

Run: `npx tsx scripts/backfill-enrollment-weeks.ts --apply`
Expected: writes `enrollment_weeks` rows; prints rows created. Then verify no active enrolment is missing weeks:
```sql
SELECT e.id FROM enrollments e
LEFT JOIN enrollment_weeks w ON w.enrollment_id = e.id
WHERE w.id IS NULL AND e.status = 'active';
```
Expected: 0 rows.

- [ ] **Step 5: [OWNER] Confirm** — record the row counts in `docs/september-dry-run-runbook.md` (Task 6) as the backfill baseline.

---

### Task 3: End-to-end verification of every money path (Stripe test mode)

Proves the deployed price logic charges the right GST-inclusive amount for each enrolment shape before any real parent uses it. **Owner-run** (requires a browser + Stripe test keys); not automatable here.

**Files:**
- Reference: `client/src/components/classes/enrollment-form.tsx` (week picker), `server/routes.ts` payment-intent handlers.

- [ ] **Step 1: [OWNER] Switch to Stripe test mode**

Ensure the environment uses Stripe **test** keys (test publishable + secret). Confirm the dashboard shows "Test mode".

- [ ] **Step 2: [OWNER] Full-term enrolment**

Enrol one athlete full-term in a term-priced class. Use test card `4242 4242 4242 4242`.
Expected: charge = `pricePerTerm × 1.10` (or the term's gstRate). Confirm the Stripe PaymentIntent amount matches the amount shown at checkout to the cent.

- [ ] **Step 3: [OWNER] Fortnightly (per-week) enrolment**

Enrol picking the "Fortnightly" preset (must meet the half-term minimum).
Expected: charge = `pricePerWeek × selectedWeeks × 1.10`. Confirm `enrollment_weeks` rows written (selected/skipped/holiday) and the Stripe amount equals the picker's live total.

- [ ] **Step 4: [OWNER] Below-minimum guard**

Try to deselect below half the payable weeks.
Expected: UI blocks it / server rejects with a minimum-weeks error; no PaymentIntent created.

- [ ] **Step 5: [OWNER] Multi-sibling combined checkout**

Enrol two siblings in one booking (mix full-term + fortnightly if possible).
Expected: sibling discount applied; a single combined charge equal to the sum of each athlete's computed amount; each enrolment gets its own weeks rows.

- [ ] **Step 6: [OWNER] Casual drop-in**

Book a casual/drop-in session.
Expected: single charge for the drop-in price + GST; no term-week rows.

- [ ] **Step 7: [OWNER] Record results** in the runbook (Task 6). Any mismatch = STOP and raise a bug before proceeding.

---

### Task 4: Confirm credits + makeup-class behaviour

Verifies the credit/makeup features that already have code actually behave correctly, since parity here is why SportsBiz kept winning. **Owner-run** through the admin UI.

**Files:**
- Reference: `client/src/components/admin/enrollment-weeks-dialog.tsx`, `server/storage.ts`, `server/invoiceService.ts` (credit paths).

- [ ] **Step 1: [OWNER] Skip a week → credit**

In the admin enrollment-weeks dialog, mark a future week as skipped with a reason.
Expected: week status flips to skipped/credited; a credit is recorded against the enrolment; the reason is stored.

- [ ] **Step 2: [OWNER] Apply a makeup**

Assign a makeup for the skipped week.
Expected: makeup recorded and visible; credit consumed/adjusted as designed.

- [ ] **Step 3: [OWNER] 24h drop cutoff**

Attempt to drop a week inside 24h of its session.
Expected: system enforces the cutoff per the confirmed rule (drop only outside 24h → makeup credit). Record actual behaviour; if it does not enforce, log as a gap for a follow-up plan (not a September blocker if the one dry-run program avoids late drops).

- [ ] **Step 4: [OWNER] Record results** in the runbook.

---

### Task 5: Stand up Stripe → Xero accounting sync

Restores the accounting sync SportsBiz provided, using the native connector (no code). **Owner-run** in the Stripe + Xero dashboards.

- [ ] **Step 1: [OWNER] Connect**

In Stripe Dashboard → Apps, install the official **Xero** connector (or in Xero, add the Stripe feed). Authorise against the correct Xero organisation.

- [ ] **Step 2: [OWNER] Map accounts + tax**

Map Stripe payouts/fees/sales to the same Xero accounts SportsBiz currently posts to, and map GST to the correct Xero tax rate (GST on Income 10%).
Expected: mapping mirrors current bookkeeping so the accountant sees no discontinuity.

- [ ] **Step 3: [OWNER] Reconcile a test batch**

Push the Task 3 test-mode charges (or a small set of live September charges once live) through and reconcile in Xero.
Expected: amounts, GST, and fees land in the right Xero accounts and reconcile cleanly against the bank feed.

- [ ] **Step 4: [OWNER] Record** the mapping decisions in the runbook so December cutover repeats them exactly.

---

### Task 6: Route ONE program to the new flow + create the dry-run runbook

Makes September real for a single program while every other button stays on SportsBiz, and captures the whole verification trail in one durable document.

**Files:**
- Create: `docs/september-dry-run-runbook.md`
- Modify: `client/src/pages/landing.tsx` (exactly one of the 8 SportsBiz buttons)

- [ ] **Step 1: [AGENT] Create the runbook skeleton**

Create `docs/september-dry-run-runbook.md` with sections: Backfill baseline (Task 2), E2E results table (Task 3), Credits/makeup results (Task 4), Xero mapping (Task 5), and a "Chosen dry-run program" line. This is the artifact the owner fills during Tasks 2–5.

- [ ] **Step 2: [OWNER] Choose the dry-run program**

Pick one program/squad to run through the new platform in September (ideally a small, engaged group). Note it in the runbook.

- [ ] **Step 3: [AGENT] Repoint that program's button**

In `client/src/pages/landing.tsx`, find that program's "Enroll Now" button (one of lines ~346, 401, 566, 621, 693, 758, 815, 872 — the ones opening the `thinksmartsoftware` URL). Change ONLY that button to match the working hero pattern at line 189:
```tsx
onClick={() => setLocation('/classes')}
```
Remove its SportsBiz `href`/`window.open`. Leave the other 7 buttons untouched.

- [ ] **Step 4: [AGENT] Verify the change is surgical**

Run: `grep -c "thinksmartsoftware" client/src/pages/landing.tsx`
Expected: **7** (was 8). And `npm run check` introduces no new errors.

- [ ] **Step 5: [AGENT] Commit**

```bash
git add client/src/pages/landing.tsx docs/september-dry-run-runbook.md
git commit -m "feat: route September dry-run program to /classes; add dry-run runbook"
```

- [ ] **Step 6: [OWNER] Deploy + smoke test**

Deploy (push to GitHub main → Fly deploy). On the live site, click the repointed program's button.
Expected: lands on `/classes` in the new flow (not SportsBiz); a full test enrolment completes and charges correctly. The other 7 buttons still open SportsBiz.

---

## Out of Scope (later plans)

- **Stage D** — clearing the 118 admin TS errors (own plan before daily admin reliance).
- **Stage E December cutover** — flip the remaining 7 buttons, full SportsBiz data migration (`scripts/import-sportsbiz.ts`), cancel the $150/mo.
- **Stage F** — coach payroll/timesheets, reporting dashboards, Athlete Metrics + MAJ integration.
