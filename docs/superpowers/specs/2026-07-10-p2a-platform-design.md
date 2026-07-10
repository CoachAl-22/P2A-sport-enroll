# P2A Platform — SportsBiz Cutover Plan

**Date:** 2026-07-10
**Owner:** Alistair Tait (Power2ADAPT PTY LTD)
**Status:** Design approved (revised after codebase discovery)
**Codebase:** `~/1_AI-OS/apps/sport-enroll` — GitHub `CoachAl-22/P2A-sport-enroll`, live at power2adapt.online

> **Revision note:** The first draft of this spec assumed a greenfield build. Inspecting the code showed the platform is already ~60–70% built and deploying. This revision reframes the work as **closing the gap to switch off SportsBiz**, not building from scratch.

## Problem

Power2ADAPT pays ThinkSmart **SportsBiz $150/mo AUD** for club operations. A replacement app already exists and takes real enrolments, but SportsBiz cannot yet be cancelled — some parity features are unverified/undeployed, there is no accounting sync, and live "Enroll Now" traffic still flows into SportsBiz. Each school holiday Al re-enrols on SportsBiz because the switch isn't ready.

## Goals

- Close the remaining gaps and **fully retire SportsBiz** to capture the $150/mo saving.
- Preserve **zero-friction signup and payment** (guest checkout already exists — do not regress it).
- Restore accounting sync (SportsBiz → Xero) that the new app currently lacks.
- Keep staff/coach tools simple and phone-friendly.

## Non-Goals (YAGNI)

- Multi-club / franchise features.
- In-app messaging threads (SMS + email cover comms).
- Re-platforming — keep the current stack, do not rewrite.
- Building custom card-entry UI (Stripe-hosted checkout stays).

## Current State — What's Already Built

**Stack:** Express + React + Vite + Drizzle ORM on **Neon Postgres**; **Stripe** (payment intents, receipts, GST-inclusive), **Twilio** (SMS), **Resend** (email); Docker + **Fly.io** deploy config (migrating off Replit).

**Shipped features:**
- Guest checkout + `/re-enrol` flow (frictionless signup principle already realised).
- Casual drop-in enrolment (POW-17); term selector (POW-18).
- Attendance with absence reasons (POW-12).
- Branded invoice PDF auto-emailed on payment; Stripe receipt emails.
- Sibling discount + multi-sibling combined checkout.
- GST always applied (ex-GST base × 1+gstRate), both per-week and full-term paths.
- **Per-week enrolment** (untick weeks / fortnightly, half-term minimum) — `enrollment_weeks` table, server price recompute, week-picker UI. Built and typecheck-clean; deployment/e2e-test status on live host unverified.
- **Credits + makeup classes** — code present in schema, routes, storage, `invoiceService`, and an `enrollment-weeks-dialog` admin component. Completeness/behaviour unverified.

## Payments & Accounting — Corrected Picture

- **Payments:** already on **Stripe**. The originally-stated Ezipayment/Spreedly migration is effectively done in code.
- **Xero:** **not integrated (zero references).** This is the main missing capability. Two paths:
  - **(Recommended) Stripe → Xero native connector** — configured in the Stripe/Xero dashboards, near-zero code, keeps bookkeeping automatic.
  - Keep branded PDF invoices + periodic CSV/manual entry into Xero — cheaper to start, more manual, error-prone.

## The Blockers to Leaving SportsBiz

1. **Live traffic still goes to SportsBiz.** `client/src/pages/landing.tsx` — 8 "Enroll Now" buttons still open the `thinksmartsoftware` URL. Until repointed to `/classes`, the platform funnels its own customers into the tool it's meant to replace. (Flip only once the new flow is signed off to take real money.)
2. **Per-week / credits / makeup unverified live.** Built but needs `db:push`, backfill, and end-to-end testing against real Stripe charges on the live host.
3. **No accounting sync.** No Xero path yet (see above).
4. **Admin tooling fragility.** ~118 TypeScript errors (up from ~40 in June), concentrated in admin pages (attendance, SMS, term config, portal). Untyped query results can crash at runtime — risky for daily admin reliance.

## Staged Plan (gap-closing, in cutover order)

| Stage | Delivers | Notes |
|-------|----------|-------|
| **A — Verify & deploy built features** | `db:push` `enrollment_weeks`; run backfill; e2e-test fortnightly + full-term + sibling + GST; verify credits + makeup behave correctly | Confirms parity features actually work with live Stripe before relying on them |
| **B — Xero accounting** | Stand up Stripe → Xero native connector; reconcile account/tax mapping to current bookkeeping | The real missing piece; recommended over manual CSV |
| **C — Flip the switch** | Repoint the 8 landing buttons SportsBiz → `/classes` | Point of no return for new traffic; do only after A + B signed off |
| **D — Admin hardening** | Clear the 118 TS errors in admin tooling; fix `ObjectUploader` missing module | So day-to-day admin doesn't crash |
| **E — Cutover** | Migrate/reconcile SportsBiz data; run parallel one term; **cancel the $150/mo** | Two-window strategy (below) |
| **F — Features later** | Coach payroll/timesheets (L2 $50/hr, L3 $60–65/hr, 2-hr min, 12.5% super); reporting dashboards; Athlete Metrics + MAJ integration | Growth |

## Cutover Timing — Two-Window Strategy (decided 2026-07-10)

- **September (Term 3→4 holidays) — soft launch / dry run.** Run the new platform *in parallel* with SportsBiz. Route a slice of enrolments (one program or squad) fully through the new flow — real Stripe charges, real Xero entries, real parent feedback — while SportsBiz handles the rest. Do **not** flip all 8 buttons or cancel anything. Purpose: shake out bugs under real conditions at low risk.
- **December (Dec–Jan break) — hard cutover.** With September's validation done, flip all landing buttons to `/classes`, migrate/reconcile remaining data, and cancel SportsBiz.

Xero path confirmed: **Stripe → Xero native connector** (Stage B).

## Risks & Mitigations

- **Flipping live buttons too early** — parents hit an unfinished flow. Mitigate: A + B fully signed off first; flip at a term boundary.
- **Per-week price/GST bugs** — a latent bug already existed where payment intents recomputed from flat price. Mitigate: e2e-test the actual Stripe charge for every path in Stage A.
- **Xero mapping mismatch** — accounts/tax codes differ from SportsBiz bookkeeping. Mitigate: reconcile a term of test transactions before cutover.
- **Admin crashes from untyped queries** — Mitigate: Stage D before daily reliance.
- **Data migration fidelity** — reconcile enrolment counts + balances from SportsBiz export before cancelling.

## Success Criteria

- Every enrolment path (full-term, fortnightly/per-week, casual, multi-sibling) charges the correct GST-inclusive amount in Stripe, verified live.
- Payments flow into Xero automatically.
- All 8 landing buttons route to `/classes`; no traffic reaches SportsBiz.
- Admin tools (attendance, SMS, term config) run without runtime crashes.
- SportsBiz cancelled at the Dec–Jan break; $150/mo saving realised with no operational regression.
