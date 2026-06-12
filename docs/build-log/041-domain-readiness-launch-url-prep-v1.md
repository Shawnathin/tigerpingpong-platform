# 041 Domain Readiness Launch URL Prep V1 Build Log

Date: 2026-06-12

Branch: `docs/041-domain-readiness-launch-url-prep-v1`

## Goal

Prepare Tiger Ping Pong for a future public custom-domain cutover without changing DNS, forcing canonical redirects, moving the Stripe webhook endpoint, or changing checkout, cart, order, admin, Supabase, Stripe, or webhook behavior.

## Preflight

- Checked out `main`.
- Pulled latest `origin/main`, fast-forwarding to PR #40 merge commit `21db780d7f6858b40095ea34b1dbf4b46828e067`.
- Confirmed PR #40 is merged:
  - PR: `https://github.com/Shawnathin/tigerpingpong-platform/pull/40`
  - Title: `[codex] Add simple admin UI shell`
  - Merged at: `2026-06-12T18:31:54Z`
  - Merge commit: `21db780d7f6858b40095ea34b1dbf4b46828e067`
- Confirmed deployed route evidence on Render:
  - `https://tigerpingpong-web.onrender.com/` returned `200`.
  - `https://tigerpingpong-web.onrender.com/admin` without credentials returned `401`, confirming the PR #40 admin route is live and protected.
  - `https://tigerpingpong-platform.onrender.com/health` returned `200`.
  - `https://tigerpingpong-platform.onrender.com/catalog/health` returned `200`.
  - `https://tigerpingpong-platform.onrender.com/api/admin/dashboard/summary` without token returned `401`.
  - `POST https://tigerpingpong-platform.onrender.com/webhooks/stripe` without Stripe signature returned `400`, confirming the webhook route is reached while rejecting invalid traffic.
- Created `docs/041-domain-readiness-launch-url-prep-v1` from updated `main`.

## Search Scope

Searched the repository for:

- `tigerpingpong-web.onrender.com`
- `tigerpingpong-platform.onrender.com`
- `tigerpingpong.ca`
- `tigerpingpong.com`
- `NEXT_PUBLIC_API_BASE_URL`
- `success_url`
- `cancel_url`
- `checkout/success`
- `checkout/cancel`
- `metadataBase`
- `canonical`
- `sitemap`
- `robots`
- `window.location.origin`
- request headers used for origin assumptions

## URL Findings

### Render URLs

- `tigerpingpong-web.onrender.com` appears in existing docs and QA records as the current browser-facing web app URL.
- `tigerpingpong-platform.onrender.com` appears in existing docs and validation commands as the current backend/API/webhook service URL.
- No active app code hardcodes either Render host as the storefront origin.
- Active frontend API helpers use `NEXT_PUBLIC_API_BASE_URL` and fall back to `http://localhost:3001` for local development.

### Public Custom Domains

- `tigerpingpong.ca` appears in:
  - scraper/import source metadata under `tools/` and `data/import-review/`;
  - visible storefront copy such as `TigerPingPong.ca` labels;
  - existing historical docs.
- `tigerpingpong.com` appears primarily as `info@tigerpingpong.com` support/contact email and in older planning docs.
- The `.ca` and `.com` hits are not active routing or redirect logic.
- No forced canonical redirect logic was found.

### SEO Routes And Metadata

- No active `metadataBase` usage was found.
- No active canonical URL generation was found.
- No active Next `sitemap` route was found.
- No active Next `robots` route was found.
- `canonical`, `sitemap`, and `robots` hits are in docs, scrape metadata, import metadata, or generic copy rather than active SEO route code.

### Origin Assumptions

- No `window.location.origin` usage was found.
- No `x-forwarded-*` origin handling was found.
- The API uses `CORS_ORIGIN` from env and supports comma-separated origins through `readCsv`.
- The web middleware reads only the `authorization` header for Basic Auth on `/internal/:path*`, `/admin`, and `/admin/:path*`.

## Checkout URL Readiness

Stripe Checkout success and cancel URLs are created by the API in `apps/api/src/checkout/checkout.service.ts`.

