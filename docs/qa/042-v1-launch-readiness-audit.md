# 042 V1 Launch Readiness Audit

Date: 2026-06-12

Branch: `docs/042-v1-launch-readiness-audit`

## Status Legend

- `PASS`: Ready or verified enough for V1 launch scope.
- `WATCH`: Usable for V1, but should be watched, approved, or improved.
- `BLOCKED`: Must be resolved before custom domain cutover or cannot be freshly verified in this audit.
- `NOT STARTED`: Planned capability or operational step has not begun.
- `DEFERRED`: Intentionally out of V1 launch scope.

## Executive Summary

TigerPingPong is close to a V1 launch on the current Render URLs. The public storefront, catalog, product pages, cart, Stripe Checkout path, backend-confirmed success page, Stripe webhook payment truth, paid-order storage, internal order review, and read-only admin shell are implemented.

The core checkout/payment truth model is the strongest part of the launch posture: the client does not mark orders paid, Stripe redirect is not treated as payment truth, and webhook-confirmed backend order state remains authoritative.

The site is not ready for custom domain cutover until domain/DNS decisions, cutover env checks, final pre-cutover smoke tests, and product media/content sign-off are completed. Do not add admin write features, inventory editing, product editing, CSV import/export, refunds, fulfillment, or checkout rewrites before launch.

## Current Verified URL Structure

| Surface | Status | URL |
| --- | --- | --- |
| Browser-facing web app | PASS | `https://tigerpingpong-web.onrender.com` |
| Backend/API/webhook service | PASS | `https://tigerpingpong-platform.onrender.com` |
| Current Stripe webhook destination | PASS | `https://tigerpingpong-platform.onrender.com/webhooks/stripe` |
| Future public domains | NOT STARTED | `tigerpingpong.ca`, `www.tigerpingpong.ca`, `tigerpingpong.com`, `www.tigerpingpong.com` |

## 042 Live Evidence Snapshot

Non-mutating checks were run against the current Render URLs.

| Check | Status | Evidence |
| --- | --- | --- |
| PR #41 merged before start | PASS | PR #41 is `MERGED`, merged `2026-06-12T20:21:25Z`. |
| Latest `main` pulled before branch | PASS | `main` fast-forwarded from `21db780` to `b2cefd5`. |
| Public web routes return `200` | PASS | `/`, `/catalog`, four requested product routes, `/cart`, `/shipping`, `/contact`, `/checkout/success`, `/checkout/cancel`. |
| API health routes return `200` | PASS | `/health`, `/catalog/health`, `/catalog/products`. |
| Web protected routes reject no auth | PASS | `/internal/orders`, `/admin`, and admin subroutes returned `401`. |
| API protected routes reject no token | PASS | `/internal/orders` and `/api/admin/*` endpoints returned `401`. |
| Unsigned Stripe webhook rejected | PASS | `POST /webhooks/stripe` without Stripe signature returned `400` with safe signature-required response. |
| Fake checkout status is safe | PASS | Fake well-shaped session returned `{"found":false,"status":"not_found"}`. |
| Empty checkout request rejected | PASS | `POST /checkout/sessions` with empty `items` returned `400`. |
| Credentialed production admin/internal check | PASS with WATCH | Protected/read-only internal order review has prior production credentialed smoke coverage. Protected read-only admin API/UI has verified token coverage, including `/api/admin/settings` and `/api/admin/dashboard/summary` returning `200` with token and dashboard summary returning `401` without token. Repeat immediately before domain cutover. |
| New paid order test | DEFERRED | Not created. Prior PR #31 has paid checkout, webhook, Supabase, and internal-order proof. |

## Boss-Ready Status Summary

What is working:

- Customers can browse the Render storefront, catalog, product pages, cart, shipping, contact, checkout success, and cancel pages.
- Cart behavior exists for add-to-cart, recommended add-ons, quantity changes, item removal, persistence, and checkout handoff.
- Checkout session creation is server-owned and re-fetches product data before calculating totals.
- Stripe webhook confirmation is the payment authority.
- Paid orders are stored with item snapshots and Stripe references.
- Staff order review and admin pages are protected and read-only.

What has been proven:

