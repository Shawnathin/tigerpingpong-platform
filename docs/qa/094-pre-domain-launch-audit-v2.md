# 094 Pre-Domain Launch Audit V2

Date: 2026-06-17
Branch / PR: `codex/pr-094-pre-domain-launch-audit-v2`
Status: Draft PR audit report only

## 1. Executive Summary

TigerPingPong is close to custom-domain launch, but I do not recommend domain cutover yet.

The current storefront, catalog API, protected admin/internal route posture, cart model, checkout service, Stripe webhook payment-truth design, robots, sitemap, and SEO canonical helpers are broadly aligned with the launch guardrails. The deployed Render public routes sampled during this audit returned successful responses, catalog debug flags rejected no-token access, and admin/internal surfaces rejected no-auth/no-token requests.

Top remaining blockers before domain cutover:

- Complete a real pre-cutover checkout smoke plan in Stripe test mode after confirming Render env values, including simple accessory, Aqua package, and table carts.
- Confirm deployed API/platform migrations and Render env values match the code now that Stripe Tax, shipment record, and shipment email handoff columns exist.
- Fix or formally accept missing browser security headers on the public web/API responses.
- Finish domain operations decisions: `www`, `.com`, Search Console, sitemap submission, CORS origins, Stripe return URLs, and post-cutover canonical verification.

This PR intentionally does not change app code, migrations, imports, DNS, Render, Stripe, Supabase, or Make settings.

## 2. Critical Launch Blockers

- Fresh payment smoke not completed in this audit. I did not create live Checkout sessions or complete payments because that would create deployed pending orders and requires an explicit test-order plan. Before cutover, run approved Stripe test-mode smoke for simple accessory, Aqua package, table, cancel, success, webhook-paid transition, and protected admin/order visibility.
- Env/deployment parity needs human confirmation. Code expects `STRIPE_TAX_ENABLED`, `STRIPE_EXPECTED_LIVEMODE`, `CHECKOUT_SUCCESS_URL`, `CHECKOUT_CANCEL_URL`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `INTERNAL_ORDERS_API_TOKEN`, Basic Auth values, and optionally `SHIPMENT_EMAIL_WEBHOOK_URL`; I did not inspect secret values.
- Domain behavior remains an open launch decision. The code now emits `https://tigerpingpong.ca` canonicals/sitemap entries, but `www` and `.com` redirect/load behavior still needs a reviewed plan before DNS changes.

## 3. High-Priority Pre-Domain Items

- Add a focused security headers PR. Sampled deployed web/API responses were missing `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` or `frame-ancestors`, `Permissions-Policy`, and HSTS. Design CSP carefully for Stripe Checkout redirects, Cloudinary images, Render hosting, and admin/internal pages.
- Run and document a final end-to-end production-like checkout smoke. Include Stripe Tax enabled path, Canada-only shipping, exactly `$100.00 CAD` shipping behavior, backend-confirmed success status, webhook idempotency evidence, and no client-side paid transition.
- Verify database migration deployment state without running migrations in this PR. The repo includes migrations for Stripe Tax/order total fields, minimal shipment record, and shipment notification handoff.
- Confirm Make shipment email handoff is either parked in the deployed branch or protected by the current server-only/token flow. Current code contains a protected `POST /internal/orders/:publicReference/shipment-email` path and server-only Make webhook URL usage.
- Update `docs/deployment/render-setup.md`; it is stale and does not list current Stripe, checkout URL, admin/internal auth, tax, shipment email, Cloudinary, or `NEXT_PUBLIC_API_BASE_URL` requirements.

## 4. Medium-Priority Cleanup

- Public catalog API still exposes `shippingReviewRequired` on public product summaries/details. It is not secret/customer data, but it is an internal review-ish flag and should be removed or renamed from public DTOs if not customer-facing.
- The add-to-cart modal closes on Escape but does not appear to trap focus or restore focus. This is a basic accessibility polish item before larger traffic.
- `X-Powered-By` is visible as `Next.js` on web and `Express` on API responses. Remove in the same hardening PR if easy.
- Aqua has zero public API media records and relies on storefront fallback media. This is acceptable if known, but it should be explicitly signed off because Aqua is launch-relevant.
- Root route cache header sampled as `s-maxage=31536000, stale-while-revalidate`; review whether launch-critical homepage copy/media should be this sticky during domain cutover.

## 5. Post-Launch / Deferred Polish

- Inventory and audit log can remain `not_configured`.
- Full admin product editing, inventory editing, refunds, fulfillment automation, and custom payment forms remain non-goals.
- Broader WCAG pass, keyboard modal polish, automated accessibility scans, and visual regression screenshots can follow after launch basics are stable.
- Product media debt can be reduced after Cloudinary coverage is verified on deployed product pages.

