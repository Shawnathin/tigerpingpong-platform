# PR 077: Canadian Tax Launch Readiness Plan

Date: 2026-06-16
Branch: `codex/pr-077-canadian-tax-launch-readiness-plan`
Status: Draft PR planning report

## Summary

PR 076 confirmed that deployed shipping, cart totals, Stripe Checkout startup,
required table colour selection, and webhook-based payment truth passed the
tested flows. Tax remains the launch blocker.

The current app does not calculate Canadian province tax itself and does not
enable Stripe Tax in the Checkout Session payload. Stripe Sandbox checkout pages
observed in PR 076 showed product subtotal, shipping, and total due, but no tax
line. Based on the current code, Stripe is not being asked to calculate tax for
Tiger Ping Pong checkout sessions.

The recommended launch path is Stripe Tax, not app-managed province tax, but it
needs both Stripe Dashboard/Sandbox configuration and a careful app change. A
one-line `automatic_tax.enabled = true` change is not sufficient because the
current webhook verifies that Stripe `amount_total` exactly matches the
pre-tax order total stored by the app. If Stripe adds tax at Checkout, paid
orders would likely fail the existing total-match validation until the order and
webhook logic explicitly account for tax.

No checkout, payment, webhook, database migration, product media, admin,
shipment, Aqua, variant pricing, or SEO code was changed in this PR.

## Sources Reviewed

- `docs/planning/076-checkout-shipping-tax-sanity-audit.md`
- `apps/api/src/checkout/checkout.service.ts`
- `apps/api/src/config.ts`
- `.env.example`
- Stripe Checkout Session create API:
  `https://docs.stripe.com/api/checkout/sessions/create`
- Stripe Tax with Checkout:
  `https://docs.stripe.com/tax/checkout/page`
- Stripe Tax customer location rules:
  `https://docs.stripe.com/tax/customer-locations`
- Stripe Tax testing guidance:
  `https://docs.stripe.com/tax/testing`
- Stripe Tax in Canada:
  `https://docs.stripe.com/tax/supported-countries/canada`
- CRA GST/HST rates:
  `https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate.html`

## Current Tax Behavior

- App-side checkout totals include:
  - product subtotal
  - V1 Canada shipping rule
  - total = subtotal + shipping
- App-side checkout totals do not include:
  - province tax
  - Stripe `total_details.amount_tax`
  - tax jurisdiction detail
  - app-managed GST/HST/PST/QST fields
- Checkout Session creation currently sends:
  - `mode: "payment"`
  - line items using inline `price_data`
  - `shipping_address_collection.allowed_countries: ["CA"]`
  - one fixed-amount shipping option
  - success/cancel URLs from env
  - order metadata and payment-intent metadata
  - optional `customer_email`
- Checkout Session creation currently does not send:
  - `automatic_tax: { enabled: true }`
  - manual `tax_rates`
  - product `tax_code`
  - explicit `tax_behavior`
  - `billing_address_collection`
  - `customer_creation`
  - customer update settings

## Answers To Launch Questions

### 1. Is Stripe Tax enabled/configured for the Stripe account/environment used by Render?

Not proven from repository access.

The app does not expose Stripe Tax readiness and this investigation did not have
direct access to the Render service settings or Stripe Dashboard. PR 076
indirectly proved that Render has a Stripe test secret key configured because
Sandbox Checkout Sessions were created, but it did not prove that Stripe Tax is
enabled, that sandbox tax settings are complete, or that Canadian tax
registrations exist.

Observed behavior strongly suggests Stripe Tax is either not enabled for these
Checkout Sessions or not configured in a way that causes tax collection, because
PR 076 saw no tax line and the app did not pass `automatic_tax.enabled`.

### 2. Is the app passing the required Stripe Checkout tax settings?

No.

The current Checkout Session payload in
`apps/api/src/checkout/checkout.service.ts` does not set
`automatic_tax.enabled = true`. Stripe's Checkout Tax guide says Checkout tax
calculation requires automatic tax on the session, and Stripe's testing guide
says low-code Checkout integrations should pass `automatic_tax[enabled]=true`
when testing Stripe Tax.

