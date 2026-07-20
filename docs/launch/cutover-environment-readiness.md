# Cutover Environment Readiness — TigerPingPong.ca

## 1) Executive summary

TigerPingPong has a stable payment and order backbone on Render, but a safe custom-domain cutover depends on operational confirmation after the SEO cutover release is deployed.

The canonical decision is final: `https://tigerpingpong.ca` is canonical, while `.com` and `www` hosts redirect permanently. Before live DNS changes, deploy the cutover release, align runtime variables (`CORS_ORIGIN`, `CHECKOUT_SUCCESS_URL`, `CHECKOUT_CANCEL_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_BASE_URL`), and run the Render-origin smoke proof.

As of this pass, no production code, infra, DNS, webhook routing, database, or payment integrations were changed in this task.

## 2) Cutover readiness status

- Payment truth and checkout-webhook model are implemented and unchanged.
- Deployment architecture is established as:
  - web storefront on `tigerpingpong-web`
  - API/webhook on `tigerpingpong-platform`
- Current blockers are operational and can be handled through controlled cutover steps:
  - deploy and verify the approved canonical/redirect implementation,
  - production env variable confirmation for selected domain,
  - final pre-cutover smoke on the actual public domain.
- Launch is **not blocked by missing app/runtime logic** in this checklist task.

Status: **Pre-DNS hold until Render-origin, Stripe test-mode, CORS, staff-auth, and rollback proofs pass.**

## 3) Production services checklist

### Domain / DNS

- Canonical domain is `https://tigerpingpong.ca`.
- `https://www.tigerpingpong.ca`, `https://tigerpingpong.com`, and `https://www.tigerpingpong.com` are redirect-only aliases.
- Path-specific legacy redirects must run before host catch-all redirects so old product URLs land directly on their final `.ca` destinations.
- DNS and Render domain mappings must be changed only after every pre-DNS gate passes.
- Keep Render web URL available for rollback verification.
- Ensure HTTPS and certificate coverage are active for all intended cutover hosts.

### Render web service

- Must serve the public storefront and staff surfaces.
- Should remain reachable without changes to code.
- Protected paths (`/admin`, `/internal/orders`) must continue to require Basic Auth.
- `NEXT_PUBLIC_API_BASE_URL` should continue to point to API service unless architecture changes.

### Render API service

- Must keep API/webhook ownership and must not move webhook endpoint.
- Must continue to serve `POST /checkout/sessions`, `GET /checkout/sessions/:sessionId/status`, `POST /webhooks/stripe`, and protected internal/admin routes.
- CORS must permit selected final web origin(s).

### Supabase/Postgres

- Database service/account should be the same as current launched environment.
- Prisma schema/migrations for order and webhook models should already be deployed.
- No migrations/imports are required in this task.

### Stripe Checkout

- Existing hosted Checkout session flow should be kept.
- Success/cancel URLs must reflect selected public domain and include:
  - `?session_id={CHECKOUT_SESSION_ID}` on success route.
- Checkout mode (test/live) must align with Stripe mode and `STRIPE_EXPECTED_LIVEMODE`.
- In the intended Stripe mode, **Settings → Business → Customer emails → Successful payments** must be enabled and evidenced.
- Stripe receipt branding and public support details must identify Tiger Ping Pong accurately.
- Send a test receipt to an owner-controlled address and verify delivery, line items, shipping, tax, totals, and support information.
- The application does not send a separate order-confirmation email; avoid a duplicate customer message.
- Keep paid-invoice creation off unless the business separately approves that workflow.

### Stripe webhook

- Webhook endpoint remains:
  - `https://tigerpingpong-platform.onrender.com/webhooks/stripe`
- Verify that endpoint is still reachable by test traffic after cutover.
- Validate no-client-payment-truth dependency:
  - success redirect is not payment confirmation; backend status API is source of truth.

### Cloudinary

- Public media should use Cloudinary URLs where available with fallback behavior.
- Do not change Cloudinary service config in this task.
- Validate at least one representative product page/media path on cutover domain.

## 4) Environment variable checklist by surface

### Web app

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `INTERNAL_ORDERS_API_TOKEN`
- `INTERNAL_ORDERS_BASIC_AUTH_USER`
- `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD`

### API service

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGIN`
- `PORT`
- `APP_ENV`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_EXPECTED_LIVEMODE`
- `STRIPE_TAX_ENABLED`
- `CHECKOUT_SUCCESS_URL`
- `CHECKOUT_CANCEL_URL`
- `INTERNAL_ORDERS_API_TOKEN`

### Database/Prisma

- `DATABASE_URL` is the only required runtime DB variable in current launch path.

### Stripe

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_EXPECTED_LIVEMODE`
- `STRIPE_TAX_ENABLED`

### Cloudinary

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Public URL/base URL values

- `NEXT_PUBLIC_SITE_URL=https://tigerpingpong.ca`
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com`
- `CHECKOUT_SUCCESS_URL=https://tigerpingpong.ca/checkout/success?session_id={CHECKOUT_SESSION_ID}`
- `CHECKOUT_CANCEL_URL=https://tigerpingpong.ca/checkout/cancel`
- `CORS_ORIGIN` must include `https://tigerpingpong.ca`, `https://www.tigerpingpong.ca`, and `https://tigerpingpong-web.onrender.com` using the API service's supported delimiter format.

### Webhook URL values

