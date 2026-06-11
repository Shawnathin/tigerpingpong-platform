# 031 Production Checkout Order QA V1

## Summary

Production QA was run on June 11, 2026 from branch
`docs/031-production-checkout-order-qa-v1`.

This was a documentation and verification pass only.

No production code, checkout code, webhook code, internal orders code, Prisma
schema, migrations, cart, admin, customer accounts, email, fulfillment, or
refund behavior was changed.

## Production URL Structure

- Browser-facing production storefront and staff app:
  `https://tigerpingpong-web.onrender.com`
- Backend/API/webhook service:
  `https://tigerpingpong-platform.onrender.com`

Use `https://tigerpingpong-web.onrender.com` for public storefront and protected
staff page checks:

- `https://tigerpingpong-web.onrender.com/`
- `https://tigerpingpong-web.onrender.com/catalog`
- `https://tigerpingpong-web.onrender.com/catalog/products/<product-slug>`
- `https://tigerpingpong-web.onrender.com/shipping`
- `https://tigerpingpong-web.onrender.com/contact`
- `https://tigerpingpong-web.onrender.com/checkout/success`
- `https://tigerpingpong-web.onrender.com/checkout/cancel`
- `https://tigerpingpong-web.onrender.com/internal/orders`
- `https://tigerpingpong-web.onrender.com/internal/orders/<order-reference>`

Do not use `https://tigerpingpong-platform.onrender.com` as the
browser-facing staff/internal URL unless the deployment structure is
intentionally changed. That origin is the backend/API/webhook service in the
current production setup.

Custom domain observation: `https://www.tigerpingpong.com` and
`https://tigerpingpong.com` redirect to `https://tigerpingpong.ca/`, which is
the legacy storefront and not the current Render app from this repository.

## PR 35 Preflight

PR #35 was confirmed merged before starting this branch.

- PR: `https://github.com/Shawnathin/tigerpingpong-platform/pull/35`
- State: `MERGED`
- Merged at: `2026-06-11T21:58:17Z`
- Merge commit: `fc6a2eba6b4d73de4bc50bca3fff6d83f1a8eecd`
- Local `main` after pull: `fc6a2eba6b4d73de4bc50bca3fff6d83f1a8eecd`

## Public Route Checklist

| Route | Result | Notes |
| --- | --- | --- |
| `/` | Pass | `200 text/html` on Render storefront. |
| `/catalog` | Pass | `200 text/html`; catalog rendered public product links. |
| `/catalog/products/tiger-vice-paddle` | Pass | `200 text/html`; page includes `Buy with Stripe`. |
| `/catalog/products/tiger-portland-outdoor-table` | Pass | `200 text/html`; page includes `Buy with Stripe`. |
| `/catalog/products/tiger-premium-balls-6-white` | Pass | `200 text/html`; page includes `Buy with Stripe`. |
| `/shipping` | Pass | `200 text/html`. |
| `/contact` | Pass | `200 text/html`. |
| `/checkout/success` | Pass | `200 text/html`; missing-session state rendered safely. |
| `/checkout/cancel` | Pass | `200 text/html`; cancel page rendered safely. |

## Protected Route Checklist

| Route | Result | Notes |
| --- | --- | --- |
| `/internal/orders` without credentials | Pass | Render storefront returned `401 text/plain` with `Authentication required.` |
| `/internal/orders` with wrong Basic Auth | Pass | Render storefront returned `401 text/plain` with `Authentication required.` |
| `/internal/orders` with valid Basic Auth | Pass | Human-assisted Chrome QA opened the protected order list at `https://tigerpingpong-web.onrender.com/internal/orders`. |
| API `/internal/orders` without token | Pass | Render API returned `401` with `Unauthorized.` |
| API `/internal/orders` with wrong token | Pass | Render API returned `401` with `Unauthorized.` |
| API `/internal/orders` with valid token | Not directly checked | Staff page success confirms the web app could call the internal orders API with the server-side token. The raw token was not exposed or used directly in QA. |

## Checkout Flow Checklist

