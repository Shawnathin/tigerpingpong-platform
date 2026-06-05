# 015: Stripe Checkout Sessions Architecture Plan

## Summary

Created the V1 architecture plan for backend-created Stripe Checkout Sessions:

```text
docs/commerce/TIGER_PINGPONG_STRIPE_CHECKOUT_SESSIONS_PLAN_V1.md
```

This is a planning/documentation task only. No Stripe implementation, checkout endpoint, payment button, cart, webhook, Prisma schema change, migration, database write, auth/admin feature, Cloudinary upload, or site redesign was added.

## Checkout approach documented

The plan recommends backend-created Stripe Checkout Sessions for V1.

Planned flow:

```text
Product detail page
-> future checkout/buy button
-> frontend calls backend checkout endpoint
-> backend creates Stripe Checkout Session
-> user pays on Stripe-hosted checkout
-> Stripe redirects to success/cancel pages
```

Stripe hosts the payment page. The Tiger Ping Pong backend creates and controls the Checkout Session. Custom checkout UI is deferred to a future release.

## Endpoint recommendation

Recommended endpoint:

```http
POST /checkout/sessions
```

Recommended request body:

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

The plan recommends an `items` array even if the first UI starts with one product. This keeps V1 simple while supporting cart or multi-item checkout later.

## Validation rules documented

The backend should:

- Look up products by slug server-side.
- Verify products are active/public.
- Verify `v1CheckoutScope` is true.
- Verify `priceCents` and `currency` are present.
- Reject Replacement Parts unless explicitly enabled later.
- Reject invalid quantities.
- Avoid trusting frontend price or shipping data.

## Stripe line item recommendation

The plan recommends dynamic Stripe `price_data` for V1, using validated database product values.

This is the fastest practical V1 path and avoids immediate schema work for Stripe Product/Price IDs. The plan leaves room to move to stored Stripe Product/Price IDs in a later commerce phase.

## Shipping rule documented

The V1 shipping rule is cart/order-based:

- Canada only for V1.
- Free shipping across Canada on orders over $100.
- $15 flat rate shipping across Canada on orders under or equal to $100.
- All products, including tables, follow the same V1 shipping rule.

The plan recommends `shipping_address_collection.allowed_countries: ["CA"]` and a single backend-selected Stripe `shipping_options` entry based on subtotal:

```text
subtotalCents > 10000: free shipping
subtotalCents <= 10000: $15 flat rate
```

## Success/cancel routes documented

Recommended future routes:

```text
/checkout/success
/checkout/cancel
```

The plan notes that a success redirect is not authoritative fulfillment proof without a webhook/order record.

## Env vars documented

Likely API Render env vars:

```dotenv
STRIPE_SECRET_KEY
STRIPE_CURRENCY
FRONTEND_SITE_URL
CHECKOUT_SUCCESS_URL
CHECKOUT_CANCEL_URL
STRIPE_WEBHOOK_SECRET # later
```

Frontend env var, if needed:

```dotenv
NEXT_PUBLIC_SITE_URL
```

Secret Stripe keys must remain API-only and must not be exposed through frontend `NEXT_PUBLIC_` variables.

## Future phases documented

V1A:

- Create Checkout Session only.
- Redirect to Stripe.
- Manually review Stripe dashboard before fulfillment.

V1B:

- Add `checkout.session.completed` webhook.
- Verify webhook signature.
- Create an order record.
- Add confirmation email.
- Handle payment failure/cancel/refund states as needed.

## Recommended next tasks

```text
Task 016: Stripe Checkout Sessions Backend Endpoint V1
Task 017: Checkout Success/Cancel Pages
Task 018: Product Detail Checkout Button V1
Task 019: Stripe Webhook + Order Record Planning/Implementation
```

## Intentionally excluded

- No Stripe implementation
- No checkout endpoint code
- No payment buttons
- No cart
- No webhooks
- No order database changes
- No email notifications
- No custom checkout
- No auth/admin
- No Prisma schema changes
- No migrations
- No database writes
- No Cloudinary uploads
- No site redesign

## Validation

Docs-only validation:

```bash
git diff --check
git status
```

No package files or app code should be touched. No build is required for this documentation-only task.
