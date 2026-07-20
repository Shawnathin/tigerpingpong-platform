# Launch Readiness Audit — TigerPingPong.ca Readiness (as of 2026-06-24)

## 1) Executive summary

TigerPingPong can process checkout and record paid orders from Stripe in principle, and public storefront/admin/internal protection is in place. The store can sell on the current Render URLs, but `tigerpingpong.ca` is not yet production-live ready because the domain/env/deployment alignment and final human confirmation steps are still outstanding.

## 2) Current repo/app architecture relevant to launch

- Monorepo: Next.js web app (`apps/web`) + NestJS API (`apps/api`) + Prisma/Supabase DB (`packages/db`).
- API owns catalog, checkout session creation (`POST /checkout/sessions`), checkout status polling, Stripe webhook ingestion (`POST /webhooks/stripe`), and internal/admin data.
- Web app renders public storefront, cart, checkout status/cancel pages, and protected `/admin` and `/internal/*` surfaces.
- Two-service deployment pattern (Render): web service uses `NEXT_PUBLIC_API_BASE_URL` to call API service.

## 3) What appears ready for launch

- Payment truth path: server-side and webhook-driven.
- Stripe signature verification and event idempotency are in place.
- Required options enforced before add-to-cart on product pages (for products with required option groups).
- Duplicate checkout lines are blocked for the same slug+option signature in a single cart session.
- Canada-only shipping/country policy in Stripe session and shipping cost logic.
- Protected routes and API tokens/auth are in place for staff-only surfaces.
- Hosted Stripe redirect is not treated as payment confirmation.
- Core QA artifacts and recent smoke checks already confirmed many paths and checkout behavior.

## 4) What appears ready and safe for launch

- Public storefront routes and key customer flows render.
- Web and API auth guards for internal surfaces remain active.
- Pending order creation and webhook transition to `paid` are present.
- `stripeEventId` uniqueness and webhook event tracking are configured.
- Basic security headers and `X-Frame-Options` / `Referrer-Policy` / `X-Content-Type-Options` / `Permissions-Policy` are set on web and API responses.

## 5) Must fix before live

These block TigerPingPong.ca from going live safely today.

1. **Custom-domain/env parity is incomplete for `tigerpingpong.ca` today.**
   - Public domain mapping, Render DNS/SSL, and canonical rollout decision are not completed.
   - `CORS_ORIGIN`, `CHECKOUT_SUCCESS_URL`, and `CHECKOUT_CANCEL_URL` must be set for the selected public domain.
2. **Final pre-cutover checkout verification (paid-path smoke) has not been completed in this audit pass.**
   - Open Stripe test-mode checkout creation is known, but a full end-to-end paid-order confirmation and staff visibility loop is not demonstrated in this pass.
3. **Deployment checklist mismatch risk.**
   - `docs/deployment/render-setup.md` is outdated vs current env/deployment realities.
4. **Final domain-cutover governance tasks are pending (rollback and runbook verification).**
   - No DNS/Maintenance runbook execution has been done in this pass.

## 6) Should fix before live

1. `shippingReviewRequired` remains in public catalog DTOs.
2. Content/media completeness still has v1-level caveats:
   - Fallback media paths exist, but Cloudinary canonical coverage is not complete across all products.
   - Several product description paths are acceptable for launch, but should be cleaned for launch quality.
3. Add or confirm any required route canonical/redirect decisions (`www`, `.com`, and trailing slash behavior).
4. Review accessibility and focus handling on add-to-cart modal (existing implementation already has escape handling but should satisfy broader QA scope).

## 7) Can ship with caveat

- Inventory and audit log are intentionally not fully implemented beyond minimal admin read-only states.
- `ship to Canada only` and flat-shipping policy are implemented, but domain-level operational polish is not complete.
- Some catalog fields are still launch-adequate but imperfect for marketing polish (media and copy quality variance).

## 8) Parking lot

- Full content rewrite (detailed specs, richer SEO metadata, canonical redirect strategy details, richer search/filtering).
- Any future customer account model.
- Automation beyond webhook-paid order and basic staff workflows.

## 9) Required environment/config checklist (no secrets)

API service (`tigerpingpong-api`):

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGIN` (must include final web origin(s))
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CHECKOUT_SUCCESS_URL` (`.../checkout/success?session_id={CHECKOUT_SESSION_ID}`)
- `CHECKOUT_CANCEL_URL`
- `INTERNAL_ORDERS_API_TOKEN`
- `STRIPE_TAX_ENABLED`
- `STRIPE_EXPECTED_LIVEMODE`