| Step | Result | Evidence |
| --- | --- | --- |
| Product page checkout button is present | Pass | Checked the requested product pages; each rendered `Buy with Stripe`. |
| Product page checkout button click works | Pass | Human-assisted Chrome QA used the browser-facing Render storefront and reached Stripe Checkout from the product page. |
| Stripe Checkout opens | Pass | Stripe Checkout opened in test mode. Checkout Session ID was redacted and starts with `cs_test_`. |
| Test payment completes | Pass | Stripe test payment completed in Chrome. |
| Success redirect returns to storefront | Pass | Stripe redirected back to the browser-facing Render storefront success page. |
| Success page reads backend-confirmed status | Pass | Success page displayed `Payment confirmed` and backend order status `Paid`. |
| Stripe webhook marks order paid | Pass | `checkout.session.completed` webhook delivery succeeded with HTTP `201` / `201 OK`. |
| Supabase order row shows paid | Pass | Matching Supabase order row was found with paid status/order_status. |
| Internal orders page shows paid order | Pass | Latest paid order appeared in the read-only paid order review table. |
| Order detail page shows customer/shipping/totals/items/Stripe refs | Pass | Order detail opened at `https://tigerpingpong-web.onrender.com/internal/orders/<redacted-order-reference>` and showed backend-confirmed paid summary, customer/shipping section, totals, and order data. |

## Human-Assisted Production Verification

- Browser used: Chrome.
- Browser-facing production URL tested:
  `https://tigerpingpong-web.onrender.com`.
- Product tested: `Tiger PingPong Vice Ping Pong Paddle`
  (`tiger-vice-paddle`).
- Stripe Checkout Session ID: redacted, starts with `cs_test_`.
- Stripe test payment result: Passed.
- Success redirect result: Passed.
- Success page backend status result: Passed. The success page displayed
  `Payment confirmed` and backend order status `Paid`.
- Stripe webhook event checked: `checkout.session.completed`.
- Stripe webhook delivery status: Passed. Stripe event destination delivered
  with HTTP `201` / `201 OK`.
- Current Stripe webhook destination observed:
  `https://tigerpingpong-platform.onrender.com/webhooks/stripe`.
- Supabase order row result: Passed. Matching order row found with paid
  status/order_status.
- Internal orders 401 without credentials result: Passed from earlier QA.
- Internal orders valid Basic Auth result: Passed. Protected order list opened
  at `https://tigerpingpong-web.onrender.com/internal/orders`.
- Internal order list result: Passed. Latest paid order appeared in the
  read-only paid order review table.
- Internal order detail result: Passed. Order detail opened at
  `https://tigerpingpong-web.onrender.com/internal/orders/<redacted-order-reference>`
  and showed backend-confirmed paid summary, customer/shipping section, totals,
  and order data.
- If item and Stripe reference sections are below the fold on the order detail
  page, capture a separate lower-page screenshot showing those sections.

## Launch Confidence Summary

Render production checkout/order foundation is verified. A customer can
complete Stripe Checkout, return to a success page that reads backend-confirmed
paid status, Stripe webhook delivery is confirmed, Supabase stores the paid
order, and staff can review the paid order behind protected Basic Auth at the
browser-facing web URL.

## Checkout Session Evidence

A production test checkout session was created through the Render API:

- Endpoint: `POST https://tigerpingpong-platform.onrender.com/checkout/sessions`
- Request item: `tiger-vice-paddle`, quantity `1`
- Email: `qa+tigerpingpong-031@example.com`
- Response: `201 application/json`
- Session shape: `cs_test_...`
- Public reference: `cmqa22vtk0002rrj3wbkrwbgi`
- Subtotal: `5000` cents CAD
- Shipping: `1500` cents CAD
- Total: `6500` cents CAD
- Follow-up status endpoint result: `checkout_pending`

The checkout status endpoint for a fake but well-shaped session also returned
safe public output:

```json
{"found":false,"status":"not_found"}
```

## Webhook Configuration Check

A non-mutating invalid-signature webhook request was sent to:

```text
POST https://tigerpingpong-platform.onrender.com/webhooks/stripe
```

Result:

```json
{"message":"Stripe webhook signature verification failed."}
```

This confirms the webhook route is live and `STRIPE_WEBHOOK_SECRET` is present.
The separate human-assisted production verification confirmed the paid
transition with a real `checkout.session.completed` delivery.

## Security Checks