## 6. Security Findings

Critical:

- None found in code or safe deployed checks.

High:

- Missing browser hardening headers on sampled public web/API responses. Add CSP, `X-Content-Type-Options`, `Referrer-Policy`, frame protection, `Permissions-Policy`, and HSTS readiness in a focused PR.

Medium:

- Public API exposes `shippingReviewRequired`. Treat as low sensitivity, but public DTOs should avoid internal review flags.
- `X-Powered-By` framework disclosure is present.
- Admin and internal APIs correctly fail closed without token, but final valid-credential smoke was not performed in this audit.

Pass / positive controls:

- Next middleware protects `/admin`, `/admin/*`, `/internal/*` with Basic Auth, no-cache, and `X-Robots-Tag`.
- API admin/internal endpoints require `x-internal-orders-token`.
- Public catalog `includeInternal=1` and `includeReplacementParts=1` returned `401` without token on deployed API.
- Server-only web helpers read admin/internal API token server-side.
- No public nav exposure of `/admin` or `/internal/orders` was found in source review.

## 7. Payment / Tax / Order Findings

Critical:

- Fresh deployed Checkout opening/payment completion was not executed by this audit. This remains the most important pre-cutover smoke.

High:

- Confirm Render `STRIPE_TAX_ENABLED` and `STRIPE_EXPECTED_LIVEMODE` match Stripe mode before the test order. Webhook validation changes behavior depending on tax enabled status.

Pass / positive controls:

- Checkout service validates request shape, item count, quantity, product slugs, selected options, selected variant key, and customer email.
- Backend loads products from DB and rejects unavailable/non-checkoutable products.
- Backend resolves required variant options and validates selected options against active checkoutable variants.
- Backend calculates line totals, subtotal, shipping, and total; client cart prices are not payment truth.
- Shipping rule remains over `$100 CAD` free, `$100 CAD` or under `$15 CAD`, so exactly `$100.00 CAD` is flat-rate.
- Stripe Checkout is hosted; no custom payment form was found.
- Webhook signature verification uses Stripe raw body and `STRIPE_WEBHOOK_SECRET`.
- Webhook is idempotent through `stripeWebhookEvent` unique event recording.
- Webhook validates session id, order id, mode, status, payment status, currency, totals, shipping, country, shipping rule, and optional livemode before marking paid.
- Stripe Tax path allows `amount_total = subtotal + shipping + tax` and requires automatic tax status `complete`.
- Success page status endpoint reads backend order status; client redirect is not payment truth.

## 8. SEO / Domain Findings

Critical:

- Do not cut over DNS until canonical domain, `www`, and `.com` behavior are reviewed and Render/CORS/Stripe return URLs are aligned.

High:

- `NEXT_PUBLIC_SITE_URL` currently defaults/sanitizes to `https://tigerpingpong.ca`; this is correct only if `.ca` is the chosen canonical.
- Submit sitemap and verify Search Console only after the final domain/redirect behavior is live.

Pass / positive controls:

- `robots.txt` loaded and disallows `/admin/`, `/internal/`, `/api/`, `/catalog-preview/`, and `/checkout/`.
- `sitemap.xml` loaded as XML and includes public static routes, all four resource article routes, and public product routes.
- Sitemap excludes admin/internal/API/checkout routes.
- Product metadata uses full product names while visible PDP hero titles are shorter/human-friendly where mapped.
- Resource article metadata exists for all four articles.
- Source scan did not find active stale `$50` shipping copy in app code.

## 9. Mobile / Accessibility Findings

High:

- Human mobile QA is still required at 390px before cutover. I used code and HTTP route checks, not full browser/mobile interaction automation.

Medium:

- Add-to-cart modal lacks obvious focus trap/restore-focus behavior.
- Product option controls are radio inputs in fieldsets with labels, which is good; still verify touch target spacing on 390px for table color and Aqua package options.
- Cart controls have accessible button labels for quantity changes; verify no mobile overflow with long product/option labels.

Pass / positive controls:

- Product option groups use `fieldset`, `legend`, labelled radio inputs, and error text when required selections are missing.
- Cart uses real buttons and links, accessible quantity labels, alt text/fallback thumbnails, and a visible checkout error state.
- Admin shipment fields have server-side validation; form clarity should be smoke-tested with valid credentials.

## 10. Admin / Operations Findings

Critical:

- None found in no-auth/no-token checks.

High:

- Final credentialed admin/internal smoke is still needed immediately before domain cutover.
- If shipment email handoff is deployed, office testing should verify duplicate-send protection, Make response handling, and user-visible error states.

Pass / positive controls:

