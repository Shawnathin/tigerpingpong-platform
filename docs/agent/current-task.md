# Current Task

## Active task

Stripe owner order alerts and Checkout phone collection.

## Selected task card

Have Stripe email Shawn after each successful storefront payment and require a customer phone number in hosted Stripe Checkout, using the existing webhook-confirmed paid-order storage and protected order views.

## Boundaries

- Work only on `codex/feature/stripe-order-alerts-phone-collection` and target its pull request to `develop`, never `main`.
- Preserve hosted Stripe Checkout, webhook-confirmed payment truth, idempotency, Canada-only shipping, Stripe Tax behavior, and all current shipping rules.
- Use Stripe's personal successful-payment email preference for Shawn's owner alert; do not add an application email provider or duplicate customer order email.
- Collect the phone number only for transaction and fulfillment use under the existing privacy policy.
- Reuse the existing `customerPhone` and `shippingPhone` order fields and protected admin/internal views; do not change schema or migrations.
- Do not change customer receipt settings, payment methods, webhook endpoints, DNS, Render, Supabase data, catalog data, or production deployment in this task.

## Required proof

- New Checkout Sessions send `phone_number_collection.enabled: true` while retaining Canadian shipping-address collection and the existing idempotency key.
- Webhook processing continues to write `customer_details.phone` to `customerPhone` and `shippingPhone` only after the paid transition is validated.
- Focused unit tests, lint, typecheck, and production build pass.
- Stripe Dashboard evidence confirms Shawn's `Successful payments` email notification preference is enabled in the Tiger PingPong account.

## Status

Implementation and local proof are complete on 2026-07-22. Stripe's live `Successful payments — Email` preference was enabled for Shawn in the Tiger PingPong account and remained enabled after reopening the Dashboard. New Checkout Sessions now require phone collection; the existing paid-webhook path stores the number in `customerPhone` and `shippingPhone`. Lint, typecheck, all 64 unit tests, and the production-style build pass. The code remains local and undeployed pending review, commit, and a task-branch pull request to `develop`.
