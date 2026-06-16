# PR 085: Launch Readiness Audit and Cutover Checklist

Date: 2026-06-16
Branch / PR: `codex/pr-085-launch-readiness-cutover-checklist`
Status: Draft PR checklist

## Executive Summary

### Current launch posture

TigerPingPong is close to custom-domain launch. The storefront, category and
product pages, cart, Stripe Checkout handoff, backend-confirmed success page,
webhook-owned paid order transition, resources/articles, SEO basics, Aqua
catalog publication, variant-priced accessory options, and deployed catalog
import tooling are substantially in place.

The current launch posture is strong on checkout architecture and public page
coverage, but not ready for domain cutover until tax, environment, and final
smoke-test gates are complete.

### Biggest remaining blocker

Stripe Tax / Canadian province tax setup and retesting remains the largest
launch blocker.

PR 076 found shipping and Stripe Checkout totals passing for the tested flows,
but no tax line appeared in Stripe Checkout. PR 077 documented that the app does
not currently calculate Canadian province tax itself and that Stripe Tax setup,
implementation readiness, and province-specific retesting need to be completed
before launch.

### Recommended next actions

1. Complete Stripe Tax setup and province testing from the office/security
   sensitive environment.
2. Verify Render web/API environment variables before any domain changes.
3. Run a final launch smoke test on Render.
4. Decide whether PR #49 shipped-order admin work is required before launch or
   can remain parked while operations use manual tracking emails.
5. Cut over `tigerpingpong.ca` only after tax, env, DNS, SSL, and smoke-test
   gates pass.

## Completed Launch Foundation

- [x] Storefront routes exist for the main public shopping path.
- [x] Homepage quick sweep completed.
- [x] Category page polish completed.
- [x] Table product page polish completed.
- [x] Accessory product page polish completed.
- [x] Product/category pages support launch shopping paths.
- [x] Cart flow exists and sends checkout requests through the backend.
- [x] Backend checkout recalculates catalog prices and shipping from trusted
      data.
- [x] Hosted Stripe Checkout is the payment collection surface.
- [x] Stripe redirect is not payment truth.
- [x] Client code does not mark orders paid.
- [x] Stripe webhook-confirmed backend order status remains payment truth.
- [x] Success page reads backend-confirmed checkout/order status.
- [x] Resources landing page exists.
- [x] Resource article migration completed.
- [x] SEO basics added: metadata, robots.txt, sitemap.xml, canonicals, and OG
      basics.
- [x] Aqua product modeled, imported, live, and package options working after
      frontend redeploy.
- [x] Variant-priced accessory option support completed.
- [x] Deployed catalog import tooling and runbook exist.
- [x] Supabase password was rotated and Render API restored after credential
      update.

## Launch Blockers

- [ ] Stripe Tax / Canadian province tax setup is completed in Stripe.
- [ ] Tax behavior is retested for Canadian province scenarios.
- [ ] Checkout totals with tax are verified against the payment-truth model.
- [ ] Required Render API env vars are verified after the Supabase password
      rotation.
- [ ] Required Render web env vars are verified before cutover.
- [ ] Domain/canonical env vars are verified before cutover, especially
      `NEXT_PUBLIC_SITE_URL`.
- [ ] `NEXT_PUBLIC_API_BASE_URL` still points to the stable API/platform
      service.
- [ ] Stripe env vars are present and match the intended test/live mode.
- [ ] Stripe webhook endpoint remains:
      `https://tigerpingpong-platform.onrender.com/webhooks/stripe`
- [ ] Final launch smoke test passes immediately before DNS/domain cutover.

## Important But Non-Blocking Items

- [ ] Vice Paddle media alignment / final image sweep.
- [ ] Aqua media quality replacement if better final media is available.
- [ ] Final mobile polish pass.
- [ ] PR #49 minimal shipped-order record, if not required for day-one
      operations.
- [ ] Automated shipment emails remain deferred for V1.
- [ ] Legacy redirect map and implementation, if not already approved and
      implemented.
- [ ] Search Console and Bing submissions after domain cutover.

## Stripe Tax Office-Only Checklist

Do this from the secure office/security-sensitive environment because Stripe and
related production settings are sensitive.

- [ ] Log into Stripe from the office/security-sensitive environment.
- [ ] Confirm the correct Stripe account and mode for the deployed Render
      services.
