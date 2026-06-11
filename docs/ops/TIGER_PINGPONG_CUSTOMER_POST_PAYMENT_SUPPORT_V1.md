# Tiger Ping Pong Customer Post-Payment Support V1

## Purpose

This document plans the customer-facing post-payment support path for
TigerPingPong.ca V1.

This is planning documentation only. It does not implement admin, cart, email,
Cloudinary uploads, checkout changes, webhook changes, Prisma schema changes,
migrations, production code, or a site redesign.

## Current Success Page Behavior

`/checkout/success` reads the `session_id` query parameter from Stripe and calls
the backend checkout session status API:

```text
GET /checkout/sessions/:sessionId/status
```

The page currently confirms:

- Whether a Stripe session reference was present in the URL.
- Whether the backend found a matching order.
- The backend order status.
- That a Stripe redirect is not payment truth.
- For `paid` orders only: public order reference, total, paid timestamp, and
  customer email when available.

The status API intentionally reads from the existing backend `Order` row. It
does not mark anything paid and does not call Stripe as a substitute for the
verified webhook.

## What The Success Page Intentionally Does Not Confirm

The page does not confirm:

- Fulfillment has started.
- The order has shipped.
- Inventory has been reserved.
- A staff member has reviewed the order.
- A customer email has been sent.
- A support ticket exists.
- The customer can edit shipping details.
- A refund, cancellation, or exchange workflow exists.

The page also does not expose raw Stripe payloads, internal database details,
shipping address JSON, or item snapshots.

This is the correct posture for now. The next improvement should add clearer
support instructions without pretending that fulfillment automation exists.

## If Status Is Pending

Customers may land on `/checkout/success` before the Stripe webhook has marked
the backend order `paid`.

Customer-facing behavior should say:

- Stripe returned you to Tiger Ping Pong.
- Backend payment confirmation is still pending.
- If you saw a Stripe receipt or your card statement shows a pending charge, do
  not immediately retry checkout.
- Wait a few minutes and refresh the page.
- If the status does not update, contact support and include the order
  reference if shown, the Stripe session reference, checkout email, approximate
  time, and order total.

The copy should avoid saying "payment failed" for `checkout_pending`. Pending is
not failed. It means the backend has not yet received or processed payment truth.

## How `publicReference` Should Be Used

`publicReference` is the customer-safe order reference.

Use it in:

- Success page order reference display.
- Customer support instructions.
- Staff replies to customers.
- Staff order search.
- Future customer confirmation emails.
- Future contact form prefill.

Do not use `Order.id` in customer-facing copy. A customer should be able to say
"my order reference is ..." without exposing the internal database primary key.

## Why Internal Order IDs Should Not Be Exposed

Internal order IDs are implementation details. Exposing them publicly creates
unnecessary coupling and support risk:

- They reveal database identifiers.
- They can be copied into screenshots and emails.
- They can encourage future public APIs to accept internal IDs.
- They make it harder to rotate or reshape internal data models later.
- They are not needed for customer support when `publicReference` exists.

The current checkout creation response includes `orderId`, but the current UI
does not display it. Future public support flows should avoid relying on it and
should prefer `publicReference`.

## Suggested Support Copy

### Paid

```text
Payment confirmed.

Your Tiger Ping Pong order reference is {publicReference}. Keep this reference
for support. We will review your paid order details before fulfillment.
```

### Pending

```text
Payment confirmation is still pending.

Stripe returned you to Tiger Ping Pong, but our backend has not marked the
order paid yet. This can happen while Stripe confirmation is still arriving.
If you received a Stripe receipt, please do not retry checkout immediately.
Refresh this page in a few minutes.
```

### Status Unavailable

```text
Order status is temporarily unavailable.

Your Stripe redirect was received, but this page cannot confirm payment right
now. Please keep your Stripe receipt and contact us with your checkout email,
approximate checkout time, and Stripe session reference.
```

### Not Found

```text
Order status was not found.

We could not find a Tiger Ping Pong order for this Stripe session reference.
Please keep your Stripe receipt and contact us with your checkout email,
approximate checkout time, and Stripe session reference.
```

### Manual Review

```text
Order status needs review.

We cannot display payment confirmation yet. Please contact us with the order
reference shown on this page, if available, and your checkout email.
```

## Suggested "Contact Us About Your Order" Behavior

The next customer-facing support improvement should be small and explicit.

Minimum behavior:

- Add a "Contact us about your order" action on `/checkout/success`.
- Show it for paid, pending, not found, status unavailable, and manual-review
  states.
- Prefer a stable support email or existing contact page if one is approved.
- Include instructions telling customers what to send.
- Use `publicReference` when available.
- Include the Stripe session reference only as a fallback/debug reference.
- Do not expose internal order IDs.
- Do not create a ticketing system yet.
- Do not send automated customer emails yet unless a separate email task
  approves sender, template, and delivery provider.

Good first implementation choices:

- A static support block with the approved support email.
- A `mailto:` link with a prefilled subject containing `publicReference` when
  available.
- A future `/contact` or `/support/order` route that collects reference, email,
  and message, but only after spam protection and storage/email decisions are
  made.

Avoid:

- A public order lookup by internal ID.
- A public order lookup that returns shipping address or item snapshots.
- A form that stores support requests without a staff workflow.
- A promise that fulfillment has started.

## Data Staff Need To Look Up An Order

Support copy should ask customers for the smallest useful set:

- Public order reference, if shown.
- Checkout email address.
- Customer name, if available.
- Approximate checkout date and time.
- Order total.
- Stripe session reference from the success page, if no public reference is
  shown.
- Stripe receipt or payment email, if they received one.
- Product name(s), when helpful.

Staff should then search internally by:

- `publicReference`
- `customerEmail`
- `stripeCheckoutSessionId`
- `stripePaymentIntentId`
- `paidAt` or `createdAt`
- order total

## Recommended Next Task

After order operations planning is approved, add a narrow success-page support
copy/action task:

- Reuse the existing status API.
- Add customer instructions for pending, not found, unavailable, and manual
  review states.
- Add a "Contact us about your order" action using the approved support contact
  destination.
- Do not add email sending, ticket storage, customer accounts, cart behavior,
  or order mutation.

If only one next task can be built before launch, prioritize internal order
visibility first. Customer support copy is much stronger when staff have a
reliable way to look up the order.

## What Not To Add Yet

Do not add these in the first support pass:

- Customer account login.
- Public order lookup by internal ID.
- Public display of shipping address.
- Public display of item snapshots.
- Refund requests.
- Address editing.
- Automated customer receipt email.
- Fulfillment status promises.
- Support ticket database.
- Chat widget.
- Cart.
- Admin.
- Prisma schema changes or migrations.
