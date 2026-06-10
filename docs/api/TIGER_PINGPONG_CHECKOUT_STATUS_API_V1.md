# Tiger Ping Pong Checkout Status API V1

## Purpose

This endpoint gives the checkout success page a safe, public read of the
current Tiger Ping Pong order state for a Stripe Checkout Session.

The success redirect is not payment truth. This endpoint only reads the backend
`Order` row that was created before Stripe redirect. It never marks an order
paid, never trusts the redirect as proof of payment, and never exposes raw
Stripe payloads or internal database details.

## Endpoint

```http
GET /checkout/sessions/:sessionId/status
```

Example:

```http
GET /checkout/sessions/cs_test_example/status
```

## Session ID Validation

The endpoint rejects obvious garbage before querying the database.

Accepted shape:

```text
cs_test_* or cs_live_*
```

The suffix may contain letters, numbers, and underscores. This is only a public
shape check; it is not payment verification.

## Response Shape

Found order:

```json
{
  "found": true,
  "status": "paid",
  "publicReference": "clx...",
  "currency": "cad",
  "subtotalCents": 5000,
  "shippingCents": 1500,
  "totalCents": 6500,
  "customerEmail": "customer@example.com",
  "paidAt": "2026-06-10T17:10:00.000Z",
  "createdAt": "2026-06-10T17:05:00.000Z",
  "message": "Payment is confirmed by backend order state."
}
```

No matching order:

```json
{
  "found": false,
  "status": "not_found"
}
```

Possible public statuses:

- `paid`
- `checkout_pending`
- `checkout_failed`
- `canceled`
- `expired`
- `not_found`
- `manual_review`

Unexpected internal order statuses are mapped to `manual_review` for the public
response.

## Safe Fields

The endpoint selects and returns only:

- `found`
- `status`
- `publicReference`
- `currency`
- `subtotalCents`
- `shippingCents`
- `totalCents`
- `customerEmail`
- `paidAt`
- `createdAt`
- `message`

It does not return:

- raw Stripe Checkout Session payloads
- Stripe webhook payloads
- payment intent details
- shipping address JSON
- internal order IDs
- product snapshots
- database error details

## Payment Mutation Rule

This endpoint performs no writes.

Payment state can move to `paid` only through the existing verified Stripe
webhook flow for `checkout.session.completed`. The status endpoint reads the
current `Order.status` after that flow has or has not run.

## Success Page Handling

`/checkout/success` reads `session_id` from the URL and calls this endpoint when
the value exists.

The page renders:

- `paid`: payment confirmed from backend order state, with order reference and
  total.
- `checkout_pending`: redirect received, backend has not marked the order paid.
- `checkout_failed`: backend says checkout did not complete successfully.
- `canceled`: backend says checkout was canceled.
- `expired`: backend says the session expired.
- `not_found`: no backend order matched the session ID.
- `manual_review`: backend returned a state that should not be displayed as
  paid.
- status-call failure: safe unavailable fallback.
- missing `session_id`: safe missing-reference fallback.

The page never marks payment paid client-side.

## Environment Variables

API runtime:

```text
DATABASE_URL
```

Also still required for checkout creation and webhook work:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
CHECKOUT_SUCCESS_URL
CHECKOUT_CANCEL_URL
STRIPE_EXPECTED_LIVEMODE
APP_ENV
CORS_ORIGIN
```

Web runtime:

```text
NEXT_PUBLIC_API_BASE_URL
```

Default local API base URL:

```text
http://localhost:3001
```

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

Suggested smoke tests:

```text
/checkout/success
/checkout/success?session_id=cs_test_example
/checkout/cancel
/catalog/products/tiger-vice-paddle
GET /checkout/sessions/cs_test_example/status
GET /checkout/sessions/<known-paid-test-session>/status, when available
```

For a fake but well-shaped session ID, the API should safely return:

```json
{
  "found": false,
  "status": "not_found"
}
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

## Next Recommended Task

Add a small customer-facing order lookup or support workflow plan that uses
`publicReference` safely, without exposing internal order IDs or adding admin
surface area.
