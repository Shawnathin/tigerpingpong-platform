# 041 Custom Domain Cutover Runbook V1

Date: 2026-06-12

## Status

Preparation only.

- Do not perform the domain cutover in this task.
- Do not change DNS in this task.
- Do not add forced canonical redirects in this task.
- Do not move the Stripe webhook endpoint in this task.
- Do not change checkout payment truth in this task.
- Do not change cart behavior in this task.
- Do not change Stripe webhook behavior in this task.
- Do not change Supabase/order logic in this task.
- Do not change internal orders in this task.
- Do not change admin auth in this task.
- Do not expose admin publicly in this task.
- Do not create migrations in this task.

## Pre-Cutover Checks

- [ ] Current Render web app loads: `https://tigerpingpong-web.onrender.com`
- [ ] Current Render API health works: `https://tigerpingpong-platform.onrender.com/health`
- [ ] Current Render catalog health works: `https://tigerpingpong-platform.onrender.com/catalog/health`
- [ ] Current Render admin API endpoints reject missing/wrong token.
- [ ] Current Render web `/admin` requires Basic Auth.
- [ ] Current Render web `/internal/orders` requires Basic Auth.
- [ ] Public routes do not require auth:
  - `/`
  - `/catalog`
  - `/catalog/products/:slug`
  - `/cart`
  - `/checkout/success`
  - `/checkout/cancel`
  - `/shipping`
  - `/contact`
- [ ] Cart checkout works on Render web URL.
- [ ] Stripe Checkout opens.
- [ ] Success page confirms backend-paid status after webhook processing.
- [ ] Success page does not treat redirect as payment truth.
- [ ] Webhook delivers to platform URL: `https://tigerpingpong-platform.onrender.com/webhooks/stripe`
- [ ] Supabase order row becomes paid after the Stripe webhook.
- [ ] Internal orders work and remain protected.
- [ ] Admin UI works and remains protected.
- [ ] Public storefront navigation has no admin/internal links.

## Environment Checks

API/platform service:

- [ ] `DATABASE_URL` is present.
- [ ] `SUPABASE_URL` is present.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is present.
- [ ] `CORS_ORIGIN` includes the currently active Render web origin.
- [ ] `CORS_ORIGIN` is ready to include the selected custom-domain origins.
- [ ] `APP_ENV` matches the intended deployment environment.
- [ ] `STRIPE_SECRET_KEY` is present and matches intended test/live mode.
- [ ] `STRIPE_WEBHOOK_SECRET` matches the current Stripe webhook endpoint.
- [ ] `STRIPE_EXPECTED_LIVEMODE` matches the Stripe mode expectation if set.
- [ ] `CHECKOUT_SUCCESS_URL` points to the intended web success route and includes `?session_id={CHECKOUT_SESSION_ID}`.
- [ ] `CHECKOUT_CANCEL_URL` points to the intended web cancel route.
- [ ] `INTERNAL_ORDERS_API_TOKEN` is present.

Web app service:

- [ ] `NEXT_PUBLIC_API_BASE_URL` points to the platform/API service.
- [ ] `INTERNAL_ORDERS_API_TOKEN` matches the API/platform service.
- [ ] `INTERNAL_ORDERS_BASIC_AUTH_USER` is present.
- [ ] `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD` is present.

## DNS Preparation Checklist

- [ ] Decide canonical public domain.
- [ ] Decide whether `.ca`, `.com`, `www`, and apex domains load directly or redirect.
- [ ] Add selected custom domains to the Render web service, not the API service.
- [ ] Remove legacy redirects from `.com` to old `.ca` storefront when ready.
- [ ] Configure root/apex records according to DNS provider and Render instructions.
- [ ] Configure `www` records according to DNS provider and Render instructions.
- [ ] Do not change Stripe webhook endpoint during public web cutover.
- [ ] Keep backend/API URL stable.
- [ ] Keep Render web URL available for rollback/testing.
- [ ] Confirm SSL certificates are active for each mapped custom domain before launch traffic is sent there.

## Cutover Steps

- [ ] Confirm all pre-cutover checks passed.
- [ ] Confirm all environment checks passed.
- [ ] Apply DNS/domain mapping changes for the selected public web domain or domains.
- [ ] Update API `CORS_ORIGIN` to allow the selected custom web origins.
- [ ] Update API `CHECKOUT_SUCCESS_URL` and `CHECKOUT_CANCEL_URL` only when launch wants Stripe to return customers to the selected public domain.
- [ ] Keep `NEXT_PUBLIC_API_BASE_URL` pointed at the API/platform service.
- [ ] Keep the Stripe webhook endpoint pointed at the platform service.
- [ ] Do not deploy unrelated code during DNS propagation.

## Post-Cutover Checks

- [ ] `tigerpingpong.ca` loads new storefront.
- [ ] `www.tigerpingpong.ca` loads new storefront or redirects correctly.
- [ ] `tigerpingpong.com` loads new storefront or redirects correctly.
- [ ] `www.tigerpingpong.com` loads new storefront or redirects correctly.
- [ ] Catalog loads.
- [ ] Product page loads.
- [ ] Product images load.
- [ ] Cart works.
- [ ] Stripe Checkout opens.
- [ ] Success page returns to expected public domain.
- [ ] Backend-confirmed Paid appears after test payment.
- [ ] Stripe webhook still delivers `2xx` or `201`.
- [ ] Supabase order row becomes paid.
- [ ] Internal orders remain protected.
- [ ] Admin remains protected.
- [ ] No public admin/internal links appear.
- [ ] Render web URL still loads for rollback/testing.
- [ ] API health still returns `200`.
- [ ] Catalog health still returns `200`.

## Rollback Plan

- [ ] Document the exact failure before rollback.
- [ ] Revert DNS records or Render domain mapping if cutover fails.
- [ ] Keep Render web app URL available.
- [ ] Keep backend/API URL stable.
- [ ] Do not change database state.
- [ ] Do not change webhook code.
- [ ] Do not change checkout code.
- [ ] Revert `CHECKOUT_SUCCESS_URL` and `CHECKOUT_CANCEL_URL` only if those env vars were changed during cutover.
- [ ] Revert `CORS_ORIGIN` only if custom-domain CORS changes caused the failure.
- [ ] Re-test Render web URL checkout path after rollback.

## Cutover Decision Notes

- Canonical public domain is intentionally undecided in this task.
- Stripe webhook remains on the platform service unless intentionally changed later.
- Checkout success/cancel URLs are explicit API env vars, not automatic per request origin.
- If multiple public domains are supported without redirects, choose which one Stripe returns customers to.
- If canonical redirects are added later, verify they do not break Stripe return URLs, public catalog routes, admin auth, or internal order auth.

