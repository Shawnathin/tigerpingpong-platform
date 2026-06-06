# Tiger Ping Pong Checkout Sessions API V1

## Purpose

This document describes the V1 backend API for creating Stripe-hosted Checkout
Sessions for Tiger Ping Pong.

The endpoint creates a pending Tiger Ping Pong `Order`, snapshots requested
`OrderItem` rows, creates a Stripe Checkout Session, stores the Stripe Checkout
Session ID on the order, and returns the Stripe-hosted checkout URL.

This API does not confirm payment. Stripe webhook handling is still required
before an order can be treated as paid or ready for fulfillment.

## Endpoint

```http
POST /checkout/sessions
```

## Request Shape

```json
{
  "items": [
    {
      "productSlug": "tiger-vice-paddle",
      "quantity": 1
    }
  ]
}
```

Optional field:

```json
{
  "customerEmail": "customer@example.com"
}
```

Notes:

- `items` must be an array.
- The first public UI may only send one item, but the API accepts an array so
  V1 remains compatible with future cart behavior.
- The frontend must not send trusted price, currency, shipping, product name, or
  total values.

## Success Response Shape

```json
{
  "orderId": "clx...",
  "publicReference": "clx...",
  "checkoutSessionId": "cs_test_...",
  "checkoutUrl": "https://checkout.stripe.com/...",
  "currency": "cad",
  "subtotalCents": 5000,
  "shippingCents": 1500,
  "totalCents": 6500,
  "shippingLabel": "Standard shipping - $15"
}
```

The API response uses the display labels:

```text
Standard shipping - Free
Standard shipping - $15
```

In the current implementation, these labels use an em dash in the response
text.

## Validation Rules

The endpoint validates the request body before creating an order:

- Request body must be an object.
- `items` must exist and must be an array.
- `items` cannot be empty.
- `items` cannot contain more than 20 line items.
- Each item must be an object.
- `productSlug` is required.
- `productSlug` is trimmed, lowercased, and must be slug-shaped.
- Duplicate product slugs are rejected for V1.
- `quantity` must be an integer.
- `quantity` must be at least 1.
- `quantity` cannot be greater than 10 per line item.
- Optional `customerEmail` must be a simple valid email string when provided.

The endpoint validates each requested product through Prisma:

- Product must exist.
- Product status must be `active`.
- Product must be in public navigation.
- Product must be in V1 checkout scope.
- Product must not be a replacement part.
- Product purchase mode must be `online_checkout` or
  `online_checkout_candidate`.
- Product family must be active and public.
- Product primary category must be active, public-navigation scoped, and
  checkout-scoped.
- Product price must exist, be an integer, and be greater than 0.
- Product currency must be CAD.

The endpoint intentionally returns public-safe validation errors. It does not
expose private product state, internal database details, Stripe secrets, or
stack traces.

## Order Creation Flow

The backend flow is:

1. Validate the request body and item fields.
2. Load requested products from the database by slug.
3. Validate product checkout eligibility.
4. Calculate line totals, subtotal, shipping, and total from database values.
5. Create a pending `Order` and `OrderItem` snapshot rows in a Prisma
   transaction.
6. Call Stripe to create the Checkout Session outside the database transaction.
7. Update the order with `stripeCheckoutSessionId`.
8. Return the Stripe checkout URL and calculated order totals.

The order is created before the Stripe Checkout Session so Tiger Ping Pong has a
durable record of the intended purchase even if the shopper abandons checkout or
Stripe redirects/webhooks arrive later.

## Order Fields

The pending order stores:

- `status: checkout_pending`
- `currency: CAD`
- `subtotalCents`
- `shippingCents`
- `totalCents`
- `shippingRule: canada_free_over_100_flat_15`
- `checkoutSource: stripe_checkout`
- optional `customerEmail`
- `stripeCheckoutSessionId` after Stripe session creation succeeds

If Stripe session creation fails after the order exists, the endpoint attempts
to mark the order as:

```text
checkout_failed
```

## Order Item Snapshots

Each `OrderItem` snapshots purchase-time product values:

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
- optional `productId`
- optional `variantId`

Order display, support review, receipts, and future fulfillment should use
these snapshots rather than relying only on live catalog rows, because live
products can change after checkout starts.

## Shipping Calculation

V1 shipping rule:

```text
canada_free_over_100_flat_15
```

