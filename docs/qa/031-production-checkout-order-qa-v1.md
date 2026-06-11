# 031 Production Checkout Order QA V1

## Summary

Production QA was run on June 11, 2026 from branch
`docs/031-production-checkout-order-qa-v1`.

This was a documentation and verification pass only.

No production code, checkout code, webhook code, internal orders code, Prisma
schema, migrations, cart, admin, customer accounts, email, fulfillment, or
refund behavior was changed.

## Production Targets Checked

- Current Render storefront: `https://tigerpingpong-web.onrender.com`
- Current Render API: `https://tigerpingpong-platform.onrender.com`
- Custom domain observation: `https://www.tigerpingpong.com` and
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
| `/internal/orders` with valid Basic Auth | Blocked | Valid production credentials were not available in this QA session. This still needs a staff credential smoke test after Render env vars are confirmed. |
| API `/internal/orders` without token | Pass | Render API returned `401` with `Unauthorized.` |
| API `/internal/orders` with wrong token | Pass | Render API returned `401` with `Unauthorized.` |
| API `/internal/orders` with valid token | Blocked | Valid `INTERNAL_ORDERS_API_TOKEN` was not available in this QA session. |

## Checkout Flow Checklist

| Step | Result | Evidence |
| --- | --- | --- |
| Product page checkout button is present | Pass | Checked the three requested product pages; each rendered `Buy with Stripe`. |
| Product page checkout button click works | Partial | The live API path used by the button created a Stripe Checkout Session successfully. Browser click automation was blocked by the local browser sandbox before Chromium could launch. |
| Stripe Checkout opens | Pass | A production API-created session loaded `https://checkout.stripe.com` with title `Stripe Checkout`. Session ID shape was `cs_test_...`, confirming Stripe test mode. |
| Test payment completes | Blocked | Could not complete the hosted Stripe form because both available browser paths were blocked in this environment: the in-app browser could not navigate to the external Render URL, and downloaded Chromium could not launch under the local macOS sandbox. |
| Success redirect returns to storefront | Blocked | Not reached from a completed test payment because payment completion was blocked. |
| Success page reads backend-confirmed status | Pass | Visiting `/checkout/success?session_id=<created cs_test session>` rendered `Payment confirmation is pending` and did not render paid confirmation. |
| Stripe webhook marks order paid | Blocked | No completed Stripe test payment was available to emit the real `checkout.session.completed` webhook. |
| Supabase order row shows paid | Blocked | No completed payment was available. The backend status endpoint did find the created order and reported `checkout_pending`. |
| Internal orders page shows paid order | Blocked | Requires a completed paid order plus valid Basic Auth credentials. |
| Order detail page shows customer/shipping/totals/items/Stripe refs | Blocked | Requires a completed paid order plus valid Basic Auth credentials. |

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
It does not prove the paid transition because no valid Stripe webhook was
available without completing a payment.

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
| `INTERNAL_ORDERS_API_TOKEN` | Needs credentialed confirmation | Missing/wrong token checks returned `401`; valid token was not available to prove the configured success path. |
| `INTERNAL_ORDERS_BASIC_AUTH_USER` | Needs credentialed confirmation | No-credential and wrong-credential checks returned `401`; valid username was not available. |
| `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD` | Needs credentialed confirmation | No-credential and wrong-credential checks returned `401`; valid password was not available. |

## Screenshots To Capture

Capture these during the follow-up manual or authorized browser QA run:

- Render storefront home page.
- Render catalog page.
- Each requested product detail page with `Buy with Stripe`.
- Stripe Checkout open for a `cs_test_...` session.
- Stripe Checkout completed with test card.
- Storefront success page showing `Payment confirmed`, order reference, total,
  paid timestamp, and customer email.
- Stripe Dashboard test-mode payment and Checkout Session.
- Supabase `Order` row showing `paid`, `paidAt`,
  `stripeCheckoutSessionId`, and `stripePaymentIntentId`.
- `/internal/orders` `401` without credentials.
- `/internal/orders` with valid Basic Auth showing the paid order.
- `/internal/orders/[publicReference]` showing customer, shipping, totals,
  items, and Stripe references.

Screenshots were not captured in this automated run because local browser launch
was blocked before page interaction could begin.

## What Passed

- PR #35 was merged into `main` before branch creation.
- Latest `main` was pulled before the branch was created.
- Requested public Render routes returned `200`.
- `/internal/orders` returned `401` without credentials.
- Wrong Basic Auth also returned `401`.
- API internal orders endpoint returned `401` for missing and wrong tokens.
- Product pages rendered `Buy with Stripe`.
- The production API created a Stripe test Checkout Session.
- The Stripe Checkout URL loaded.
- Success page read backend state for the created session and showed
  `checkout_pending`, not paid.
- Invalid signed webhook request confirmed webhook secret/config presence.
- Public pages and public scripts did not expose internal order routes or
  internal-order API token strings.

## What Failed Or Remained Blocked

- Full browser click-through and Stripe payment completion could not be run in
  this environment.
- No real `checkout.session.completed` webhook was produced.
- No order from this run was marked `paid`.
- Supabase paid-row confirmation was not possible.
- Valid Basic Auth `/internal/orders` check was not possible without
  production credentials.
- Internal paid order list/detail verification was not possible without a paid
  test order and valid credentials.
- Custom domains currently route to the legacy `tigerpingpong.ca` storefront
  rather than the Render web app.

## Remaining Blockers Before Wider Launch

1. Point the public launch domain to the current Render storefront, or document
   the intended cutover if Render is not yet the customer-facing production
   domain.
2. Run a manual or authorized browser QA pass that completes Stripe test
   Checkout end to end.
3. Confirm the resulting Stripe webhook marks the order `paid`.
4. Confirm the paid order row directly in Supabase.
5. Confirm `/internal/orders` with valid Basic Auth shows the paid order.
6. Confirm the internal order detail page shows customer, shipping, totals,
   items, and Stripe references.
7. Confirm staff access credentials and the internal API token are set in
   Render for the intended production services.

## Recommended Next Build Task

Create a launch-domain and production-order-ops verification task that runs a
human-assisted Stripe test payment through the customer-facing domain, verifies
the Stripe webhook/Supabase/internal-orders chain with credentials, and records
the final evidence screenshots before wider launch.

## Validation Results

Validation was run after this documentation was created:

- `pnpm db:generate`: passed.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate`: passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`: passed.
- `git diff --check`: passed.
- `git status`: showed only the two expected documentation files before commit.
