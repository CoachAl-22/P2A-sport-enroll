# Fly.io Migration Runbook — POW-14

Migrate SportEnroll (`power2adapt.online`) production hosting from Replit to Fly.io.

## Status

| Step | Item | State | Owner |
|------|------|-------|-------|
| 1 | `Dockerfile` (multi-stage, node:20) | ✅ done, build-validated | Devon |
| 2 | `fly.toml` (region `syd`) | ✅ done | Devon |
| 2b | `/api/health` liveness route | ✅ done | Devon |
| 3 | Fly account + `flyctl` + secrets | ⛔ needs credentials | Alistair |
| 4 | DNS `power2adapt.online` → Fly | ⛔ needs registrar access | Alistair |
| 5 | Neon Postgres reachable from Fly | external — expected OK, verify after deploy | Alistair/Devon |
| 6 | Deploy on main push | config-ready, needs Fly app | Alistair |
| 7 | Keep Replit 2 weeks fallback | operational note | Alistair |

## ⛔ BLOCKER: Object storage uses Replit sidecar

`server/objectStorage.ts` authenticates against the Replit object-storage sidecar at
`http://127.0.0.1:1106` using `@google-cloud/storage` external-account credentials.
**This does not exist on Fly.io.** Any feature that uploads/serves files (athlete photos,
invoices, CSV import artifacts) will fail once traffic moves off Replit.

Resolution options (tracked in child issue):
- Provision a real GCS bucket + service-account key, swap the sidecar credential block for a
  standard service-account key stored as a Fly secret. (Recommended — keeps GCS API.)
- Or migrate to Fly Tigris (S3-compatible) object storage and switch the client to the S3 SDK.

Migration cannot claim feature parity until this is resolved.

## Deploy steps (Alistair, once account exists)

```bash
# from apps/sport-enroll
flyctl auth login
flyctl launch --no-deploy --copy-config --name sportenroll --region syd

# Set secrets (copy values from Replit Secrets):
flyctl secrets set \
  DATABASE_URL=... \
  SESSION_SECRET=... \
  REMINDER_SECRET=2832f3ca1bb9bb4b2aaff1c9b6d66dba71f5f5d5a018022be79492308b71e284 \
  STRIPE_SECRET_KEY=... \
  STRIPE_WEBHOOK_SECRET=... \
  TESTING_STRIPE_SECRET_KEY=... \
  RESEND_API_KEY=... \
  FROM_EMAIL=... \
  TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_PHONE_NUMBER=... \
  VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... \
  VAPID_SUBJECT=mailto:info@power2adapt.com.au
  # + object-storage secrets once blocker resolved

flyctl deploy

# Custom domain + SSL
flyctl certs add power2adapt.online
flyctl ips list          # get the A/AAAA targets
# At registrar: A -> <fly v4>, AAAA -> <fly v6>  (or CNAME apex per registrar support)
flyctl certs show power2adapt.online   # confirm SSL issued
```

## Env vars required as Fly secrets

`DATABASE_URL`, `SESSION_SECRET`, `REMINDER_SECRET`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `TESTING_STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `FROM_EMAIL`,
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`,
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

Replit-only vars NOT needed on Fly: `REPL_IDENTITY`, `REPLIT_CONNECTORS_HOSTNAME`,
`WEB_REPL_RENEWAL`, `PRIVATE_OBJECT_DIR`/`PUBLIC_OBJECT_SEARCH_PATHS`
(replaced by object-storage resolution above).

## Zero-downtime deploy on main push

`min_machines_running = 1` + rolling deploy (Fly default) gives zero-downtime.
For CI, add a GitHub Action running `flyctl deploy --remote-only` on push to `main`
with `FLY_API_TOKEN` (from `flyctl tokens create deploy`) as a repo secret.

## Cost estimate

1× `shared-cpu-1x` / 512MB, always-on (`min_machines_running=1`), syd:
~US$1.94/mo compute + ~US$0.15/mo IPv4 ≈ **US$2–4/mo (~AU$3–6/mo)**, well under the
AU$20 target. Neon stays on its own plan (external, unchanged).

## Acceptance criteria verification (post-deploy)

- [ ] `power2adapt.online` resolves to Fly with valid SSL (`flyctl certs show`)
- [ ] Cold start < 3s — machine is always-on so no cold start; verify TTFB
- [ ] 24h without restart — `flyctl status` machine uptime after a day
- [ ] Monthly cost < AU$20 — confirmed by estimate above
