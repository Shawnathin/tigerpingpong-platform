# 016: Minimal Order Model V1

## What Was Added

- Reshaped the existing placeholder `Order` model into the minimal V1
  Stripe-hosted checkout order record.
- Reshaped `OrderItem` into a purchase-time product snapshot model.
- Added `StripeWebhookEvent` for future webhook idempotency.
- Replaced the older planning `OrderStatus` lifecycle with checkout-focused
  values.
- Added migration folder:
  `packages/db/prisma/migrations/20260606180000_order_foundation_v1/`.
- Added schema reference:
  `docs/database/TIGER_PINGPONG_ORDER_FOUNDATION_V1.md`.

## Why Order Records Exist Before Checkout

V1 should not be redirect-only Stripe checkout. The backend needs to create a
pending order before creating a Stripe Checkout Session so Tiger Ping Pong has a
durable record of the intended purchase, calculated totals, shipping rule, and
item snapshot even if checkout is abandoned or Stripe webhooks arrive later.

## Why OrderItem Snapshots Exist

Order items store product and variant snapshot data at purchase time:

- product key and slug
- variant key
- SKU
- display name
- image URL
- unit price
- quantity
- line total
- currency

Catalog rows can change after a shopper pays. Receipts, support review, success
pages, and future fulfillment flows need the purchased values, not only live
catalog relations.

## Status Lifecycle

`OrderStatus` values:

- `checkout_pending`
- `checkout_failed`
- `paid`
- `canceled`
- `expired`
- `refunded`

The migration maps the old catalog-planning statuses into the new lifecycle if
any placeholder rows exist.

## Stripe Fields

`Order` now supports:

- `stripeCheckoutSessionId`, nullable and unique.
- `stripePaymentIntentId`, nullable.
- `stripeCustomerId`, nullable.
- `paidAt`, nullable.

No Stripe SDK code or checkout session creation was added.

## Shipping Foundation

`Order.shippingRule` stores the applied V1 shipping policy:

```text
canada_free_over_100_flat_15
```

V1 shipping remains Canada only:

- Free shipping across Canada on orders over $100.
- $15 flat rate shipping across Canada on orders under or equal to $100.
- Tables follow the same rule as every other product.

## Webhook Idempotency

`StripeWebhookEvent.stripeEventId` is unique. Future webhook code can insert or
check this table before processing an event so Stripe retries do not mark the
same order multiple times.

## What Was Intentionally Not Added

- No Stripe Checkout Session implementation.
- No checkout endpoints.
- No payment buttons.
- No frontend checkout UI.
- No cart.
- No custom checkout.
- No auth or admin.
- No Cloudinary image uploads.
- No catalog data changes.
- No Supabase migration application.
- No database writes.

## Migration Name

- `20260606180000_order_foundation_v1`

The migration was created for later review/application against Supabase
development. It was not applied in this task.

## Validation Commands

Run from the repository root:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_order_foundation_v1 pnpm db:generate
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_order_foundation_v1 pnpm db:validate
pnpm lint
pnpm typecheck
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_order_foundation_v1 NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build
git diff --check
git status
```

The `DATABASE_URL` above is a local placeholder used only so Prisma can parse
and generate from the schema. It was not written to `.env`, and no database was
migrated.

## How To Run Migration Later Against Supabase Dev

Use only the Supabase development database URL:

```bash
DATABASE_URL="postgresql://..." pnpm --filter @tigerpingpong/db exec prisma migrate deploy --schema prisma/schema.prisma
```

Do not run against production without explicit approval.

## Next Recommended Task

Implement the backend-created Stripe Checkout Session flow:

- Validate the requested catalog items.
- Create a pending `Order`.
- Create `OrderItem` snapshots.
- Calculate and store the Canada-only shipping rule.
- Create the Stripe Checkout Session.
- Store the Stripe Checkout Session ID on the order.

Webhook payment confirmation and success-page status reads can follow as their
own tasks.
