# 095 Security Headers Pre-Domain Hardening

Date: 2026-06-17
Branch / PR: `codex/pr-095-security-headers-hardening`
Status: Draft PR validation note

## Decision made

Add conservative baseline browser headers to the public web app and API service before domain cutover:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()`

The web app also disables the default `X-Powered-By: Next.js` header. The API disables Express `x-powered-by`.

## Why

The PR 094 pre-domain audit found missing browser hardening headers on sampled web/API responses. These headers improve baseline browser protections without changing checkout, catalog, admin data flows, Cloudinary media delivery, robots, sitemap, redirects, DNS, or payment truth.

`X-Frame-Options: DENY` is safest for the current app because TigerPingPong does not intentionally embed storefront, admin, internal, checkout success, robots, sitemap, or API responses in another site. Hosted Stripe Checkout is a top-level navigation away from TigerPingPong, not an iframe embed.

## Deferred

Full `Content-Security-Policy` is deferred to a dedicated tested PR. Current storefront behavior includes Next.js runtime scripts/styles, hosted Stripe Checkout redirects, Cloudinary product images, BigCommerce fallback/source images, Render-hosted web/API origins, and possible future analytics decisions. A strict CSP could break launch-critical checkout or media behavior if added without browser-level route QA and reporting.

HSTS is deferred until final domain and SSL behavior are confirmed. Enabling HSTS before the canonical domain, `www`, `.com`, Render custom-domain SSL, and rollback plan are reviewed could make domain mistakes sticky in browsers.

## Validation focus

This PR should verify:

- Public storefront routes still load.
- Cloudinary and fallback/source images still load.
- Hosted Stripe Checkout still opens from cart paths.
- `/robots.txt` and `/sitemap.xml` still load.
- `/admin/orders` remains protected.
- Public API behavior is unchanged.
- Catalog debug/internal flags still return `401` without the internal token.

## QA results

- Local web `/`, category pages, Vice PDP, Aqua PDP, and `/cart` loaded in the browser.
- Cloudinary product images loaded on category/PDP pages.
- BigCommerce fallback/source images loaded on the homepage, Aqua PDP, and paddle category page.
- Local `/robots.txt` returned `200` with the baseline security headers.
- Local `/sitemap.xml` returned `200` XML with the baseline security headers.
- Local `/admin/orders` returned `401` with Basic Auth challenge, no-cache staff headers, `X-Robots-Tag`, and the baseline security headers.
- Local API `/health` returned `200` with the baseline security headers and no `X-Powered-By` header.
- Local API catalog errors still returned the baseline security headers; full local catalog success was not expected because local DB/env were not configured for this PR.
- Deployed public catalog API returned `200` for a normal no-token request.
- Deployed `includeInternal=1` without token returned `401`.
- Deployed `includeReplacementParts=1` without token returned `401`.
- Browser cart checkout from `localhost:3100` reached the cart, then failed because the deployed API CORS configuration does not allow that local origin. This is an environment-origin constraint, not a header regression.
- A direct deployed `POST /checkout/sessions` for `tiger-vice-paddle` returned `201` with a hosted `checkout.stripe.com` URL.
- The hosted Stripe Checkout sandbox page rendered from that URL, showing the Vice paddle line item, `$15` shipping, and tax awaiting address entry. No customer, address, or payment data was entered.

## What did not change

- No Stripe Checkout creation changes.
- No Stripe webhook/payment truth changes.
- No cart totals, tax, shipping, or order status changes.
- No catalog, product, Aqua, media, or import data changes.
- No admin shipment email changes.
- No Prisma schema, migrations, imports, DNS, Render env, Stripe, Supabase, or Make setting changes.
