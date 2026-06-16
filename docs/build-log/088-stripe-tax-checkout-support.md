# PR 088: Stripe Tax Checkout Support

Date: 2026-06-16
Branch / PR: `codex/pr-088-stripe-tax-checkout-support`
Status: Draft PR

## Decision made

Stripe Tax support is gated by `STRIPE_TAX_ENABLED=true`. The default is disabled so unconfigured environments keep the existing subtotal-plus-shipping behavior.

## Why

PR 076 and PR 077 found that Stripe Tax is launch-blocking and that the webhook previously compared Stripe `amount_total` directly to the app pre-tax order total. Once Stripe adds tax, that comparison would incorrectly send paid orders to manual review.

## What changed

- Checkout Sessions pass `automatic_tax.enabled` only when `STRIPE_TAX_ENABLED` is true.
- Webhook validation now compares app-controlled subtotal and shipping separately, then validates Stripe's tax-inclusive total when tax is enabled.
- Orders can store Stripe charged total, Stripe tax amount, automatic tax status, and an order-level tax amount.
- The checkout success page and protected internal order detail can show Stripe charged total/tax after webhook confirmation.

## What did not change

- Stripe webhook confirmation remains payment truth.
- Client redirects still do not mark orders paid.
- Product prices, shipping rules, catalog/media data, SEO routes, DNS, and shipment/admin write scope did not change.
- Canadian tax rates are not hard-coded in app code.

## Deferred

- Stripe Tax Dashboard setup remains a secure-office task.
- Province-by-province paid Sandbox QA still needs to run after Stripe Sandbox tax registrations/settings are configured.

## Follow-up

- Set `STRIPE_TAX_ENABLED=true` on the API/platform service only after Stripe Tax is configured for that Stripe mode.
- Test BC, Alberta, Ontario, Quebec, Nova Scotia, shipping threshold boundaries, table checkout, and Aqua 4-Pack checkout.

## Human notes

If `STRIPE_TAX_ENABLED=true` and Stripe returns an incomplete/failed/missing automatic tax result, the webhook leaves the order out of the clean paid path for review instead of silently trusting the charge.
