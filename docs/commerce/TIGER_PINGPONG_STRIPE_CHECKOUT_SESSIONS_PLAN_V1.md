# Tiger Ping Pong Stripe Checkout Sessions Plan V1

## Purpose

This document defines the V1 architecture plan for backend-created Stripe Checkout Sessions for Tiger Ping Pong.

This is a planning document only. It does not implement Stripe code, checkout endpoints, cart behavior, payment buttons, webhooks, database changes, auth, admin tools, or frontend checkout UI.

## V1 checkout decision

Tiger Ping Pong V1 should use backend-created Stripe Checkout Sessions.

The planned flow is:

```text
Product detail page
-> user clicks a future checkout/buy button
-> frontend calls backend checkout endpoint
-> backend validates product and quantity
-> backend creates a Stripe Checkout Session
-> backend returns the Stripe-hosted checkout URL
-> frontend redirects the user to Stripe
-> user pays on Stripe-hosted checkout
-> Stripe redirects back to Tiger Ping Pong success or cancel pages
```

Key decisions:

- Stripe hosts the payment page.
- The Tiger Ping Pong backend creates and controls the Checkout Session.
- The frontend never sends trusted price data.
- Custom Tiger Ping Pong checkout UI is deferred to a future release.
- Static Stripe Payment Links are not the primary V1 approach.

## Recommended backend endpoint

Recommended endpoint:

```http
POST /checkout/sessions
```

Recommended V1 request body:

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

The endpoint should use an `items` array from the start, even if the first public UI only allows one product at a time.

Reasons:

- It supports single-product checkout immediately.
- It keeps the backend shape ready for cart or multi-item checkout later.
- It avoids creating a V1 single-item contract that must be replaced as soon as a cart is added.
- It lets shipping remain correctly cart/order-based instead of product-based.

The frontend can still begin with one item:

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

The backend should reject an empty `items` array. It should either combine duplicate product slugs into one line item or reject duplicates with a clear validation error. For V1, rejecting duplicates is simpler and easier to reason about.

## Product validation rules

The backend should validate all checkout inputs server-side before creating a Stripe Checkout Session.

For each requested item, the backend should:

- Look up the product by `productSlug` through the database/API layer.
- Verify the product exists.
- Verify the product is active and public.
- Verify `v1CheckoutScope` is true.
- Verify `priceCents` is present, positive, and an integer.
- Verify `currency` is present and supported for V1.
- Reject Replacement Parts unless they are explicitly enabled in a later approved task.
- Reject products that are archived, inactive, private, or outside V1 checkout scope.
- Reject invalid quantities.
- Never trust a price, currency, product name, shipping amount, or Stripe Price ID sent from the frontend.

Quantity rules for V1:

- Quantity must be an integer.
- Quantity must be at least 1.
- Set a conservative maximum quantity, such as 10 per line item, until inventory and abuse controls are more mature.
- Calculate subtotal from database product price and validated quantity only.

The response for validation failures should be public-safe. It should not leak internal database structure, private product status, or Stripe configuration details.

## Stripe line item strategy

There are three practical options:

### Option A: dynamic `price_data`

The backend creates Checkout Session line items using database product values:

```text
product name
unit_amount from priceCents
currency from product currency or V1 default
quantity from validated request
```

Pros:

- Fastest practical V1 path.
- No immediate Stripe catalog setup required.
- Uses the database as the source of truth for product price and currency.
- Works well while product media and catalog records are still being finalized.

Cons:

- Stripe Product/Price objects are not pre-managed as a polished commerce catalog.
- Reporting and reconciliation may be less structured than using stable Stripe Price IDs.
- Later migration may be needed if Tiger Ping Pong wants a fully modeled Stripe catalog.

### Option B: pre-created Stripe Price IDs in the database

The backend looks up each product and uses stored Stripe Price IDs.

Pros:

- Stronger Stripe catalog consistency.
- Better long-term reporting and product/price management inside Stripe.
- Cleaner when prices are fixed and operational processes are mature.

Cons:

- Requires database schema fields or configuration for Stripe Price IDs.
- Requires creating and maintaining Stripe Products and Prices.
- Adds setup work before V1 checkout can launch.
- Prisma schema changes are out of scope for this planning task.

### Option C: hybrid