- Deployed web `/admin`, `/admin/orders`, and `/internal/orders` returned `401` without Basic Auth.
- Deployed API `/api/admin/dashboard/summary`, `/api/admin/orders`, and `/internal/orders?status=paid&limit=1` returned `401` without token.
- Admin UI moved to `/admin/orders`; public nav does not expose admin/internal routes.
- Internal shipment update and shipment email endpoints require the internal token.
- Make webhook URL is read from server env and is not represented as `NEXT_PUBLIC`.
- Shipment email reservation checks prevent already-sent and in-progress duplicate sends.
- Admin service does not expose an endpoint to mark orders paid.

## 11. Environment / Deployment Checklist

Before cutover, confirm without printing secrets:

- Render web is the public domain target; Render API/platform remains `https://tigerpingpong-platform.onrender.com`.
- Stripe webhook endpoint remains `https://tigerpingpong-platform.onrender.com/webhooks/stripe`.
- API `CORS_ORIGIN` includes current Render web origin and the final custom web origins.
- API `CHECKOUT_SUCCESS_URL` includes `?session_id={CHECKOUT_SESSION_ID}` and points to the intended final domain when ready.
- API `CHECKOUT_CANCEL_URL` points to the intended final domain when ready.
- Web `NEXT_PUBLIC_API_BASE_URL` points to the API/platform service.
- Web `NEXT_PUBLIC_SITE_URL` matches reviewed canonical domain.
- API has `DATABASE_URL`, Supabase server env, Stripe secret/webhook secret, Stripe Tax flag, livemode expectation, and internal token.
- Web has internal token plus Basic Auth user/password for staff pages.
- Optional `SHIPMENT_EMAIL_WEBHOOK_URL` exists only when Make office testing is ready.
- Cloudinary credentials remain server/local script env only; Cloudinary public URLs are safe to commit.
- Confirm migration deployment state for:
  - `20260616150000_stripe_tax_checkout_support`
  - `20260616190000_minimal_admin_shipment_record`
  - `20260616193000_shipment_notification_handoff`

## 12. Human Mobile QA Checklist

Use a 390px-wide phone viewport and real browser:

- `/`: header/menu, hero, product/category links, footer, no overflow.
- `/tables/`, `/tables/indoor-tables/`, `/tables/outdoor-tables/`: cards, filters/anchors, images, CTAs.
- `/accessories/`, `/accessories/paddles/`, `/accessories/ping-pong-balls/`, `/accessories/covers/`, `/accessories/nets/`: product cards and category navigation.
- `/resources/` and all four articles: headings, tables/callouts, internal links, CTAs.
- Expo PDP: gallery, color required error, color select, add to cart, modal, recommended add-ons.
- One indoor table PDP: same table option checks.
- Vice Paddle PDP: simple add to cart, modal, recommended add-ons.
- Aqua PDP: exactly four package options, required package error, each package can add a separate cart line.
- Balls, cover, net PDPs: simple accessory add to cart.
- `/cart`: long product names, option labels, quantity controls, remove, empty cart, checkout button.
- `/checkout/success`: no-session state and approved test session paid/pending states.
- `/checkout/cancel`: customer recovery links.
- `/admin/orders` with credentials: list readability, detail route, shipment fields, mobile overflow.
- Keyboard smoke: tab through nav, PDP options, add-to-cart modal, cart controls, admin shipment form.

## 13. Recommended Next PR Sequence

1. `fix/security-headers-pre-domain`
   Add web/API security headers with a Stripe/Cloudinary-safe CSP and no checkout breakage.

2. `docs/render-env-cutover-checklist-refresh`
   Update Render env/deployment docs for the current Stripe Tax, admin/internal, shipment email, and SEO/domain reality.

3. `qa/final-stripe-tax-checkout-smoke`
   Execute an approved Stripe test-order plan for simple accessory, Aqua package, table, cancel/success, webhook, admin/internal visibility, and tax/shipping totals.

4. `fix/public-catalog-dto-review-flags`
   Remove `shippingReviewRequired` from public catalog responses unless it is intentionally customer-facing.

5. `fix/pdp-modal-accessibility`
   Add focus trap/restore focus and small-screen QA fixes for add-to-cart modal.

## 14. Suggested Codex Prompts

Prompt 1:

```text
Create a focused PR to add pre-domain security headers for TigerPingPong. Do not change checkout/payment logic, DNS, redirects, sitemap, robots, or product data. Add CSP, X-Content-Type-Options, Referrer-Policy, frame protection, Permissions-Policy, and HSTS readiness where safe. Design CSP so Stripe Checkout, Cloudinary images, Render hosting, and admin/internal routes still work. Validate with lint/typecheck/build and deployed/local header checks.
```

Prompt 2:

```text
Create a docs-only PR updating TigerPingPong Render/domain environment documentation for current launch reality. Include Stripe Tax env, checkout success/cancel URLs, CORS origins, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_API_BASE_URL, Basic Auth, internal API token, Make shipment email webhook, Cloudinary secrets, migration deployment checks, and post-cutover smoke checklist. Do not inspect or print secret values.
```

Prompt 3:

```text
Run the approved final pre-domain Stripe Tax checkout smoke for TigerPingPong in test mode. Do not change code. Test simple accessory, Aqua package, and table checkout through hosted Stripe Checkout; verify Canada shipping, tax, success page backend status, webhook-paid transition, admin/internal visibility, and no client-side paid transition. Stop before any real/live payment and document exact results in docs/qa/.
```

## Evidence Collected

Code reviewed:

- `apps/web/src/middleware.ts`
- `apps/web/src/app/robots.ts`
- `apps/web/src/app/sitemap.xml/route.ts`
- `apps/web/src/lib/seo.ts`
- `apps/web/src/lib/sitemap.ts`
- `apps/web/src/lib/cart.ts`
- `apps/web/src/lib/shipping.ts`
- `apps/web/src/lib/catalog-api.ts`
- `apps/web/src/lib/checkout-api.ts`
- `apps/web/src/lib/admin-api.ts`
- `apps/web/src/lib/internal-orders-api.ts`
- `apps/web/src/app/catalog/products/[slug]/page.tsx`
- `apps/web/src/app/catalog/products/[slug]/CheckoutButton.tsx`
- `apps/web/src/app/cart/CartPageClient.tsx`
- `apps/api/src/config.ts`
- `apps/api/src/main.ts`
- `apps/api/src/catalog/catalog.controller.ts`
- `apps/api/src/catalog/catalog.service.ts`
- `apps/api/src/checkout/checkout.controller.ts`
- `apps/api/src/checkout/checkout.service.ts`
- `apps/api/src/webhooks/stripe-webhook.controller.ts`
- `apps/api/src/webhooks/stripe-webhook.service.ts`
- `apps/api/src/admin/admin-auth.ts`
- `apps/api/src/admin/admin.controller.ts`
- `apps/api/src/admin/admin.service.ts`
- `apps/api/src/internal-orders/internal-orders.controller.ts`
- `apps/api/src/internal-orders/internal-orders.service.ts`
- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/*/migration.sql`
- `.env.example`
- `docs/deployment/render-setup.md`
- `docs/qa/041-custom-domain-cutover-runbook-v1.md`

Safe deployed checks:

- Web public routes sampled returned `200` after following slash normalization: `/`, `/tables`, `/tables/indoor-tables`, `/tables/outdoor-tables`, `/accessories`, `/accessories/paddles`, `/accessories/ping-pong-balls`, `/accessories/covers`, `/accessories/nets`, `/resources`, all four resource articles, sampled PDPs, `/cart`, `/checkout/success`, `/checkout/cancel`.
- Web protected routes without credentials returned `401`: `/admin`, `/admin/orders`, `/internal/orders`.
- API normal checks returned `200`: `/health`, `/catalog/health`, `/catalog/products`.
- API protected/debug checks without token returned `401`: `/catalog/products?includeInternal=1`, `/catalog/products?includeReplacementParts=1`, `/api/admin/dashboard/summary`, `/api/admin/orders`, `/internal/orders?status=paid&limit=1`.
- `GET /webhooks/stripe` returned `404`; expected because the Stripe webhook endpoint is `POST`.
- CORS sampled with `Origin: https://evil.example` did not emit `Access-Control-Allow-Origin`; sampled with Render web origin did.
- Aqua deployed catalog detail returned one product with four variants: `Single - Coral Red` `$25.00`, `Single - Ocean Blue` `$25.00`, `2-Pack w/ 3 Balls` `$45.00`, `4-Pack w/ 3 Balls` `$80.00`.

Validation commands:

- `pnpm validate:tiger-import`: passed with 0 errors and 14 warnings.
- `pnpm exec eslint apps/web/src --max-warnings=0`: passed.
- `pnpm exec tsc --noEmit -p apps/web/tsconfig.json`: passed.
- `pnpm --filter @tigerpingpong/api lint`: passed.
- `pnpm --filter @tigerpingpong/api typecheck`: passed. This script ran its configured pretypecheck, including shared/db builds and Prisma client generation; no migrations were run.
- `pnpm --filter @tigerpingpong/db typecheck`: passed.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm --filter @tigerpingpong/web build`: passed, generating 38 app routes.

Not run:

- No migrations.
- No imports.
- No real or test payment completion.
- No checkout session creation against deployed API.
- No DNS, Render, Stripe, Supabase, or Make setting changes.
- No secret values inspected.
