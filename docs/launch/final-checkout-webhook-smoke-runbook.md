# Final Checkout + Webhook Smoke Runbook

## 1. Executive summary

TigerPingPong checkout and webhook order capture are already implemented and code-stable. This runbook provides the final smoke plan for the production-domain proof path (without executing any payment in this task).

Primary goal:

- Prove that a real customer path still works through the final domain,
  from browse to checkout session creation, through webhook processing,
  into paid-order visibility.

Hard rule for this runbook:

- This task is documentation and operational prep only.
- Do not start any checkout, do not charge cards, and do not call paid Stripe APIs until operator confirmations and target-environment validation are complete.

## 2. Scope

- No code changes.
- No new app behavior changes.
- No media mapping changes.
- No deployment or DNS actions.
- No env mutations.
- No imports or uploads.
- No webhook endpoint edits.

Coverage for the smoke record should include:

- Public domain health and navigation.
- Checkout session creation in web-facing mode.
- Optional cart cancel path.
- Paid path confirmation via backend order status and internal order records.
- Route protection proof for admin/internal routes.
- Stripe webhook event proof for `checkout.session.completed`.

## 3. Required operator confirmations before running

Before any paid checkout attempt, collect written confirmation for all items below:

1. Final domain selected for launch (example `tigerpingpong.ca`, `www` policy, aliases).
2. `www` vs non-`www` canonical behavior is decided and documented.
3. Stripe mode for this smoke (test mode vs live mode) is decided.
4. Whether this task includes a real paid order and who approved it.
5. Name/role for Stripe Dashboard owner.
6. Name/role for Render web/API owner.
7. Name/role for Supabase/order DB visibility owner.
8. Name/role for go/no-go approver.

If any item is unresolved, hold this runbook and do not run the smoke.

## 4. Required env validation before smoke

Run this as part of pre-flight in the target deployment context.

```bash
pnpm launch:env:validate
```

Surface-scoped checks:

```bash
pnpm launch:env:validate --surface web
pnpm launch:env:validate --surface api
pnpm launch:env:validate --surface all
```

Mode checks:

```bash
pnpm launch:env:validate --surface api --expected-mode test
pnpm launch:env:validate --surface api --expected-mode live
```

Capture the command output in the smoke record.

## 5. Pre-smoke deployment/domain checklist

1. Confirm selected domain is live in Render web service and is reachable.
2. Keep API URL fixed to the current platform service unless architecture changes.
3. Confirm `CORS_ORIGIN` in API includes at least current web origin and rollback origin if required.
4. Confirm `CHECKOUT_SUCCESS_URL` and `CHECKOUT_CANCEL_URL` use the selected domain and success URL includes `?session_id={CHECKOUT_SESSION_ID}`.
5. Confirm `NEXT_PUBLIC_API_BASE_URL` points to `https://tigerpingpong-platform.onrender.com` or equivalent target API service.
6. Confirm Basic Auth creds are available for `/admin` and `/internal/*`.
7. Confirm internal orders token is set for `admin-api` and web internal views.
8. Confirm Stripe endpoint is set to `https://tigerpingpong-platform.onrender.com/webhooks/stripe` and expected livemode aligns with selected test/live flow.

## 6. Customer path smoke

Use manual browser checks first; avoid payment callouts until confirmation.

- Home
  - Open `/` on final domain.
  - Confirm storefront renders and no auth prompt for public traffic.
- Category
  - Open `/tables`, `/tables/indoor-tables`, `/accessories`.
  - Confirm list pages are reachable and product links are visible.
- Product
  - Open one PDP from each family where feasible (table, accessory, package).
  - Confirm price, options (if required), and Add to Cart flow is visible.
- Cart
  - Open `/cart`.
  - Confirm added item appears, quantity controls work, and checkout button is visible.
- Checkout start
  - Click checkout from cart.
  - Confirm API returns a checkout session URL and request lands on Stripe checkout.
- Checkout cancel path
  - Cancel checkout from Stripe.
  - Confirm redirect to `/checkout/cancel` and return-to-store links.
- Checkout success path
  - After redirect, open `/checkout/success?session_id=<SESSION_ID>` (if a session exists).
  - Confirm page explicitly says backend status is the truth and does not declare paid status itself.

## 7. Stripe checkout smoke

### Test mode path

1. Run in a test-only context.
2. Use an approved staging/test operator procedure.
3. Do not use real customer payment data.
4. Confirm checkout session opens and returns to success/cancel correctly.

### Live mode path (if approved)

1. Only run if operations has explicitly approved a real low-value live payment.
2. Confirm this is intentionally requested by the same go/no-go owner.
3. Capture post-transaction evidence only after webhook confirmation.

### Expected Stripe dashboard evidence

- New checkout session row appears in the correct event stream.
- Matching completed session for selected mode.
- Webhook delivery attempts visible to endpoint `/webhooks/stripe`.

### What not to do

- Do not run Stripe checkout without prior approvals in section 3.
- Do not rerun `pnpm launch:env:validate` after every failed local click unless env values changed.
- Do not send secret values (webhook secret, Stripe keys, internal token) in chat notes, screenshots, or logs.

## 8. Webhook proof

- Expected event: `checkout.session.completed`
- Expected route: `POST /webhooks/stripe`
- Failure/retry proof:
  - If event appears as duplicate in Stripe/our logs, verify we receive and keep idempotent state.
  - Confirm no payload exposure in any pasted evidence.
  - Confirm retries do not create duplicate order transitions.