- `success_url` is set from `CHECKOUT_SUCCESS_URL`.
- `cancel_url` is set from `CHECKOUT_CANCEL_URL`.
- Both values are required by `getCheckoutConfig` in `apps/api/src/config.ts`.
- Both values are validated as HTTP or HTTPS URLs before checkout starts.
- They are not derived from request origin.
- They are not derived from `window.location.origin`.
- They are not derived from frontend route helpers.
- They are not hardcoded to Render in active app code.

Cutover implication:

- Checkout is ready for custom domains at the code level.
- The launch cutover must intentionally update the API service env vars to the chosen public success and cancel URLs.
- `CHECKOUT_SUCCESS_URL` must keep the Stripe placeholder query parameter: `/checkout/success?session_id={CHECKOUT_SESSION_ID}`.
- If those env vars are left on the Render web URL during public-domain launch, Stripe Checkout will still work but will return customers to the configured Render URL instead of the public custom domain.

Payment truth remains safe:

- `/checkout/success` reads `session_id`.
- The frontend calls the backend status endpoint at `/checkout/sessions/:sessionId/status`.
- The success page treats backend order status as payment truth.
- The webhook remains the payment authority for marking orders paid.

## API And Webhook Readiness

- The public web app should keep calling the platform/API service through `NEXT_PUBLIC_API_BASE_URL`.
- The API service should stay at `https://tigerpingpong-platform.onrender.com` for this cutover.
- The current Stripe webhook destination remains `https://tigerpingpong-platform.onrender.com/webhooks/stripe`.
- No code change was made to webhook routing or webhook behavior.
- Before cutover, `CORS_ORIGIN` on the API service should be verified to allow the selected public web origins in addition to any Render URL needed for rollback/testing.

## Admin URL Readiness

- Protected admin UI lives under `/admin` on the web app service.
- Protected internal orders UI lives under `/internal/orders` on the web app service.
- The web middleware protects `/internal/:path*`, `/admin`, and `/admin/:path*` with Basic Auth.
- Admin data and internal order data are fetched server-side through `NEXT_PUBLIC_API_BASE_URL` and `INTERNAL_ORDERS_API_TOKEN`.
- Backend admin/internal endpoints require `x-internal-orders-token`.
- Public storefront navigation uses relative links and does not expose `/admin` or `/internal/orders`.
- No admin auth or internal order behavior was changed.

## Environment Variables Discovered

API/platform service:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGIN`
- `PORT`
- `APP_ENV`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_EXPECTED_LIVEMODE`
- `CHECKOUT_SUCCESS_URL`
- `CHECKOUT_CANCEL_URL`
- `INTERNAL_ORDERS_API_TOKEN`

Web service:

- `NEXT_PUBLIC_API_BASE_URL`
- `INTERNAL_ORDERS_API_TOKEN`
- `INTERNAL_ORDERS_BASIC_AUTH_USER`
- `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD`

Present in `.env.example` and older deployment docs, but no active runtime usage found in app code:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SITE_URL`

Future recommendation only:

- If launch operations want one central web-origin env var, add a clearly named app URL env var in a future PR. Do not treat that as required for this cutover because the current checkout implementation intentionally uses full `CHECKOUT_SUCCESS_URL` and `CHECKOUT_CANCEL_URL` values.

## Code Changes

No app code changes were made.

This is a docs-only PR because no clear hardcoded-domain bug was found in active checkout, cart, webhook, API, admin, or public navigation behavior.

## Docs Created

- `docs/architecture/041-launch-url-map-v1.md`
- `docs/qa/041-custom-domain-cutover-runbook-v1.md`

## DNS Cutover Status

- No DNS changes made.
- No Render custom-domain mapping changes made.
- No canonical redirects added.
- No Stripe webhook endpoint changes made.
- No checkout URL env changes made.
- No API base URL env changes made.

## Validation

- `pnpm lint`: passed.
- `pnpm typecheck`: passed after retry.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`: passed.
- `git diff --check`: passed.
- `git status`: showed only the three expected new documentation files.

The first two `pnpm typecheck` attempts failed locally with exit code `-35` during process startup/Prisma generation, matching the local process-limit behavior seen in prior PR #40 validation. The production build then passed, including Prisma generation and the Next build's type validation. A final `pnpm typecheck` rerun passed.