### 3. Is tax calculated by Stripe or by the app?

Currently, neither path is launch-ready.

The app does not calculate Canadian province tax. Stripe Checkout is not being
asked to calculate tax for the session. Therefore the current deployed behavior
appears to be no tax collection in Checkout for the tested Sandbox flows.

### 4. Are Canadian province taxes configured correctly in Stripe Sandbox/Test mode?

Unknown and likely incomplete until proven in Dashboard.

Stripe says sandbox tax settings are separate from live settings and that at
least one sandbox registration must be added to test Stripe Tax. The future fix
PR must verify the Sandbox account has:

- Stripe Tax enabled.
- A head office/origin address reviewed.
- Preset product tax code appropriate for physical sporting goods/ecommerce
  merchandise, or explicit product tax codes passed by the app.
- Preset shipping tax code left as Shipping unless the business/accountant
  decides otherwise.
- Tax behavior set to exclusive for Canadian customer-facing prices unless the
  business intentionally wants tax-inclusive pricing.
- Canadian registrations needed for launch testing and collection. The exact
  legal registrations are a business/accounting decision, but Stripe will only
  collect in jurisdictions with active registrations.

### 5. Does checkout collect enough customer address information for tax calculation?

Probably yes after Stripe Tax is enabled, but it must be retested.

The app already requires a Canadian shipping address by setting
`shipping_address_collection.allowed_countries: ["CA"]`. Stripe's customer
location docs say Canadian tax can be calculated from country plus province, or
country plus postal code, and Checkout uses the shipping address entered during
the session when shipping collection is enabled.

Because the storefront sells physical products shipped in Canada, shipping
address collection is the right customer-location input. The future test must
confirm that Checkout requires province/postal code before payment and uses the
shipping province for tax.

### 6. Are shipping and tax displayed correctly in Stripe Checkout?

Shipping displayed correctly in PR 076. Tax did not display.

PR 076 observed:

- under `$100 CAD`: `$15 CAD` shipping
- over `$100 CAD`: free shipping
- exactly `$100 CAD`: `$15 CAD` shipping
- table order: free shipping
- no tax line in tested Stripe Sandbox summaries

After Stripe Tax is configured and code is updated, Stripe Checkout should show
subtotal, shipping, tax, and total due. The exact tax label and jurisdiction
breakdown should be verified in Stripe Checkout and in the Stripe Dashboard Tax
calculation section after payment.

### 7. What needs to happen before production launch?

Launch should stay blocked until all of the following are complete:

1. Business/accounting confirms the Canadian sales tax obligation and
   jurisdictions Tiger Ping Pong must collect for at launch.
2. Stripe Sandbox tax settings are configured.
3. Stripe live-mode tax settings are configured after Sandbox proof is accepted.
4. App checkout code enables Stripe Tax for Checkout Sessions.
5. App order/webhook/status logic is updated so tax-inclusive Stripe totals do
   not fail payment-truth validation.
6. Internal order review shows the actual charged total and tax amount, or the
   team explicitly accepts where tax will be reviewed in Stripe for V1.
7. Deployed Sandbox checkout is retested by province and paid test sessions are
   reviewed in Stripe Dashboard.
8. Only after Sandbox passes, repeat a production-mode readiness check with live
   Stripe settings before custom-domain launch.

### 8. What needs to be retested after configuration?

Retest all PR 076 money-path scenarios plus province-specific tax scenarios:

- cart subtotal and shipping threshold
- Stripe Checkout displayed subtotal, shipping, tax, and total due
- paid webhook transition to `paid`
- success page backend-confirmed paid state
- internal/admin order review totals
- unpaid/cancelled sessions remain non-paid
- table required colour option still remains separate and visible
- exact `$100.00 CAD` shipping boundary still charges `$15 CAD` shipping before
  tax behavior is applied

## Required Stripe Dashboard Settings

Complete these in Stripe Sandbox/Test mode first:

