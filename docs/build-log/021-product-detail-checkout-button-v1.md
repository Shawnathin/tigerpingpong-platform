# 021: Product Detail Checkout Button V1

## What Was Added

- Added the first V1 product detail checkout trigger on
  `/catalog/products/[slug]`.
- Replaced the previous V1 checkout placeholder with a small client component:
  `apps/web/src/app/catalog/products/[slug]/CheckoutButton.tsx`.
- Added a frontend checkout API helper:
  `apps/web/src/lib/checkout-api.ts`.
- The button starts a backend-created Stripe Checkout Session and redirects to
  the `checkoutUrl` returned by the API.

## Route Changed

```text
/catalog/products/[slug]
```

The product detail page remains a server component. Only the checkout button is
client-side so it can handle click state, API submission, and browser redirect.

## Request Payload

The frontend sends:

```json
{
  "items": [
    {
      "productSlug": "<current product slug>",
      "quantity": 1
    }
  ]
}
```

The frontend does not send product name, price, shipping amount, subtotal, or
total as trusted checkout data.

## Fixed Quantity Decision

V1 product detail checkout uses a fixed quantity of `1`.

Quantity controls and cart behavior are intentionally deferred to a later task.

## API Helper

`createCheckoutSession({ items })`:

- uses `NEXT_PUBLIC_API_BASE_URL`
- posts JSON to `POST /checkout/sessions`
- handles non-2xx responses as checkout API errors
- validates that the response includes `checkoutUrl` and the order/session
  summary fields
- avoids logging or displaying secrets

Returned summary fields include:

- `checkoutUrl`
- `checkoutSessionId`
- `orderId`
- `publicReference`
- `currency`
- `subtotalCents`
- `shippingCents`
- `totalCents`
- `shippingLabel`

## Error Handling

If checkout cannot start, the customer sees:

```text
Checkout could not be started. Please try again or contact us.
```

The product page does not display stack traces, Stripe internals, database
details, or raw backend error bodies.

## Product Eligibility

The page keeps Replacement Parts excluded through the existing product detail
filtering.

For visible product detail pages, the checkout button is only enabled when the
product response indicates:

- `v1PublicNavigation: true`
- `v1CheckoutScope: true`
- `purchaseMode` is `online_checkout` or `online_checkout_candidate`
- positive CAD price

If a product is not eligible, the panel shows:

```text
Checkout is not available for this product yet.
```

The backend remains the source of truth and still validates product eligibility.

## Shipping Copy

Existing product detail shipping copy is unchanged.

The frontend does not calculate or send shipping amounts. The backend applies
the V1 Canada shipping rule:

- free shipping across Canada on orders over $100
- flat rate shipping on orders under or equal to $100

## Environment Variables Needed

Frontend:

```text
NEXT_PUBLIC_API_BASE_URL
```

API:

```text
DATABASE_URL
STRIPE_SECRET_KEY
CHECKOUT_SUCCESS_URL
CHECKOUT_CANCEL_URL
```

Optional API variables already supported:

```text
APP_ENV
STRIPE_WEBHOOK_SECRET
STRIPE_EXPECTED_LIVEMODE
```

## Render Environment Checklist

API service:

- `DATABASE_URL` points at the production database.
- `STRIPE_SECRET_KEY` is set for the intended Stripe mode.
- `CHECKOUT_SUCCESS_URL` points at the deployed web success route and includes
  `{CHECKOUT_SESSION_ID}` when desired.
- `CHECKOUT_CANCEL_URL` points at the deployed web cancel route.
- `STRIPE_WEBHOOK_SECRET` is set for the Stripe webhook endpoint.
- `STRIPE_EXPECTED_LIVEMODE` matches the Stripe mode expectation when used.
- CORS allows the deployed web origin.

Web service:

- `NEXT_PUBLIC_API_BASE_URL` points at the deployed API base URL.
- `NEXT_PUBLIC_SITE_URL` points at the deployed web base URL when used.

## What Was Intentionally Not Added

- No cart.
- No custom checkout.
- No Stripe Elements.
- No static Stripe Payment Links.
- No auth or admin.
- No Prisma schema changes.
- No migrations.
- No webhook changes.
- No paid order transition changes.
- No Cloudinary uploads.
- No site redesign.
- No quantity selector.

## Local Test Steps

Run from the repository root:

```bash
pnpm db:generate
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate
pnpm lint
pnpm typecheck
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build
git diff --check
git status
```

Optional UI smoke test against the deployed API:

```bash
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm --filter @tigerpingpong/web dev
```

Then check:

```text
http://localhost:3000/catalog/products/tiger-vice-paddle
http://localhost:3000/catalog/products/tiger-whistler-indoor-table
http://localhost:3000/catalog
http://localhost:3000/checkout/success
http://localhost:3000/checkout/cancel
http://localhost:3000/catalog-preview
```

If the deployed API is missing Stripe or checkout environment variables, the
button may return a safe configuration error. That is acceptable for local Codex
testing as long as the page does not crash and the safe customer message is
shown.

## Next Recommended Task

Add a small success-page order/session status read so `/checkout/success` can
show customer-safe order confirmation details after webhook payment
confirmation.
