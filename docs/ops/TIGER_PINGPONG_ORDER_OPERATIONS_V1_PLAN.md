# Tiger Ping Pong Order Operations V1 Plan

## Purpose

This plan defines the minimum operational order workflow TigerPingPong.ca needs
before a customer-ready launch.

This is planning documentation only. It does not implement admin, cart, email,
Cloudinary uploads, checkout changes, webhook changes, Prisma schema changes,
migrations, production code, or a site redesign.

## Current State

The platform now creates a durable `Order` before Stripe Checkout, snapshots
`OrderItem` rows at checkout start, verifies Stripe webhooks, and marks a
matching pending order `paid` only through the verified webhook flow.

That is a good payment spine. The operational gap is that staff do not yet have
a deliberate order-review workflow. A paid order can exist in the database, but
there is no staff-facing order list, no support queue, no email notification,
and no fulfillment handoff.

## Minimum Staff View For A Paid Order

Before launch, staff need a reliable way to answer these questions:

- Which orders are newly paid?
- Who paid?
- What did they buy?
- Where should the order ship?
- What amount was charged?
- Which Stripe payment should be reconciled?
- Which customer-safe reference should be used in support messages?
- Does anything need manual review before fulfillment?

The minimum paid order review view should show:

- `publicReference`
- `status`
- `paidAt`
- `createdAt`
- `updatedAt`
- `currency`
- `subtotalCents`
- `shippingCents`
- `totalCents`
- `shippingRule`
- `checkoutSource`
- `customerEmail`
- `customerName`
- `customerPhone`
- `shippingName`
- `shippingPhone`
- `shippingAddressJson`
- `stripeCheckoutSessionId`
- `stripePaymentIntentId`
- `stripeCustomerId`
- order item snapshots: product name, product key, product slug, variant key,
  SKU, image URL, unit price, quantity, line total, currency

For reconciliation and debugging, staff may also need:

- `StripeWebhookEvent.stripeEventId`
- `StripeWebhookEvent.type`
- `StripeWebhookEvent.processedAt`
- the webhook response status from logs, especially `manual_review`,
  `duplicate_processed`, and `duplicate_in_progress`

## Fields Already Exist

The current Prisma order model already stores:

- `Order.id`
- `Order.publicReference`
- `Order.status`
- `Order.currency`
- `Order.subtotalCents`
- `Order.shippingCents`
- `Order.totalCents`
- `Order.shippingRule`
- `Order.checkoutSource`
- `Order.customerEmail`
- `Order.customerName`
- `Order.customerPhone`
- `Order.shippingName`
- `Order.shippingPhone`
- `Order.shippingAddressJson`
- `Order.stripeCheckoutSessionId`
- `Order.stripePaymentIntentId`
- `Order.stripeCustomerId`
- `Order.paidAt`
- `Order.createdAt`
- `Order.updatedAt`

The current order item model already stores:

- `OrderItem.id`
- `OrderItem.orderId`
- `OrderItem.productId`
- `OrderItem.variantId`
- `OrderItem.productKey`
- `OrderItem.productSlug`
- `OrderItem.variantKey`
- `OrderItem.sku`
- `OrderItem.name`
- `OrderItem.imageUrl`
- `OrderItem.unitPriceCents`
- `OrderItem.quantity`
- `OrderItem.lineTotalCents`
- `OrderItem.currency`
- `OrderItem.createdAt`

The current webhook event model already stores:

- `StripeWebhookEvent.id`
- `StripeWebhookEvent.stripeEventId`
- `StripeWebhookEvent.type`
- `StripeWebhookEvent.processedAt`
- `StripeWebhookEvent.createdAt`

## Safe To Expose Internally

These fields are safe to expose in a protected internal staff workflow when the
viewer is authorized and the page is not indexed or public:

- Order status and timestamps.
- Public order reference.
- Customer name, email, and phone.
- Shipping name, phone, and shipping address.
- Order totals and currency.
- Shipping rule applied.
- Order item snapshot fields.
- Stripe Checkout Session ID.
- Stripe PaymentIntent ID.
- Stripe Customer ID.
- Webhook event ID, type, and processed timestamp.
- Internal database order and item IDs, only when needed for staff debugging.

Treat customer contact details, shipping address, and Stripe identifiers as
operationally sensitive. They are necessary for support and reconciliation, but
they should not appear in public UI or logs that can be shared casually.

## Should Never Be Exposed Publicly

Do not expose these in public pages, customer support forms, catalog responses,
or unauthenticated APIs:

- Internal database row IDs such as `Order.id`, `OrderItem.id`, and
  `StripeWebhookEvent.id`.
- Raw Stripe webhook payloads.
- Raw Stripe Checkout Session payloads.
- Raw PaymentIntent details.
- Stripe customer identifiers.
- Shipping address JSON, except to the same customer in a deliberately designed
  authenticated/customer-owned context later.
- Staff notes, manual review reasons, internal logs, stack traces, or database
  errors.
- Supabase service-role credentials, database URLs, Stripe secrets, or webhook
  secrets.

The current checkout creation API response includes `orderId`, but the current
frontend does not render it. Before public launch hardening, review whether
that field should remain in a browser-visible response. Future customer-facing
flows should use `publicReference`, not `Order.id`.

## Current Manual Supabase Workflow

Until an internal order review UI exists, the only practical workflow is manual
review in Supabase or direct trusted database tooling.

