# Current Task

## Selected: admin safety and usability

Task key: `TPP-ADMIN-SAFETY-USABILITY`. Shawn approved the jointly refined plan on 2026-09-04. Implement independent publication/stock, Vancouver shipment-date defaults, direct dashboard order links, a responsive lean product table, and copy reduction across admin.

Branch: `codex/fix/admin-safety-usability`, isolated from current `develop`. Draft PR targets `develop`; no merge or deployment is authorized. Preserve Whistler as published/out of stock, existing variant choices, auth, checkout/payment/webhooks, and email behavior. All mutation proof uses local fixtures; never submit shipment/email forms or change production records.

Required proof: unit/browser regression coverage, desktop/mobile screenshots, lint, typecheck, Prisma generation/validation, and production build. Status: implemented and locally verified. All 215 unit tests and 98 standard browser tests pass, plus the dedicated out-of-stock storefront test; lint, typecheck, Prisma generation/validation, production build, and security gates pass. Twelve gated browser cases are excluded from the standard run, including the separately exercised stock fixture. Evidence and release considerations: `docs/qa/admin-safety-usability.md`. Draft PR [#172](https://github.com/Shawnathin/tigerpingpong-platform/pull/172) targets `develop`. Hosted checks are pending; Shawn review and any merge/promotion approval remain outstanding.

Deferred: searchable Orders queue, fulfillment/email filters, audit history, media-editor improvements, quantity inventory, and broad redesign.


## Historical completed task: universal table-page recovery

Shawn selected recovery on 2026-09-04. Restore safety stash `ecd2dd5` onto current `develop` on `codex/feature/recover-universal-table-pages`, validate the horizontal feature cards and model-specific stories for all five models, and prepare a draft PR into `develop`.

PR #169 merged into develop and the separately approved promotion #170 released the table pages on 2026-09-04. Whistler is published with checkout disabled. The detailed production release record remains in the separate draft documentation PR #171; this admin task does not alter that PR or repeat its production actions.

## Historical completed task: automated emails

The following task card is retained as the previous email milestone, not the scope of the current admin task.

Recover, review, activate, and prove automated customer order, staff new-order, and shipment emails.

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

The owner confirmed on 2026-09-04 that `tigerpingpong.com` and `info@tigerpingpong.com` are configured in Resend, replacing the abandoned `updates.tigerpingpong.ca` plan. PR #165 merged the reviewed implementation into `develop`, and production PR #167 passed the complete hosted gate before merging `develop` into `main` as `79d7f7c`. Render applied `20260823210000_order_email_outbox`, initialized `OrderEmailModule`, and deployed that exact commit to both API and web services. API health, catalog health, and the storefront returned HTTP 200 after release.

The first protected staff-only production proof used an existing paid order without contacting its customer or changing payment/shipment state. The API returned HTTP 201 with `staff_new_order` in `sent` status and a provider acceptance timestamp, and the owner confirmed receipt in `info@tigerpingpong.com`. The first controlled customer order-received and shipment inbox proofs remain operational follow-up rather than code/deployment blockers.

Before activation, the three messages were moved into a reusable, side-effect-free template module with one shared Tiger email layout. The design and language follow the approved About/Contact treatment, customer messages expose the current support email and phone, and a local preview command renders representative HTML without contacting Resend. Template-focused tests cover shared branding, customer/staff separation, responsive markup, escaping, tracking links, and the pre-tax fallback label.