Verification methods (no secrets):

1. Stripe Dashboard event/endpoint list filtered for checkout session completion and 2xx target.
2. Internal order list/detail on web or API confirms `paid` transition after webhook processing.
3. Success page status endpoint is still used as backend confirmation (`GET /checkout/sessions/:sessionId/status`).

## 9. Paid-order proof

- Where it should appear:
  - `GET /internal/orders?status=paid` (API)
  - `/internal/orders` and `/internal/orders/<publicReference>` pages (web, staff protected)
  - `/admin/orders` summary/details as optional read-only confirmation
- Fields expected once paid:
  - `status: paid`
  - `publicReference`
  - `paidAt` timestamp
  - `subtotalCents`, `shippingCents`, `totalCents`
  - `stripeAmountTotalCents`, `stripePaymentIntentId` (where exposed)
- Payment truth/source:
  - Backend order status from checkout session status endpoint / internal orders API.
  - Success redirect alone is not payment confirmation.
- Fulfillment status:
  - Shipment fields stay empty until fulfillment is manually recorded.
  - Paid order visibility does not imply shipment confirmation.

## 10. Admin/order visibility proof

1. `GET /admin` with Basic Auth should return protected UI.
2. `GET /admin/orders` should show paid records and recent status.
3. `GET /admin/orders/<publicReference>` should render order detail for a known paid order.
4. `GET /internal/orders` with `x-internal-orders-token` should return status list.
5. `GET /internal/orders/<publicReference>` should return detail row for paid order.

## 11. Shipping/tax sanity checks

- Confirm at least one cart with subtotal below `$100.00 CAD` has flat shipping `$15.00 CAD`.
- Confirm at least one cart at exactly `$100.00 CAD` returns flat shipping `$15.00 CAD`.
- Confirm at least one subtotal over `$100.00 CAD` returns free shipping.
- Confirm Canada-only shipping behavior is respected on checkout.
- Confirm tax behavior is visibly consistent with current Stripe tax configuration.

## 12. Mobile smoke checks

- Open in a narrow viewport (near 390 px):
  - `/`
  - `/tables`
  - one product page
  - `/cart`
  - `/checkout/success`
- Confirm no accidental overflow, broken primary actions, or hidden navigation.
- Confirm checkout CTA still reachable.

## 13. Failure triage

- Checkout session fails
  - Check API response from `/checkout/sessions` (status and body).
  - Re-check `STRIPE_SECRET_KEY`, `STRIPE_TAX_ENABLED`, `CHECKOUT_SUCCESS_URL`, `CHECKOUT_CANCEL_URL`, and `DATABASE_URL`.
  - Confirm `NEXT_PUBLIC_API_BASE_URL` is pointing at active API service.

- Payment succeeds but webhook missing
  - Confirm endpoint is configured and listening: `/webhooks/stripe`.
  - Verify Stripe webhook URL + livemode alignment.
  - Confirm API logs do not show signature or route rejection.

- Webhook received but order missing
  - Verify checkout session created and persisted with `stripeCheckoutSessionId`.
  - Check one paid-like transition exists for the same `sessionId` and `orderId` mapping.

- Order exists but admin view broken
  - Verify `x-internal-orders-token` and API/service token parity.
  - Verify `INTERNAL_ORDERS_BASIC_AUTH_USER/PASSWORD` for web staff routes.
  - Verify admin route is served with staff credentials.

- CORS/domain mismatch
  - Verify `CORS_ORIGIN` includes final domain and any rollback domain required by ops.
  - Verify web API base URLs are pointed at actual API base.

- Stripe livemode mismatch
  - Verify `STRIPE_EXPECTED_LIVEMODE` and selected Stripe key mode (test/live) match.
  - Stop and re-align env + deployment before trying again.

## 14. Evidence capture checklist

- Allowed evidence:
  - Screenshot or short notes from
    - storefront path pages,
    - cart,
    - checkout session creation URL,
    - success route status text,
    - admin/internal order views.
  - Command output from `pnpm launch:env:validate` runs.
  - Non-secret API/route response status summaries.
- Do not capture:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `INTERNAL_ORDERS_API_TOKEN`
  - `INTERNAL_ORDERS_BASIC_AUTH_*`

What to paste back to master build-control chat:

- Final domain and canonical policy.
- Validation command output for `pnpm launch:env:validate --surface web|api|all`.
- Pass/fail matrix for sections 6–12.
- Webhook status and paid-order proof summary.
- Explicit go/no-go decision.

## 15. Go/no-go decision checklist

Go only if all conditions are true:

- Operator confirmations complete for items in section 3.
- `pnpm launch:env:validate --surface all` passes in target context.
- Public domain smoke paths pass.
- Checkout session can be started in intended mode.
- Webhook completion evidence is present for the session.
- Paid order is visible in internal/admin surfaces.
- Protected routes remain protected.
- No secrets exposed in captured evidence.

Hold if any check is missing or inconsistent.

## 16. Rollback / hold-launch instructions

- If checks fail:
  - Stop paid-flow attempts.
  - Keep Render rollback domain available.
  - Revert any recently changed env values associated with launch attempt.
  - Fix remaining env/domain alignment issues before rerunning smoke.

- Recommended rollback order:
  1. Stop any payment-attempt execution.
  2. Revert web/domain rollout only if user traffic changed.
  3. Re-run smoke against rollback host.
  4. Do not adjust webhook/code during rollback.

## 17. Recommended next executable task

`Run production env validator in target environment`
