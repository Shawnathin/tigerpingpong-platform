# 033 Admin Backend Foundation V1

Branch: `feature/033-admin-backend-foundation-v1`

## Goal

Create a safe backend/admin foundation for a small V1 Tiger Ping Pong staff panel.

This is not a BigCommerce replacement for launch. The V1 target is practical staff visibility:

- protected admin access
- dashboard summary
- product list and detail visibility
- inventory visibility gap/planning
- order list and detail visibility
- payment/Stripe status visibility
- basic settings visibility
- clear schema gap report

No production migrations were created. No checkout, cart, Stripe Checkout creation, Stripe webhook verification, webhook paid transition, public navigation, refunds, fulfillment automation, or CSV import write system was changed.

## Current Prisma Schema Inspection

Current enums:

- `ProductKind`
- `ProductStatus`
- `PurchaseMode`
- `SourceReviewStatus`
- `MediaRole`
- `MediaReviewStatus`
- `MediaSourceProvider`
- `QuoteRequestStatus`
- `OrderStatus`
- `RedirectStatus`
- `RelationshipType`
- `ReviewSeverity`
- `ReviewResolutionStatus`

Current models:

- `PlatformMetadata`
- `Brand`
- `Category`
- `ProductFamily`
- `Product`
- `ProductOption`
- `ProductOptionValue`
- `ProductVariant`
- `ProductVariantOptionValue`
- `ProductMedia`
- `ProductContentSection`
- `ProductSpecGroup`
- `ProductSpec`
- `ProductRelationship`
- `QuoteRequest`
- `QuoteRequestItem`
- `Order`
- `OrderItem`
- `StripeWebhookEvent`
- `Redirect`
- `ImportReviewFlag`

## Existing Product/Catalog Data Model

The canonical product model is in `packages/db/prisma/schema.prisma`.

Catalog foundation already exists for:

- brands
- hierarchical categories
- product families
- products
- product options and option values
- product variants
- variant option assignments
- product media
- product content sections
- product specs and spec groups
- product relationships
- import review flags
- redirects

Public catalog read routes currently live under `apps/api/src/catalog/*`:

- `GET /catalog/health`
- `GET /catalog/categories`
- `GET /catalog/product-families`
- `GET /catalog/families/:slug`
- `GET /catalog/products`
- `GET /catalog/products/:slug`

The admin product endpoints added in this pass read directly from the same Prisma catalog tables.

## Existing Order/Order Item Models

`Order` stores the backend order state and checkout/payment references:

- `publicReference`
- `status`
- `currency`
- `subtotalCents`
- `shippingCents`
- `totalCents`
- `shippingRule`
- `checkoutSource`
- customer fields
- shipping fields
- `stripeCheckoutSessionId`
- `stripePaymentIntentId`
- `stripeCustomerId`
- `paidAt`
- timestamps

`OrderItem` stores immutable checkout snapshots:

- product and variant links where available
- product key/slug snapshot
- variant key snapshot
- SKU snapshot
- name snapshot
- image URL snapshot
- unit price, quantity, line total, currency

The admin order endpoints added in this pass use these existing tables only.

## Existing Internal Orders API Protection

The backend internal orders API is `apps/api/src/internal-orders/*`.

Backend protection:

- `GET /internal/orders`
- `GET /internal/orders/:publicReference`
- Requires `x-internal-orders-token`
- Compares the token to `INTERNAL_ORDERS_API_TOKEN`
- Uses timing-safe token comparison
- Fails closed with `401`
- Adds no-store/noindex response headers

The staff-facing web route protection is in `apps/web/src/middleware.ts`.

Web protection:

- Protects `/internal/:path*`
- Requires Basic Auth credentials from:
  - `INTERNAL_ORDERS_BASIC_AUTH_USER`
  - `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD`
- Adds no-store/noindex response headers

## Admin Auth Helper

Added:

- `apps/api/src/admin/admin-auth.ts`

Admin backend routes reuse the existing server-side internal orders token pattern:

- Header: `x-internal-orders-token`
- Env var: `INTERNAL_ORDERS_API_TOKEN`
- Missing or bad token returns `401`
- Missing server env also fails closed
- No admin token is exposed client-side
- No public navigation links were added

No new production env var is required.

## Existing Checkout/Session API

Checkout code is in `apps/api/src/checkout/*`.

Current routes:

- `POST /checkout/sessions`
- `GET /checkout/sessions/:sessionId/status`

Checkout creation still:

- validates product slugs and quantities server-side
- loads catalog rows from Prisma
- checks checkout eligibility server-side
- calculates subtotal, shipping, and total server-side
- creates a pending backend order before Stripe Checkout
- creates a Stripe Checkout Session
- stores the Stripe Checkout Session ID on the order

This PR did not change checkout/session creation.

## Existing Webhook Code

Webhook code is in `apps/api/src/webhooks/*`.

Current route:

- `POST /webhooks/stripe`

The webhook still:

- requires Stripe signature verification
- records `StripeWebhookEvent`
- supports `checkout.session.completed`
- validates the Stripe session against the pending order
- only moves `checkout_pending` orders to `paid`
- stores Stripe payment/customer references where available
- sets `paidAt`

This PR did not change Stripe webhook verification or the paid-transition logic.

## Current Env Vars Used By Internal/Admin-Like Routes

Existing backend/internal/admin-like env vars:

- `DATABASE_URL`
- `INTERNAL_ORDERS_API_TOKEN`

Existing staff web Basic Auth env vars:

- `INTERNAL_ORDERS_BASIC_AUTH_USER`
- `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD`

Existing checkout/webhook env vars, unchanged by this PR:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_EXPECTED_LIVEMODE`
- `CHECKOUT_SUCCESS_URL`
- `CHECKOUT_CANCEL_URL`
- `APP_ENV`

Existing web API base env vars, unchanged by this PR:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SITE_URL`

## Backend/Admin Endpoints Added

Added `AdminModule` under `apps/api/src/admin/*` and wired it into `apps/api/src/app.module.ts`.

Protected read-only routes:

- `GET /api/admin/dashboard/summary`
- `GET /api/admin/products`
- `GET /api/admin/products/:id`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `GET /api/admin/customers`
- `GET /api/admin/inventory`
- `GET /api/admin/settings`
- `GET /api/admin/audit-log`

No write endpoints or write stubs were added after the V1 scope correction. Product edits, simple inventory adjustments, notes, fulfillment, and import preview paths are documented as future work only.

## Data Sources Used

- Products: `Product`, `ProductFamily`, `Brand`, `Category`, `ProductVariant`, `ProductMedia`
- Orders: `Order`, `OrderItem`
- Customers: derived from `Order.customerEmail`
- Payment/Stripe visibility: `Order` Stripe fields and `StripeWebhookEvent`
- Settings: safe hardcoded/config-derived values only
- Inventory: explicitly not configured because no inventory tables exist yet
- Audit log: explicitly not configured because no audit log table exists yet

## Safety Results

- Checkout/session creation code unchanged.
- Stripe webhook verification code unchanged.
- Webhook paid-transition code unchanged.
- Public cart behavior unchanged.
- Public storefront navigation unchanged.
- Internal orders API remains protected by `x-internal-orders-token`.
- Staff web internal orders remain protected by Basic Auth middleware.
- Admin backend routes require `x-internal-orders-token`.
- Admin backend routes add no-store/noindex headers.
- No admin client UI or public admin links were created.
- No migrations were created.

## Remaining V1 Gaps

- No admin user/session table.
- No inventory table or adjustment ledger.
- No order notes.
- No fulfillment table.
- No audit log table.
- No settings table.
- `StripeWebhookEvent` exists but is minimal.
- Product edits and simple inventory adjustment writes need a small explicit follow-up design before implementation.

See `docs/architecture/033-admin-schema-gap-report-v1.md`.
