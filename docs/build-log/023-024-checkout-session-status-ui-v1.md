# 023-024: Checkout Session Status UI V1

## What Was Added

- Added `GET /checkout/sessions/:sessionId/status`.
- Added a read-only checkout status lookup by `Order.stripeCheckoutSessionId`.
- Added safe public response fields for checkout status display.
- Added `apps/web/src/lib/checkout-api.ts`.
- Updated `/checkout/success` to read `session_id`, call the backend status
  endpoint, and render backend-confirmed order status.
- Added safe success-page states for paid, pending, failed, canceled, expired,
  not found, manual review, missing session, and status-call failure.

## Endpoint Added

```http
GET /checkout/sessions/:sessionId/status
```

The endpoint validates that `sessionId` looks like a Stripe Checkout Session ID:

```text
cs_test_* or cs_live_*
```

It then reads:

```text
Order.stripeCheckoutSessionId == sessionId
```

## Response Shape

Found order:

```json
{
  "found": true,
  "status": "checkout_pending",
  "publicReference": "clx...",
  "currency": "cad",
  "subtotalCents": 5000,
  "shippingCents": 1500,
  "totalCents": 6500,
  "customerEmail": "customer@example.com",
  "createdAt": "2026-06-10T17:05:00.000Z",
  "message": "Payment confirmation is still pending."
}
```

Fields with no value are omitted from the actual JSON response.

Not found:

```json
{
  "found": false,
  "status": "not_found"
}
```

## Status Handling

Public statuses:

- `paid`
- `checkout_pending`
- `checkout_failed`
- `canceled`
- `expired`
- `not_found`
- `manual_review`

The database currently also has `refunded`, but refund handling is not part of
this task. Unexpected or out-of-scope internal statuses are surfaced publicly as
`manual_review`.

## Success Page States

`/checkout/success` now handles:

- Missing `session_id`: explains that status cannot be looked up without a
  session reference.
- Status API failure: shows a safe unavailable state.
- `not_found`: explains that no backend order matched the session.
- `checkout_pending`: explains that backend payment confirmation is still
  pending.
- `checkout_failed`: explains checkout did not complete successfully.
- `canceled`: explains checkout was canceled.
- `expired`: explains checkout expired.
- `manual_review`: explains the status needs review before payment is shown as
  confirmed.
- `paid`: shows backend-confirmed payment status, public order reference, total,
  and optional paid timestamp/customer email.

The page does not state or imply that order handling has begun.

## Why This Does Not Mark Payment Paid

The success redirect is informational only. The success page calls a read-only
API endpoint. The API endpoint performs a Prisma `findUnique` with a narrow
`select`; it does not call `update`, does not write webhook records, does not
call Stripe, and does not infer payment from the redirect.

The existing verified Stripe webhook remains the only code path that can mark a
matching pending order `paid`.

## Environment Variables Needed

For the status endpoint:

```text
DATABASE_URL
```

For the frontend helper:

```text
NEXT_PUBLIC_API_BASE_URL
```

Still needed elsewhere in checkout/webhook flows:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_EXPECTED_LIVEMODE
CHECKOUT_SUCCESS_URL
CHECKOUT_CANCEL_URL
APP_ENV
CORS_ORIGIN
```

## Local Test Steps

Validation commands:

```bash
pnpm db:generate
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate
pnpm lint
pnpm typecheck
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build
git diff --check
git status
```

Smoke tests:

```text
/checkout/success
/checkout/success?session_id=cs_test_example
/checkout/cancel
/catalog/products/tiger-vice-paddle
GET /checkout/sessions/cs_test_example/status
GET /checkout/sessions/<known-paid-test-session>/status, when available
```

## Intentionally Excluded

- No cart.
- No admin.
- No email.
- No fulfillment flow.
- No refunds.
- No checkout session creation behavior changes.
- No webhook paid-transition behavior changes.
- No Prisma schema changes.
- No migrations.
- No Cloudinary uploads.
- No site redesign.

## Database Actions

- No Prisma schema changes.
- No migrations.
- No database writes were added to the status endpoint.
- `pnpm db:generate` and `pnpm db:validate` are validation-only steps.

## Next Recommended Task

Plan the post-payment customer communication/support path around
`publicReference`, including what customers see if webhook confirmation is
delayed, without adding admin, email, fulfillment, or refund behavior in the
same task.