1. Open Stripe Dashboard in the same account/environment used by Render's
   `STRIPE_SECRET_KEY`.
2. Go to Tax settings and enable/configure Stripe Tax.
3. Review the business head office/origin address.
4. Set the default product tax code for physical goods unless the future app
   change passes explicit product tax codes.
5. Set default tax behavior to exclusive unless business/accounting intentionally
   approves tax-inclusive storefront pricing.
6. Keep the shipping preset tax code as Shipping unless business/accounting
   decides shipping should be treated differently.
7. Add Canadian tax registrations for the jurisdictions the business is
   registered to collect in. Stripe Tax only collects in jurisdictions with
   active registrations.
8. Repeat the same configuration deliberately in live mode only after Sandbox
   testing passes.

Important: this document is an implementation plan, not tax/legal advice. The
registration list and collection obligations need owner/accountant confirmation.

## Required App Code Changes

Do not implement these as drive-by edits. They should be done together in a
future tax implementation PR:

1. Enable Stripe Tax in Checkout Session creation:

   ```ts
   automatic_tax: {
     enabled: true
   }
   ```

2. Decide whether to pass explicit product tax codes in
   `price_data.product_data.tax_code` or rely on the Stripe Dashboard preset.
   For V1, Dashboard preset is simpler if all checkout products share the same
   physical-goods treatment.
3. Decide whether to set `tax_behavior: "exclusive"` in `price_data` or rely on
   the Dashboard default. For V1, explicit `tax_behavior: "exclusive"` may make
   the code's pricing intent clearer.
4. Update order total handling. Current DB order totals are pre-tax, and the
   webhook validates `session.amount_total === order.totalCents`. With Stripe
   Tax enabled, `amount_total` should include tax, so this validation must be
   updated intentionally.
5. Retrieve or trust webhook-provided Checkout Session tax fields carefully:
   - `amount_subtotal`
   - `amount_total`
   - `total_details.amount_tax`
   - `total_details.amount_shipping` if available
   - `shipping_cost.amount_total`
6. Store enough tax/charged-total data for staff review. This likely requires a
   small schema migration because an earlier order-foundation migration removed
   `tax_cents`.
7. Keep payment truth authoritative in the webhook. The success page and client
   cart must not mark orders paid.
8. Add safe tests or QA notes proving that tax-inclusive Stripe totals can pass
   the webhook and that untaxed/no-registration test sessions do not silently
   become launch-approved.

## Required Env Vars

No new env var is obviously required for Stripe Tax if the app always enables
Tax for launch checkout sessions and uses the existing `STRIPE_SECRET_KEY`.

Existing required env vars remain:

- API/platform service:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_EXPECTED_LIVEMODE`
  - `CHECKOUT_SUCCESS_URL`
  - `CHECKOUT_CANCEL_URL`
  - `INTERNAL_ORDERS_API_TOKEN`
- Web service:
  - `NEXT_PUBLIC_API_BASE_URL`
  - `INTERNAL_ORDERS_API_TOKEN`
  - `INTERNAL_ORDERS_BASIC_AUTH_USER`
  - `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD`

Optional future env var if the team wants a guarded rollout:

- `STRIPE_TAX_ENABLED=true`

For launch, a feature flag is probably less useful than making tax required and
failing closed if Stripe Tax is not configured. If a flag is added, avoid
shipping with it accidentally off.

## Province Test Scenarios

Use the same simple checkout item where possible, then repeat at least one
free-shipping order. Do not hardcode tax rates in the app based on this table;
use it as a human QA expectation and confirm against Stripe Dashboard and
current CRA/provincial guidance.

| Province | Why test it | Current common expectation for taxable physical goods | Required proof |
| --- | --- | --- | --- |
| BC | GST + PST province and likely home-region scenario | GST 5% plus BC PST 7%, commonly 12% total | Checkout shows tax after BC shipping address; Stripe Dashboard tax calculation shows BC/GST/PST treatment expected by registration settings |
| Alberta | GST-only province | GST 5% | Checkout shows GST-only behavior for Alberta address |
| Ontario | HST province | HST 13% | Checkout shows Ontario HST behavior |
| Quebec | GST + QST province with non-round combined rate | GST 5% plus QST 9.975%, commonly 14.975% total | Checkout handles Quebec address and displays expected tax total without rounding surprises |
| Nova Scotia | HST province with recent rate change | HST 14% as of April 1, 2025 | Checkout uses 14% HST behavior, not old 15% behavior |

For each province:

1. Start from deployed Render storefront.
2. Add a checkout-eligible accessory under `$100 CAD`.
3. Confirm Stripe Checkout shows `$15 CAD` shipping before tax is applied to the
   final payable amount.
4. Enter a valid shipping address in the target province.
5. Confirm tax appears before payment.
6. Complete payment with Stripe test card.
7. Confirm webhook moves the backend order to `paid`.
8. Confirm success page shows backend-confirmed paid state.
9. Confirm Stripe Dashboard payment details include a Tax calculation section.
10. Record whether tax was also applied to shipping, based on Stripe's tax
    calculation and the configured shipping tax code.

Repeat at least one over-`$100 CAD` free-shipping order for BC and Ontario so
tax behavior is verified independently from paid shipping.

## Exact Future Implementation Prompt

Use this for the implementation PR after Stripe Sandbox tax settings are ready:

```md
Create PR 078: Enable Stripe Tax for Canadian checkout

