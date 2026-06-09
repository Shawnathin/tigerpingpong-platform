# 019: Stripe Webhook Raw Body Scaffold V1

## What Was Added

- Added the first Stripe webhook endpoint:
  `POST /webhooks/stripe`.
- Added a NestJS Stripe webhook module, controller, and service.
- Enabled NestJS raw body capture in the API bootstrap with `rawBody: true`.
- Added Stripe signature verification using the raw request body.
- Added lazy `STRIPE_WEBHOOK_SECRET` config reading.
- Added idempotent `StripeWebhookEvent` recording.
- Recognized `checkout.session.completed` without applying any order payment
  transition.
- Safely ignored unsupported verified event types.
- Added `STRIPE_WEBHOOK_SECRET` to `.env.example`.
- Added API documentation:
  `docs/api/TIGER_PINGPONG_STRIPE_WEBHOOK_API_V1.md`.

## Endpoint Added

```http
POST /webhooks/stripe
```

The endpoint expects Stripe webhook requests with a `Stripe-Signature` header.
The route verifies the signature before trusting the event body.

## Raw Body Configuration

The API bootstrap now creates the Nest app with:

```ts
NestFactory.create(AppModule, {
  rawBody: true
});
```

This uses NestJS/Express raw body support and keeps normal JSON parsing enabled.
Existing JSON endpoints are not globally disabled or replaced.

The webhook controller reads `req.rawBody` and passes that `Buffer` to:

```ts
Stripe.webhooks.constructEvent(...)
```

## Signature Verification

The service rejects:

- missing `Stripe-Signature`,
- missing `STRIPE_WEBHOOK_SECRET`,
- missing raw body,
- invalid Stripe signatures.

Public errors stay generic and do not expose secrets, stack traces, raw payloads,
or sensitive Stripe/customer data.

## Event Recording

Verified events are recorded in the existing `StripeWebhookEvent` model:

- `stripeEventId`
- `type`
- `processedAt` left null for this scaffold

`processedAt` is intentionally not set yet because this task only records secure
receipt. It does not apply a business side effect such as marking an order paid.

## Idempotency Behavior

`StripeWebhookEvent.stripeEventId` is unique. If Stripe retries the same event,
the duplicate insert is treated as successful idempotent receipt.

Duplicate events return HTTP 200 with a response shaped like:

```json
{
  "received": true,
  "status": "duplicate",
  "type": "checkout.session.completed"
}
```

## Supported And Ignored Events

Recognized for this scaffold:

```text
checkout.session.completed
```

For recognized events, the service verifies the signature, records the event ID
and type, and returns:

```json
{
  "received": true,
  "status": "recorded",
  "type": "checkout.session.completed"
}
```

Unsupported verified events are recorded when possible and return:

```json
{
  "received": true,
  "status": "ignored",
  "type": "..."
}
```

The endpoint does not fail merely because Stripe sends a currently unsupported
event type.

## No Paid Order Transition

This task deliberately does not:

- load `Order`,
- mark an order `paid`,
- update `paidAt`,
- store `stripePaymentIntentId`,
- store customer details,
- store shipping details,
- fulfill anything.

The checkout success redirect is still not payment truth. Payment truth must
come from verified webhooks, and the actual paid transition remains a separate
task.

## Environment Variables

Required when the webhook endpoint is called:

```text
STRIPE_WEBHOOK_SECRET
```

The API can still start without `STRIPE_WEBHOOK_SECRET`. The config error is
returned only when `POST /webhooks/stripe` is called without the secret.

Existing checkout session variables remain:

```text
STRIPE_SECRET_KEY
CHECKOUT_SUCCESS_URL
CHECKOUT_CANCEL_URL
APP_ENV
```

## Local Stripe CLI Testing Notes

Start the API locally, then run:

```bash
stripe listen --forward-to localhost:3001/webhooks/stripe
```

Set the printed webhook secret:

```text
STRIPE_WEBHOOK_SECRET=whsec_...
```

Trigger a sample event:

```bash
stripe trigger checkout.session.completed
```

For a record-write test, use a safe development `DATABASE_URL`. A real
`STRIPE_SECRET_KEY` is not needed for webhook signature verification.

## Safe Logging

The webhook service logs only event ID, event type, and receipt status.

It does not log:

- Stripe secret key,
- Stripe webhook secret,
- raw payload,
- card data,
- sensitive customer payload details.

## What Was Intentionally Not Added

- No paid order marking.
- No `checkout.session.completed` order transition.
- No frontend checkout buttons.
- No cart UI.
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
pnpm db:generate
pnpm db:validate
pnpm lint
pnpm typecheck
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build
git diff --check
git status
```

Basic endpoint checks, where possible without real Stripe secrets:

```bash
curl http://localhost:3001/health
curl http://localhost:3001/catalog/health
curl -i -X POST http://localhost:3001/webhooks/stripe -H 'Content-Type: application/json' --data '{}'
curl -i -X POST http://localhost:3001/webhooks/stripe -H 'Content-Type: application/json' -H 'Stripe-Signature: test' --data '{}'
```

The last command should reach the missing-secret path when
`STRIPE_WEBHOOK_SECRET` is unset.

## Next Recommended Task

Implement the verified `checkout.session.completed` paid order transition,
including order lookup, payment status validation, order updates, selected
Stripe field snapshots, and `processedAt` semantics after the order transition
succeeds.
