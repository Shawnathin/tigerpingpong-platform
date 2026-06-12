# 042 V1 Launch Readiness Audit Build Log

Date: 2026-06-12

Branch: `docs/042-v1-launch-readiness-audit`

## Goal

Create a full V1 launch readiness audit for TigerPingPong. This was a review, audit, and checklist task only.

No DNS, domain mapping, checkout, cart, Stripe, webhook, payment truth, Supabase/order schema, migrations, admin writes, inventory editing, product editing, CSV import/export, refunds, fulfillment, or public admin/internal exposure changes were made.

## Preflight

- Checked out `main`.
- Pulled latest `origin/main`.
- `main` fast-forwarded from `21db780` to `b2cefd5`.
- Confirmed PR #41 is merged:
  - PR: `https://github.com/Shawnathin/tigerpingpong-platform/pull/41`
  - Title: `[codex] Prepare domain readiness launch URL docs`
  - State: `MERGED`
  - Merged at: `2026-06-12T20:21:25Z`
  - Head branch: `docs/041-domain-readiness-launch-url-prep-v1`
  - Base branch: `main`
- Created branch `docs/042-v1-launch-readiness-audit` from updated `main`.

## Evidence Sources Reviewed

Existing docs:

- `docs/qa/031-production-checkout-order-qa-v1.md`
- `docs/qa/032-cart-add-to-cart-checkout-v1.md`
- `docs/qa/040-simple-admin-ui-shell-v1.md`
- `docs/qa/041-custom-domain-cutover-runbook-v1.md`
- `docs/build-log/032-cart-add-to-cart-checkout-v1.md`
- `docs/build-log/040-simple-admin-ui-shell-v1.md`
- `docs/build-log/041-domain-readiness-launch-url-prep-v1.md`
- `docs/architecture/041-launch-url-map-v1.md`
- `docs/api/033-admin-api-contracts-v1.md`
- `docs/internal/TIGER_PINGPONG_INTERNAL_ORDERS_READONLY_V1.md`

Source files:

- `apps/web/src/app/PublicStorefrontNav.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/catalog/page.tsx`
- `apps/web/src/app/catalog/products/[slug]/page.tsx`
- `apps/web/src/app/catalog/products/[slug]/CheckoutButton.tsx`
- `apps/web/src/app/cart/CartPageClient.tsx`
- `apps/web/src/app/shipping/page.tsx`
- `apps/web/src/app/contact/page.tsx`
- `apps/web/src/app/checkout/success/page.tsx`
- `apps/web/src/app/checkout/cancel/page.tsx`
- `apps/web/src/app/internal/orders/page.tsx`
- `apps/web/src/app/internal/orders/[publicReference]/page.tsx`
- `apps/web/src/app/admin/*`
- `apps/web/src/lib/cart.ts`
- `apps/web/src/lib/shipping.ts`
- `apps/web/src/lib/checkout-api.ts`
- `apps/web/src/lib/internal-orders-api.ts`
- `apps/web/src/lib/admin-api.ts`
- `apps/web/src/lib/public-storefront-demo.ts`
- `apps/web/src/middleware.ts`
- `apps/api/src/config.ts`
- `apps/api/src/catalog/*`
- `apps/api/src/checkout/*`
- `apps/api/src/webhooks/*`
- `apps/api/src/internal-orders/*`
- `apps/api/src/admin/*`
- `packages/db/prisma/schema.prisma`

## Live Non-Mutating Checks

Public web app base:

- `https://tigerpingpong-web.onrender.com`

Backend/API/webhook base:

- `https://tigerpingpong-platform.onrender.com`

Public route results:

| Route | Result |
| --- | --- |
| `/` | `200 text/html` |
| `/catalog` | `200 text/html` |
| `/catalog/products/tiger-expo-outdoor-table` | `200 text/html` |
| `/catalog/products/tiger-portland-outdoor-table` | `200 text/html` |
| `/catalog/products/tiger-premium-balls-6-white` | `200 text/html` |
| `/catalog/products/tiger-vice-paddle` | `200 text/html` |
| `/cart` | `200 text/html` |
| `/shipping` | `200 text/html` |
| `/contact` | `200 text/html` |
| `/checkout/success` | `200 text/html` |
| `/checkout/cancel` | `200 text/html` |

Protected web route no-auth results:

| Route | Result |
| --- | --- |
| `/internal/orders` | `401 text/plain` |
| `/admin` | `401 text/plain` |
| `/admin/orders` | `401 text/plain` |
| `/admin/products` | `401 text/plain` |
| `/admin/customers` | `401 text/plain` |
| `/admin/settings` | `401 text/plain` |
| `/admin/inventory` | `401 text/plain` |
| `/admin/audit-log` | `401 text/plain` |

