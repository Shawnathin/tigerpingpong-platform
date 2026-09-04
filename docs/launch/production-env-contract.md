# Production Env Contract — TigerPingPong Website Launch v1

## 1) Executive summary

TigerPingPong is already wired for a stable web/API split and Stripe-based checkout flow. The remaining launch risk is production environment parity before custom-domain cutover. This contract defines required environment variables by surface, expected formats, launch impact, and verification evidence so operators can complete final settings without exposing secrets.

This contract is **docs-only** and intentionally does not include secret values.

## 2) Environment surfaces

- Render web service (`apps/web`)
- Render API service (`apps/api`)
- Supabase/Postgres (via Prisma package)
- Stripe Dashboard (checkout + webhook)
- Cloudinary (media resolve + upload tooling)
- DNS/domain provider (operational controls)

## 3) Environment variable contract table

| Variable                              | Surface       |                               Required for launch? | Secret / Public / Internal | Category / format                                               | Used by / code references                                                                                                                                                                                                                      | Safe validation method (no secrets printed)                                                                                                                  | Failure mode if missing/wrong                                                                                       | Evidence source                                                                                                          |
| ------------------------------------- | ------------- | -------------------------------------------------: | -------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------- |
| `NEXT_PUBLIC_API_BASE_URL`            | Web           |                                           Required | Public                     | HTTPS URL to API base (`https://...`)                           | `apps/web/src/lib/catalog-api.ts`, `apps/web/src/lib/checkout-api.ts`, `apps/web/src/lib/admin-api.ts`, `apps/web/src/lib/internal-orders-api.ts`                                                                                              | `node -e "const k='NEXT_PUBLIC_API_BASE_URL';if(!process.env[k]){process.exit(1)}"` and successful API calls to `${NEXT_PUBLIC_API_BASE_URL}/catalog/health` | Web can’t reach API; cart/checkout/admin surfaces fail                                                              | Confirmed by repo                                                                                                        |
| `NEXT_PUBLIC_SITE_URL`                | Web           |                                Required for launch | Public                     | Canonical public origin URL                                     | `apps/web/src/lib/seo.ts`                                                                                                                                                                                                                      | Compare configured value with selected canonical domain and check generated canonical URLs in local pages                                                    | Canonical metadata points wrong host; SEO/returns alignment confusion                                               | Confirmed by repo                                                                                                        |
| `INTERNAL_ORDERS_API_TOKEN`           | Web/API       |                                           Required | Internal secret            | Non-empty token string                                          | `apps/web/src/lib/admin-api.ts`, `apps/web/src/lib/internal-orders-api.ts`, `apps/api/src/internal-orders/internal-orders.service.ts`, `apps/api/src/config.ts`                                                                                | Ensure token exists and `x-internal-orders-token` header succeeds against `/internal/orders` in smoke test                                                   | Admin/internal pages show unauthorized even with web auth                                                           | Confirmed by repo                                                                                                        |
| `RESEND_API_KEY`                      | API           |                                           Required | Secret                     | Resend key beginning `re_`                                      | `apps/api/src/order-emails/order-email.service.ts`, `apps/api/src/config.ts`                                                                                                                                                                   | Run the redacted env validator, then send only to a controlled test inbox                                                                                    | Customer transactional email remains failed/retryable; payment truth is unchanged                                   | Confirmed by repo                                                                                                        |
| `EMAIL_FROM`                          | API           |                                           Required | Internal config            | Resend-verified sender name/address                             | `apps/api/src/order-emails/order-email.service.ts`, `apps/api/src/config.ts`                                                                                                                                                                   | Confirm its domain is verified in Resend without printing the key                                                                                            | Resend rejects customer transactional email                                                                         | Confirmed by repo                                                                                                        |
| `ORDER_EMAIL_REPLY_TO`                | API           |                                           Optional | Internal config            | Customer support email                                          | `apps/api/src/order-emails/order-email.service.ts`, `apps/api/src/config.ts`                                                                                                                                                                   | Confirm replies reach the approved support inbox                                                                                                             | Defaults to `info@tigerpingpong.com`                                                                                | Confirmed by repo                                                                                                        |
| `ORDER_NOTIFICATION_EMAIL`            | API           |                                           Required | Sensitive config           | Staff notification email                                        | `apps/api/src/order-emails/order-email.service.ts`, `apps/api/src/config.ts`                                                                                                                                                                   | Place a controlled paid test order and confirm exactly one staff alert                                                                                       | Staff can miss new paid orders                                                                                      | Confirmed by repo                                                                                                        |
| `INTERNAL_ORDERS_BASIC_AUTH_USER`     | Web           |                                           Required | Internal secret            | Non-empty username                                              | `apps/web/src/middleware.ts`                                                                                                                                                                                                                   | Compare `process.env` presence and 401 behavior without/with auth                                                                                            | `/admin` or `/internal/*` becomes open or permanently locked if mis-set                                             | Confirmed by repo                                                                                                        |
| `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD` | Web           |                                           Required | Internal secret            | Non-empty password                                              | `apps/web/src/middleware.ts`                                                                                                                                                                                                                   | Compare `process.env` presence and 401/200 auth test                                                                                                         | Same as above                                                                                                       | Confirmed by repo                                                                                                        |
| `NEXT_PUBLIC_API_URL`                 | Web           |                              Not required (legacy) | Public                     | URL                                                             | Not used in active web code                                                                                                                                                                                                                    | Confirmed unused in active web runtime references                                                                                                            | Misconfigured values in deployment UI only cause operator confusion; can be safely removed from deployment template | Needs verification                                                                                                       |
| `DATABASE_URL`                        | API           |                                           Required | Secret                     | Postgres DSN                                                    | `packages/db/src/index.ts`, `apps/api/src/config.ts`, `apps/api/src/checkout/checkout.service.ts`, `apps/api/src/internal-orders/internal-orders.service.ts`, `apps/api/src/catalog/catalog.service.ts`, `apps/api/src/admin/admin.service.ts` | `pnpm db:validate` with a safe validation DB URL and `curl` smoke against catalog/checkout endpoints                                                         | API fails startup/operations/checkout, DB writes fail                                                               | Confirmed by repo                                                                                                        |
| `DIRECT_URL`                          | API/DB        | Needs verification (not used in current repo code) | Secret/URL                 | Postgres DSN                                                    | Not referenced in active code or scripts                                                                                                                                                                                                       | Confirm if deployment policy requires separate direct URL via infra policy                                                                                   | Unclear operationally if missing                                                                                    | Needs verification                                                                                                       |
| `SUPABASE_URL`                        | API/DB        |                Optional / depends on provider mode | Secret                     | URL                                                             | `packages/db/src/index.ts`                                                                                                                                                                                                                     | Check env exists; verify `db:generate` / `db:validate` pass                                                                                                  | Missing value can remove auth fallback/connection features                                                          | Confirmed by repo                                                                                                        |
| `SUPABASE_SERVICE_ROLE_KEY`           | API/DB        |                Optional / depends on provider mode | Secret                     | Secret token                                                    | `packages/db/src/index.ts`                                                                                                                                                                                                                     | Check env exists; confirm role-scoped features requiring service role work in QA                                                                             | Missing value can reduce auth/role capabilities                                                                     | Confirmed by repo                                                                                                        |
| `CORS_ORIGIN`                         | API           |                 Required for launch-domain traffic | Public                     | Comma-separated origins or single origin                        | `apps/api/src/config.ts`, `apps/api/src/main.ts`                                                                                                                                                                                               | `curl -sSI`/preflight `OPTIONS` from web origin to API                                                                                                       | Browser requests blocked on cross-origin calls                                                                      | Confirmed by repo                                                                                                        |
| `PORT`                                | API           |                  Required (runtime default exists) | Operational                | Integer string                                                  | `apps/api/src/config.ts`, `apps/api/src/main.ts`                                                                                                                                                                                               | Verify Render service config points to expected port if non-default                                                                                          | API may not bind expected port, deployment health checks fail                                                       | Confirmed by repo                                                                                                        |
| `APP_ENV`                             | API           |                                           Optional | Internal                   | `local                                                          | staging                                                                                                                                                                                                                                        | production` style string                                                                                                                                     | `apps/api/src/config.ts`                                                                                            | Confirm env map matches intended mode in validation notes                                                                | Mis-mode may confuse operational dashboards and mode-dependent checks        | Confirmed by repo                                      |
| `STRIPE_SECRET_KEY`                   | API           |                                           Required | Secret                     | `sk_live_...` or `sk_test_...`                                  | `apps/api/src/config.ts`, `apps/api/src/checkout/checkout.service.ts`, `apps/api/src/admin/admin.service.ts`                                                                                                                                   | Attempt checkout session creation in smoke                                                                                                                   | Checkout cannot be created; payment flow blocked                                                                    | Confirmed by repo                                                                                                        |
| `STRIPE_WEBHOOK_SECRET`               | API           |                                           Required | Secret                     | `whsec_...`                                                     | `apps/api/src/config.ts`, `apps/api/src/webhooks/stripe-webhook.service.ts`                                                                                                                                                                    | Trigger a known-safe webhook signature test and validate response                                                                                            | Webhook endpoint rejects all deliveries                                                                             | Confirmed by repo                                                                                                        |
| `STRIPE_EXPECTED_LIVEMODE`            | API           |                      Optional (highly recommended) | Internal config            | `true                                                           | false                                                                                                                                                                                                                                          | 1                                                                                                                                                            | 0`                                                                                                                  | `apps/api/src/config.ts`, `apps/api/src/webhooks/stripe-webhook.service.ts`                                              | Compare with Stripe environment and webhook payload `event.livemode` in logs | Wrong mismatch sends events to manual-review status    | Confirmed by repo |
| `STRIPE_TAX_ENABLED`                  | API           |                                           Optional | Internal boolean           | `true                                                           | false                                                                                                                                                                                                                                          | 1                                                                                                                                                            | 0`                                                                                                                  | `apps/api/src/config.ts`, `apps/api/src/checkout/checkout.service.ts`, `apps/api/src/webhooks/stripe-webhook.service.ts` | Confirm tax behavior expected vs test transaction totals                     | Checkout totals/reconciliation differences if mismatch | Confirmed by repo |
| `CHECKOUT_SUCCESS_URL`                | API           |                                           Required | Internal config for Stripe | `https://.../checkout/success?session_id={CHECKOUT_SESSION_ID}` | `apps/api/src/config.ts`, `apps/api/src/checkout/checkout.service.ts`                                                                                                                                                                          | Open a sample checkout session in staging-like mode and inspect URL target/placeholder                                                                       | Customers return to wrong route or without session id; checkout status can be lost                                  | Confirmed by repo                                                                                                        |
| `CHECKOUT_CANCEL_URL`                 | API           |                                           Required | Internal config for Stripe | `https://.../checkout/cancel`                                   | `apps/api/src/config.ts`, `apps/api/src/checkout/checkout.service.ts`                                                                                                                                                                          | Cancel a checkout attempt and inspect redirect target                                                                                                        | Customer returns to wrong page after cancel                                                                         | Confirmed by repo                                                                                                        |
| `CLOUDINARY_CLOUD_NAME`               | Web/API       |               Required for media fallback behavior | Public/operational         | Cloudinary cloud short name                                     | `apps/web/src/lib/product-media.ts`, `apps/api/src/admin/admin.service.ts`                                                                                                                                                                     | Confirm image URLs resolve and media page no blank sources                                                                                                   | Media URLs malformed or fallback broken                                                                             | Confirmed by repo                                                                                                        |
| `CLOUDINARY_API_KEY`                  | Media tooling |          Optional for launch (operational scripts) | Secret                     | API key                                                         | `scripts/upload-product-media-to-cloudinary.mjs`, `scripts/media/upload_tpp_cloudinary_approved.mjs`                                                                                                                                           | Only required when running media upload scripts; verify via script dry-run output summary                                                                    | Media upload scripts cannot run/upload                                                                              | Confirmed by launch docs                                                                                                 |
| `CLOUDINARY_API_SECRET`               | Media tooling |          Optional for launch (operational scripts) | Secret                     | API secret                                                      | `scripts/upload-product-media-to-cloudinary.mjs`, `scripts/media/upload_tpp_cloudinary_approved.mjs`                                                                                                                                           | Same as above                                                                                                                                                | Same as above                                                                                                       | Confirmed by launch docs                                                                                                 |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`   | Web           |                                           Optional | Public                     | Cloudinary cloud short name                                     | `apps/web/src/lib/product-media.ts`                                                                                                                                                                                                            | Confirm optional fallback works by loading product image URLs                                                                                                | None if unset; falls back to `CLOUDINARY_CLOUD_NAME`                                                                | Confirmed by repo                                                                                                        |

## 4) Required web app env vars

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `INTERNAL_ORDERS_API_TOKEN`
- `INTERNAL_ORDERS_BASIC_AUTH_USER`
- `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD`

## 5) Required API env vars

- `DATABASE_URL`
- `CORS_ORIGIN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CHECKOUT_SUCCESS_URL`
- `CHECKOUT_CANCEL_URL`
- `INTERNAL_ORDERS_API_TOKEN`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `ORDER_NOTIFICATION_EMAIL`

## 6) Database / Prisma env vars

- `DATABASE_URL` (required runtime DB connection for all non-import code paths)
- `SUPABASE_URL` (optional, used when available)
- `SUPABASE_SERVICE_ROLE_KEY` (optional, used when available)
- `DIRECT_URL` (currently not required by repository code; keep only if deployment policy needs a split write/read topology)

## 7) Stripe env vars and dashboard-side requirements

- Required on API service:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Strongly recommended parity variables:
  - `STRIPE_EXPECTED_LIVEMODE`
  - `STRIPE_TAX_ENABLED`
- Dashboard checks for operators:
  - Webhook endpoint is set to `https://tigerpingpong-platform.onrender.com/webhooks/stripe` and active.
  - Product mode and key mode (`test` vs `live`) match intended launch checkout mode.
  - Checkout success/cancel URLs match selected public web domain and placeholder requirements.