- Prior PR #31 proved a production Stripe test payment, successful webhook delivery, Supabase paid order row, and protected internal order review.
- Prior PR #32 proved cart add-to-cart, recommendations, cart persistence, quantity changes, mobile cart/modal layout, and multi-item cart behavior locally.
- Prior PR #40 proved protected read-only admin shell behavior with mock admin data and live no-token API rejection.
- Latest verified admin API checks proved `/api/admin/settings` and `/api/admin/dashboard/summary` return `200` with token, while dashboard summary returns `401` without token.
- Current 042 checks reconfirmed public route availability and fail-closed protected routes on Render.

What is not done yet:

- Custom domains are not cut over.
- Canonical domain and redirect behavior are not decided.
- Final pre-cutover admin/internal smoke tests still need to be repeated immediately before custom domain cutover.
- Catalog media is still fallback-driven rather than backed by canonical public Cloudinary image URLs.
- Product descriptions in the public API still contain import/internal planning language, though the storefront masks this with customer-ready fallback copy.

What remains before custom domain cutover:

- Decide canonical domain behavior across `.ca`, `.com`, `www`, and apex domains.
- Map selected domains to the Render web service, not the API service.
- Verify SSL, DNS, `CORS_ORIGIN`, `CHECKOUT_SUCCESS_URL`, `CHECKOUT_CANCEL_URL`, `NEXT_PUBLIC_API_BASE_URL`, Basic Auth, and internal token values.
- Run final pre-cutover and post-cutover smoke tests covering public routes, cart, Stripe Checkout, backend-confirmed success, webhook, Supabase paid order, internal orders, and admin.

What should not be built before launch:

- No admin writes.
- No inventory editing.
- No product editing.
- No CSV import/export.
- No refunds.
- No fulfillment.
- No checkout rewrite.
- No webhook or payment-truth rewrite.

## Public Storefront Audit

### Route Status

| Route | Status | Notes |
| --- | --- | --- |
| `/` | PASS | Returned `200`; homepage has product/category, shipping, checkout, and support positioning. |
| `/catalog` | PASS | Returned `200`; products render from live catalog API. |
| `/catalog/products/tiger-expo-outdoor-table` | PASS | Returned `200`; product detail route loads. |
| `/catalog/products/tiger-portland-outdoor-table` | PASS | Returned `200`; product detail route loads. |
| `/catalog/products/tiger-premium-balls-6-white` | PASS | Returned `200`; product detail route loads. |
| `/catalog/products/tiger-vice-paddle` | PASS | Returned `200`; product detail route loads. |
| `/cart` | PASS | Returned `200`; cart has empty state and client cart behavior. |
| `/shipping` | PASS | Returned `200`; shipping rules are clear. |
| `/contact` | PASS | Returned `200`; support phone/email and order guidance are present. |
| `/checkout/success` | PASS | Returned `200`; missing-session state is safe and payment-truth copy is present. |
| `/checkout/cancel` | PASS | Returned `200`; cancel page states it does not mark failed, paid, or fulfilled. |

### Storefront Readiness

| Area | Status | Notes |
| --- | --- | --- |
| Homepage | PASS | Launch-ready V1 storefront entry with category cards, shipping promise, and support path. |
| Catalog page | PASS | Public categories and product cards are visible and linked. |
| Product detail pages | PASS | Product detail pages render price, media/fallback, facts, variants, shipping note, add-to-cart, and support link. |
| Product images | WATCH | All 11 products currently have no live `primaryMedia.cloudinarySecureUrl`; every product has a storefront fallback. This is acceptable only if fallback/prototype/BigCommerce media is approved for launch. |
| Product pricing | PASS | All 11 public products have CAD prices. |
| Product categories/types | PASS | Public categories are Tables, Balls, Covers, Nets, and Paddles. Product kinds align with those categories. |
| Product descriptions/content quality | WATCH | Storefront masks rough API descriptions with generic customer-ready copy. Public API raw descriptions still include planning/import language such as candidate/source/mapped phrasing. |
| Shipping messaging | PASS | Pages consistently state Canada only, free over $100 CAD, and $15 at or under $100 CAD. |
| Contact/support messaging | PASS | Phone, email, Vancouver/Canada support positioning, and order-support guidance are present. |
| Public nav | PASS | Public nav links only to Home, Catalog, Shipping, Contact, and Cart. No admin/internal links were found. |
| Mobile layout | PASS | Responsive CSS and prior PR #32 mobile QA cover cart/modal. 042 did not capture new screenshots. |
| Desktop layout | PASS | Desktop grid/card layouts are implemented and public routes render on Render. |
| Empty/error states | PASS | Cart empty state, catalog connection error state, product load error state, missing checkout session, and checkout cancel states exist. |

