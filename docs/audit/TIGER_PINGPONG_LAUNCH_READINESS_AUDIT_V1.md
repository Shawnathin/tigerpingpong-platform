# Tiger Ping Pong Launch Readiness Audit V1

## Purpose

This audit reviews the current TigerPingPong.ca repo state for the next launch
readiness phase: making the platform customer-ready and operationally safe.

This is planning documentation only. It does not implement admin, cart, email,
Cloudinary uploads, checkout changes, webhook changes, Prisma schema changes,
migrations, production code, or a site redesign.

Status labels used in this audit:

- Ready
- Needs review
- Needs build
- Blocked
- Defer

## Executive Summary

Overall launch readiness status: Needs build.

The payment spine is in much better shape than the operational layer. Backend
Checkout Sessions, pending orders, order item snapshots, webhook-confirmed paid
transition, and success-page backend status reads exist. However, the platform
is not yet customer-ready because staff order visibility, customer support
instructions, final launch QA, media readiness, deployment env review, and table
shipping/policy review are not complete.

Bluntly: do not launch broadly until staff can reliably see paid orders and
customers know what to do when status is pending or unavailable.

## Checkout/Payment Status

Status: Needs review.

Ready:

- `POST /checkout/sessions` exists.
- Checkout validates request shape and product eligibility server-side.
- Frontend product detail page can start Stripe Checkout for eligible products.
- Backend calculates subtotal, shipping, and total from database values.
- Pending `Order` and `OrderItem` snapshots are created before the Stripe call.
- Stripe Checkout uses backend-created dynamic line items and one shipping
  option.
- `/checkout/success` reads backend order status.
- `/checkout/cancel` does not mutate payment state.

Needs review:

- No real launch-mode Stripe checkout smoke test is documented in this task.
- No staff view exists for orders created by checkout.
- The product detail checkout button sends fixed quantity `1`; cart is
  intentionally absent.
- Customer email is optional in the checkout API and is not collected by the
  current product detail button before redirect. Stripe may supply it later.
- The checkout creation response includes internal `orderId`; current UI does
  not display it, but the public response contract should be reviewed before
  hardening.

Defer:

- Cart.
- Quantity controls.
- Custom checkout UI.
- Customer accounts.
- Refund flow.

## Webhook/Payment Truth

Status: Ready for architecture, Needs review for deployment.

Ready:

- Raw body support is enabled in the API bootstrap.
- `POST /webhooks/stripe` verifies Stripe signatures.
- `STRIPE_WEBHOOK_SECRET` is read lazily when the endpoint is called.
- `checkout.session.completed` is the only event that can mark an order paid.
- Webhook processing records `StripeWebhookEvent` rows.
- Duplicate Stripe events are handled idempotently.
- Paid transition validates session ID, client reference ID, metadata order ID,
  mode, status, payment status, currency, totals, item subtotal, shipping rule,
  shipping country, and optional livemode expectation.
- Success redirect does not mark payment paid.
- Status API is read-only.

Needs review:

- Confirm the deployed webhook endpoint is registered in Stripe.
- Confirm `STRIPE_EXPECTED_LIVEMODE` matches test or live mode.
- Run at least one deployed test-mode checkout through full webhook-paid
  transition before launch.
- Decide how staff will notice `manual_review` webhook outcomes.

Blocked:

- Launch operations are blocked if no one reviews paid orders or manual-review
  webhook cases.

## Shipping Rule/Copy

Status: Blocked for table launch, Needs review for copy.

Ready:

- Backend V1 shipping rule is implemented as
  `canada_free_over_100_flat_15`.
- Backend shipping calculation is:
  - subtotal over 10000 cents: free shipping
  - subtotal at or under 10000 cents: 1500 cents
- Stripe Checkout restricts shipping address collection to Canada.
- Product/catalog copy links to `/shipping`.
- Product-level copy is cart-aware and avoids implying a low-priced product
  always has a product-specific flat shipping charge.

Needs review:

- `/shipping` says final wording should be reviewed before public launch.
- Final legal/business shipping terms are not approved in repo docs.
- Tax, regional restrictions, damage policy, curbside/freight, and table
  delivery handling are not fully resolved.

Blocked:

- Import review flags still mark table shipping/freight policy as open
  blockers for several table products.
- `checkout_policy_required` remains open for all V1 checkout candidates.

Recommendation:

- Do not make table products broadly checkout-live until table shipping,
  freight/curbside, regional, tax, and support policy are approved.
