# September Dry-Run Runbook

Owner-run verification trail for the September parallel dry run. Fill each
section as you complete the matching task in
`docs/superpowers/plans/2026-07-10-p2a-september-readiness.md`.
All [OWNER] steps — Claude/agents must not run these against live infra.

## Chosen dry-run program

- **Program/squad:** _(pick one small, engaged group — Task 6 Step 2)_
- **Landing button repointed on:** _(date + commit)_

## Backfill baseline (Task 2)

| Check | Result |
|---|---|
| DATABASE_URL host confirmed | |
| `db:push` diff reviewed (no drops) | |
| Dry-run count (would backfill) | |
| Applied rows created | |
| Active enrolments missing weeks (SQL check) | expect 0: |

## E2E money-path results (Task 3 — Stripe TEST mode)

| Path | Expected charge | Stripe PaymentIntent amount | Weeks rows correct | Pass? |
|---|---|---|---|---|
| Full term | pricePerTerm × (1+gst) | | n/a | |
| Fortnightly per-week | pricePerWeek × selected × (1+gst) | | | |
| Below-minimum guard | blocked, no PaymentIntent | | n/a | |
| Multi-sibling combined | sum of per-athlete amounts, discount applied | | | |
| Casual drop-in | pricePerSession × (1+gst) | | n/a | |

Any mismatch = STOP, raise a bug before proceeding.

## Credits + makeup results (Task 4)

| Behaviour | Expected | Actual | Pass? |
|---|---|---|---|
| Skip future week w/ reason | status flips, credit recorded, reason stored | | |
| Apply makeup | makeup recorded, credit consumed | | |
| 24h drop cutoff | drop blocked inside 24h → makeup credit path | | |

If the 24h cutoff is not enforced: log as a gap for a follow-up plan (not a
September blocker if the dry-run program avoids late drops).

## Stripe → Xero mapping (Task 5)

- Connector installed in: _(Stripe Apps / Xero feed)_
- Xero organisation: _
- Sales account mapping: _
- Fees account mapping: _
- Payout/clearing account: _
- GST tax rate mapped: _(GST on Income 10%)_
- Test batch reconciled cleanly: _(date, notes)_

Record every mapping decision — December cutover must repeat them exactly.

## Sign-off

- [ ] All five money paths verified to the cent
- [ ] Credits/makeup behave (or gaps logged)
- [ ] Xero reconciles
- [ ] Dry-run program button live and smoke-tested