The backend uses stored Stripe Price IDs when present and falls back to dynamic `price_data` when they are missing.

Pros:

- Can support gradual migration to Stripe Price IDs.
- Useful after the database schema supports Stripe IDs.

Cons:

- More branching logic.
- More test cases.
- More ways for product setup to drift.
- Not necessary for first V1 checkout.

### Recommendation

Use dynamic `price_data` for V1 Checkout Sessions.

This is the fastest practical V1 approach and aligns with the current catalog reality: products already return `priceCents` and `currency`, while Cloudinary images and checkout-specific database fields are not finalized.

Forward-compatible plan:

- V1: dynamic `price_data` from validated database product values.
- Later: add Stripe Product/Price IDs to the database when commerce operations are ready.
- Later: migrate to stored Stripe Price IDs or a hybrid strategy after schema and operational workflows are approved.

## V1 shipping rule

The V1 public shipping rule is cart/order-based:

- Canada only for V1.
- Free shipping across Canada on orders over $100.
- $15 flat rate shipping across Canada on orders under or equal to $100.
- All products, including tables, follow the same V1 shipping rule.
- Replacement Parts remain excluded unless explicitly enabled later.

Backend calculation:

```text
subtotalCents = sum(validatedProduct.priceCents * quantity)

if subtotalCents > 10000:
  shipping = free
else:
  shipping = 1500 cents
```

Important threshold behavior:

- `10001` cents and above gets free shipping.
- `10000` cents exactly uses the $15 flat rate.
- The threshold is based on cart/order subtotal before shipping.

Recommended Stripe Checkout Session setup:

- Use `shipping_address_collection.allowed_countries: ["CA"]`.
- Use `shipping_options` with `shipping_rate_data.fixed_amount`.
- Backend chooses exactly one shipping option based on the validated subtotal.
- Do not let Stripe display both free and flat-rate shipping options for V1.

For orders over $100:

```json
{
  "shipping_options": [
    {
      "shipping_rate_data": {
        "type": "fixed_amount",
        "fixed_amount": {
          "amount": 0,
          "currency": "cad"
        },
        "display_name": "Free shipping across Canada"
      }
    }
  ]
}
```

For orders under or equal to $100:

```json
{
  "shipping_options": [
    {
      "shipping_rate_data": {
        "type": "fixed_amount",
        "fixed_amount": {
          "amount": 1500,
          "currency": "cad"
        },
        "display_name": "$15 flat rate shipping across Canada"
      }
    }
  ]
}
```

This keeps the business rule enforced by the backend and represented clearly in Stripe Checkout.

## Success and cancel URLs

Recommended future routes:

```text
/checkout/success
/checkout/cancel
```

Recommended Stripe URLs:

```text
CHECKOUT_SUCCESS_URL=https://www.tigerpingpong.com/checkout/success?session_id={CHECKOUT_SESSION_ID}
CHECKOUT_CANCEL_URL=https://www.tigerpingpong.com/checkout/cancel
```

V1 success page should show:

- A simple confirmation that checkout was completed on Stripe.
- A note that confirmation details may arrive by email from Stripe or Tiger Ping Pong, depending on the phase.
- A link back to `/catalog`.

V1 cancel page should show:

- A simple message that checkout was canceled.
- A link back to `/catalog`.
- No order failure language unless the backend can verify payment state.

Important: without a webhook/order record, the success redirect alone is not authoritative proof that fulfillment should begin. Stripe dashboard review is the minimum operational fallback for V1A.

## Stripe and site environment variables

Likely Render API environment variables:

```dotenv
STRIPE_SECRET_KEY=sk_live_or_test_...
STRIPE_CURRENCY=CAD
FRONTEND_SITE_URL=https://www.tigerpingpong.com
CHECKOUT_SUCCESS_URL=https://www.tigerpingpong.com/checkout/success?session_id={CHECKOUT_SESSION_ID}
CHECKOUT_CANCEL_URL=https://www.tigerpingpong.com/checkout/cancel
STRIPE_WEBHOOK_SECRET=whsec_... # later, when webhooks are implemented
```

Frontend environment variables, if needed:

```dotenv
NEXT_PUBLIC_SITE_URL=https://www.tigerpingpong.com
```

Notes:

