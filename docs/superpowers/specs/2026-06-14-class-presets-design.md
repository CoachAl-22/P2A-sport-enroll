# Class Presets Design

_Date: 2026-06-14_
_Project: P2A-sport-enroll (SportsBiz replacement)_

## Purpose

When an admin adds a class, they currently free-type the name, description, sport type, ages, and price — which produces inconsistent class names, descriptions that drift from the website, and pricing/GST mistakes. This feature adds a fixed set of **class presets**: choosing a program from a dropdown auto-fills the canonical name, the website-matching description, the sport type, the age range, and the standard per-session rate. The admin then sets only the per-class details (day, time, venue, coach, capacity).

This also makes the "Set Up New Term" flow and ongoing class admin fast and consistent.

## Scope

In scope:
- A fixed list of class presets defined in code (one per program).
- A "Choose a class template" dropdown at the top of the Add Class admin form that auto-fills name, description, sportType, minAge, maxAge, pricePerSession, and the per-week default.
- The admin still fills day, time, venue, coach, capacity, and can override any auto-filled field.

Out of scope:
- Editing presets via an admin UI (presets are code-maintained; changing copy/price is a code change).
- Changing how GST is applied (already: per-session $30 + 10% = $33 at checkout).
- Changing the application-only enrolment flow for Junior Academy / Senior Squad / Elite HP.

## Presets

Defined as a fixed array in code. Each preset:

| Program | sportType | minAge | maxAge | pricePerSession | perWeekEnabled default | Description |
|---|---|---|---|---|---|---|
| Foundation | `foundation_prep_year2` | 5 | 8 | "30.00" | true | "Movement skills, games and confidence in a fun, welcoming environment. Designed for Prep–Year 2 athletes aged 5–8." |
| Emerging | `emerging_year3_6` | 8 | 12 | "30.00" | true | "Running, jumping, throwing and sport-specific athletic development for Year 3–6 athletes aged 8–12." |
| Team Sport Speed | `team_sport_speed` | 12 | 99 | "30.00" | false | "Speed, agility and athleticism training for team sport athletes. Ideal for AFL, soccer, basketball, netball and more." |
| Junior Academy | `junior_development` | 12 | 16 | "30.00" | false | "The Power2ADAPT Junior Academy is an in-person athletic development programme for young athletes aged 12–16, designed for multi-sport athletes who want to build the physical foundations that make them better at every sport they play — not just one. Sessions run up to twice per week and focus on movement quality, speed, strength, and athletic confidence — skills that transfer across all sports and carry athletes forward as they grow." |
| Senior Squad | `senior_squad` | 16 | 99 | "30.00" | false | "High-level squad training for committed senior athletes aged 16+. Structured sessions focused on performance, competition preparation and athlete development." |
| Elite HP Squad | `empowered_athlete_program` | 16 | 99 | "30.00" | false | "Next-level performance training for elite athletes. By application only. Advanced programming, individualised coaching and competition-ready conditioning." |

Notes:
- `pricePerSession` is the ex-GST rate; the system adds 10% GST at checkout, so families pay $33/session. This is unchanged.
- `perWeekEnabled` default ON only for Foundation and Emerging (per the per-week scope decision). The admin can still toggle per-week per class after creation.
- Junior Academy, Senior Squad, and Elite HP remain application-only in the enrolment funnel regardless of their per-session rate — that flow is unchanged.

## Architecture

**Single source of truth:** a new module `shared/class-presets.ts` exporting the preset array and a TypeScript type. Living in `shared/` keeps it usable by client (the dropdown) and, if ever needed, the server.

**UI integration:** the Add Class form (in `client/src/pages/admin-classes.tsx`) gets a "Choose a class template" `Select` at the top of the create form. On selection, it sets the form fields (name, description, sportType, minAge, maxAge, pricePerSession, perWeekEnabled) from the chosen preset. All fields remain editable; nothing is forced.

**No schema change.** Presets only populate existing `classes` columns. (`per_week_enabled` already exists.)

## Data Flow

1. Admin opens Add Class form.
2. Admin selects a program from the template dropdown.
3. The form's state is populated from the matching preset (name, description, sportType, ages, pricePerSession, perWeekEnabled).
4. Admin fills day, time, venue, coach, capacity (and may edit any auto-filled field).
5. Submit posts to the existing `POST /api/classes` route — no API change needed.

## Error Handling

- If no preset is selected, the form behaves exactly as today (manual entry).
- Selecting a preset overwrites the relevant fields; a brief note tells the admin they can edit anything after applying a template.

## Testing

- Logic test (tsx): the presets array has one entry per program, each with non-empty name/description, a valid sportType, numeric ages with min ≤ max, a "30.00" pricePerSession, and perWeekEnabled true only for Foundation and Emerging.
- Manual: in Add Class, pick each template and confirm the fields populate correctly; edit a field after applying; submit and confirm the class is created with the expected values.

## Open follow-ups (not blocking)

- A later iteration could make presets editable via an admin page (DB-backed) if the program lineup or copy starts changing often.
