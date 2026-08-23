# Current Task

## Active task

Recover and advance automated customer order and shipment emails onto current `develop` without changing live production.

## Stable task key

`TPP-AUTOMATED-ORDER-EMAILS-RECOVERY`

## Selected task card

Reconcile the preserved Resend-backed implementation with current commerce, shipping, promotion, admin, and deployment code. Prepare a focused task branch and pull request to `develop`; keep provider DNS, Render environment changes, migration execution, deployment, and live inbox proof as a separately controlled activation lane.

## Boundaries

- Work only on `codex/feature/automated-order-shipment-emails` and target its task pull request to `develop`, never `main`.
- Preserve hosted Stripe Checkout, webhook-confirmed payment truth, webhook idempotency, Canada-only shipping, Stripe Tax behaviour, and all current pricing/shipping rules.
- Send the order-received email only after the backend has accepted the verified paid webhook transition.
- Send the shipment email only from the protected shipment workflow; saving or sending email must never mutate payment truth.
- Keep Resend credentials and sender configuration server-only. Do not commit secrets, change DNS, apply the migration, deploy, or send production email in this code-recovery task.
- Preserve current protected admin/internal routes and the latest table-accessory pricing/order presentation.
- Use an idempotent database outbox and stable provider idempotency keys so failures remain visible and retryable.

## Required proof

- The recovered branch is based on current `origin/develop` and contains only the focused email feature.
- A verified paid transition queues exactly one order-received email for the customer email stored from Stripe.
- Duplicate Stripe deliveries do not create duplicate customer emails.
- Saving a supported carrier and tracking number generates the carrier link and queues exactly one shipment email.
- Custom carriers require a safe HTTP(S) tracking link.
- Email failures leave payment and shipment records intact, record a safe error, and remain retryable.
- Protected admin detail shows delivery status and supports a deliberate retry.
- Prisma generation/validation, unit tests, lint, typecheck, production build, focused browser proof, tracked-secret scanning, and the high-severity dependency audit pass on current `develop`.

## Status

Reactivated on 2026-08-23 after a project audit found the complete July implementation uncommitted on a branch 58 commits behind `origin/develop`. The preserved implementation passed its historical baseline locally, was checkpointed without unrelated `output/` artifacts, and is now reconciled onto current `origin/develop` as one focused commit.

The recovered implementation preserves the current table-accessory pricing and shipping code. Its migration is ordered after the already-shipped July pricing migration and enables RLS with no public policies. The retry worker now excludes permanently blocked deliveries instead of attempting them every minute. Prisma generation/validation, lint, typecheck, all 147 unit tests, the production build, the focused protected-admin browser test, all 92 active browser tests, and tracked-secret scanning pass. Eleven evidence-only browser tests remain skipped by their existing gates.

PR #166 merged the separate `nanoid@3.3.18` security hotfix into `develop` after complete local and hosted release-readiness proof. The email branch is rebasing onto that patched baseline before its final aggregate validation.

The live storefront and API health endpoint returned HTTP 200. GoDaddy is now authoritative for `tigerpingpong.ca`, so the prior BigCommerce DNS-provider blocker is gone; however, `updates.tigerpingpong.ca` still has no published Resend TXT, MX, or DKIM records. The repository has no evidence that the outbox migration, Resend API environment, application deployment, or controlled production inbox proof has occurred. Those steps remain explicitly outside this code-recovery task.
