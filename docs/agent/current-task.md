# Current Task

## Active task

Recover and advance automated customer order, staff new-order, and shipment emails onto current `develop` without changing live production.

## Stable task key

`TPP-AUTOMATED-ORDER-EMAILS-RECOVERY`

## Selected task card

Reconcile the preserved Resend-backed implementation with current commerce, shipping, promotion, admin, and deployment code. Add the owner-approved staff new-paid-order alert. Prepare a focused task branch and pull request to `develop`; keep provider DNS, Render environment changes, migration execution, deployment, and live inbox proof as a separately controlled activation lane.

## Boundaries

- Work only on `codex/feature/automated-order-shipment-emails` and target its task pull request to `develop`, never `main`.
- Preserve hosted Stripe Checkout, webhook-confirmed payment truth, webhook idempotency, Canada-only shipping, Stripe Tax behaviour, and all current pricing/shipping rules.
- Send the order-received email only after the backend has accepted the verified paid webhook transition.
- Send one staff new-order alert from that same verified paid transition; duplicate webhooks must not duplicate it.
- Send the shipment email only from the protected shipment workflow; saving or sending email must never mutate payment truth.
- Keep Resend credentials and sender configuration server-only. Do not commit secrets, change DNS, apply the migration, deploy, or send production email in this code-recovery task.
- Preserve current protected admin/internal routes and the latest table-accessory pricing/order presentation.
- Use an idempotent database outbox and stable provider idempotency keys so failures remain visible and retryable.

## Required proof

- The recovered branch is based on current `origin/develop` and contains only the focused email feature.
- A verified paid transition queues exactly one order-received email for the customer email stored from Stripe.
- The same transition queues exactly one staff alert to the server-only configured inbox.
- Duplicate Stripe deliveries do not create duplicate customer emails.
- Saving a supported carrier and tracking number generates the carrier link and queues exactly one shipment email.
- Custom carriers require a safe HTTP(S) tracking link.
- Email failures leave payment and shipment records intact, record a safe error, and remain retryable.
- Protected admin detail shows delivery status and supports a deliberate retry.
- Prisma generation/validation, unit tests, lint, typecheck, production build, focused browser proof, tracked-secret scanning, and the high-severity dependency audit pass on current `develop`.

## Status

Reactivated on 2026-08-23 after a project audit found the complete July implementation uncommitted on a branch 58 commits behind `origin/develop`. The preserved implementation passed its historical baseline locally, was checkpointed without unrelated `output/` artifacts, and is now reconciled onto current `origin/develop` as one focused commit.

The recovered implementation preserves the current table-accessory pricing and shipping code. Its migration is ordered after the already-shipped July pricing migration and enables RLS with no public policies. The paid webhook only persists the idempotent customer and staff outbox rows and never waits for the Resend request. The retry worker excludes permanently blocked deliveries and stops after five automatic attempts. Prisma generation/validation, lint, typecheck, all 154 unit tests, the production build, all 92 active browser tests, tracked-secret scanning, and the high-severity production dependency audit pass. Eleven evidence-only browser tests remain skipped by their existing gates, and five existing moderate advisories remain below the configured gate.

PR #166 merged the separate `nanoid@3.3.18` security hotfix into `develop` after complete local and hosted release-readiness proof. The email branch is rebased onto that patched baseline, and the complete local `pnpm launch:preflight` passes.

The live storefront and API health endpoint returned HTTP 200. The owner confirmed on 2026-09-04 that `tigerpingpong.com` and `info@tigerpingpong.com` are already configured in Resend, replacing the abandoned `updates.tigerpingpong.ca` plan. The repository still has no evidence that the outbox migration, Resend API environment, application deployment, or controlled production inbox proof has occurred. Those steps remain separately controlled activation work.
