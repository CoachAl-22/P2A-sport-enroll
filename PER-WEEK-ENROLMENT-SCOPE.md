# Per-Week Enrolment — Scope

**Goal:** Replicate SportsBiz's "untick weeks" term enrolment so parents can pay only for the weeks they'll attend (e.g. fortnightly), removing the last blocker to leaving SportsBiz ($150/month).

## Current state (verified in code)

| Piece | What exists today |
|---|---|
| `term_configurations` | `startDate`, `endDate`, `weeksCount`, `pricePerWeek`, `gstRate` — per-week pricing already modelled |
| `term_holidays` | Excluded dates table with holiday types (public holiday, curriculum day, etc.) |
| `enrollments` | One row per child+class+term. Has `makeupCredits` but **no week-level granularity** |
| Enrollment page | Flat `pricePerTerm`, hardcoded "(10 weeks)" label, 20% sibling discount |
| Checkout | Stripe payment intent for the full term amount |
| Attendance | `/api/attendance/mark` by class+date; absence reasons with `creditsEligible` flags |

## Design

### 1. Schema (new table + migration)

```ts
// enrollment_weeks: one row per week of the enrolment
export const enrollmentWeeks = pgTable("enrollment_weeks", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").references(() => enrollments.id).notNull(),
  weekNumber: integer("week_number").notNull(),        // 1..weeksCount
  sessionDate: date("session_date").notNull(),          // computed from term start + class day
  status: weekStatusEnum("status").default("selected"), // selected | skipped | holiday | credited | makeup
  createdAt: timestamp("created_at").defaultNow(),
});
```

- Migration backfills existing active enrolments with all weeks `selected` (holiday weeks `holiday`).
- A normalized table (vs a JSON column) lets attendance, credits, and makeups reference individual weeks.

### 2. Server

- **`GET /api/classes/:classId/term-weeks`** — computes the dated week list for a class: term `startDate` → `weeksCount` sessions on the class's weekday, flagging any that collide with `term_holidays`.
- **`POST /api/enrollments`** — accepts `selectedWeekNumbers: number[]`; server recomputes price (`selectedWeeks × pricePerWeek × (1 + gstRate)`, sibling discount after) — **never trust the client's total**.
- **Stripe payment intent** amount comes from that server-side calculation.
- **Attendance roll** for a date only includes students whose enrolment has that week `selected` (skipped students excluded or greyed out).
- **Week change endpoint** — parent/admin unticks a future week → status `credited`, increments `makeupCredits` (cutoff rule below).

### 3. Enrollment UI

- Week checkbox grid on the enrollment page: date + week number per row, all ticked by default, holiday weeks shown disabled with the reason.
- One-click **"Fortnightly" preset** (ticks alternating weeks).
- Live price recalculation as weeks are toggled.
- Replace the hardcoded "(10 weeks)" with the real selected count.

### 4. Out of scope (separate pieces)

- Makeup class *booking* UI (credits ledger exists; booking flow is its own feature).
- Xero — handled by Xero's native Stripe bank feed, no code.
- Pro-rata refunds for already-paid weeks (credits only, no money out).

## Business rules (confirmed 2026-06-13)

1. **Minimum weeks:** half the term (e.g. 5 of a 10-week Victorian school term). Full term remains the default with all weeks pre-ticked.
2. **Drop cutoff:** parents can drop a paid week up to **24 hours before** the class; it converts to a makeup credit.
3. **Who edits after payment:** **admin only** for v1 — parents contact Alistair, he adjusts via admin. Parent self-serve is a later phase.
4. **Pricing:** pay only for selected weeks (`selected × pricePerWeek × (1 + GST)`, sibling discount after).
5. **Capacity** (open): whether a skipped week frees the spot for a makeup booking — decide during build step 4.

## Build order (each step deployable on its own)

1. Schema + migration + `term-weeks` endpoint (no UI change, zero risk)
2. Enrollment page week grid + server price calc + Stripe amount
3. Attendance roll filtering by selected weeks
4. Week-change → credit flow (cutoff rule)

**⚠️ Precondition:** pull the current Replit code down first — the local copy is behind the deployed site (live has `/re-enrol`, local doesn't). Building this on stale code risks losing live changes on paste-back.