- [ ] Confirm Stripe Tax is enabled and configured.
- [ ] Confirm Canadian tax registrations/settings with the business/accounting
      owner.
- [ ] Confirm product and shipping tax behavior is appropriate for the launch
      catalog.
- [ ] Confirm Checkout collects the customer shipping address needed for tax.
- [ ] Test a BC customer address scenario.
- [ ] Test an AB customer address scenario.
- [ ] Test an ON customer address scenario.
- [ ] Test a QC customer address scenario.
- [ ] Test an HST province scenario.
- [ ] Retest checkout subtotals, shipping, tax, and total due.
- [ ] Confirm webhook/payment-truth behavior still works with tax-inclusive
      Stripe totals before production launch.
- [ ] Document the result, tested provinces, Stripe mode, and any remaining tax
      caveats in launch notes.

## Render / Environment Checklist

Web service:

- [ ] Render web service is deployed from latest `main`.
- [ ] `NEXT_PUBLIC_API_BASE_URL` points to
      `https://tigerpingpong-platform.onrender.com`.
- [ ] `NEXT_PUBLIC_SITE_URL` is set to the final canonical domain when ready:
      `https://tigerpingpong.ca`.
- [ ] Basic Auth env vars for `/admin` and `/internal/*` remain present.
- [ ] Public storefront navigation does not expose `/admin` or
      `/internal/orders`.

API/platform service:

- [ ] Render API/platform service is deployed from latest `main`.
- [ ] `DATABASE_URL` is valid after the Supabase password rotation.
- [ ] Stripe env vars are present.
- [ ] Stripe mode expectation is correct for the intended launch test/live
      state.
- [ ] `STRIPE_WEBHOOK_SECRET` matches the current webhook endpoint.
- [ ] `CHECKOUT_SUCCESS_URL` points to the intended success route and includes
      the Stripe checkout session id placeholder.
- [ ] `CHECKOUT_CANCEL_URL` points to the intended cancel route.
- [ ] `CORS_ORIGIN` allows the current Render web origin and is ready for the
      final custom-domain origins.
- [ ] Internal/admin API token env vars remain present.
- [ ] Webhook endpoint remains stable:
      `https://tigerpingpong-platform.onrender.com/webhooks/stripe`

## Domain / DNS Cutover Checklist

- [ ] Confirm canonical domain: `tigerpingpong.ca`.
- [ ] Confirm `www.tigerpingpong.ca` behavior: redirect to apex or serve the
      same app intentionally.
- [ ] Confirm `.com` behavior/redirect decision.
- [ ] Confirm `www.tigerpingpong.com` behavior/redirect decision.
- [ ] Add selected public custom domains to the Render web service, not the API
      service.
- [ ] Update DNS only when tax, env, smoke-test, and domain decisions are ready.
- [ ] Verify SSL certificates are active before sending launch traffic.
- [ ] Verify the web app loads on the final domain.
- [ ] Verify the API/webhook endpoint remains on the platform service.
- [ ] Verify Stripe success/cancel returns use the intended public domain.
- [ ] Verify canonicals do not point to Render after the final
      `NEXT_PUBLIC_SITE_URL` update.
- [ ] Keep the Render web URL available for rollback/testing.

## SEO / Search Console Checklist

- [ ] `robots.txt` is reachable on the final domain.
- [ ] `sitemap.xml` is reachable on the final domain.
- [ ] `sitemap.xml` references the final canonical domain.
- [ ] Submit sitemap to Google Search Console after cutover.
- [ ] Submit sitemap to Bing Webmaster Tools if desired.
- [ ] Inspect `/`.
- [ ] Inspect `/tables/`.
- [ ] Inspect `/accessories/`.
- [ ] Inspect `/resources/`.
- [ ] Inspect `/catalog/products/tiger-expo-outdoor-table`.
- [ ] Inspect `/catalog/products/tiger-aqua-outdoor-indoor-paddle`.
- [ ] Keep legacy redirect map as follow-up if redirects are not implemented
      before launch.

## Final Smoke Test Checklist

