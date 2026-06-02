# 002: Catalog Model Proposal Build Log

## What Was Added

- `docs/catalog/TIGER_PINGPONG_CATALOG_MODEL_PROPOSAL_V1.md`
- `docs/catalog/TIGER_PINGPONG_CATALOG_IMPLEMENTATION_ORDER_V1.md`
- `docs/catalog/TIGER_PINGPONG_CATALOG_OPEN_DECISIONS_V1.md`

These files propose the v1 catalog data model, implementation sequence, and
business decisions needed before implementation.

## Decision Updates Applied

- Tables default to `online_checkout` in v1.
- Tables are purchasable unless a specific table SKU is manually marked
  otherwise.
- `quote_required` remains available for special cases, discontinued products,
  uncertain fulfillment, or products needing manual review.
- Replacement Parts are deferred from v1 public navigation, public launch
  categories, and checkout scope.
- Replacement Parts may still be scraped/preserved for future review, redirects,
  and v1.5/v2 planning.
- `orders` and `order_items` should be included in v1 schema planning because
  tables are purchasable.
- Checkout implementation still belongs in a later explicit checkout task.
- Public table checkout requires confirmed freight, curbside delivery, tax,
  regional availability, and shipping policy before launch.

## Why This Is Docs-Only

This task is intentionally limited to planning. The catalog model needs business
approval before schema, API, frontend, quote, checkout, or admin implementation
begins.

## Implementation Intentionally Deferred

- Prisma schema changes
- SQL or migrations
- Seed data
- Catalog API controllers
- Frontend category or product pages
- Cart
- Checkout
- Stripe
- Auth
- Admin screens
- Supabase connection code
- Real product data
- Fake demo products

## Recommended Next Task

Answer the remaining open catalog decisions, then create the approved Prisma
catalog schema and migration for v1 catalog entities. Include `orders` and
`order_items` in schema planning, but do not add frontend product pages,
checkout implementation, auth, Stripe, or admin screens unless a later explicit
task includes them.
