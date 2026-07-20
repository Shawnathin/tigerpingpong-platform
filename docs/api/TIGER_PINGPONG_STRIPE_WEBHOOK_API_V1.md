# Tiger Ping Pong Stripe Webhook API V1

## Purpose

This document describes the V1 Stripe webhook endpoint for Tiger Ping Pong.

The endpoint verifies Stripe webhook signatures with the raw request body,
records Stripe event IDs idempotently in `StripeWebhookEvent`, and handles the
verified `checkout.session.completed` paid order transition.

The checkout success redirect is not payment truth. Only this verified webhook
path can mark an order paid.

## Endpoint

```http
POST /webhooks/stripe
```

Stripe should send this endpoint its standard webhook request with:

```http
Stripe-Signature: t=...,v1=...
Content-Type: application/json
```

The controller reads `req.rawBody` and passes that unmodified `Buffer` to the
Stripe SDK signature verifier.

## Raw Body Requirement

Stripe webhook signatures must be verified against the exact raw request body
received from Stripe. A parsed JSON object is not valid input for signature
verification because parsing can change whitespace, ordering, and byte-level
payload details.

The API bootstrap enables NestJS raw body support:

```ts
NestFactory.create(AppModule, {
  rawBody: true
});
```

This keeps the normal NestJS/Express JSON parser active for existing endpoints
while also registering `req.rawBody` for webhook verification.

## Signature Verification

The webhook route:

1. Reads the `Stripe-Signature` request header.
2. Rejects the request if the signature header is missing.
3. Reads `STRIPE_WEBHOOK_SECRET` only when the endpoint is called.
4. Rejects the request with a safe config error if `STRIPE_WEBHOOK_SECRET` is
   missing.
5. Verifies the raw body with `Stripe.webhooks.constructEvent`.
6. Rejects invalid signatures with a safe public error.

The endpoint never returns Stripe secrets, stack traces, raw payloads, card
data, or customer-sensitive payload details.

## Success Responses

Paid transition:

```json
{
  "received": true,
  "status": "paid",
  "type": "checkout.session.completed"
}
```

Already-paid idempotent success:

```json
{
  "received": true,
  "status": "already_paid",
  "type": "checkout.session.completed"
}
```

Duplicate already processed event:

```json
{
  "received": true,
  "status": "duplicate_processed",
  "type": "checkout.session.completed"
}
```

Duplicate recorded but not processed event:

```json
{
  "received": true,
  "status": "duplicate_in_progress",
  "type": "checkout.session.completed"
}
```

Valid but unsafe event requiring manual review:

```json
{
  "received": true,
  "status": "manual_review",
  "type": "checkout.session.completed"
}
```

Ignored event:

```json
{
  "received": true,
  "status": "ignored",
  "type": "customer.created"
}
```

## Safe Error Behavior

Missing signature:

```json
{
  "message": "Stripe signature is required."
}
```

Missing webhook secret or invalid webhook config:

```json
{
  "message": "Stripe webhook is not configured."
}
```

Invalid signature:

```json
{
  "message": "Stripe webhook signature verification failed."
}
```

Raw body unavailable:

```json
{
  "message": "Stripe webhook payload is required."
}
```

Database config or write failure:

```json
{
  "message": "Stripe webhook event could not be recorded."
}
```

NestJS may wrap these messages with its standard `statusCode` and `error`
fields.

## Event Recording And Idempotency

After a webhook is verified, the service writes one `StripeWebhookEvent` row:

- `stripeEventId`: Stripe event ID, unique.
- `type`: Stripe event type.
- `processedAt`: set only after the order paid transition, or an already-paid
  idempotent success, is safely complete.

For `checkout.session.completed`, event creation, order validation, order
update, and `processedAt` update run in one Prisma transaction. If the database
fails during the transition, the transaction rolls back so Stripe can retry.

If Stripe retries an already recorded event, the unique `stripeEventId`
constraint prevents a second processing attempt:

- `processedAt` present: returns `duplicate_processed`.
- `processedAt` null: returns `duplicate_in_progress`.

Unsupported verified events are recorded for audit/idempotency and return
`ignored`. Their `processedAt` remains null because no business side effect was
applied.

## Supported Events

V1 handles:

```text
checkout.session.completed
```