Launch-ready:

- Public route availability.
- Public nav and support path.
- Shipping and checkout trust copy.
- Cart presence as first-class public route.

Rough but acceptable for V1:

- Generic customer-facing product copy.
- Fallback-driven product media.
- Long product names such as color variants in product title.

Should be fixed or explicitly approved before domain cutover:

- Business approval for fallback/prototype/BigCommerce media.
- Business approval that all 11 products, including all 5 tables, can accept online checkout under the current simple shipping rule.
- Public API description cleanup if the API itself is considered customer-visible surface.

Can wait until after launch:

- Polished product storytelling, specs, content sections, SEO metadata, filters, search, sorting, and comparison tools.

## Cart And Checkout Audit

| Area | Status | Notes |
| --- | --- | --- |
| Add-to-cart button behavior | PASS | Product button adds item to client cart and opens modal. Prior PR #32 browser QA confirmed. |
| Added-to-cart modal | PASS | Modal shows added item, close, keep shopping, view cart, and review cart actions. |
| Recommended add-ons | PASS | Recommendations load from real catalog products and filter to checkout-eligible items. |
| Add-on add behavior | PASS | Add-on button adds recommended item and disables when already in cart. |
| Cart count | PASS | Public nav uses cart subscription and updates item count. |
| Cart persistence | PASS | Cart stores sanitized V1 items in `localStorage` under `tigerpingpong.cart.v1`. |
| Cart page | PASS | `/cart` has item rows, thumbnails/fallbacks, totals, checkout, and empty state. |
| Quantity controls | PASS | Quantity can increase/decrease between 1 and 10 per line. |
| Remove item | PASS | Remove action deletes a cart line. |
| Empty cart state | PASS | Empty cart page links back to catalog. |
| Shipping calculation | PASS | Frontend and backend both use `subtotal > 10000` cents for free shipping, otherwise `1500` cents. |
| Checkout button | PASS | Cart sends only product slugs and quantities to `POST /checkout/sessions`. |
| Stripe Checkout line items | PASS | Backend creates line items from stored order item snapshots, not client prices. |
| Stripe Checkout shipping line | PASS | Backend creates fixed shipping option from server-calculated shipping amount. |
| Success redirect | PASS | Prior PR #31 proved Stripe redirect returned to web success page. |
| Success page backend status | PASS | Success page reads `/checkout/sessions/:sessionId/status` and shows backend status. |
| Cancel page copy | PASS | Cancel page does not mutate or imply payment state. |

Shipping rule confirmation:

- Orders over $100 CAD ship free: PASS.
- Orders $100 CAD or under get $15 flat-rate shipping: PASS.
- Exactly $100 CAD still gets $15 flat-rate shipping: PASS.

Payment truth confirmation:

- Stripe redirect is not payment truth: PASS.
- Client never marks payment paid: PASS.
- Backend order status is payment truth: PASS.
- Webhook-confirmed paid transition remains payment truth: PASS.
- Success page reads backend-confirmed status: PASS.

## Order, Payment, And Backend Audit

| Area | Status | Notes |
| --- | --- | --- |
| Pending order creation | PASS | `CheckoutService.createPendingOrder` creates `checkout_pending` orders before Stripe session creation. |
| Order item snapshots | PASS | `OrderItem` rows store product key, slug, variant key, SKU, name, image, unit price, quantity, line total, and currency. |
| Multi-item cart order support | PASS | Checkout accepts up to 20 distinct item slugs and stores multiple order items. Prior PR #32 validated multi-item local cart flow. |
| Stripe Checkout Session creation | PASS | API creates Stripe session server-side with order metadata and idempotency key. |
| Stripe webhook delivery | PASS | Prior PR #31 proved `checkout.session.completed` delivered `201`. 042 unsigned webhook check safely returned `400`. |
| Webhook event tracking | PASS | `StripeWebhookEvent` records event ID/type and processed timestamp. Admin summary reports webhook health. |
| Paid order transition | PASS | Webhook validates session/order totals, shipping, status, currency, shipping country, livemode expectation, and then marks paid. |
| Supabase order row | PASS | Prior PR #31 found matching paid order row. No new paid order was created in 042. |
| Supabase order items | PASS | Schema and checkout service support item snapshots; prior internal detail proof showed order data. |
| Internal order list | PASS | Protected list reads paid orders by default and shows item count and Stripe references. |
| Internal order detail | PASS | Protected detail shows customer/shipping, totals, item snapshots, and Stripe references. |
| Customer/shipping snapshot | PASS | Webhook stores customer email/name/phone and shipping name/phone/address where Stripe provides them. |
| Stripe references | PASS | Order stores checkout session, payment intent, and customer ID. |
| Payment/webhook health summary | PASS | Admin dashboard service exposes webhook event counts and latest processed event without secrets. |