The backend calculates shipping from the validated order subtotal:

```text
subtotalCents > 10000  -> shippingCents = 0
subtotalCents <= 10000 -> shippingCents = 1500
```

Threshold behavior:

- `10001` cents and above gets free shipping.
- `10000` cents exactly gets $15 flat-rate shipping.

Stripe Checkout is configured with:

- `shipping_address_collection.allowed_countries: ["CA"]`
- exactly one backend-selected shipping option

The shopper must not be allowed to choose between multiple V1 shipping options.

## Stripe Checkout Session Fields

The backend creates a Stripe Checkout Session with:

- `mode: payment`
- `line_items` using dynamic `price_data`
- `currency: cad`
- `unit_amount` from `OrderItem.unitPriceCents`
- `product_data.name` from the item snapshot
- `product_data.images` only when a safe public HTTPS image URL exists
- `shipping_address_collection.allowed_countries: ["CA"]`
- exactly one `shipping_options` entry based on backend-calculated shipping
- `success_url` from `CHECKOUT_SUCCESS_URL`
- `cancel_url` from `CHECKOUT_CANCEL_URL`
- `client_reference_id = order.id`
- `customer_email` when a valid customer email was provided

The Stripe idempotency key is:

```text
checkout_session_create:{orderId}
```

## Stripe Metadata

Checkout Session metadata includes:

- `orderId`
- `publicReference`
- `source: tigerpingpong-web`
- `environment`
- `shippingRuleVersion: v1`
- `subtotalCents`
- `shippingCents`
- `totalCents`

PaymentIntent metadata includes:

- `orderId`
- `publicReference`
- `source: tigerpingpong-web`
- `environment`

This metadata is for reconciliation and future webhook handling. It is not a
substitute for webhook-confirmed payment status.

## Required API Environment Variables

The API runtime requires:

```text
DATABASE_URL
STRIPE_SECRET_KEY
CHECKOUT_SUCCESS_URL
CHECKOUT_CANCEL_URL
```

Optional:

```text
APP_ENV
```

Local examples:

```text
APP_ENV=local
STRIPE_SECRET_KEY=
CHECKOUT_SUCCESS_URL=http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}
CHECKOUT_CANCEL_URL=http://localhost:3000/checkout/cancel
```

Stripe secrets must stay backend-only. Do not expose them through
`NEXT_PUBLIC_` variables.

## Safe Error Behavior

Public responses are intentionally safe:

- Invalid request bodies return validation errors without exposing internals.
- Missing or unavailable products use a generic checkout-unavailable message.
- Database configuration or catalog access failures return service-unavailable
  style responses.
- Stripe session creation failures return a safe checkout-start failure message.
- Stripe secrets, stack traces, and internal database structure are not returned
  to callers.

When Stripe fails after the order is created, the endpoint attempts to mark the
order `checkout_failed`. That marker is best-effort so the public response can
remain safe even if the failure update cannot be written.

## Webhook And Payment Confirmation Requirement

The checkout success redirect is not authoritative proof of payment. A shopper
can reach a success URL through redirects, browser history, or incomplete
payment states.

Before fulfillment, Tiger Ping Pong still needs Stripe webhook handling that:

- verifies Stripe webhook signatures,
- receives payment-confirmed events,
- finds the pending order by Stripe session/payment metadata,
- updates the order status to `paid`,
- records Stripe payment intent/customer details when available,
- avoids duplicate processing through webhook event idempotency.

Until webhook handling exists, orders created by this endpoint should remain
`checkout_pending` or `checkout_failed`; they must not be treated as paid or
ready to fulfill from the redirect alone.

## Intentionally Excluded

This endpoint does not add:

- frontend checkout buttons,
- cart UI,
- Stripe webhook handling,
- paid order marking,
- custom checkout,
- auth or admin,
- Prisma schema changes,
- migrations,
- seed or import data,
- Cloudinary uploads,
- site redesign.

## Local Testing Notes

Recommended validation commands:

```bash
pnpm db:generate
pnpm db:validate
pnpm lint
pnpm typecheck
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build
git diff --check
git status
```

No live Stripe Checkout Session should be created during normal local
validation unless a real development `DATABASE_URL`, test-mode
`STRIPE_SECRET_KEY`, and approved test product data are intentionally provided.
Creating a live session writes external Stripe and database state.