- `STRIPE_SECRET_KEY` must only exist in the API service.
- `STRIPE_WEBHOOK_SECRET` is only needed once webhooks are added.
- Secret keys must never be exposed through `NEXT_PUBLIC_` variables.
- The frontend should only receive the Checkout Session URL returned by the backend.
- API and web Render services can use different env vars where needed.

## Metadata to send to Stripe

Recommended Checkout Session metadata:

```json
{
  "source": "tigerpingpong-web",
  "environment": "prod",
  "shippingRuleVersion": "v1",
  "productSlugs": "tiger-vice-paddle",
  "productKeys": "tiger-vice-paddle",
  "productIds": "database-id-if-safe",
  "quantities": "1"
}
```

For multi-item sessions, keep metadata compact and public-safe:

- Store comma-separated slugs/keys when short enough.
- Avoid internal notes, source URLs, supplier data, or private catalog metadata.
- Avoid sensitive customer data.
- Add `client_reference_id` or an order draft ID later when order records exist.

Line-item-level metadata can be considered later if stored Stripe Product/Price IDs are introduced.

## Order records and webhooks

No order records or webhooks should be implemented in this planning task.

Recommended phases:

### V1A: checkout session creation only

Scope:

- Backend creates Checkout Session.
- Frontend redirects to Stripe.
- Stripe redirects back to success/cancel pages.
- Operators manually review Stripe dashboard for payment status and fulfillment.

Risk:

- The application does not have a reliable internal order record.
- The success redirect is not enough to trigger fulfillment.
- Canceled, abandoned, failed, refunded, and disputed payments are not represented in the app.
- Customer service and reconciliation remain manual.

Minimum acceptable use:

- Internal QA, very limited launch, or low-volume manual operations where Stripe dashboard review is required before fulfillment.

### V1B: webhook and order record

Scope:

- Add webhook endpoint for `checkout.session.completed`.
- Verify Stripe webhook signatures with `STRIPE_WEBHOOK_SECRET`.
- Create an order record after successful checkout.
- Store Stripe session/payment identifiers.
- Make order creation idempotent.
- Add confirmation email workflow.
- Track payment failure, cancel, refund, and dispute states as later needs require.

This is the recommended phase before a more serious public commerce launch.

## Future frontend changes

Planned later tasks:

- Add checkout button to `/catalog/products/[slug]`.
- Optionally add a simple quantity selector.
- For V1, the first UI can send exactly one product.
- The endpoint should still accept `items` so a cart can be added later.
- On click, frontend calls `POST /checkout/sessions`.
- Backend returns a Stripe Checkout URL.
- Frontend redirects the browser to the returned URL.
- Existing cart-aware shipping copy can remain on product cards and product pages.

No frontend checkout UI should be added in this planning task.

## Security and operational notes

- Never trust frontend price, currency, product name, shipping amount, or Stripe identifiers.
- Validate products server-side.
- Validate quantities server-side.
- Keep Stripe secret keys only in the API service.
- Do not expose Stripe secret keys to the frontend.
- Add rate limiting later, especially around checkout session creation.
- Verify webhook signatures later before trusting webhook events.
- Log checkout errors safely without card data, customer secrets, or full Stripe secrets.
- No card data touches Tiger Ping Pong servers when using Stripe Checkout.
- Use Stripe test mode for development and staging.
- Keep environment-specific success/cancel URLs explicit.
- Prefer structured error responses for frontend handling.

## Out of scope for this plan

- Stripe implementation
- Checkout endpoint code
- Payment buttons
- Cart
- Webhooks
- Order database changes
- Email notifications
- Custom checkout
- Auth/admin
- Prisma schema changes
- Migrations
- Database writes
- Cloudinary uploads
- Site redesign

## Recommended implementation sequence

Recommended next tasks:

```text
Task 016: Stripe Checkout Sessions Backend Endpoint V1
Task 017: Checkout Success/Cancel Pages
Task 018: Product Detail Checkout Button V1
Task 019: Stripe Webhook + Order Record Planning/Implementation
```

Task 016 should stay narrow: backend endpoint, server-side validation, dynamic Stripe `price_data`, V1 shipping option selection, and a URL response. It should not add cart, webhooks, order records, or database schema changes unless separately approved.
