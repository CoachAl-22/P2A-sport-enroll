# Set Up New Term: Admin Tool Design

_Date: 2026-06-13_
_Project: P2A-sport-enroll (SportsBiz replacement)_

## Purpose

Replace the manual, per-term class rebuild that SportsBiz forces on Alistair with an in-app wizard. Each term he creates a fresh set of classes (same definitions, new date range). The tool clones the previous term's classes into a new term, lets him adjust them, and links everything to a new term config so per-week (fortnightly) enrolment works.

This is the operational piece that makes per-week enrolment usable for a live term, and removes a recurring chore every term going forward.

## Background

- SportsBiz uses one schedule per term (term tabs). A class is defined by day + time/duration + venue + program + coach + student limit; the term supplies the date range. Definitions repeat term to term.
- The app already mirrors this: separate `classes` rows per term, each optionally linked to a `term_configurations` row via `term_config_id`.
- Per-week enrolment (the `enrollment_weeks` table, term-weeks logic, week-picker UI, GST-inclusive pricing) is already built and deployed. It currently shows the week-picker for any class that has a `term_config_id`.
- Term 3 2026 (starts 13 July 2026) has no term config and no class rows yet. All Term 3 2026 classes show 0 enrolments, so it is a clean slate.
- Known constraint: the live database and the repo schema have drifted. `drizzle-kit push` attempts destructive changes. All schema changes ship as hand-written SQL run in the Replit shell.

## Scope

In scope:
- A 4-step admin wizard at `/admin/setup-term`.
- Creating a term config (with holidays) as part of the wizard.
- Cloning a source term's class definitions into the new term.
- A per-class edit form (SportsBiz-style) for adjusting cloned classes and adding/removing classes.
- A per-class `per_week_enabled` toggle controlling whether the week-picker appears.
- Updating the per-week picker to require `term_config_id` AND `per_week_enabled`.

Out of scope:
- Saved master templates (clone-from-previous-term only for now).
- Rolling enrolled families/auto re-enrolment into the new term (handled by existing autoRenew / re-enrol flow).
- Cleaning up the existing duplicate/mispriced legacy class rows (separate task).

## Flow

### Step 1: Create the term config
- Fields: term (enum, e.g. `term_3`), year, name (auto "Term 3 2026", editable), start date, end date, weeks count (auto-calculated from dates, editable), price per week (default 30), GST rate (default 0.10).
- Holidays: add date + name rows, written to `term_holidays`. These mark no-class weeks.
- Guard: if a config already exists for that term + year, offer to reuse it rather than create a duplicate.

### Step 2: Pick the source term to clone from
- Dropdown of existing terms, showing how many classes will be copied.
- Guard: if the target term already has classes linked, block and warn (prevents duplicates). Offer to view the existing classes instead.

### Step 3: Review and adjust classes
- Show the cloned classes: program, day, time, venue, coach, capacity, per-week toggle.
- Per-class edit form modelled on the SportsBiz Add Class dialog: day of week, start time, duration (auto-derived finish time), venue, coach, program / sport type, student limit, notes, per-week on/off.
- Add a class or remove a class.
- Per-week defaults ON for Emerging and Foundation programs, OFF for all others.

### Step 4: Confirm and create
- Create the class rows linked to the new term config, enrolment counts reset to 0, coaches carried over from the source.
- Show a summary of what was created.

## Data Model

**New column:**
- `classes.per_week_enabled` boolean, default `false`.

**Behaviour change:**
- The week-picker (GET `/api/classes/:id/term-weeks` consumers and the enrolment form) shows the week selector only when the class has a `term_config_id` AND `per_week_enabled = true`. Previously it showed for any class with a `term_config_id`, which would wrongly appear on Junior Academy / Senior Squad / POWER2ADAPT.

**Migration delivery:**
- All schema changes ship as hand-written SQL (`ALTER TABLE classes ADD COLUMN per_week_enabled boolean NOT NULL DEFAULT false;`) run in the Replit shell. Do not use `drizzle-kit push` due to the live-vs-repo schema drift.

## Backend

Admin-role required on every endpoint.

- Reuse existing term-config routes (`POST /api/term-configurations`, holidays routes) for Step 1.
- New clone endpoint: copy a source term config's classes into a target term config. Copies class definitions (day, time, venue, coach, program, capacity, notes), sets the new `term_config_id`, resets `current_enrollment` to 0, applies per-week defaults. Never copies enrolments or payments.
- Extend existing class create/update routes to accept `per_week_enabled`.

## Safety

- Block cloning when the target term already has classes (duplicate prevention).
- Admin-role guard on all setup-term endpoints.
- Clone copies class definitions only, never enrolments or payments.

## Testing

- Logic tests: clone produces the correct rows; enrolment counts reset to 0; per-week defaults correct by program; duplicate-guard fires when target already populated.
- Manual on Replit: run the wizard for Term 3 2026; confirm classes appear; confirm the week-picker shows only on Emerging/Foundation; enrol one fortnightly booking end to end and confirm the GST-inclusive charge.

## Open follow-ups (not blocking)

- Legacy class cleanup: retire duplicate rows, fix `price_per_term` misconfigurations ($30 where $300 is correct), clear stale Term 3 2025 links.
- Optional future: saved master schedule template.