API results:

| Route | Result |
| --- | --- |
| `/health` | `200 application/json` |
| `/catalog/health` | `200 application/json` |
| `/catalog/products` | `200 application/json` |
| `/internal/orders?status=paid&limit=1` without token | `401 application/json` |
| `/api/admin/dashboard/summary` without token | `401 application/json` |
| `/api/admin/orders` without token | `401 application/json` |
| `/api/admin/products` without token | `401 application/json` |
| `/api/admin/customers` without token | `401 application/json` |
| `/api/admin/settings` without token | `401 application/json` |
| `/api/admin/inventory` without token | `401 application/json` |
| `/api/admin/audit-log` without token | `401 application/json` |
| `POST /webhooks/stripe` without Stripe signature | `400 application/json`, signature required |
| `/checkout/sessions/cs_test_aaaaaaaaaaaaaaaaaaaaaaaa/status` | `200`, `{"found":false,"status":"not_found"}` |
| `POST /checkout/sessions` with empty `items` | `400`, empty items rejected |

Credential limitation:

- This local checkout did not contain production `INTERNAL_ORDERS_API_TOKEN`, `INTERNAL_ORDERS_BASIC_AUTH_USER`, or `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD`.
- 042 could confirm live fail-closed behavior but could not freshly open production `/admin`, production `/internal/orders`, or token-protected production admin/internal API endpoints with valid credentials.
- Prior PR #31 and PR #40 evidence was used for valid-credential/admin rendering history.

Payment limitation:

- No new paid test order was created in this task.
- Existing PR #31 production checkout proof was used for paid checkout, webhook, Supabase paid row, and internal order review evidence.

## Product Data Snapshot

Live `GET /catalog/products` returned 11 public products.

Category counts:

- Tables: 5
- Balls: 3
- Covers: 1
- Nets: 1
- Paddles: 1

Checkout-enabled count by public fields:

- 11 of 11 products.

Missing price count:

- 0 of 11 products.

Missing live public Cloudinary image URL count:

- 11 of 11 products.

Storefront fallback media coverage:

- 11 of 11 products have fallback media in `apps/web/src/lib/public-storefront-demo.ts`.

Raw public API description quality:

- Most product detail `shortDescription` and `description` values still include planning/import language such as candidate/source/mapped wording.
- The storefront masks these values with `getProductShortCopy` and `getProductDescriptionCopy`, so live customer HTML for checked product pages did not include those internal wording markers.

Table shipping review:

- All 5 table products have `shippingReviewRequired: true` in product detail data and are still checkout-enabled by public fields.
- This should receive business sign-off before custom domain cutover.

## Readiness Findings

Public storefront:

- Current Render routes are available.
- Public nav does not expose admin/internal routes.
- Homepage, catalog, product, shipping, contact, cart, success, and cancel pages exist.
- Media/content needs business sign-off before domain cutover.

Cart/checkout:

- Client cart is persisted in localStorage.
- Cart checkout sends only slugs and quantities.
- Backend re-fetches products, calculates totals/shipping, creates pending order/items, then creates Stripe Checkout.
- Shipping rule is consistent: subtotal over `$100 CAD` ships free; `$100 CAD` or under uses `$15 CAD`.

Payment/webhook:

- Success redirect is not payment truth.
- Webhook-confirmed backend order state is payment truth.
- Prior PR #31 proved paid production checkout and webhook delivery.

Internal orders:

- Live no-auth route returns `401`.
- Source and prior PR #31 support readable protected list/detail.
- Fresh valid-credential production test is still required before cutover.

Admin:

- Live no-auth web and API checks return `401`.
- Source and prior PR #40 support protected read-only admin shell.
- Fresh valid-credential production test is still required before cutover.

Security:

- Admin/internal routes fail closed.
- Server-only helpers keep internal/admin token server-side.
- Settings endpoint is safe and declares `secretsExposed: false`.
- No admin mutation routes were found.

Domain/env:

- Domain cutover remains not started.
- PR #41 docs/runbook remain current and should be followed before cutover.

## Docs Created

- `docs/qa/042-v1-launch-readiness-audit.md`
- `docs/build-log/042-v1-launch-readiness-audit.md`

## Code Changes

No app code changes were made.

No schema or migration changes were made.

## Validation

- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`: passed.
- `git diff --check`: passed.
- `git status`: showed only the two expected new documentation files before staging.
