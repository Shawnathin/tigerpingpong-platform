# 018: Stripe Checkout Sessions Endpoint V1

## What Was Added

- Added the first backend-created Stripe Checkout Sessions endpoint:
  `POST /checkout/sessions`.
- Added a NestJS checkout module, controller, and service.
- Added server-side checkout request validation.
- Added catalog product lookup and V1 checkout eligibility checks.
- Added pending `Order` creation before the Stripe call.
- Added `OrderItem` purchase snapshots.
- Added V1 Canada-only shipping calculation.
- Added Stripe Checkout Session creation with dynamic `price_data`.
- Added storage of `stripeCheckoutSessionId` on the order after Stripe session
  creation succeeds.
- Added checkout failure marking with `checkout_failed` when Stripe session
  creation fails after an order exists.
- Added API checkout environment variable placeholders.
- Added the Stripe Node SDK dependency to the API package.

## Endpoint Added

```http
POST /checkout/sessions
```

Request body:

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

Optional request field:

```json
{
  "customerEmail": "customer@example.com"
}
```

Success response body:

```json
{
  "orderId": "...",
  "publicReference": "...",
  "checkoutSessionId": "cs_test_...",
  "checkoutUrl": "https://checkout.stripe.com/...",
  "currency": "cad",
  "subtotalCents": 5000,
  "shippingCents": 1500,
  "totalCents": 6500,
  "shippingLabel": "Standard shipping - $15"
}
```

The live `shippingLabel` uses an em dash in the API response text:
`Standard shipping \u2014 Free` or `Standard shipping \u2014 $15`.

## Order Flow

1. Validate request body and line items.
2. Load requested products from Prisma by slug.
3. Validate product checkout eligibility.
4. Calculate line totals, subtotal, shipping, and total.
5. Create a pending `Order` and snapshot `OrderItem` rows in a Prisma
   transaction.
6. Call Stripe outside the database transaction.
7. Update the order with the Stripe Checkout Session ID.
8. Return the Stripe-hosted checkout URL and calculated totals.

If Stripe session creation fails after the pending order exists, the endpoint
attempts to mark the order `checkout_failed` and returns a public-safe error.

## Validation Rules

The endpoint validates:

- Request body exists and is an object.
- `items` exists and is an array.
- `items` is not empty.
- A conservative maximum of 20 line items.
- `productSlug` is required, normalized to lowercase, and slug-shaped.
- Duplicate product slugs are rejected for V1.
- `quantity` is an integer.
- `quantity >= 1`.
- `quantity <= 10` per line item.
- Optional `customerEmail` is a simple valid email string.
- Product exists.
- Product is `active`.
- Product is in public navigation.
- Product is in V1 checkout scope.
- Product is not a replacement part.
- Product purchase mode is `online_checkout` or `online_checkout_candidate`.
- Product family is active and public.
- Product primary category is active, public-navigation scoped, and
  checkout-scoped.
- Product price is a positive integer.
- Product currency is CAD.

The endpoint does not trust frontend price, currency, shipping, name, image, or
total data.

## Shipping Logic

V1 shipping rule:

```text
canada_free_over_100_flat_15
```

Calculation:

- `subtotalCents > 10000`: free shipping, `shippingCents = 0`.
- `subtotalCents <= 10000`: flat shipping, `shippingCents = 1500`.

Stripe Checkout is configured with:

- `shipping_address_collection.allowed_countries: ["CA"]`
- exactly one shipping option chosen by the backend-calculated subtotal

## Stripe Checkout Session

The endpoint creates a Checkout Session with:

- `mode: payment`
- dynamic `line_items.price_data`
- `currency: cad`
- `unit_amount` from order item snapshots
- `product_data.name` from order item snapshots
- `product_data.images` only when a safe public HTTPS image URL exists
- `success_url` from `CHECKOUT_SUCCESS_URL`
- `cancel_url` from `CHECKOUT_CANCEL_URL`
- `client_reference_id = order.id`
- idempotency key: `checkout_session_create:{orderId}`

Session metadata includes:

- `orderId`
- `publicReference`
- `source: tigerpingpong-web`
- `environment`
- `shippingRuleVersion: v1`
- `subtotalCents`
- `shippingCents`
- `totalCents`

Payment intent metadata includes:

- `orderId`
- `publicReference`
- `source: tigerpingpong-web`
- `environment`

## Environment Variables

Required for checkout endpoint runtime:

```text
DATABASE_URL
STRIPE_SECRET_KEY
CHECKOUT_SUCCESS_URL
CHECKOUT_CANCEL_URL
```

Optional but supported:

```text
APP_ENV
```

`.env.example` now includes:

```text
APP_ENV=local
STRIPE_SECRET_KEY=
CHECKOUT_SUCCESS_URL=http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}
CHECKOUT_CANCEL_URL=http://localhost:3000/checkout/cancel
```

## What Was Intentionally Not Added

- No frontend checkout buttons.
- No cart UI.
- No Stripe webhook handling.
- No paid order marking.
- No custom checkout.
- No auth or admin.
- No Prisma schema changes.
- No migrations.
- No seed or import data.
- No Cloudinary uploads.
- No site redesign.

## Validation Commands

Run from the repository root:

```bash
pnpm --filter @tigerpingpong/api typecheck
pnpm --filter @tigerpingpong/api lint
pnpm --filter @tigerpingpong/api build
git diff --check
```

All commands passed locally.

## Local Test Notes

No live Stripe Checkout Session was created locally because that would require
real `DATABASE_URL` and `STRIPE_SECRET_KEY` values and would create external
Stripe/database state.

## Next Recommended Tasks

- Add a frontend checkout trigger that calls `POST /checkout/sessions`.
- Add Stripe webhook handling for final payment confirmation.
- Add a safe order/session status read for the checkout success page.