- [ ] Homepage loads and links to current launch shopping paths.
- [ ] Table categories load.
- [ ] Accessory categories load.
- [ ] Resources landing page loads.
- [ ] Resource articles load.
- [ ] Representative table PDP loads.
- [ ] Representative accessory PDP loads.
- [ ] Aqua PDP loads with package options.
- [ ] Required options block add-to-cart until selected where applicable.
- [ ] Cart add, quantity, remove, empty, and persistence behaviors work.
- [ ] Checkout opens Stripe Checkout.
- [ ] Success page reads backend status.
- [ ] Cancel page does not mutate payment/order state.
- [ ] Mobile 390px layout is usable for homepage, category, PDP, cart, and
      checkout handoff.
- [ ] Header/footer links are correct and have no dead placeholders.
- [ ] Public header/footer do not link to admin/internal routes.
- [ ] `/admin` remains protected.
- [ ] `/internal/orders` remains protected.
- [ ] Protected API routes reject missing/wrong internal token.

## Order / Payment Test Checklist

- [ ] Accessory order under `$100 CAD` gets `$15 CAD` shipping.
- [ ] Accessory order exactly `$100 CAD` gets `$15 CAD` shipping.
- [ ] Accessory order over `$100 CAD` gets free shipping.
- [ ] Table order gets free shipping.
- [ ] Stripe Checkout opens from cart.
- [ ] Canada-only shipping collection remains enforced.
- [ ] Tax is verified after office Stripe Tax setup.
- [ ] Webhook confirms payment truth.
- [ ] Success page uses backend status and does not trust redirect alone.
- [ ] Cancel path leaves order/payment state unconfirmed.
- [ ] Do not use a real paid order unless Shawn intentionally approves it.

## Admin / Operations Checklist

- [x] Current admin media page exists.
- [x] Current admin shell is protected.
- [ ] Confirm admin protection again immediately before cutover.
- [ ] PR #49 shipment admin work remains parked unless explicitly merged.
- [ ] Decide whether to merge PR #49 before launch or operate manually first.
- [ ] If PR #49 stays parked, staff can manually send shipment/tracking emails
      for V1.
- [ ] If PR #49 is merged before launch, smoke test the protected shipped-order
      record flow without changing payment truth.
- [ ] Confirm staff know where paid orders are reviewed for fulfillment.

## Catalog / Data Checklist

- [x] Aqua is live.
- [x] Aqua package options work after frontend redeploy.
- [ ] Confirm there are no duplicate Aqua package products visible to shoppers.
- [ ] Confirm Aqua package prices are correct.
- [ ] Confirm known product media issues are accepted or fixed:
      - Vice Paddle image alignment / media quality.
      - Aqua media quality.
      - Any final mobile image/crop issues.
- [x] Catalog import tooling exists.
- [x] Deployed catalog import runbook exists.
- [ ] Do not run imports casually.
- [ ] Keep import validator passing before any future deployed import.
- [ ] Do not remove fallback media until Cloudinary media is verified through
      deployed API/UI.

## Rollback Plan

- [ ] Use Render rollback to return the web or API service to a prior deploy if
      a launch deploy breaks public behavior.
- [ ] Revert a problematic PR if the failure is code/documented behavior rather
      than an environment issue.
- [ ] For bad catalog data from a deployed import, follow the deployed catalog
      import runbook:
      - restore affected catalog rows from pre-import exports or snapshot;
      - prefer corrected CSV plus guarded deployed import when time allows;
      - do not manually delete production rows without an approved rollback
        plan.
- [ ] For DNS failure, revert DNS records or Render custom-domain mapping and
      keep the Render web URL available for traffic/testing.
- [ ] For Stripe webhook/env problems, restore the prior known-good webhook
      secret and environment values, then verify webhook delivery and backend
      order state.
- [ ] Do not change checkout/payment/webhook/order truth during rollback unless
      that exact code path caused the incident and the rollback is approved.
- [ ] Record the failure, rollback action, operator, time, and verification
      result in launch notes.

## Recommended Next Sequence

1. Stripe Tax setup and retest from the office/security-sensitive environment.
2. Launch readiness smoke test on current Render URLs.
3. Decide PR #49 admin shipment timing.
4. Domain/DNS cutover for `tigerpingpong.ca`.
5. Search Console and sitemap submission after final domain verification.
6. Final media/mobile sweep after launch, or just before launch if time allows.

## Explicit Non-Changes In This PR

- No app code changed.
- No checkout/payment/webhook/order-truth changes.
- No tax implementation changes.
- No database migrations.
- No imports run.
- No product/media/catalog data changed.
- No products published or unpublished.
- PR #49 was not altered.
