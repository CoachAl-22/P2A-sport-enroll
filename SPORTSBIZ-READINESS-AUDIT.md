# SportsBiz Replacement Readiness Audit

_Date: 2026-06-13 | Reviewer: Claude Code (Opus 4.8) | Goal: confirm platform can replace SportsBiz ($150/mo)_

## Verdict

**Not yet ready to cut SportsBiz.** Two hard blockers, both fixable. The morning session laid solid per-week foundations; the feature is ~40% wired end-to-end.

---

## BLOCKER 1 — Live "Enroll Now" buttons still send parents to SportsBiz

`client/src/pages/landing.tsx` — 8 buttons open the SportsBiz URL (`thinksmartsoftware-au.com/...t=sportsbiz`):
lines 346, 401, 566, 621, 693, 758, 815, 872.

The hero button (line 189) already routes correctly: `setLocation('/classes')`.

**Impact:** the platform built to replace SportsBiz is still funnelling real enrolment traffic INTO SportsBiz. Until these point to `/classes`, you cannot leave.

**Note before fixing:** redirecting live paying-customer traffic is consequential and mid-term. Only flip these once the new portal is signed off to take real money for Term 3.

---

## BLOCKER 2 — Per-week enrolment is built on the backend but not usable end-to-end

The core SportsBiz-parity feature ("untick weeks / pay fortnightly"). Morning session progress:

| Piece | Status |
|---|---|
| `enrollment_weeks` table + status enum (schema.ts) | DONE |
| `shared/term-weeks.ts` date logic + `minimumSelectableWeeks` (= half term) | DONE |
| `GET /api/classes/:id/term-weeks` endpoint (routes.ts) | DONE |
| Backfill script for existing enrolments | DONE |
| `POST /api/enrollments` accepts `selectedWeekNumbers` + recomputes price | **MISSING** |
| `POST /api/enrollments` writes `enrollment_weeks` rows | **MISSING** |
| Enrollment UI: week-checkbox grid + fortnightly preset + live price | **MISSING** |
| Replace hardcoded "(10 weeks)" label with real count | **MISSING** |

Right now `POST /api/enrollments` (routes.ts:1626) still charges the flat `classData.pricePerTerm`. A parent cannot actually drop weeks or pay fortnightly through the live flow. **This is the real continuation of the morning Fable session.**

`minimumSelectableWeeks = Math.ceil(payable/2)` — matches the confirmed "half the term" rule.

---

## Minor — dead footer links (`href="#"`)

- `landing.tsx:1054-1059` — Athletics, AFL, Soccer, Basketball, Netball, Multi-sports
- `high-performance.tsx:403-406` — Performance Assessment, Coaching Resources, Contact Coach, Athlete Portal

Cosmetic, low traffic. Need a destination decision per link.

---

## Minor — TypeScript errors (~40)

Across admin pages and components (athlete-portal, admin-term-config, admin-sms, video-highlights-parent, login-modal). Vite still runs (transpile-only), but `Property 'map' does not exist on type '{}'` patterns = untyped query results that can crash at runtime. `ObjectUploader.tsx` references a missing `@uppy/react/dashboard-modal` module.

Not launch-blocking, but worth a cleanup pass before relying on the admin tools day-to-day.

---

## UPDATE 2026-06-13 — per-week enrolment now wired end-to-end

Continued the morning session's work. Built and typecheck-clean:

- `POST /api/enrollments` accepts `selectedWeekNumbers`, recomputes price server-side (`pricePerWeek × selected`), validates against payable weeks + the half-term minimum, and writes `enrollment_weeks` rows (selected / skipped / holiday).
- Fixed both payment paths (`/api/create-payment-intent` and `/api/create-batch-payment-intent`) to charge the **stored** payment amount instead of recomputing from flat `pricePerTerm` — this was a latent bug that would have overridden any per-week price.
- Storage: `createEnrollmentWeeks` + `getEnrollmentWeeks`.
- UI: week-picker in the enrolment review step — checkbox grid, holidays disabled, "Full term" + "Fortnightly" presets, live price, half-term minimum guard. Shared across siblings in one booking.
- Full-term selections omit `selectedWeekNumbers`, preserving the exact original flat-price behaviour (no regression for standard enrolments).
- Fixed hardcoded "9 weeks" label in the class-details sidebar.

### Still to do before this is live (cannot be done from here)
1. **`npm run db:push` on Replit** to create the `enrollment_weeks` table.
2. Run `scripts/backfill-enrollment-weeks.ts` (dry run, then `--apply`) for existing enrolments.
3. **End-to-end test on Replit:** enrol fortnightly, confirm Stripe charges the per-week amount; test a full-term enrol still charges the flat price; test the multi-sibling combined checkout.
4. **GST — RESOLVED (2026-06-13):** Alistair confirmed GST should always be applied. `POST /api/enrollments` now charges the ex-GST base × (1 + gstRate) for both per-week and full-term paths, using the term config's `gstRate` (defaults to 10% if no term config). The stored payment amount is GST-inclusive, so both payment intents charge correctly. Note: this means full-term enrolments now charge ~10% more than the previous (GST-omitting) behaviour — expected and correct. Verify the charged total on Replit before going live.

## Recommended order to actually leave SportsBiz

1. Finish per-week POST (price recompute + write weeks) — server, server-trusted price.
2. Build the week-picker UI (grid + fortnightly preset + live price + real week count).
3. Run the backfill script on Replit after `db:push`.
4. End-to-end test a fortnightly enrolment with sibling discount + GST.
5. Flip the 8 landing buttons to `/classes`.
6. Clean up TS errors in admin tooling.
7. Cut SportsBiz at the Dec-Jan break.
