# PR 089: Stripe Tax Checkout Session Failure Fix

Date: 2026-06-16
Branch / PR: `codex/pr-089-stripe-tax-checkout-failure`
Status: Draft PR

## Decision made

Stripe Tax-enabled Checkout Sessions now explicitly mark generated product prices and the generated shipping rate as tax-exclusive.

## Why

PR 088 enabled `automatic_tax` behind `STRIPE_TAX_ENABLED`, but inline Checkout `price_data` did not declare a tax behavior. Stripe recommends `price_data.tax_behavior` when calculating taxes and requires it when Stripe Tax settings do not provide a default tax behavior.

## What changed

- `automatic_tax.enabled=true` is only included when `STRIPE_TAX_ENABLED=true`.
- Product line item `price_data.tax_behavior` is set to `exclusive` only when tax is enabled.
- Inline `shipping_rate_data.tax_behavior` is set to `exclusive` only when tax is enabled.

## What did not change

- No Canadian tax rates were hard-coded.
- Shipping rule amounts and thresholds did not change.
- Webhook-confirmed payment truth did not change.
- Client redirects still do not mark orders paid.
- Product, catalog, and media data were not touched.

## Deferred

- Render/API failed checkout logs were not available from this local workspace.
- Manual Stripe Checkout QA with `STRIPE_TAX_ENABLED=true` still needs to be run against a deployed API/service configured with the Stripe key and Dashboard tax settings.

## Follow-up

- Verify tax-enabled Checkout opens for Aqua 4-Pack, Vice Paddle, and one table.
- Enter Canadian shipping addresses in Stripe Checkout and confirm tax appears before payment.
- Leave `STRIPE_TAX_ENABLED=false` as the fallback if tax-enabled deployed QA fails.