Web service (`tigerpingpong-web`):

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `INTERNAL_ORDERS_API_TOKEN`
- `INTERNAL_ORDERS_BASIC_AUTH_USER`
- `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD`

## 10) Stripe checkout/webhook readiness findings

- Checkout session creation validates payload shape, line items, options, quantities, and product status/visibility/purchase mode.
- Server calculates subtotal/shipping totals and creates Stripe Checkout session with shipping restriction to `CA`.
- New checkout orders use
  `canada_free_over_100_flat_15_aqua_4_pack_free`; the exact Aqua 4-pack ships
  free when it is the only cart line, while legacy pending orders retain
  threshold-only webhook validation.
- Webhook validates signature, supports `checkout.session.completed`, checks session/order IDs, payment status, amount/country/livemode (if configured), and marks order paid only after all checks pass.

## 11) Catalog/product/media readiness findings

- Public catalog filters hide replacement parts and non-public items and default to checkoutable items.
- Media rendering prefers Cloudinary URLs when available and falls back to curated local/demo sources.
- Catalog endpoints support internal/admin-expanded views only when `x-internal-orders-token` is valid.
- Some product families are operationally launch-useful but still have quality and media debt (acceptable today as `Should fix` / `Can ship with caveat`).

## 12) Cart/shipping/order readiness findings

- Required options are enforced for checkout-eligible items requiring selection.
- Shipping is enforced as:
  - free when subtotal > `10000` cents,
  - free for an Aqua 4-pack-only order,
  - else `$15.00 CAD`, including exactly `$100.00 CAD` and mixed under-threshold carts.
- Cart state is local-only and not payment truth; backend is source of status.
- Success/cancel pages explicitly avoid client-side payment marking.

## 13) Admin/order visibility readiness findings

- `/admin` and `/internal/*` routes are middleware-protected in web.
- Internal/admin APIs check `x-internal-orders-token` and fail closed on missing/invalid token.
- Read-only pages provide order visibility and summary states.
- Shipment updates are minimally supported.

## 14) Deployment/domain/DNS readiness findings

- Render service split is conceptually correct (`web` vs `api`).
- Render setup doc is stale and does not list current required envs.
- Canonical URL helper defaults to `https://tigerpingpong.ca` and must match final domain decisions.
- Domain cutover (`tigerpingpong.ca`, `www`, `.com`, redirects) is a launch-control action, not complete.

## 15) Security/secrets/debug risk findings

- Good:
  - Protected staff routes and internal headers.
  - API webhook signature verification.
  - Timing-safe token comparison for internal/auth token checks.
  - Stripe redirect is not trusted for paid state.
  - `x-powered-by` disabled in both web and API.
- Residual risk:
  - Security header scope is currently practical but not maximal (for example, CSP/HSTS not yet hardened as a distinct launch hardening item).
  - Debug logs remain production-safe but limited operational observability depends on webhook/manual-review handling.

## 16) Validation commands run and results

- `pnpm lint` — passed
- `pnpm typecheck` — passed
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate` — passed
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build` — passed

## 17) Build/lint/typecheck/database validation status

- Completed successfully in this pass:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm db:validate` with `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation`
  - `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`

## 18) Exact recommended launch task sequence

1. Create and validate the `tigerpingpong.ca` domain plan (canonical + www/`.com` behavior + redirects/legacy routes).
2. Update Render web/API env to final domain set:
   - API: `CORS_ORIGIN`, `CHECKOUT_SUCCESS_URL`, `CHECKOUT_CANCEL_URL`, Stripe mode flags.
   - Web: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, admin credentials.
3. Execute final pre-cutover smoke for TigerPingPong.ca:
   - Public route checks, protected admin/internal checks, successful paid checkout webhook path (test mode), and internal order visibility.
4. Validate staff workflows:
   - Admin/internals accessible with staff credentials and tokens; no public nav links for staff paths.
5. Confirm catalog/media final sign-off checklist and proceed with one-pass smoke under custom domain.

## 19) First executable task card recommendation

`Task: TigerPingPong.ca cutover environment readiness`

- Scope: finalize domain decisions, configure API web/envs for `tigerpingpong.ca`, and run pre-cutover smoke checks.
