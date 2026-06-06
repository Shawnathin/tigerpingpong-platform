# 017: Checkout Success and Cancel Pages V1

## Routes Added

- `/checkout/success`
- `/checkout/cancel`

## Why These Pages Exist Before Stripe Implementation

These pages prepare the frontend redirect destinations for future
backend-created Stripe Checkout Sessions. Stripe will host checkout in V1, then
redirect customers back to Tiger Ping Pong after success or cancellation.

This task only adds the redirect destination pages. It does not create Checkout
Sessions or start checkout from the frontend.

## Success Page Limitations

`/checkout/success` reads an optional `session_id` URL search param and displays
it as a low-emphasis Stripe session reference when present.

The page intentionally does not say:

- the order is confirmed
- payment was received
- fulfillment has started

The success redirect is not authoritative proof of payment by itself. Final
payment and order status confirmation must come from future backend status and
Stripe webhook work.

## Cancel Page Behavior

`/checkout/cancel` explains that checkout was canceled or not completed. It also
states that no payment confirmation happens on this page.

The page does not imply payment failed. It only reflects the cancellation or
incomplete checkout redirect.

## Future Status Endpoint and Webhook Dependency

Future checkout work should connect:

- backend-created Stripe Checkout Sessions
- a stored pending order before redirecting to Stripe
- Stripe webhook handling for final payment status
- a safe frontend status read, likely by Checkout Session ID or order reference

Until that work exists, these pages remain production-safe placeholders.

## Intentionally Excluded

- No Stripe SDK implementation.
- No checkout endpoints.
- No payment buttons.
- No cart.
- No webhooks.
- No Prisma schema changes.
- No migrations.
- No database writes.
- No auth or admin.
- No Cloudinary uploads.
- No site redesign.

## Local Test Steps

Run from the repository root:

```bash
pnpm lint
pnpm typecheck
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build
git diff --check
git status
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm --filter @tigerpingpong/web dev
```

Then visit:

```text
http://localhost:3000/checkout/success
http://localhost:3000/checkout/success?session_id=cs_test_example
http://localhost:3000/checkout/cancel
http://localhost:3000/catalog
http://localhost:3000/catalog/products/tiger-vice-paddle
http://localhost:3000/shipping
http://localhost:3000/catalog-preview
```

## Render Env Var Notes

No new Render environment variables are required for this task.

Future API checkout work may use:

- `FRONTEND_SITE_URL`
- `CHECKOUT_SUCCESS_URL`
- `CHECKOUT_CANCEL_URL`
- Stripe API-only secrets such as `STRIPE_SECRET_KEY`

Secret Stripe values must stay backend-only and must not use `NEXT_PUBLIC_`.

## Next Recommended Task

Implement the backend-created Stripe Checkout Session endpoint that validates
catalog items, creates a pending order, stores purchase-time item snapshots,
applies the Canada-only V1 shipping rule, creates the Stripe Checkout Session,
and redirects customers to Stripe-hosted checkout.