No other Stripe event type marks an order paid in V1.

## Paid Order Transition

The service finds the order by the verified Checkout Session ID:

```text
session.id == Order.stripeCheckoutSessionId
```

It also verifies:

- `session.client_reference_id == Order.id`
- `session.metadata.orderId == Order.id`
- exactly one order matches the session ID
- `Order.status` is `checkout_pending` for a new paid transition

If the order is already `paid`, the event is treated as idempotent success only
when the same checkout session and payment intent match.

Orders in `checkout_failed`, `canceled`, `expired`, `refunded`, or any other
non-payable state are not marked paid automatically. The endpoint returns HTTP
200 with `manual_review` for valid but unsafe events to avoid repeated Stripe
retries while preserving a diagnostic audit record.

## Strict Verification

Before marking an order paid, the service verifies:

- session object is a Checkout Session
- session mode is `payment`
- session status is `complete`
- session payment status is `paid`
- session currency is `cad`
- session total equals `Order.totalCents`
- session subtotal equals `Order.subtotalCents` when Stripe provides it
- session shipping cost equals `Order.shippingCents` when Stripe provides it
- shipping details exist and shipping country is `CA`
- order currency is CAD
- order total equals subtotal plus shipping
- order has at least one item
- item line totals equal the order subtotal
- item currencies are CAD
- order shipping rule is either the current
  `canada_free_over_100_flat_15_aqua_4_pack_free` rule or the supported legacy
  `canada_free_over_100_flat_15` rule
- order subtotal, item snapshots, and shipping still satisfy the stored rule;
  only an Aqua 4-pack-only order receives the current below-threshold exception
- event/session livemode matches `STRIPE_EXPECTED_LIVEMODE` when that env var is
  set

Shipping details are intentionally strict for production because all V1 checkout
orders are physical goods and the Checkout Session collects a Canadian shipping
address. Stripe CLI fixture payloads that do not include shipping details will
record as `manual_review` rather than marking an order paid.

## Stored Order Fields

After validation succeeds, the service updates `Order`:

- `status: paid`
- `paidAt`
- `stripePaymentIntentId` when available
- `stripeCustomerId` when available
- `customerEmail`, `customerName`, `customerPhone` when available
- `shippingName` when available
- `shippingPhone` from the customer phone when available
- `shippingAddressJson` with selected address fields

The service does not store the raw Stripe event payload and does not store card
data. Existing customer fields are not overwritten with null values.

## Environment Variables

Required when the webhook endpoint is called:

```text
STRIPE_WEBHOOK_SECRET
```

Optional:

```text
APP_ENV
STRIPE_EXPECTED_LIVEMODE
```

`STRIPE_EXPECTED_LIVEMODE` accepts `true`, `false`, `1`, or `0`. When unset, the
webhook does not block on livemode. For local Stripe CLI testing, use:

```text
STRIPE_EXPECTED_LIVEMODE=false
```

Still required by checkout session creation:

```text
STRIPE_SECRET_KEY
CHECKOUT_SUCCESS_URL
CHECKOUT_CANCEL_URL
```

The API process can still start when `STRIPE_WEBHOOK_SECRET` is empty. Only
calls to `POST /webhooks/stripe` require it.

## Safe Logging

The service logs only:

- event ID
- event type
- receipt/processing status
- sanitized manual-review reason codes

It does not log:

- Stripe secret key
- Stripe webhook secret
- raw webhook payload
- card data
- customer-sensitive webhook details

## Intentionally Excluded

This endpoint does not add:

- frontend checkout buttons
- cart UI
- custom checkout
- auth or admin
- Prisma schema changes
- migrations
- seed or import data
- Cloudinary uploads
- site redesign
- broad fulfillment automation
- email sending
- refund handling
- support for every Stripe event

## Local Stripe CLI Testing Notes

With a local API server on port 3001:

```bash
stripe listen --forward-to localhost:3001/webhooks/stripe
```

Copy the printed `whsec_...` value into:

```text
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_EXPECTED_LIVEMODE=false
```

The API also needs a safe development `DATABASE_URL`. A real
`STRIPE_SECRET_KEY` is not needed for webhook signature verification because
webhook verification uses `STRIPE_WEBHOOK_SECRET`.