## Internal Order Review Audit

| Area | Status | Notes |
| --- | --- | --- |
| `/internal/orders` requires auth | PASS | Live no-auth request returned `401`. Middleware protects `/internal/:path*`. |
| `/internal/orders` works with valid credentials | PASS with WATCH | Protected/read-only design is verified and production credentialed smoke has been performed previously. Repeat immediately before domain cutover. |
| Order list is readable | PASS | Source renders paid-order table with reference, customer, total, status, item count, and PaymentIntent. Prior PR #31 verified live order list. |
| Order detail is readable | PASS | Source renders summary, customer/shipping, totals, item snapshots, and Stripe references. Prior PR #31 verified live detail page. |
| Paid orders show correctly | PASS | Prior PR #31 verified paid order display. |
| Multi-item cart orders show correctly | WATCH | Data model and UI support multiple item rows; no new 042 paid multi-item order was created. |
| Page remains read-only | PASS | UI has links/tables only; no payment, fulfillment, refund, or customer mutations. |
| No public nav link exposes internal orders | PASS | Live public HTML and source nav scan found no `/internal/orders` public links. |

## Admin Audit

| Area | Status | Notes |
| --- | --- | --- |
| `/admin` requires Basic Auth | PASS | Live no-auth request returned `401`. |
| `/admin` dashboard loads | PASS with WATCH | Protected read-only admin UI is readable/protected. Repeat smoke immediately before domain cutover. |
| `/admin/orders` loads | PASS with WATCH | Protected read-only admin UI is readable/protected. Repeat smoke immediately before domain cutover. |
| `/admin/products` loads | PASS with WATCH | Protected read-only admin UI is readable/protected. Repeat smoke immediately before domain cutover. |
| `/admin/customers` loads | PASS with WATCH | Protected read-only admin UI is readable/protected. Repeat smoke immediately before domain cutover. |
| `/admin/settings` loads | PASS with WATCH | Protected read-only admin UI is readable/protected. Repeat smoke immediately before domain cutover. |
| `/admin/inventory` loads with `not_configured` state | WATCH | Source returns `not_configured`; read-only admin shell handles this state. Repeat smoke immediately before domain cutover. |
| `/admin/audit-log` loads with `not_configured` state | WATCH | Source returns `not_configured`; read-only admin shell handles this state. Repeat smoke immediately before domain cutover. |
| Admin UI is readable | PASS with WATCH | Protected read-only admin UI is readable/protected. Repeat smoke immediately before domain cutover. |
| Admin UI is read-only | PASS | Pages contain read-only tables/summaries and no edit/save/delete/import/refund/fulfillment controls. |
| No edit/save/delete/import/refund/fulfillment controls exist | PASS | Source scan found no admin mutation controls. |
| No public nav link exposes admin | PASS | Live public HTML and source nav scan found no `/admin` public links. |
| No admin token is exposed client-side | PASS | Admin client is `server-only` and token is read from server env. Prior PR #40 bundle scan passed. |
| Admin API endpoints return `401` without token | PASS | Dashboard summary returned `401` without token; prior no-token checks covered the protected admin API surface. |
| Admin API settings returns `200` with token | PASS with WATCH | `/api/admin/settings` returned `200` with token. Repeat smoke immediately before domain cutover. |
| Admin API dashboard summary returns `200` with token | PASS with WATCH | `/api/admin/dashboard/summary` returned `200` with token. Repeat smoke immediately before domain cutover. |

## Security Audit

