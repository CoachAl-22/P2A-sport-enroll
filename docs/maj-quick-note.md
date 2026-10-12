# MAJ Quick Note

## Behaviour

Coaches dictate using the phone keyboard in Quick Note, press Save note, then review
and individually confirm editable drafts. Claude extraction is not a saved observation
and never sends a notification. Uncertain names need explicit roster selection.
The existing shared MAJ coaching roster remains shared; the free-text `coach` label
is not an ownership or authorization mapping.

Confirmed observations reuse `maj_skill_assessments`. With Send to parent off,
neither the parent APIs nor legacy athlete history/notification APIs return the note.
With it on, parents see only the reviewed parent message, skill, coach and date.
Push delivery is separate from saving: unavailable or failed push is reported honestly.
Retries use a stable client UUID; changing an already-saved retry is rejected.

Parent sign-in reuses website `users` accounts. Enrolled children retain their
existing `children.majAthleteId` links. Coach-created athletes use an additional
parent/athlete link after a private, seven-day invitation is accepted. Invitations
are copy/share links, not automatically emailed. Tokens are stored only as hashes.
Parent APIs check account activity and child ownership on each request.

Offline drafts, unprocessed notes and explicitly confirmed cards are stored only
on the coach's device, scoped by coach identity. Reconnection extracts raw notes
for review; it never silently confirms them. Device storage errors remain visible.

Roster inactivity is independent of account licensing (`enabled`). History, XP,
badges, parent access and athlete login remain intact. Inactive and license-disabled
athletes are excluded from Quick Note matching.

## Additive schema changes

`server/maj-quick-note-schema.ts` applies an idempotent, transactional startup
migration to the existing database, protected by an advisory lock:

- `maj_athletes.roster_active` (true by default).
- Existing `maj_skill_assessments`: `observation_kind`, `skill`, `parent_message`,
  `send_to_parent`, unique nullable `client_note_id`, `coach_username`.
- Existing `maj_push_subscriptions`: nullable athlete ID and nullable parent ID
  referencing `users`. Athlete subscriptions and parent subscriptions are separate
  recipient identities; Quick Note never calls athlete push.
- `maj_parent_links`: parent-to-athlete junction for athletes without an enrolment.
- `maj_parent_invites`: hashed token, athlete, invited email, expiry, accepting parent.

No existing history or account data is deleted or migrated to another database.
Legacy assessments are explicitly distinguished from Quick Notes.

## Endpoints

All are under `/api/maj/` unless noted.

Coach-authenticated:
- `POST observe` — `{note}`; returns validated editable drafts and active roster.
- `POST observe/confirm` — reviewed fields, `clientNoteId`, `send_to_parent`.
- `GET athlete/:id/quick-notes` — complete coach observation history.
- `POST coach/athletes` — `{name,group}`; no parent or login details required.
- `PATCH coach/athletes/:id/active` — `{active}`; soft roster status only.
- `POST coach/athletes/:id/parent-invite` — `{email}`; returns a shareable invite path.

Parents:
- `GET parent/me` — parent identity and linked children.
- `GET parent/athlete/:id/journey` — progress, badges and shared parent messages only.
- `POST parent/push/subscribe` — `{subscription}`; associates this device with parent.
- `POST parent/push/unsubscribe` — `{endpoint}`; used before parent logout.
- `GET parent/invite?token=…` — private invitation preview.
- `POST parent/accept-invite` — token plus invite-gated signup details, or existing
  invited parent session. Consumes invitation and renews the session.

Reused: `/api/auth/login`, `/api/auth/logout`, `/api/maj/logout`, existing
`/api/maj/push/public-key` and the existing web-push/VAPID sender.

## Main files

- `public/my-athletic-journey.html`, `public/maj-quick-notes.js`: PWA UI.
- `public/sw.js`: refreshed static cache; authenticated API responses stay uncached.
- `server/maj-quick-notes.ts`: extraction, confirmation, invitations, parent APIs.
- `server/maj-quick-note-domain.ts`: validation, deterministic matching and projections.
- `server/maj-quick-note-schema.ts`, `shared/schema.ts`: additive schema.
- `server/routes.ts`, `server/storage.ts`: integration and legacy privacy filtering.
- `server/index.ts`: sensitive draft, parent and invitation responses excluded from logs.
- `server/maj-quick-note-domain.test.ts`, `server/maj-quick-notes.integration.test.ts`,
  `scripts/maj-quick-notes-ui.test.ts`: matching, persistence/privacy and browser logic.

## Setup

1. Configure `ANTHROPIC_API_KEY` in Replit Secrets. The analytics-specific key is not
   reused. Extraction uses the requested Anthropic SDK model `claude-sonnet-5-5`.
2. Keep the existing `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` pair for web push.
   If this environment has no pair, configure one; do not rotate a working published
   pair, as existing subscriptions use its public key.
3. Parents sign in inside MAJ using their existing website parent account, or accept
   a coach's invitation for a new account. They must enable browser notifications.
   On iOS, web push requires a supported installed Home Screen PWA.
4. Publish after configuration. Startup applies the additive migration in that
   deployment's existing database. No separate SQL command is required.

Run `npm run check`, `npm test` and `npm run build`. Integration tests use their own
synthetic development fixtures and clean them up, and skip if DATABASE_URL is absent.
With the development workflow running, `npx tsx scripts/verify-maj-quick-note-live.ts`
also checks real session cookies, private/shared notes and inactive athlete login,
then removes its synthetic fixtures. It makes no Claude API call.
Claude and push tests are mocked: they do not verify a real API key, model access,
browser push receipt or a signed-in visual screenshot.
