# Operator Handoff, Cutover, and Rollback

Status: template — no launch while any required field is blank

## Named-owner worksheet

| Area                      | Primary owner | Backup owner | Coverage window | Evidence link |
| ------------------------- | ------------- | ------------ | --------------- | ------------- |
| Stripe/tax/webhooks       |               |              |                 |               |
| Supabase/Postgres/restore |               |              |                 |               |
| Render deploy/rollback    |               |              |                 |               |
| DNS/SSL/HSTS              |               |              |                 |               |
| Customer support          |               |              |                 |               |
| Monitoring/on-call        |               |              |                 |               |
| Go/no-go authority        |               |              |                 |               |

## Existing health and alert contract

- Liveness: `GET /health`.
- Catalog/database readiness: `GET /catalog/health`.
- Protected staff routes must reject absent/incorrect credentials with `401`.
- Run `pnpm launch:smoke:read-only -- --web-url <https-url> --api-url <https-url> --expected-origin <https-origin>` after deployment. It prints statuses/header outcomes only and sends no credentials.

Create alerts or log queries for:

| Signal/pattern                                                                      | Severity and response                                                                            |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `Stripe webhook manual_review:`                                                     | Immediate payment-operations review; do not fulfill until reconciled                             |
| `checkout_failed` or checkout-session creation failure                              | Page support/on-call on repeated failures; verify API, catalog, Stripe mode, and safe error rate |
| Repeated `401`/`403` on admin/internal APIs                                         | Security/support investigation; never disable auth to clear the alert                            |
| `catalog`/database unavailable, Prisma connection errors, `/catalog/health` failure | Stop checkout attempts; database and Render owners investigate connection/availability           |
| `/health` failure or deployment health failure                                      | Render owner rolls back if not restored within the agreed window                                 |
| Stripe endpoint non-`2xx` or webhook delivery retries                               | Stripe owner stops payment testing and restores verified service path                            |

Logs, screenshots, and tickets must exclude secret values, full webhook payloads, session cookies, internal tokens, full customer contact/address data, and card/payment details.

## Explicit risk register

| Risk                                                  | Impact/control                                                                                           | Required decision                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Inventory has no reservation/authoritative stock gate | Oversell or fulfillment delay; support confirms availability and operator reviews orders                 | Accept / mitigate / stop; owner + expiry       |
| CSP deferred                                          | Reduced browser-layer injection defense; existing headers/auth/validation remain                         | Accept staged hardening / stop                 |
| Two moderate advisories                               | Limited applicability documented separately; monitor upstream                                            | Accept / remediate / stop                      |
| Shipment email is manual                              | Customer notification delay; named support owner uses the saved shipment record and manual email process | Accept with coverage / stop                    |
| Policy drafts unapproved                              | Customer/legal promises may be wrong                                                                     | Approve/edit before GO; cannot silently accept |

Record each decision, named owner, date, expiration/review date, and evidence reference. “TBD” is not valid at go/no-go.

## Cutover checklist

- [ ] CI and local release evidence green for the exact approved commit.
- [ ] Policy/promise matrix approved; all residual risks signed.
- [ ] Production project/connection targets confirmed without copying values.
- [ ] Prisma migrations verified; timestamped backup and restore evidence recorded.
- [ ] After backup and migration-state verification, database owner approves a forward cleanup migration for the three dormant shipment-notification columns; no applied migration is edited.
- [ ] RLS, counts, paid-order visibility, connection health, and DB rollback owner confirmed.
- [ ] Stripe tax treatment and test cases approved; mode, URLs, webhook, duplicate/manual-review, and paid-order proof complete.
- [ ] Render variables validated in actual web/API shells using `--expected-mode` and `--expected-origin`.
- [ ] Health checks, alerts, notifications, support/on-call, and rollback origin active.
- [ ] Apex/`www`/`.com` policy, DNS records, certificates, TTL/rollback records confirmed.
- [ ] Read-only final-origin smoke passes; final authorized checkout proof passes.
- [ ] Go/no-go owner records GO with timestamp and evidence index.

## Stop conditions

STOP on any payment-mode mismatch, webhook signature/delivery/amount/country inconsistency, missing paid-order transition, database uncertainty, missing backup/restore evidence, failing health/readiness/CORS/auth, invalid SSL, unexpected customer promise, unowned risk, unavailable support/monitoring coverage, or any high/critical advisory. Do not make more payment attempts while a payment-path stop is active.

## Rollback checklist

- [ ] Announce STOP and name the incident owner/time.
- [ ] Stop new payment tests and customer traffic changes.
- [ ] Restore the last verified Render release/origin path; do not edit payment truth or webhook logic during rollback.
- [ ] Restore prior DNS records only from the reviewed rollback record, accounting for TTL.
- [ ] Keep the existing webhook endpoint stable unless a separately approved incident procedure requires otherwise.
- [ ] Do not restore or mutate production data without database-owner approval and verified scope.
- [ ] Re-run liveness, readiness, auth rejection, CORS, and public smoke on the rollback path.
- [ ] Reconcile any checkout started during the incident before fulfillment.
- [ ] Record outcome, customer/support impact, and criteria for a new go/no-go.
