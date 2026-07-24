# Current Task

## Active task

Vice bundle catalog foundation, followed by the table-triggered 30% accessory offer.

## Selected task card

Make table package contents explicit, add a live component-priced Vice package containing four paddles and six white balls, and offer eligible play sets plus a compatible table cover at 30% off when a table is in the cart.

## Boundaries

- Deliver two focused branches/PRs from current `develop`: the Vice catalog foundation first, then the table accessory offer. Both target `develop`, never `main`.
- Preserve hosted Stripe Checkout, webhook-confirmed payment truth, webhook idempotency, Stripe Tax, Canada-only shipping, the `$100` threshold, and the existing Aqua shipping exception.
- Prices and availability remain live catalog truth. Client prices are reconciliation hints only.
- Do not use a Stripe coupon. The API computes net eligible line prices and keeps unexpected Stripe discounts unsupported.
- Use the owner-supplied Vice bundle SKU `15488`; do not substitute a placeholder or alternate value.
- Do not apply a production catalog write, database migration, deployment, or real payment in this task without separate approval.
- Preserve the unrelated automated-order-email worktree and branch.

## Required proof

- Vice exposes required Single and four-paddle/six-white-ball package choices, with the bundle regular price derived from live components.
- Legacy Vice cart lines migrate safely to the Single variant.
- Every table purchase rail says paddles and balls are sold separately.
- The table dialog offers the exact three play sets and a compatible cover without a preselected upsell; Plaza never offers the cover.
- Cart and API pricing agree on automatic eligibility, per-table limits, highest-price-first allocation, rounding, and reversal when tables are removed.
- Stripe receives net line prices without coupons, and webhook-confirmed payment truth remains unchanged.
- Order snapshots preserve list, discount, net, and promotion audit values; legacy orders backfill safely.
- Prisma generation/validation, focused tests, lint, typecheck, production build, browser coverage, and secret scanning pass.

## Status

PR 1 is implemented and locally reverified on `codex/feature/vice-bundle-catalog-foundation`. It reconciles the durable Vice single price, defines the required Single and four-paddle/six-white-ball package records, derives the bundle price from live components, adds the narrow guarded import path, preserves legacy cart/checkout compatibility, and uses exact component media. Shawn supplied exact bundle SKU `15488` on 2026-07-24, so the reviewed bundle row is active and the SKU review flag is resolved. The scoped staging dry run reports no catalog blockers and performs no database write. Staging and production writes remain separately approval-gated. PR 2 has not started.