## 8) Cloudinary env vars and asset URL expectations

- Runtime media rendering requires `CLOUDINARY_CLOUD_NAME` (or public equivalent `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`) for delivery URL construction when secure URLs are not directly stored.
- `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are only required by media upload scripts and should not be used as web/API runtime requirements.
- Render/staging deployment should not expose cloudinary API secrets to the browser.

## 9) Public URL / base URL / CORS / checkout return URL alignment

- `NEXT_PUBLIC_API_BASE_URL` must point at API service URL used by checkout/customer APIs.
- `CORS_ORIGIN` must include all selected final web origins and any temporary rollback origins.
- `CHECKOUT_SUCCESS_URL` must include `?session_id={CHECKOUT_SESSION_ID}` and point to the selected production public success route.
- `CHECKOUT_CANCEL_URL` must point to the selected production cancel route.
- `NEXT_PUBLIC_SITE_URL` must match canonical launch domain selection policy (for metadata/canonical URLs).
- `NEXT_PUBLIC_API_URL` is legacy and should not be treated as an active production requirement.

## 10) Internal order / admin access env vars

- `INTERNAL_ORDERS_API_TOKEN`
  - API and web admin/internal clients must use same token.
  - Missing or mismatch: 401 for internal API calls.
- `INTERNAL_ORDERS_BASIC_AUTH_USER`
  - `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD`
  - Required by Next.js middleware protecting `/admin` and `/internal/*` paths.

## 11) Optional env vars

- `APP_ENV`
- `STRIPE_EXPECTED_LIVEMODE`
- `STRIPE_TAX_ENABLED`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ORDER_EMAIL_REPLY_TO`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `DIRECT_URL` (policy-dependent)

## 12) Env vars that must never be committed

- `DATABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INTERNAL_ORDERS_API_TOKEN`
- `INTERNAL_ORDERS_BASIC_AUTH_USER`
- `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `ORDER_NOTIFICATION_EMAIL`
- Any `.env` exports or secrets in scripts

## 13) Operator checklist for setting / verifying env vars

1. Confirm owner for each surface: render web, render api, stripe dashboard, supabase, cloudinary.
2. Set web/public-domain variables on `tigerpingpong-web`:
   - `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `INTERNAL_ORDERS_API_TOKEN`, `INTERNAL_ORDERS_BASIC_AUTH_*`.
3. Set API variables on `tigerpingpong-platform`:
   - `DATABASE_URL`, `CORS_ORIGIN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CHECKOUT_SUCCESS_URL`, `CHECKOUT_CANCEL_URL`, `INTERNAL_ORDERS_API_TOKEN`, `RESEND_API_KEY`, `EMAIL_FROM`, `ORDER_EMAIL_REPLY_TO`, and `ORDER_NOTIFICATION_EMAIL`.
4. Confirm Supabase + Cloudinary settings are loaded in the correct environment.
5. Run a pre-cutover smoke from final domain (home, category, product, cart, checkout create, paid checkout webhook, internal/orders visibility).
6. Confirm rollback compatibility: keep Render origin in `CORS_ORIGIN` and old web origin reachable until cutover passes.

## 14) Safe validation commands (no secret values)

- Confirm file-level contract readiness:
  - `pnpm exec prettier --check docs/launch/production-env-contract.md docs/agent/current-task.md docs/agent/worklog.md docs/agent/lane-board.md docs/agent/parking-lot.md`
- Confirm command set is wired before runtime checks:
  - `node -e "['NEXT_PUBLIC_API_BASE_URL','NEXT_PUBLIC_SITE_URL','CORS_ORIGIN','CHECKOUT_SUCCESS_URL','CHECKOUT_CANCEL_URL'].forEach(k=>{if(!process.env[k]) console.log(k+': unset')})"`
- Confirm critical API routes resolve (without exposing values):
  - `curl -sS "https://tigerpingpong-platform.onrender.com/catalog/health"`
  - `curl -sS "https://tigerpingpong-platform.onrender.com/health"`
- Confirm web can call API:
  - `curl -sS "https://tigerpingpong-web.onrender.com/"`
- Confirm CORS behavior from final web origin:
  - `curl -sSI -H "Origin: https://<final-domain>" -H "Access-Control-Request-Method: POST" -X OPTIONS "https://tigerpingpong-platform.onrender.com/checkout/sessions"`
- Confirm admin/auth behavior by role-based access only:
  - `curl -sI -u "<user>:<password>" "https://tigerpingpong-web.onrender.com/admin"`
  - `curl -sI -H "x-internal-orders-token: <internal-token>" "https://tigerpingpong-platform.onrender.com/internal/orders"`

## 15) Manual confirmation checklist

- What is final canonical domain (`tigerpingpong.ca`, `www`, `.com`)?
- Is launch intended in test/live Stripe mode?
- Which webhook endpoint(s) in Stripe should remain active during and immediately after cutover?
- Do we need to keep `https://tigerpingpong-web.onrender.com` in `CORS_ORIGIN` for rollback?
- Is `DIRECT_URL` required by host policy, and if yes, what value is used at runtime?

## 16) Open questions / blockers

- Final public domain and alias/wildcard policy is still pending outside this repo.
- `DIRECT_URL` usage in this service set is unproven; confirm if infra policy requires it.
- `NEXT_PUBLIC_API_URL` remains in launch docs and `.env.example`, but active code no longer reads it.
- Cloudinary runtime/ops split (render-time cloud name vs upload-script credentials) should be confirmed per operations model.

## 17) Recommended next executable task

Recommended next task: **Create read-only production env validation script**.

Rationale: with the variable contract in place, the highest value next step is a one-command proof script that checks required presence, URL shape, and endpoint reachability without printing secrets.