- If launching a tiny non-table checkout rehearsal, explicitly exclude table
  products or mark them non-checkout until policy is closed.

## Catalog Data Readiness

Status: Needs review.

Ready:

- Catalog schema exists.
- Dev import CSVs exist under `data/import-review/tigerpingpong/v1`.
- Catalog API V1 exists.
- Frontend catalog API client exists.
- Public `/catalog` skeleton exists.
- Minimal product detail route exists.
- Replacement parts are intended to remain deferred from V1 public navigation
  and checkout.

Needs review:

- CSVs contain active checkout candidates, drafts, deferred replacement parts,
  and open review flags.
- Active table checkout candidates still have `shipping_review_required=true`
  and open blocker flags.
- Aqua paddle rows remain draft/manual-review with source/media review open.
- Redirect rows are draft/deferred, not launch-approved.
- Current deployed database contents were not proven by this repo-only audit.

Blocked:

- Final checkout policy and table shipping policy remain open blockers.

Defer:

- Full PIM/admin editing.
- Replacement part public checkout.
- Resource article crawl.

## Product Media Readiness

Status: Needs build.

Ready:

- Product media schema exists.
- Cloudinary media workflow planning doc exists.
- Media import CSV contains source BigCommerce URLs, suggested public IDs, alt
  text/title planning fields, roles, and sort order.
- Frontend gracefully shows image placeholders when `cloudinarySecureUrl` is
  missing.

Needs build:

- `cloudinary_secure_url` values are intentionally blank in import CSVs.
- No Cloudinary upload workflow has been implemented.
- No final media approval/upload has occurred in this repo.
- Public product/catalog pages may show "Image pending" placeholders.

Recommendation:

- Cloudinary workflow is required before a polished customer launch.
- It is not required before a narrow internal checkout/payment rehearsal, as
  long as placeholders are accepted.

## Frontend User Experience Readiness

Status: Needs build.

Ready:

- Homepage foundation exists.
- Public catalog skeleton exists.
- Product detail route exists.
- Product detail route has a checkout button for eligible products.
- Checkout success/cancel pages exist.
- Success page handles paid, pending, failed, canceled, expired, not found,
  manual review, missing session, and status API failure.

Needs build:

- No "Contact us about your order" action exists on success states.
- No customer support instructions are approved for pending/not-found/status
  unavailable cases.
- Public catalog and product detail still expose skeleton-ish labels such as
  slugs, record counts, and "Content Sections".
- Product media can show placeholders.
- No cart.
- No customer email capture before Stripe redirect.
- No customer receipt or order confirmation email.

Defer:

- Full redesign.
- Cart UX.
- Customer accounts.
- Order history.

## Backend/API Readiness

Status: Needs review.

Ready:

- NestJS API has health, catalog, checkout, and webhook modules.
- API owns database access through Prisma.
- Checkout and webhook endpoints use backend-only env vars.
- Public checkout status endpoint returns a narrow safe response.
- Checkout status endpoint performs no writes.

Needs review:

- Catalog API has `includeInternal` query behavior. This is useful during
  development, but if the deployed API is public it should be reviewed before
  launch because it can expose source/review fields that are not meant for
  customers.
- There is no protected internal order API.
- There is no support/contact API.
- There is no email provider integration.
- There is no central production runbook for API smoke tests.

Defer:

- Admin CRUD.
- Public Supabase access.
- Broad webhook event support.
- Fulfillment APIs.

## Database/RLS Readiness

Status: Needs review.

Ready:

- Prisma schema includes catalog, order, order item, quote request, media,
  redirect, import flag, and webhook event models.
- Order and order item models support checkout snapshots.
- RLS baseline migration exists.
- RLS docs correctly preserve frontend-to-API-to-Prisma architecture.
- RLS baseline creates no broad `anon` or `authenticated` table policies.

Needs review:

- The RLS baseline docs say it was not applied to Supabase by that task.
- This audit did not confirm whether RLS is applied in the current Supabase
  environment.
- Backend `DATABASE_URL` role must be confirmed to keep working after RLS.
- Direct Supabase manual order review requires trusted staff access and careful
  handling of PII.

Blocked:

- If production backend uses a role constrained by RLS without policies,
  catalog, checkout, and webhook database access may fail after RLS is enabled.

## Environment Variables

Status: Needs review.

Known variables in `.env.example`:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGIN`
- `APP_ENV`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_EXPECTED_LIVEMODE`
- `CHECKOUT_SUCCESS_URL`
- `CHECKOUT_CANCEL_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SITE_URL`

