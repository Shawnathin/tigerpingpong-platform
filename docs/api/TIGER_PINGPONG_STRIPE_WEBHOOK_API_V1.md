# Tiger Ping Pong Stripe Webhook API V1

## Purpose

This document describes the first Stripe webhook scaffold for Tiger Ping Pong
V1.

The endpoint verifies Stripe webhook signatures with the raw request body and
records Stripe event IDs idempotently in `StripeWebhookEvent`.

This API does not confirm payment, mark orders paid, update fulfillment state,
or trust the checkout success redirect as payment truth. The paid order
transition remains a separate follow-up task.

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
while also registering `req.rawBody` for webhook verification. The app does not
globally disable JSON parsing.

Existing endpoints such as `GET /health`, `GET /catalog/health`, and
`POST /checkout/sessions` should continue to receive parsed JSON bodies as
before.

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

Recognized event example:

```json
{
  "received": true,
  "status": "recorded",
  "type": "checkout.session.completed"
}
```

Duplicate event example:

```json
{
  "received": true,
  "status": "duplicate",
  "type": "checkout.session.completed"
}
```

Ignored event example:

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

Missing webhook secret:

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
- `processedAt`: intentionally left `null` in this scaffold.

`processedAt` stays null because this task records receipt only. It does not
apply a business side effect such as marking an order paid. A later payment
confirmation task can define when `processedAt` means the order transition was
fully applied.

If Stripe retries an already recorded event, the unique `stripeEventId`
constraint raises a duplicate write. The route treats that as successful
idempotent receipt and returns HTTP 200 with:

```json
{
  "received": true,
  "status": "duplicate",
  "type": "..."
}
```

This prevents Stripe retries from causing duplicate processing.

## Supported Events

The scaffold recognizes:

```text
checkout.session.completed
```

For V1 scaffold behavior, recognition means:

- the event signature was verified,
- the event ID and type were recorded,
- the route returned a safe success response.

Recognition does not mean the related `Order` was paid or fulfilled.

## Ignored Events

Unsupported event types are still verified first. When the database write is
available, the event ID and type are recorded for audit/idempotency, and the
route returns HTTP 200 with `status: "ignored"`.

The route does not throw just because Stripe sends an event Tiger Ping Pong does
not currently use.

## Payment Truth Rule

The checkout success redirect is not payment truth. A browser redirect can be
visited without proving that Stripe confirmed payment.

Payment truth must come from verified Stripe webhooks. This scaffold is the
secure receipt layer only; it does not yet contain the order update logic.

## Environment Variables

Required when the webhook endpoint is called:

```text
STRIPE_WEBHOOK_SECRET
```

Still required by checkout session creation:

```text
STRIPE_SECRET_KEY
CHECKOUT_SUCCESS_URL
CHECKOUT_CANCEL_URL
```

Optional:

```text
APP_ENV
```

`.env.example` includes:

```text
STRIPE_WEBHOOK_SECRET=
```

The API process can still start when `STRIPE_WEBHOOK_SECRET` is empty. Only
calls to `POST /webhooks/stripe` require it.

## Local Stripe CLI Testing Notes

With a local API server on port 3001:

```bash
stripe listen --forward-to localhost:3001/webhooks/stripe
```

Copy the printed `whsec_...` value into:

```text
STRIPE_WEBHOOK_SECRET=whsec_...
```

Then trigger a sample event:

```bash
stripe trigger checkout.session.completed
```

For a full local record-write test, the API also needs a development
`DATABASE_URL` pointing at a safe database. The scaffold does not need a real
`STRIPE_SECRET_KEY` for webhook signature verification because webhook
verification uses `STRIPE_WEBHOOK_SECRET`.

## Safe Logging

The service logs only:

- event ID,
- event type,
- receipt status.

It does not log:

- `STRIPE_SECRET_KEY`,
- `STRIPE_WEBHOOK_SECRET`,
- raw webhook payloads,
- card data,
- customer-sensitive webhook details.

## Intentionally Excluded

This scaffold does not add:

- paid order marking,
- `checkout.session.completed` order transition,
- `paidAt` updates,
- `stripePaymentIntentId` storage,
- customer or shipping detail storage,
- fulfillment behavior,
- frontend checkout buttons,
- cart UI,
- custom checkout,
- auth or admin,
- Prisma schema changes,
- migrations,
- seed or import data,
- Cloudinary uploads,
- site redesign.

## Next Recommended Task

Add the verified `checkout.session.completed` order transition:

1. Use the verified event object.
2. Find the Stripe Checkout Session and pending `Order`.
3. Confirm the event/session represents completed payment.
4. Update the order to `paid`.
5. Store payment/customer/shipping fields selected for V1.
6. Set `processedAt` only after the order transition succeeds.
7. Preserve idempotency for Stripe retries.
