# 026: Internal Orders Read-Only V1

## Goal

Build a narrow protected read-only internal orders review surface for
TigerPingPong.ca.

This is not a full admin system. It lets trusted staff review backend-confirmed
paid Stripe orders without using raw Supabase as the normal workflow.

## Branch

```text
feature/026-internal-orders-readonly-v1
```

Started from latest `main` on June 11, 2026.

## Files Added

- `apps/api/src/internal-orders/internal-orders.module.ts`
- `apps/api/src/internal-orders/internal-orders.controller.ts`
- `apps/api/src/internal-orders/internal-orders.service.ts`
- `apps/web/src/middleware.ts`
- `apps/web/src/lib/internal-orders-api.ts`
- `apps/web/src/app/internal/orders/page.tsx`
- `apps/web/src/app/internal/orders/page.module.css`
- `apps/web/src/app/internal/orders/[publicReference]/page.tsx`
- `docs/internal/TIGER_PINGPONG_INTERNAL_ORDERS_READONLY_V1.md`
- `docs/build-log/026-internal-orders-readonly-v1.md`

## Files Changed

- `apps/api/src/app.module.ts`
- `apps/api/src/config.ts`
- `.env.example`

## API Work

Added `InternalOrdersModule` with protected read-only endpoints:

```http
GET /internal/orders?status=paid&limit=50
GET /internal/orders/:publicReference
```

The endpoints:

- require `x-internal-orders-token`
- read the expected token from `INTERNAL_ORDERS_API_TOKEN`
- fail closed with `401` when the env var is missing
- return `401` for missing or wrong tokens
- never return raw Stripe payloads
- never return database error details
- never mutate orders

The list endpoint defaults to `status=paid`, defaults `limit=50`, caps limit at
`100`, and sorts newest paid orders first.

The detail endpoint looks up orders by `publicReference`, not internal database
ID.

## Web Work

Added protected internal web routes:

```text
/internal/orders
/internal/orders/[publicReference]
```

Added Basic Auth middleware for `/internal/*` using:

```text
INTERNAL_ORDERS_BASIC_AUTH_USER
INTERNAL_ORDERS_BASIC_AUTH_PASSWORD
```

The web app calls the internal API from server-rendered code using
`INTERNAL_ORDERS_API_TOKEN`. The token is not placed in client-side code and is
not a `NEXT_PUBLIC_*` value.

The list page shows:

- paid timestamp
- public reference
- customer name/email
- total
- status
- item count
- Stripe PaymentIntent ID
- detail link

The detail page shows:

- public reference
- read-only note
- status and paid timestamp
- customer contact info
- shipping name, phone, and address
- subtotal, shipping, total, and currency
- shipping rule
- item snapshots
- Stripe Checkout Session ID
- Stripe PaymentIntent ID
- Stripe Customer ID

## Environment Variables

API service:

```text
INTERNAL_ORDERS_API_TOKEN
```

Web service:

```text
INTERNAL_ORDERS_BASIC_AUTH_USER
INTERNAL_ORDERS_BASIC_AUTH_PASSWORD
INTERNAL_ORDERS_API_TOKEN
NEXT_PUBLIC_API_BASE_URL
```

## Intentionally Not Changed

- No order mutations were added.
- No fulfillment status was added.
- No refund flow was added.
- No email sending was added.
- No cart behavior was added.
- No customer accounts were added.
- No full admin system was added.
- No product or catalog editing was added.
- No checkout creation behavior changed.
- No webhook paid-transition behavior changed.
- No Prisma schema changed.
- No migrations were created.
- No public customer order lookup was added.

## Webhook Event Summary Decision

The current `StripeWebhookEvent` model records event ID, event type,
`processedAt`, and `createdAt`, but it does not store an order relationship.
This task did not add a model change or migration, so the internal order detail
page does not show an order-specific webhook event summary.

## Validation Results

Initial focused checks:

- `pnpm --filter @tigerpingpong/api typecheck`: passed.
- `pnpm --filter @tigerpingpong/web typecheck`: passed.

Full validation:

- `pnpm db:generate`: passed.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate`:
  passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`:
  passed.
- `git diff --check`: passed.
- `git status`: showed the expected implementation and documentation changes.

Smoke checks:

- API without token returns `401`: passed locally.
- API with wrong token returns `401`: passed locally.
- API with correct token and no local database returns safe `503`: passed
  locally.
- API with correct token and invalid public reference returns safe `404` before
  any database query: passed locally.
- API with token does not mutate data: code-reviewed; no live database was
  available for a data-diff smoke test.
- `/internal/orders` is protected: passed locally with Basic Auth checks.
- `/internal/orders` does not expose the token in page source/client bundle:
  passed locally.
- `/internal/orders` renders safe fallback if API unavailable: passed locally
  and verified in the in-app browser.
- `/internal/orders/[publicReference]` renders safe fallback for not found:
  passed locally with an invalid public reference.

## Next Recommended Task

Deploy this read-only surface with Render env vars, smoke-test it against the
staging/production API, then write a launch order-operations runbook covering
staff review ownership, Stripe reconciliation, and the manual fulfillment
handoff.