- API-side endpoint value is fixed in routing: `https://tigerpingpong-platform.onrender.com/webhooks/stripe`
- Checkout return URLs (env-backed):
  - `CHECKOUT_SUCCESS_URL`
  - `CHECKOUT_CANCEL_URL`

No secret values should be logged in outputs.

## 5) Required operator confirmations

- Confirm who controls DNS and will execute the domain mapping (`tigerpingpong.ca`, `www`, `.com` variants).
- Where are production env vars set and reviewed (Render Environment settings in web vs API service)?
- Run the pre-DNS checkout in Stripe test mode; use matching live credentials and `STRIPE_EXPECTED_LIVEMODE=true` only for the controlled production order.
- Return URLs use the canonical `.ca` apex only.
- Is rollback to Render default URL required to remain enabled for the same session?
- Who will approve the final cutover decision if any verification step fails?

## 6) Safe proof commands already known from audit

Use existing evidence and repeat only after final env/domain confirmation:

```bash
curl -I https://tigerpingpong-web.onrender.com/
curl -I https://tigerpingpong-platform.onrender.com/health
curl -I https://tigerpingpong-platform.onrender.com/catalog/health
```

```bash
curl -sS "https://tigerpingpong-platform.onrender.com/catalog/products?includeInternal=1" \
  -H "Origin: https://tigerpingpong-web.onrender.com"
```

```bash
curl -sSI -H "Origin: https://tigerpingpong-web.onrender.com" \
  "https://tigerpingpong-platform.onrender.com/checkout/sessions"
```

```bash
curl -sS https://tigerpingpong-web.onrender.com/sitemap.xml
curl -sS https://tigerpingpong-web.onrender.com/robots.txt
```

```bash
curl -sS -u "<user>:<password>" https://tigerpingpong-web.onrender.com/admin
curl -sS -H "x-internal-orders-token: <token>" \
  "https://tigerpingpong-platform.onrender.com/internal/orders?status=paid&limit=1"
```

## 7) Manual smoke test plan for the cutover domain

All steps are read-only and should be executed on the selected final public domain.

### Pre-cutover (before DNS flips)

1. Confirm the approved `.ca` apex canonical and redirect-only alias policy is deployed.
2. Confirm staging/prod env values above are set in the correct service.
3. Keep `NEXT_PUBLIC_API_BASE_URL` and webhook endpoint on API service URL.

### On cutover domain

- Home page
  - `GET /` returns 200, storefront shell visible.
- Category page
  - `GET /tables`, `/accessories`, `/accessories/paddles`.
- Product page
  - at least one product from each family loads from catalog.
- Cart
  - `GET /cart` and local cart can be added/updated.
- Checkout session creation
  - `POST /checkout/sessions` from web checkout CTA succeeds and returns checkout URL.
- paid/test paid order path
  - Complete end-to-end test-mode flow using selected Stripe mode.
  - Verify backend status endpoint returns `paid` for session after webhook.
  - Verify the Stripe successful-payment receipt arrives at an owner-controlled address with approved branding and correct totals.
  - Verify no duplicate application order-confirmation email is sent.
- webhook order write proof
  - Confirm API internal/admin endpoint shows paid state and no duplicate paid transition.
- admin/order visibility
  - staff auth can reach `/admin/orders` and `/internal/orders/:publicReference`.
- mobile smoke
  - run viewport smoke for home, one category, PDP, cart, checkout status.

### Proof artifacts to collect

- Screenshot or shared notes for:
  - checkout session creation URL,
  - success page paid status text,
  - redacted Stripe receipt delivery and branding proof,
  - admin internal order visibility,
  - protected route denied behavior without token/auth.

## 8) Rollback plan

- If any fail-safe check fails, stop cutover and restore render domain traffic to prior working host.
- Keep API endpoint and base URL settings stable unless failure is specifically env-derived.
- Revert only cutover-only env values if needed:
  - `CORS_ORIGIN`
  - `CHECKOUT_SUCCESS_URL`
  - `CHECKOUT_CANCEL_URL`
  - `NEXT_PUBLIC_SITE_URL`
- Re-run health and checkout smoke against Render web URL.
- Do not modify DB schema, webhook logic, or runtime behavior during rollback window.

## 9) Go/no-go checklist

### Go

- Final canonical domain and www/non-www policy approved.
- Env values are confirmed by operator owners (no missing variables).
- Domain DNS mapping and Render custom domains are active.
- Pre-cutover smoke confirms:
  - public routes load,
  - cart checkout opens,
  - success page reads backend status,
  - protected routes remain protected,
  - internal order visibility works with credentials.

### No-go

- Missing required env values for selected domain.
- CORS mismatch blocking storefront/API calls.
- Checkout creation or paid confirmation regression.
- Admin/internal routes exposed or unauthenticated.
- Any webhook delivery or order confirmation inconsistency.
- Rollback path not validated.

## 10) Open blockers

- Deploy and verify the approved redirect, sitemap, canonical, and robots release on the Render origin.
- Final alignment of `CORS_ORIGIN` and canonical `.ca` return URLs in Render.
- Final staff/operator smoke validation for full paid order flow with webhook confirmation is pending.
- Save current DNS records and the previous successful Render deploy IDs before DNS changes.
- Export the current `.ca` Search Console performance, indexed-pages, and sitemap baseline before cutover.

## 11) Recommended next executable task

Recommended next task: deploy the frozen cutover branch to the Render origin and execute the pre-DNS route, sitemap, mobile, protected-route, image, and Stripe test-mode proofs.
