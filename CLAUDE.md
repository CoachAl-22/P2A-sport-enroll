# yed Australia/Melbourne
SportsEnrol (P2A-sport-enroll) - Project Instructions

Power2ADAPT's enrolment platform, replacing SportsBiz (Thinksmart Software, $150/mo AUD).
Owner: Alistair Tait (Al). Live at https://www.power2adapt.online

Architecture detail lives in `replit.md`. This file is the working handover: state, rules, timeline, gotchas.

## The mission and the deadline

- Emulate SportsBiz ease of use + better UI. Quality bar: five-star booking portals (Mindbody, Jackrabbit Class standard)
- **Cut SportsBiz December 2026.** Term 3 2026 runs 13 Jul to 18 Sep (enrolment closes 10 Sep). Term 3 + 4 are the parallel-running proof period
- Re-enrolment automation must work before 2027 Term 1 re-enrolment (~late Nov). No scheduler exists yet

## Deploy workflow (three copies of this repo - follow strictly)

1. **Mac clone** (`~/1_AI-OS/my-assistant-coach/projects/P2A-sport-enroll`): where Claude edits. Always `git pull --no-edit` BEFORE editing
2. **GitHub** (CoachAl-22/P2A-sport-enroll): source of truth. Push after every session
3. **Replit** (~/workspace): the live site. `git pull --no-edit` then REPUBLISH (a pull alone does not deploy; the site serves the built bundle)

Lessons already paid for: never run bare `git add -A` outside the project folder (a git repo sits at Al's $HOME); Replit creates "Published your App" commits on every republish, so pull with `--no-edit`; 35 stranded Replit commits once caused a major merge mess - push from wherever you worked, every session.

## Non-negotiable business rules

- Pricing: $30/week ex GST x selected weeks; GST (10%) always added on top. Full term = all payable weeks. Server computes all prices - never trust the client
- Terms follow the Victorian school calendar; Toorak/Peninsula Grammar terms can be 9 weeks vs 10 (separate term configs per length)
- Per-week enrolment minimum = half the payable weeks
- Waitlist-only classes (e.g. Foundation Tuesday Toorak) use capacity 0 so all bookings route to the waitlist; it becomes a real class at 10-20 names
- Makeup credits (SportsBiz parity, not yet built): absence = holiday makeup class OR credit to next term
- Australian spelling in parent-facing copy (enrolment), AUD currency, dates DD/MM or "Thursday 16 July"
- Never commit `.env` (gitignored). Timestamps stored UTC, display
## Current state (as of 2026-07-04, commit b625034 pushed, NOT yet deployed - Replit credits exhausted)

Shipped and live: class browser with term selector + current-term default, quiz, per-week picker with GST, Stripe payments (real money confirmed: $33-$660 charges), waitlist join + notify with booking link, password reset, admin enrolment-open gate, rate limiting, helmet.

Pushed awaiting deploy (b625034): confirmation email per child from the Stripe webhook (first session date, venue, amount, invoice number) + first-session date in confirmation SMS.

Confirmations only fire if ALL THREE hold: Stripe webhook endpoint registered for `/api/webhook/stripe` with matching STRIPE_WEBHOOK_SECRET; Twilio secrets set on Replit; the paying account has a mobile number. Al's admin account likely lacks a mobile - test with a real parent-style account.

## Backlog (priority order)

Full detail: `projects/sportsenrol/BACKLOG.md` in the assistant workspace. Top items:

1. Deploy b625034 + one live test enrolment (full term, per-week, sibling batch)
2. Admin waitlist demand view (when does Tuesday Toorak hit 10-20 names?)
3. Notify-me-when-open capture on closed classes
4. Route-level code splitting - App.tsx has zero React.lazy; every phone downloads a single ~2 MB bundle
5. Sibling discount end-to-end verification at checkout
6. Re-enrolment priority window + scheduler (hard deadline late Nov)
7. Makeup credits parent UI; admin reporting (under-target/near-capacity/abandoned); ~40 TS errors in admin pages

## Known gotchas

- The service worker (`public/sw.js`) caches aggressively: after a republish, verify changes with a hard reload before declaring anything broken
- `wouter` strips query params - read them from `window.location.search` (see confirmation.tsx, reset-password.tsx)
- `classes.dayOfWeek`: 1=Mon..7=Sun; JS `getDay()` 0=Sun - convert with `% 7`
- Two term configs can exist per term (9-week vs 10-week venues); classes point at `termConfigId`
- Foundation Monday (Peninsula) still points at the old Term 2 termConfigId (harmless while per-week is off; fix when convenient)
- Admin routes use inline role checks, not middleware - copy the existing pattern for new admin endpoints
- The repo tracks `dist/` - stale build artefacts can mislead; trust source + the live site, not dist

## Assistant-side records (in `~/1_AI-OS/my-assistant-coach`, not this repo)

- `projects/sportsenrol/AUDIT-2026-07-02.md` - full platform audit + priority timeline
- `projects/sportsenrol/SIGNUP-FLOW-REVIEW-2026-07-04.md` - five-star UX review + confirmation diagnosis
- `projects/sportsenrol/BACKLOG.md` - living backlog with done-log
- `decisions/log.md` - decision log (December cut decision recorded 2026-07-02)