| Area | Status | Notes |
| --- | --- | --- |
| No public admin links | PASS | Public nav excludes admin; live public route HTML did not include `/admin`. |
| No public internal links | PASS | Public nav excludes internal orders; live public route HTML did not include `/internal/orders`. |
| `/admin` protected | PASS | Middleware protects `/admin` and `/admin/:path*`; live no-auth returned `401`. |
| `/internal/orders` protected | PASS | Middleware protects `/internal/:path*`; live no-auth returned `401`. |
| Admin API protected | PASS | Admin controller requires `x-internal-orders-token`; live no-token checks returned `401`. |
| Internal API token not exposed client-side | PASS | Internal/admin API helpers are `server-only` and read token from server env. |
| Stripe secrets not exposed | PASS | Stripe secret key is read only in backend checkout/admin service. No `NEXT_PUBLIC` Stripe secret exists. |
| Basic Auth credentials not exposed | PASS | Basic Auth env vars are read only in middleware. |
| Settings endpoint exposes no secrets | PASS | Admin settings returns safe store/support/currency/shipping/checkout/Stripe-mode values plus `secretsExposed: false`. |
| Success page does not treat redirect as payment truth | PASS | Success page explicitly says Stripe success redirect is only a redirect and does not update payment state. |
| No write/admin mutation routes accidentally public | PASS | Admin/internal controllers expose GET/read routes only. Checkout POST and webhook POST are intended public backend routes with validation/signature protections. |

## Domain And Environment Readiness Audit

| Area | Status | Notes |
| --- | --- | --- |
| `CHECKOUT_SUCCESS_URL` | WATCH | Must point to selected public web success URL before customers should return to custom domain. Must keep `?session_id={CHECKOUT_SESSION_ID}`. |
| `CHECKOUT_CANCEL_URL` | WATCH | Must point to selected public web cancel URL before customers should return to custom domain. |
| `NEXT_PUBLIC_API_BASE_URL` | PASS | Web app uses this to call platform/API service; should remain `https://tigerpingpong-platform.onrender.com` unless API domain changes intentionally. |
| `CORS_ORIGIN` | WATCH | Must include selected public web origin(s) before browser traffic moves to custom domain. Keep Render origin if needed for rollback/testing. |
| Stripe webhook endpoint | PASS | Current endpoint remains platform service `/webhooks/stripe`. Do not move during web-domain cutover. |
| Basic Auth env vars | WATCH | Must be present on web service and tested with launch credentials. |
| Internal orders token | WATCH | Must match between web and API services and be tested with launch token. |
| Admin/internal protection env vars | WATCH | Missing values fail closed, which is safe but would block staff access. |
| DNS/domain cutover | NOT STARTED | No DNS, Render custom-domain mapping, SSL, or canonical redirect changes were made. |

Domain readiness remains BLOCKED / NOT STARTED: custom domains, DNS, SSL, canonical behavior, `CORS_ORIGIN`, `CHECKOUT_SUCCESS_URL`, and `CHECKOUT_CANCEL_URL` still need final operator action before cutover.

Which service owns which URL:

- Web service owns public storefront, cart, checkout success/cancel pages, `/admin`, and `/internal/orders`.
- API/platform service owns health, catalog API, checkout sessions/status, Stripe webhook, internal order API, and admin API.

What must change before custom domain cutover:

- DNS/Render mapping for selected public web domain(s).
- API `CORS_ORIGIN` to include selected public web origin(s).
- API `CHECKOUT_SUCCESS_URL` and `CHECKOUT_CANCEL_URL` if Stripe should return customers to custom domain.

What must not change before custom domain cutover:

- Stripe webhook destination should remain `https://tigerpingpong-platform.onrender.com/webhooks/stripe`.
- `NEXT_PUBLIC_API_BASE_URL` should remain pointed at the platform/API service unless an API-domain cutover is intentionally planned.
- Payment truth, webhook logic, order schema, checkout logic, cart logic, and protected-route behavior should not be changed.

Routes to smoke-test after cutover:

- `/`
- `/catalog`
- `/catalog/products/tiger-portland-outdoor-table`
- `/catalog/products/tiger-vice-paddle`
- `/cart`
- `/shipping`
- `/contact`
- `/checkout/success`
- `/checkout/cancel`
- `/admin`
- `/internal/orders`
- API `/health`
- API `/catalog/health`
- API `/checkout/sessions`
- API `/checkout/sessions/:sessionId/status`
- API `/api/admin/dashboard/summary`
- API `/webhooks/stripe`

