# 031 Production Checkout Order QA V1

## Summary

Created and ran a production QA checklist for the current Render storefront,
checkout, and internal order review flow.

This was documentation and verification only.

## Branch

```text
docs/031-production-checkout-order-qa-v1
```

Started from latest `main` after confirming PR #35 was merged.

## Files Created

- `docs/qa/031-production-checkout-order-qa-v1.md`
- `docs/build-log/031-production-checkout-order-qa-v1.md`

## PR 35 Preflight

- PR #35: `https://github.com/Shawnathin/tigerpingpong-platform/pull/35`
- State: `MERGED`
- Merge commit: `fc6a2eba6b4d73de4bc50bca3fff6d83f1a8eecd`
- Local `main` after pull matched that commit before this branch was created.

## Production QA Summary

Checked the browser-facing Render storefront and staff app at:

```text
https://tigerpingpong-web.onrender.com
```

Checked the backend/API/webhook service at:

```text
https://tigerpingpong-platform.onrender.com
```

URL structure correction recorded:

- `tigerpingpong-web.onrender.com` is the browser-facing storefront/staff app.
- `tigerpingpong-platform.onrender.com` is the backend/API/webhook service
  unless intentionally changed.

The requested public routes all returned `200`, and `/internal/orders`
returned `401` without credentials.

The custom domains `https://www.tigerpingpong.com` and
`https://tigerpingpong.com` currently redirect to `https://tigerpingpong.ca/`,
which is the legacy storefront rather than the current Render app from this
repository.

## Checkout QA Summary

Initial automated QA confirmed that the production API successfully created a
Stripe test Checkout Session for `tiger-vice-paddle`:

- Response: `201 application/json`
- Session shape: `cs_test_...`
- Public reference: `cmqa22vtk0002rrj3wbkrwbgi`
- Total: `6500` cents CAD
- Status endpoint result: `checkout_pending`

The hosted Stripe Checkout URL loaded, confirming the session was usable in
Stripe test mode.

Human-assisted production QA then completed the browser checkout proof in
Chrome:

- Browser-facing production URL:
  `https://tigerpingpong-web.onrender.com`
- Product tested: `Tiger PingPong Vice Ping Pong Paddle`
  (`tiger-vice-paddle`)
- Stripe Checkout Session ID: redacted, starts with `cs_test_`
- Stripe test payment result: passed
- Success redirect result: passed
- Success page backend status result: passed; success page displayed
  `Payment confirmed` and backend order status `Paid`
- Stripe webhook event checked: `checkout.session.completed`
- Stripe webhook delivery status: passed; event destination delivered with
  HTTP `201` / `201 OK`
- Current Stripe webhook destination observed:
  `https://tigerpingpong-platform.onrender.com/webhooks/stripe`
- Supabase order row result: passed; matching order row found with paid
  status/order_status
- Internal orders valid Basic Auth result: passed; protected order list opened
  at `https://tigerpingpong-web.onrender.com/internal/orders`
- Internal order list result: passed; latest paid order appeared in the
  read-only paid order review table
- Internal order detail result: passed; detail opened at
  `https://tigerpingpong-web.onrender.com/internal/orders/<redacted-order-reference>`
  and showed backend-confirmed paid summary, customer/shipping section, totals,
  and order data

Render production checkout/order foundation is verified. A customer can
complete Stripe Checkout, return to a success page that reads backend-confirmed
paid status, Stripe webhook delivery is confirmed, Supabase stores the paid
order, and staff can review the paid order behind protected Basic Auth at the
browser-facing web URL.

## Security Checks

- Public route HTML had no `/internal/orders` links.
- Public route HTML had no cart, account, or admin links.
- Public script scan found no `INTERNAL_ORDERS_API_TOKEN`,
  `x-internal-orders-token`, or `/internal/orders` strings.
- Success page for the created pending session showed pending backend state and
  did not treat the redirect as payment truth.
- Human-assisted success page check showed backend-confirmed paid state after
  a completed Stripe test payment.
- API `/internal/orders` returned `401` for missing and wrong tokens.
- Web `/internal/orders` returned `401` without Basic Auth and with wrong Basic
  Auth.
- Valid Basic Auth opened the protected order list at the browser-facing web
  URL.

## Environment Status

- `NEXT_PUBLIC_API_BASE_URL`: appears configured; storefront data loaded from
  the Render API.
- `DATABASE_URL`: appears configured; catalog reads, checkout creation, and
  status lookup worked.
- `STRIPE_SECRET_KEY`: appears configured; test Checkout Session creation
  worked.
- `STRIPE_WEBHOOK_SECRET`: appears configured; invalid signed webhook reached
  signature verification and returned signature failure.
- `INTERNAL_ORDERS_API_TOKEN`: appears configured indirectly; valid staff page
  access loaded paid orders through the server-side token without exposing it.
- `INTERNAL_ORDERS_BASIC_AUTH_USER`: appears configured; valid Basic Auth
  opened the protected staff page.
- `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD`: appears configured; valid Basic Auth
  opened the protected staff page.

## Screenshots

Human-assisted QA captured:

- Checkout success page with backend-confirmed paid status.
- Stripe webhook delivery showing `checkout.session.completed` and HTTP `201` /
  `201 OK`.
- Supabase orders table showing paid order row.
- Internal orders list showing paid order.
- Internal order detail showing paid order.

Before sharing screenshots outside the launch review group, redact customer
email, address, full order references where appropriate, full PaymentIntent /
Stripe references where appropriate, Basic Auth credentials, API tokens, and
Stripe secrets.

If item or Stripe reference sections are below the fold on the internal order
detail page, include a separate lower-page screenshot for those sections.

## Intentionally Not Changed

- No production code changed.
- No checkout code changed.
- No webhook code changed.
- No internal orders code changed.
- No Prisma schema changed.
- No migrations were created.
- No cart, admin, customer account, email, fulfillment, or refund work was
  added.

## Validation Results

Initial validation:

- `pnpm db:generate`: passed.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate`:
  passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`:
  passed.
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

## Remaining Blockers

- Custom domains `https://www.tigerpingpong.com` and
  `https://tigerpingpong.com` still redirect to `https://tigerpingpong.ca/`,
  the legacy storefront rather than the current Render web app.
- None for Render production checkout/order proof.

## Next Recommended Task

Run a launch-domain cutover verification pass that confirms the intended
customer-facing custom domain serves the current Render storefront and preserves
the verified checkout, webhook, Supabase, and protected staff review behavior.
