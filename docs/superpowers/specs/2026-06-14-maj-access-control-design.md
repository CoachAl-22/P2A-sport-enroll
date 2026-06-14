# MAJ Access Control Design

_Date: 2026-06-14_
_Project: P2A-sport-enroll (SportsBiz replacement)_

## Purpose

Tie My Athletic Journey (MAJ) app access to enrolment. When a child's enrolment is paid, a MAJ athlete account is created automatically. Admins can enable/disable any athlete's MAJ access with a single toggle (for non-re-enrolment, lapsed white-label licences, or behaviour management), and see/reset credentials — all from the admin panel, no SQL.

## Background (current state)

- `maj_athletes` is a standalone table: `username` (unique), `password` (**plain text**), `fullName`, `grade`, `program`, `coach`, `school`, plus progress fields. Athletes are created manually via `POST /api/maj/athletes` (admin) or seed scripts. There is **no** link to `children` or enrolments, and **no** enabled/active check.
- `children` has no MAJ link.
- MAJ login is `POST /api/maj/login` (username + password → session `majAthleteId`); no access gate.
- Enrolment becomes `active` (payment confirmed) in `server/routes.ts` at the Stripe webhook (`payment_intent.succeeded`) and the payment-confirm endpoints — all call `storage.updateEnrollment(enrollmentId, { status: "active" })`.

## Decisions (from brainstorming)

- **Scope:** auto-provision new paid enrolments **and** backfill children already enrolled.
- **Passwords:** shared per school + year (e.g. `PG2026`); revisit unique-per-athlete + hashing later.
- **School:** derived automatically from the class venue.
- **Security:** passwords stay plain text for now (matches the existing system and enables the shared-school model + admin viewing); flagged for a future security pass.

## Data Model

- `maj_athletes`:
  - `enabled` boolean, default `true` — the login gate.
  - `school_code` varchar (e.g. `PG`, `TC`, `P2A`).
- `children`:
  - `maj_athlete_id` uuid, FK → `maj_athletes.id`, nullable — links an enrolled child to their MAJ login.

`enabled` lives on the athlete (not the child) so the login gate is one clean check; the admin toggle on a child flips the linked athlete's `enabled`.

Migrations ship as hand-written SQL run in the Replit shell (never `drizzle-kit push`), then dev→prod copy.

## Venue → school code + password

A small mapping (in code):
- "Peninsula Grammar" → `PG`
- "Toorak College" → `TC`
- everything else (Mornington, Ballam Park, etc.) → `P2A`

Password = `schoolCode + year`, where year is the enrolment's term year (fallback: current year). Example: `PG2026`, `P2A2026`.

## Auto-provisioning

A single helper `provisionMajAccess(childId, classId)`:
1. Load the child. If `child.maj_athlete_id` is set, return (idempotent — re-enrolment or a second class never duplicates).
2. Resolve the class → venue → `schoolCode`; compute `password = schoolCode + year`.
3. Generate `username = (firstName + lastName[0]).toLowerCase()` stripped to alphanumerics (e.g. `eddyk`). On collision with an existing `maj_athletes.username`, append the smallest integer that is free (`eddyk2`, `eddyk3`, …).
4. Create the maj_athlete: `username`, `password`, `fullName = "First Last"`, `school` (venue/school name), `school_code`, `enabled: true`.
5. Set `children.maj_athlete_id` to the new athlete.

Called wherever an enrolment transitions to `active`: the Stripe webhook and the confirm endpoints. Wrapped in try/catch so a provisioning hiccup never blocks payment confirmation (logged for follow-up).

## Backfill (one-off)

`scripts/backfill-maj-access.ts` (run with tsx, dry-run by default, `--apply` to write):
- For every child with at least one `active` enrolment and no `maj_athlete_id`, run the same `provisionMajAccess` logic.
- Idempotent and safe to re-run; skips already-linked children; never modifies existing standalone MAJ athletes.

## Admin toggle + credentials

In the admin children/customers view, each child row shows:
- **MAJ access toggle (✅/❌)** → `PUT /api/maj/athletes/:id` setting `enabled`. Off blocks login immediately.
- **Username** (read-only).
- **Password** with a **reset** action → sets a new password (defaults to the school+year value, or an admin-entered value).
- Children with no linked MAJ athlete show a **"Create MAJ access"** action that runs `provisionMajAccess`.

New admin endpoints (admin-only): update athlete `enabled`, reset password, and provision-for-child. Reuse existing `maj_athletes` storage where possible.

## Login gate

`POST /api/maj/login`: after verifying username + password, check `enabled`. If `false`, return a 403 with message: *"Your MAJ access is currently inactive — speak to your coach to re-enrol."* The MAJ client shows this message.

## Error handling

- Provisioning failures are caught and logged; they never fail the payment/enrolment flow.
- Username collisions resolved by numeric suffix.
- Backfill reports counts (created / skipped-linked / skipped-no-active-enrolment) and supports dry-run.

## Testing

- Unit (tsx): username generation + collision suffixing; venue → school code mapping; password = code + year; `provisionMajAccess` is idempotent when a child is already linked.
- Manual on Replit: pay a test enrolment → MAJ athlete auto-created with expected username/password/school; toggle access off → login shows the inactive message; toggle on → login works; reset password works; run the backfill (dry-run then apply) and confirm existing enrolled children get accounts.

## Out of scope (future)

- Hashing passwords / unique-per-athlete passwords (security pass).
- Parent-facing display of MAJ credentials.
- Per-school admin-configurable password patterns (currently derived).