## Product And Data Audit

| Area | Status | Notes |
| --- | --- | --- |
| Number of catalog products | PASS | 11 public catalog products. |
| Number of checkout-enabled products | WATCH | 11 of 11 products are checkout-enabled and work by public fields. Confirm business approval for tables before cutover. |
| Products with missing public images | WATCH | 11 of 11 have no live `primaryMedia.cloudinarySecureUrl`. All 11 have storefront fallbacks. |
| Products with missing prices | PASS | 0 missing prices. |
| Products with incomplete descriptions | WATCH | Storefront masks rough API copy. Raw public API descriptions still include internal/import wording. |
| Products with rough names/slugs | WATCH | Slugs are stable. Several display names are long and include color choices, for example table color variants. |
| Table checkout/simple shipping rule | WATCH/BUSINESS SIGN-OFF REQUIRED | Simple V1 shipping rule allows table checkout with free shipping over $100. Confirm business accepts this before domain cutover. |
| Products that should be quote-only later | WATCH | All 5 table products have `shippingReviewRequired: true` in product detail data but are currently checkout-enabled. Consider quote-only or freight-aware checkout later. |
| Product media/fallback status | WATCH | Fallback coverage is complete, but canonical media pipeline is not complete. |
| V1 acceptable data cleanup | WATCH | Generic descriptions, missing specs/content sections, and fallback images are acceptable only with business sign-off. |

Product counts by category:

| Category | Count |
| --- | ---: |
| Tables | 5 |
| Balls | 3 |
| Covers | 1 |
| Nets | 1 |
| Paddles | 1 |

Checkout-enabled public products:

- `tiger-net-post-set`
- `tiger-expo-outdoor-table`
- `tiger-plaza-outdoor-table-grey`
- `tiger-portland-indoor-table`
- `tiger-portland-outdoor-table`
- `tiger-premium-balls-140`
- `tiger-premium-balls-6-orange`
- `tiger-premium-balls-6-white`
- `tiger-table-cover-black-polyester`
- `tiger-vice-paddle`
- `tiger-whistler-indoor-table`

Products with no live public Cloudinary image URL:

- All 11 public products.

Products with storefront fallback media:

- All 11 public products.

## Launch Blockers Before Custom Domain Cutover

- Canonical domain decision not finalized.
- DNS / Render custom domain setup not performed.
- Cutover env values still need operator check.
- Final pre-cutover smoke test still required.
- Product/media/content business sign-off still required.
- Table checkout/free-shipping business sign-off required unless already accepted.

## Acceptable V1 Imperfections

- Read-only admin only.
- Inventory `not_configured`.
- Audit log `not_configured`.
- Fallback media still used.
- Product copy can be improved post-launch.
- No product editing, inventory editing, import/export, refund, or fulfillment tools yet.
- No customer accounts.
- No product search/filter/sort refinement.
- No sitemap, robots route, canonical metadata, or final SEO polish.
- Render URLs remain available for rollback/testing after custom domain launch.

## Post-Launch Improvements

- Move all product media into canonical public Cloudinary records.
- Replace raw API descriptions with customer-ready product copy.
- Add richer product specs, content sections, comparison data, and SEO metadata.
- Decide which table products stay online checkout versus quote-only/freight review.
- Add inventory, fulfillment, refunds, admin writes, product editing, CSV import/export, and audit log only after separate safety planning.
- Add sitemap, robots, canonical redirects, analytics, and richer launch monitoring.
- Add transactional/customer emails if needed for order confirmation and support.
- Add richer webhook diagnostics and manual-review workflow if operational volume requires it.

## Final Readiness Call

Render V1 readiness: PASS with WATCH items.

Custom domain cutover readiness: BLOCKED until domain/env operator actions, final smoke tests, and product media/content sign-off are complete.

Payment/webhook readiness: PASS based on current source, current safe endpoint checks, and prior paid production proof.

Admin/internal readiness: PASS with WATCH. Protected read-only internal orders and admin API/UI are verified, including latest token-verified admin API checks. Repeat smoke immediately before domain cutover.