Needs review before launch:

- API `DATABASE_URL` points to the intended database and role.
- API `STRIPE_SECRET_KEY` is correct for test/live launch mode.
- API `STRIPE_WEBHOOK_SECRET` matches the Stripe webhook endpoint.
- API `STRIPE_EXPECTED_LIVEMODE` matches the Stripe mode.
- API `CHECKOUT_SUCCESS_URL` includes
  `/checkout/success?session_id={CHECKOUT_SESSION_ID}` for the deployed web
  origin.
- API `CHECKOUT_CANCEL_URL` points to deployed `/checkout/cancel`.
- API `CORS_ORIGIN` allows the deployed web origin.
- Web `NEXT_PUBLIC_API_BASE_URL` points at the deployed API base URL.
- Web `NEXT_PUBLIC_SITE_URL` points at the deployed web URL if used.
- Do not put Stripe secret keys in `NEXT_PUBLIC_` variables.

## Render Deployment Readiness

Status: Needs review.

Ready:

- Render setup notes exist.
- Prior build logs use deployed API base URL for web builds.
- Monorepo scripts support API and web builds.

Needs review:

- `docs/deployment/render-setup.md` predates checkout/webhook/status work and
  does not list all current required Stripe/checkout/web variables.
- No `render.yaml` was found in the repo.
- Confirm API and web root directories/build commands in Render.
- Confirm Prisma generate runs during Render builds.
- Confirm API service has all checkout/webhook env vars.
- Confirm web service has `NEXT_PUBLIC_API_BASE_URL`, not only the older
  `NEXT_PUBLIC_API_URL`.
- Confirm Stripe webhook points to deployed API `/webhooks/stripe`.

## Manual QA Checklist

Status: Needs build for launch runbook.

Minimum pre-launch QA:

- Open `/health` on deployed API.
- Open `/catalog/health` on deployed API.
- Open `/catalog/products` on deployed API.
- Open deployed `/catalog`.
- Open at least one non-table product detail page.
- Open at least one table product detail page and verify checkout policy.
- Verify replacement parts are not publicly navigable or checkoutable.
- Verify product media behavior for missing Cloudinary URLs.
- Start a test-mode checkout from product detail.
- Confirm pending order row is created.
- Complete Stripe test checkout.
- Confirm webhook marks order `paid`.
- Confirm `/checkout/success?session_id=...` shows backend-confirmed paid state.
- Confirm success page does not expose internal order ID.
- Confirm cancel page does not mutate payment state.
- Confirm staff can find the paid order internally.
- Confirm customer support lookup works from `publicReference`.
- Confirm Stripe Dashboard amount matches order total.
- Confirm shipping address country is Canada.
- Confirm `STRIPE_EXPECTED_LIVEMODE` behavior in test/live mode.
- Confirm logs do not expose secrets or raw payment payloads.

## Known Blockers

Status: Blocked.

- No internal order visibility beyond manual Supabase/database review.
- No customer-facing support/contact path after checkout.
- Table shipping/freight/tax/regional policy remains open.
- Global checkout policy review remains open in import review flags.
- Cloudinary media upload workflow is not implemented.
- Deployed Stripe webhook/config has not been proven by this audit.
- Render deployment docs are outdated for current checkout/webhook env vars.
- Current Supabase RLS application/backend role state was not proven.

## Non-Blocking Polish

Status: Defer.

- Remove skeleton-ish public labels such as slugs, record counts, and content
  section scaffolding from customer surfaces.
- Finalize page metadata titles that still say "Platform".
- Add a refresh/recheck action on checkout success for pending status.
- Add friendlier product descriptions once content is approved.
- Add polished media once Cloudinary is ready.
- Improve empty/error states after launch-critical operations work.

## Recommended Build Order From Here

1. Build or formally document minimal internal paid order review.
2. Add success-page customer support copy and "Contact us about your order"
   behavior using `publicReference`.
3. Update deployment/runbook docs for current Render, Stripe, webhook, and env
   requirements.
4. Run deployed test-mode checkout/webhook/status QA end to end.
5. Resolve table shipping/freight/tax/regional policy or disable table checkout.
6. Lock launch catalog data and purchase modes.
7. Upload/review Cloudinary product media.
8. Add staff email notification after paid webhook, if still needed.
9. Defer cart, full admin, customer accounts, refunds, and fulfillment
   automation until the operational spine is stable.
