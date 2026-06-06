# Tiger Ping Pong Order Foundation V1

## Purpose

This document describes the minimal order persistence added for V1
Stripe-hosted checkout.

The checkout direction is:

- The backend creates a pending `Order`.
- The backend creates `OrderItem` snapshot rows.
- The backend creates a Stripe Checkout Session.
- The order stores the Stripe Checkout Session ID.
- A later Stripe webhook marks the order paid.
- A later success page reads order/session status.

This task adds database foundation only. It does not add checkout endpoints,
Stripe SDK code, payment buttons, cart behavior, frontend checkout UI, auth,
admin, custom checkout, or payment-link redirects.

## Migration

Local migration folder:

```text
packages/db/prisma/migrations/20260606180000_order_foundation_v1/
```

The migration reshapes the existing placeholder `orders` and `order_items`
tables from catalog planning into the minimal V1 checkout spine. It also adds
the `stripe_webhook_events` table.

It was not applied to Supabase by this task.

## Models Added Or Updated

### `Order`

`Order` is the durable payment spine for Stripe-hosted checkout. A row should be
created before the Stripe Checkout Session is created so the app has its own
record of the intended purchase even if the shopper never completes payment.

Key fields:

- `publicReference`: Unique public lookup/reference value.
- `status`: `OrderStatus`, defaulting to `checkout_pending`.
- `currency`: Launch currency, defaulting to `CAD`.
- `subtotalCents`, `shippingCents`, `totalCents`: Order totals in cents.
- `shippingRule`: Stores the applied V1 rule:
  `canada_free_over_100_flat_15`.
- `checkoutSource`: Defaults to `stripe_checkout`.
- `customerEmail`, `customerName`, `customerPhone`: Customer contact fields
  filled from checkout/session data when available.
- `shippingName`, `shippingPhone`, `shippingAddressJson`: Shipping snapshot
  fields filled from Stripe/customer data when available.
- `stripeCheckoutSessionId`: Nullable and unique.
- `stripePaymentIntentId`: Nullable payment intent reference.
- `stripeCustomerId`: Nullable Stripe customer reference.
- `paidAt`: Set by webhook-confirmed payment.

Old order planning fields for tax, external payment references, and
table-specific freight review were removed from the Prisma model because the V1
shipping decision now applies one Canada-only order rule to all products,
including tables.

### `OrderItem`

`OrderItem` belongs to `Order` and snapshots the purchased product data at the
time checkout is created.

Snapshot fields:

- `productKey`
- `productSlug`
- `variantKey`
- `sku`
- `name`
- `imageUrl`
- `unitPriceCents`
- `quantity`
- `lineTotalCents`
- `currency`

`productId` and `variantId` are optional catalog links. They are useful for
internal traceability, but receipt/order display must rely on the snapshot
fields because live product names, prices, images, variants, and availability
can change after purchase.

### `StripeWebhookEvent`

`StripeWebhookEvent` stores processed Stripe event IDs.

Key fields:

- `stripeEventId`: Unique Stripe event ID.
- `type`: Stripe event type.
- `processedAt`: Nullable timestamp set after successful handling.
- `createdAt`: Insert timestamp.

This table exists to make later webhook processing idempotent. If Stripe
retries the same event, the app can detect that the event ID already exists and
avoid double-processing the order.

## Status Lifecycle

`OrderStatus` values:

- `checkout_pending`: Order exists and checkout has not been confirmed paid.
- `checkout_failed`: Checkout/session creation or payment flow failed.
- `paid`: Webhook confirmed payment.
- `canceled`: Shopper or system canceled checkout.
- `expired`: Stripe Checkout Session expired.
- `refunded`: Payment was refunded later.

The migration maps legacy planning statuses into the new lifecycle if any
placeholder rows exist.

## Shipping Rule

V1 order shipping is cart/order-based and Canada only:

- Free shipping across Canada on orders over $100.
- $15 flat rate shipping across Canada on orders under or equal to $100.
- All products, including tables, follow this rule.

The applied rule is stored on `Order.shippingRule` so future receipt, success
page, support, and audit flows can tell which launch rule produced the shipping
amount.

## How To Run Later Against Supabase Dev

Do not apply this migration to production without explicit approval.

When ready to apply to Supabase development, run from the repository root with
the development `DATABASE_URL` only:

```bash
DATABASE_URL="postgresql://..." pnpm --filter @tigerpingpong/db exec prisma migrate deploy --schema prisma/schema.prisma
```

Recommended preflight:

```bash
DATABASE_URL="postgresql://..." pnpm db:validate
DATABASE_URL="postgresql://..." pnpm db:generate
git diff --check
```

This task did not run a migration against Supabase and did not write database
data.

## Intentionally Excluded

- No Stripe Checkout Session creation.
- No checkout endpoints.
- No payment buttons.
- No frontend checkout UI.
- No cart.
- No custom checkout.
- No auth or admin.
- No Cloudinary upload.
- No data import or data writes.
- No production migration application.

## Next Recommended Task

Build the backend Stripe Checkout Session flow:

1. Accept a server-side checkout request.
2. Validate catalog products and prices.
3. Calculate the V1 Canada shipping rule.
4. Create `Order` and `OrderItem` snapshot rows.
5. Create the Stripe Checkout Session.
6. Store `stripeCheckoutSessionId` on the order.

Webhook handling and success-page status reads should remain separate follow-up
tasks unless explicitly combined.
