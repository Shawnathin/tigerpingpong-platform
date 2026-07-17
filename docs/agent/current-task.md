# Current Task

## Active task

Lightweight protected product and availability editor.

## Selected task card

Allow staff to edit existing product names, base and variant prices, whole-product availability, and individual variant availability without adding product creation, hard deletion, stock accounting, or schema changes. Reconcile stale cart prices and unavailable items before creating an order or Stripe Checkout session.

## Boundaries

- Do not change slugs, purchase modes, media, categories, product descriptions, payment truth, webhook authority, Prisma schema, or migrations.
- Do not add products, hard-delete products, or implement stock quantities/reservations.
- Preserve immutable historical order-item snapshots.
- Preserve the unrelated untracked media script without modification or staging.
- Do not deploy or mutate production catalog data during repository work.

## Required proof

- Product and variant writes are protected, allow-listed, atomic, validated, and optimistic-lock protected.
- Hiding blocks new checkout without deleting catalog or order history; restoring requires current launch gates.
- Stale prices or unavailable lines return `409 cart_changed` before order/Stripe creation, update the local cart, and require review.
- Admin and cart workflows cover loading, success, validation, conflict, service failure, and mobile-safe presentation.
- Full release preflight passes without external-service or production-data mutation.

## Status

Repository-local implementation and regression proof are complete. `pnpm launch:preflight` passes with 25 unit tests, 8 Chromium workflow tests, a clean tracked-secret scan, and zero high/critical production advisories. Production deployment and any reversible production product edit remain operator-controlled actions.
