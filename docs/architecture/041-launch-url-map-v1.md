# 041 Launch URL Map V1

Date: 2026-06-12

## Purpose

Centralize the current production URLs, future public domain targets, service ownership, and cutover environment variables for Tiger Ping Pong launch-domain readiness.

This document is preparation only. It does not choose a canonical public domain, change DNS, change Render domain mappings, move Stripe webhooks, or alter checkout behavior.

## Current Production URLs

- Web app: `https://tigerpingpong-web.onrender.com`
- API/webhook service: `https://tigerpingpong-platform.onrender.com`
- Current Stripe webhook destination: `https://tigerpingpong-platform.onrender.com/webhooks/stripe`

## Future Public Domains To Prepare

- `tigerpingpong.ca`
- `www.tigerpingpong.ca`
- `tigerpingpong.com`
- `www.tigerpingpong.com`

Both `.ca` and `.com` should be supported eventually. The canonical domain should remain a launch decision unless intentionally configured later.

## Intended Ownership

- Public customer storefront should point to the web app service.
- Protected admin UI should live on the web app service behind auth.
- Protected internal order UI should live on the web app service behind auth.
- Backend/API/webhook traffic should remain on the platform service.
- Stripe webhook should remain on the platform service unless intentionally changed in a future task.

## Route Ownership

Web app service:

- `/`
- `/catalog`
- `/catalog/products/:slug`
- `/cart`
- `/checkout/success`
- `/checkout/cancel`
- `/shipping`
- `/contact`
- `/admin` and `/admin/:path*`, protected by Basic Auth
- `/internal/orders` and `/internal/orders/:publicReference`, protected by Basic Auth

API/platform service:

- `/health`
- `/catalog/health`
- `/catalog/categories`
- `/catalog/product-families`
- `/catalog/families/:slug`
- `/catalog/products`
- `/catalog/products/:slug`
- `/checkout/sessions`
- `/checkout/sessions/:sessionId/status`
- `/webhooks/stripe`
- `/internal/orders` and `/internal/orders/:publicReference`, protected by `x-internal-orders-token`
- `/api/admin/:path*`, protected by `x-internal-orders-token`

## Checkout URL Model

Stripe Checkout URLs are configured on the API service:

- Success URL comes from `CHECKOUT_SUCCESS_URL`.
- Cancel URL comes from `CHECKOUT_CANCEL_URL`.
- The app does not derive checkout return URLs from request origin.
- The app does not derive checkout return URLs from `window.location.origin`.
- The app does not currently use `NEXT_PUBLIC_SITE_URL` for checkout return URLs.

Cutover requirement:

- Update `CHECKOUT_SUCCESS_URL` and `CHECKOUT_CANCEL_URL` to the selected public web domain when launch wants customers to return to the custom domain.
- Keep `CHECKOUT_SUCCESS_URL` including `?session_id={CHECKOUT_SESSION_ID}`.
- Do not move the webhook endpoint during public web cutover.

## API Base URL Model

Frontend API helpers use:

- `NEXT_PUBLIC_API_BASE_URL`

The active helpers are:

- `apps/web/src/lib/catalog-api.ts`
- `apps/web/src/lib/checkout-api.ts`
- `apps/web/src/lib/internal-orders-api.ts`
- `apps/web/src/lib/admin-api.ts`

Cutover requirement:

- Keep `NEXT_PUBLIC_API_BASE_URL` pointed at the platform/API service unless there is an intentional future API domain change.
- For this cutover, the expected production value remains `https://tigerpingpong-platform.onrender.com`.

## CORS Model

The API service reads:

- `CORS_ORIGIN`

`CORS_ORIGIN` supports comma-separated origins.

Cutover requirement:

- Add the selected public web origin or origins to `CORS_ORIGIN` before routing browsers through the custom domain.
- Keep the Render web origin available if it is needed for rollback/testing.

## Environment Variables To Verify Before Cutover

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

Web app service:

- `NEXT_PUBLIC_API_BASE_URL`
- `INTERNAL_ORDERS_API_TOKEN`
- `INTERNAL_ORDERS_BASIC_AUTH_USER`
- `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD`

Documented but not found as active runtime dependencies in app code:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SITE_URL`

## Current Code Findings

- No active `metadataBase` usage found.
- No active canonical URL generation found.
- No active sitemap route found.
- No active robots route found.
- No forced canonical redirect logic found.
- No active hardcoded Render storefront URL found.
- No active request-origin checkout URL derivation found.
- No public storefront navigation links to `/admin` or `/internal/orders` found.

## Future Recommendations

- Decide canonical public domain as a launch/business decision.
- Add canonical redirects only after the canonical decision is final.
- Add a sitemap and robots route only after the public domain plan is final.
- Consider replacing launch copy that says `TigerPingPong.ca` if `.com` should feel equally primary.
- Consider adding a central public web origin env var in a future PR if operationally useful, but do not invent one for the current cutover because checkout already uses explicit success/cancel URL env vars.