Minimum manual process:

1. Open the trusted Supabase project as a staff/admin user.
2. Open the `orders` table.
3. Filter recent rows by `status = paid`.
4. Sort by `paid_at` descending.
5. Open each new paid order.
6. Copy `public_reference` as the customer-safe order reference.
7. Review `customer_email`, `customer_name`, `customer_phone`,
   `shipping_name`, `shipping_phone`, and `shipping_address_json`.
8. Review `subtotal_cents`, `shipping_cents`, `total_cents`, `currency`, and
   `shipping_rule`.
9. Open related `order_items` rows and verify product names, SKUs, quantities,
   and line totals.
10. Search Stripe by `stripe_checkout_session_id` or
    `stripe_payment_intent_id`.
11. Confirm the Stripe payment amount and mode match the order.
12. Record fulfillment/support action outside the app, because fulfillment
    status does not exist yet.

Manual caution:

- Do not manually mark an order `paid` as a routine operation.
- Do not manually edit totals, addresses, Stripe IDs, or item snapshots except
  in a deliberate incident response with written notes.
- Do not fulfill from a success page screenshot. Fulfillment should start from
  a `paid` backend order and Stripe reconciliation.

## Recommended Minimal Internal Order Review Path

The smallest useful internal path is read-only:

- A protected staff-only order list.
- Default filter: `status = paid`, newest first.
- Columns: paid timestamp, public reference, customer email/name, total,
  item count, shipping city/province when available, Stripe payment intent.
- Detail view: order fields, shipping address, item snapshots, Stripe IDs, and
  webhook/event status.
- No mutations in V1.
- No refund controls.
- No fulfillment state changes until a fulfillment model exists.
- No product/catalog editing.

This can be built later as a very small protected internal route or as an
internal API plus a lightweight page. It should not become a broad admin system.

## Option A: Keep Using Supabase Manually For Now

Status: viable only for a very limited, low-volume launch rehearsal.

Pros:

- Fastest path.
- No new code.
- Uses existing order data.
- Good enough for one or two trusted operators.

Cons:

- Easy to miss paid orders.
- No staff-friendly queue.
- No support checklist.
- Higher risk of copying the wrong ID or exposing private data.
- No audit trail for who reviewed what.
- Not customer-ready if volume increases or staff availability is inconsistent.

Use this only with a written daily review checklist and a named owner.

## Option B: Simple Protected Internal Orders Page Later

Status: recommended build path.

Pros:

- Gives staff one obvious place to check paid orders.
- Reduces accidental exposure of internal IDs and raw data.
- Can keep all actions read-only.
- Can be built without changing checkout, webhook, schema, or customer UX.
- Creates a stable support foundation before email and fulfillment automation.

Cons:

- Requires an access-control decision.
- Needs careful deployment protection.
- Should not be expanded into full admin CRUD during V1.

Minimum acceptance criteria:

- Staff can see all `paid` orders.
- Staff can open one order and see customer, shipping, totals, items, and Stripe
  references.
- Public visitors cannot access it.
- No order mutation buttons exist.
- The page uses `publicReference` for customer-facing copy.

## Option C: Email Notification First

Status: useful, but not enough by itself.

Pros:

- Alerts staff when a paid order arrives.
- Can be simpler than a full internal page.
- Helps during low-volume launch.

Cons:

- Email can fail, get filtered, or be missed.
- Email is not a searchable operational database.
- It does not solve order review, reconciliation, or support lookup.
- It may require a provider, secrets, templates, and deliverability decisions.

If chosen, keep it narrow:

- Send staff-only paid order notification after webhook-confirmed `paid`.
- Include `publicReference`, customer email/name, total, item summary, and a
  Stripe dashboard reference.
- Do not send customer receipt emails until copy, sender identity, and support
  expectations are approved.

## Strong Recommendation For Next Build Step

Build a read-only internal paid order review path before launch.

If access control is not ready, use Option A only as a temporary launch rehearsal
workflow and document the manual Supabase checklist in the launch runbook. Do
not treat email alone as operational order visibility.

The next build should remain small:

- read-only orders list
- read-only order detail
- no order mutation
- no refunds
- no fulfillment state
- no catalog editing
- no customer account system

## Risks If We Launch Without Order Visibility

- Paid orders can be missed.
- Staff may fulfill from Stripe alone without seeing the product snapshots.
- Staff may rely on a customer screenshot of the success page.
- Pending or manual-review webhook cases can sit unnoticed.
- Customers may contact support with no clear lookup path.
- Shipping address/customer data may be copied from the wrong system.
- Stale catalog/import review flags may be mistaken for current business-policy
  blockers instead of cleanup work against the locked V1 shipping rule.
- Refund, cancellation, or payment mismatch cases have no staff workflow.

## What Not To Build Yet

Do not build these in the next order-ops step:

- Full admin dashboard.
- Product/catalog CRUD.
- Order editing.
- Manual paid/refund/cancel buttons.
- Fulfillment automation.
- Customer accounts.
- Cart.
- Custom checkout UI.
- Refund workflows.
- Email marketing or broad email templates.
- Cloudinary upload tooling.
- Prisma schema changes unless a separate task explicitly approves them.
- Supabase RLS policies for public order access.

## Recommended Next Task

Create a narrow implementation plan for a protected read-only internal orders
review surface. It should specify access control, fields, list/detail behavior,
and test coverage, but still avoid implementing full admin.