| Check | Result | Notes |
| --- | --- | --- |
| No public links to `/internal/orders` | Pass | Public route HTML scan found no internal-order links. |
| No public cart/account/admin links | Pass | Public route HTML scan found no `cart`, `account`, or `admin` links. |
| No client-side internal order API token exposure | Pass | Six public script assets loaded by checked public pages contained no `INTERNAL_ORDERS_API_TOKEN`, `x-internal-orders-token`, or `/internal/orders` strings. |
| Payment is not marked paid client-side | Pass | Success page for the created pending session showed `checkout_pending`, not paid. |
| Success redirect is not payment truth | Pass | Success page copy explicitly treated redirect as non-authoritative and read backend order state. |
| Internal API fails closed without token | Pass | API returned `401 Unauthorized` for missing and wrong token. |
| Internal web route fails closed without Basic Auth | Pass | Web route returned `401 Authentication required.` |

## Environment Checks

| Variable | Status | Evidence |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Pass | Render storefront loaded catalog/product/success data from the Render API. |
| `DATABASE_URL` | Pass | Catalog reads, checkout session creation, and checkout status lookup all used production database-backed API paths successfully. |
| `STRIPE_SECRET_KEY` | Pass | Checkout session creation succeeded and returned a `cs_test_...` Stripe Checkout Session. |
| `STRIPE_WEBHOOK_SECRET` | Pass | Invalid signed webhook request reached signature verification and returned signature failure rather than missing-config failure. |
| `INTERNAL_ORDERS_API_TOKEN` | Pass, indirectly | Missing/wrong token checks returned `401`; valid staff page access loaded paid orders through the server-side token without exposing it. |
| `INTERNAL_ORDERS_BASIC_AUTH_USER` | Pass | No-credential and wrong-credential checks returned `401`; valid Basic Auth opened the protected staff page. |
| `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD` | Pass | No-credential and wrong-credential checks returned `401`; valid Basic Auth opened the protected staff page. |

## Screenshots Captured

Human-assisted QA captured:

- Checkout success page with backend-confirmed paid status.
- Stripe webhook delivery showing `checkout.session.completed` and HTTP `201` /
  `201 OK`.
- Supabase orders table showing paid order row.
- Internal orders list showing paid order.
- Internal order detail showing paid order.

Screenshot redaction required before sharing outside the launch review group:

- Redact customer email.
- Redact address.
- Redact full order references where appropriate.
- Redact full PaymentIntent / Stripe references where appropriate.
- Do not include Basic Auth credentials.
- Do not include API tokens.
- Do not include Stripe secrets.

If the order detail page has item or Stripe reference sections below the fold,
include a separate lower-page screenshot for those sections, with the same
redaction rules.

## What Passed

- PR #35 was merged into `main` before branch creation.
- Latest `main` was pulled before the branch was created.
- Requested public Render routes returned `200`.
- `/internal/orders` returned `401` without credentials.
- Wrong Basic Auth also returned `401`.
- API internal orders endpoint returned `401` for missing and wrong tokens.
- Product pages rendered `Buy with Stripe`.
- A Chrome production checkout run completed a Stripe test payment.
- Success redirect returned to the browser-facing Render storefront.
- Success page displayed backend-confirmed paid status.
- Stripe delivered `checkout.session.completed` to the Render API webhook with
  HTTP `201` / `201 OK`.
- Supabase showed the matching paid order row.
- Valid Basic Auth opened the protected order list.
- The latest paid order appeared in the read-only internal orders table.
- The internal order detail page showed backend-confirmed paid summary,
  customer/shipping section, totals, and order data.
- Invalid signed webhook request confirmed webhook secret/config presence.
- Public pages and public scripts did not expose internal order routes or
  internal-order API token strings.

## What Failed Or Remained Blocked

- Custom domains currently route to the legacy `tigerpingpong.ca` storefront
  rather than the Render web app.
- None for Render production checkout/order proof.

## Remaining Blockers Before Wider Launch

1. Point the public launch domain to the current Render storefront, or document
   the intended cutover if Render is not yet the customer-facing production
   domain.
2. None for Render production checkout/order proof.

## Recommended Next Build Task

Create a launch-domain cutover verification task that confirms the intended
customer-facing custom domain serves the current Render storefront and preserves
the verified checkout, webhook, Supabase, and protected staff review behavior.

## Validation Results

Initial validation was run after this documentation was created:

- `pnpm db:generate`: passed.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate`: passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`: passed.
- `git diff --check`: passed.
- `git status`: showed only the two expected documentation files before commit.

Latest validation after the human-assisted QA update:

- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`:
  passed on rerun after a transient local `fork: Resource temporarily
  unavailable` failure during Prisma generation.
- `git diff --check`: passed.
- `git status`: showed only the two expected documentation files modified
  before commit.