Context:
PR 076 proved checkout/shipping/payment truth except tax. PR 077 documented the
tax launch plan. Stripe Sandbox tax settings are now configured for Canadian
province testing.

Goal:
Enable Stripe Tax for hosted Stripe Checkout while preserving webhook payment
truth and Canada-only V1 shipping.

Scope:
- Add Stripe Checkout `automatic_tax.enabled = true`.
- Use tax-exclusive pricing for current CAD product prices.
- Either rely on Stripe Dashboard default physical-goods/shipping tax codes or
  pass explicit Stripe tax codes, but document the choice.
- Update order/webhook total validation so Stripe tax does not cause paid
  orders to fail total mismatch validation.
- Store and display enough tax/charged-total information for staff order review.
- Keep success page/client code unable to mark orders paid.
- Keep current shipping rule exactly:
  - Canada only
  - subtotal over $100 CAD ships free
  - subtotal $100 CAD or under gets $15 CAD shipping
  - exactly $100 CAD still gets $15 CAD shipping

Hard limits:
- Do not replace hosted Stripe Checkout.
- Do not move the Stripe webhook endpoint.
- Do not trust client totals or client tax.
- Do not change product prices, media mappings, Aqua, variant pricing, SEO, DNS,
  shipment/admin PR #49 scope, or unrelated admin behavior.
- Do not run destructive migrations.

Investigate before editing:
- `apps/api/src/checkout/checkout.service.ts`
- `apps/api/src/webhooks/stripe-webhook.service.ts`
- order/internal/admin display code for totals
- Prisma order schema and migrations
- docs/planning/076-checkout-shipping-tax-sanity-audit.md
- docs/planning/077-canadian-tax-launch-readiness-plan.md

Validation:
- pnpm db:generate and pnpm db:validate if schema changes are needed
- pnpm exec eslint apps/api/src apps/web/src --max-warnings=0
- pnpm exec tsc --noEmit -p apps/api/tsconfig.json
- pnpm exec tsc --noEmit -p apps/web/tsconfig.json
- NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm --filter @tigerpingpong/web build
- deployed Sandbox checkout paid tests for BC, Alberta, Ontario, Quebec, and
  Nova Scotia

Expected output:
- focused implementation PR
- updated docs/QA note with province results
- no production launch approval until deployed Sandbox tax tests pass
```

## Launch Blocker Status

Blocked.

Tiger Ping Pong checkout should not launch publicly until Canadian tax behavior
is explicitly configured, implemented, and retested. Shipping and payment truth
can remain the foundation, but tax must be added in a way that keeps webhook
validation authoritative and prevents Stripe tax totals from being mistaken for
unexpected or fraudulent totals.

