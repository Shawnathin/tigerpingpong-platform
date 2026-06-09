# 020: Stripe Paid Order Transition V1

## What Was Added

- Extended `POST /webhooks/stripe` so verified
  `checkout.session.completed` events can mark a matching pending `Order` paid.
- Kept Stripe signature verification on the raw request body.
- Kept `StripeWebhookEvent` idempotency and made duplicate responses explicit:
  `duplicate_processed` or `duplicate_in_progress`.
- Added a Prisma transaction around webhook event creation, order validation,
  the paid order update, and `processedAt`.
- Added strict order/session validation before payment state changes.
- Added selected Stripe payment, customer, and shipping snapshots to `Order`.
- Added safe `manual_review` behavior for verified but unsafe events.
- Added optional `STRIPE_EXPECTED_LIVEMODE` support.

## Paid Transition Rules

The service finds an order by:

```text
session.id == Order.stripeCheckoutSessionId
```

It then verifies:

- `session.client_reference_id == Order.id`
- `session.metadata.orderId == Order.id`
- session mode/status/payment status are `payment`, `complete`, and `paid`
- Stripe/session/order currencies are CAD/cad
- Stripe total matches `Order.totalCents`
- Stripe subtotal matches `Order.subtotalCents` when present
- Stripe shipping cost matches `Order.shippingCents` when present
- shipping details exist and shipping country is Canada
- order total equals subtotal plus shipping
- order has item snapshots
- item line totals equal order subtotal
- item currencies are CAD
- `Order.shippingRule` is `canada_free_over_100_flat_15`
- V1 shipping threshold is still satisfied:
  - `subtotalCents > 10000` requires free shipping
  - `subtotalCents <= 10000` requires 1500-cent shipping
- optional livemode expectation matches when `STRIPE_EXPECTED_LIVEMODE` is set

Only `checkout_pending` orders can move to `paid`.

If the order is already `paid`, the event is treated as idempotent success only
when the same checkout session and payment intent match.

## Stored Order Fields

After validation succeeds, the webhook updates:

- `status: paid`
- `paidAt`
- `stripePaymentIntentId` when available
- `stripeCustomerId` when available
- `customerEmail`, `customerName`, `customerPhone` when available
- `shippingName` when available
- `shippingPhone` from customer phone when available
- `shippingAddressJson` with selected address fields

The raw Stripe event payload is not stored.

## Manual Review Behavior

Valid signed events that are unsafe to apply return HTTP 200 with:

```json
{
  "received": true,
  "status": "manual_review",
  "type": "checkout.session.completed"
}
```

This prevents infinite Stripe retries while preserving the event row with
`processedAt` null and logging only a sanitized reason code.

Stripe CLI fixture payloads that lack shipping details will not mark an order
paid. V1 production logic stays strict because all Checkout Sessions collect a
Canadian shipping address for physical goods.

## Environment Variables

`.env.example` now includes:

```text
STRIPE_EXPECTED_LIVEMODE=false
```

The variable is optional. When unset, the webhook does not block on livemode.
When set, it accepts `true`, `false`, `1`, or `0`.

## What Was Intentionally Not Added

- No frontend checkout buttons.
- No cart UI.
- No custom checkout.
- No auth or admin.
- No Prisma schema changes.
- No migrations.
- No seed or import data.
- No Cloudinary uploads.
- No site redesign.
- No broad fulfillment automation.
- No email sending.
- No refund handling.
- No support for every Stripe event.

## Validation Commands

Run from the repository root:

```bash
pnpm --filter @tigerpingpong/api typecheck
pnpm --filter @tigerpingpong/api lint
pnpm --filter @tigerpingpong/api build
git diff --check
```

All commands passed during implementation.
