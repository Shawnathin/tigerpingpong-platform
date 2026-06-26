# Final Checkout + Webhook Smoke Results

## 1. Executive summary

Status: **Partial public-path pass; checkout/webhook proof held.**

The public Render web URL smoke was started on 2026-06-26 in Stripe test-mode
context:

- Public homepage: PASS.
- Public category pages: PASS.
- Public product page: PASS.
- Small item add-to-cart: PASS.
- Cart subtotal/shipping sanity for a below-`$100 CAD` cart: PASS.
- Mobile public/cart smoke: PASS.

The Stripe checkout, cancel, paid success, webhook delivery, and paid-order/admin
proof were **not run** because the required pre-check says to confirm the API and
web production env validators still pass in the target Render service shells
before running checkout. This local Codex session does not have Render shell/CLI
access, and no fresh target-shell validator output was available in this turn.

No app code, env vars, Render/DNS/Stripe/Supabase/Cloudinary configuration,
migrations, imports, uploads, or media scripts were changed.

## 2. Domain tested

Tested public/pre-domain Render web URL:

- `https://tigerpingpong-web.onrender.com`

API health also responded from:

- `https://tigerpingpong-platform.onrender.com/catalog/health`

Result:

- Home `HEAD /`: HTTP 200.
- Tables category `HEAD /tables`: HTTP 200.
- Catalog health: `status: ok`, service `tigerpingpong-catalog-api`, counts
  included `products: 18`, `variants: 19`, and `media: 81`.

## 3. Stripe mode used

Stripe mode requested/approved for this task: `test`.

No Stripe checkout session or payment was started because the required Render
target-shell env validation pre-check could not be confirmed from this local
session.

Live mode was not used.

## 4. Operator confirmations

Operator confirmations supplied in the task prompt:

1. Final smoke domain/pre-domain URL:
   `https://tigerpingpong-web.onrender.com`.
2. Stripe mode: test mode only.
3. Permission to run the final checkout + webhook smoke following the runbook.
4. Permission to use a small test cart item.
5. Instruction not to run live mode, push, deploy, change DNS, edit env/config,
   or change code.

Not available inside this local session:

- Direct Render API service shell access.
- Direct Render web service shell access.
- Stripe Dashboard access/proof.
- Admin/internal credentials or token proof.

## 5. Env validation recap

Previously recorded in `docs/launch/production-env-validation-results.md`:

- Target API env validation: PASS for required vars.
- Target web env validation: PASS for required vars.
- Expected Stripe mode: `test`.
- Required failures: `0`.
- Invalid required vars: `0`.
- Secret values printed: no.

Fresh pre-check requested for this smoke:

- API Render shell:
  `pnpm launch:env:validate --surface api --expected-mode test`.
- Web Render shell:
  `node scripts/launch/validate-production-env.mjs --surface web --expected-mode test`.

Result for this pass:

- BLOCKED. This local Codex session has no `render` CLI/shell access and cannot
  execute commands inside the target Render services.
- Because the fresh target-shell validator output could not be confirmed, the
  checkout/payment path was intentionally not started.

## 6. Customer path results

Public-path checks completed:

- Home page:
  - URL: `https://tigerpingpong-web.onrender.com/`.
  - Title: `Tiger Ping Pong | Tables, Paddles, Balls, and Accessories`.
  - H1: `Tables, paddles, and game-night gear for the next rally.`
  - Public navigation rendered without an auth prompt.
- Category page:
  - URL: `https://tigerpingpong-web.onrender.com/tables`.
  - Title: `Ping Pong Tables | Tiger Ping Pong`.
  - H1: `Ping pong tables for home, school, club, and outdoor play.`
  - Product links rendered.
- Balls category:
  - URL: `https://tigerpingpong-web.onrender.com/accessories/ping-pong-balls`.
  - Title: `Ping Pong Balls | Tiger Ping Pong`.
  - H1: `Ping pong balls for practice, games, and restocks.`
  - Small `$8.00` balls product was visible.
- Product page:
  - URL:
    `https://tigerpingpong-web.onrender.com/catalog/products/tiger-premium-balls-6-orange`.
  - Title:
    `Tiger PingPong Premium 3-Star Ping Pong Balls 6 Pack Orange | Tiger Ping Pong`.
  - H1: `6-Pack Orange Balls`.
  - Price displayed: `$8.00`.
  - Add-to-cart button rendered.
- Add-to-cart:
  - Added `Tiger PingPong Premium 3-Star Ping Pong Balls 6 Pack Orange`.
  - Cart badge changed to `1`.

## 7. Checkout cancel path result

Not run.

Reason: checkout was not started because fresh API/web target Render-shell env
validator output could not be confirmed first.

## 8. Checkout success path result

Not run.

Reason: Stripe test payment was not started because fresh API/web target
Render-shell env validator output could not be confirmed first.

## 9. Stripe event/webhook proof

Not run.

Reason: no Stripe checkout session or payment was created in this pass.

Required proof still pending:

- Stripe test checkout session/event exists.
- Expected `checkout.session.completed` event was delivered to
  `https://tigerpingpong-platform.onrender.com/webhooks/stripe`.
- Webhook delivery status is successful.
- No secrets appear in logs/screenshots.

## 10. Paid-order/admin visibility proof

Not run.

Reason: no Stripe test payment was created, and this local session does not have
admin/internal credentials or an internal orders token.

Required proof still pending:

- Paid order exists.
- Order/admin view shows safe order identifier, paid/payment status,
  fulfillment status, contact presence, line items, totals, and shipping info
  when collected.

## 11. Shipping/tax sanity result

Completed visible cart sanity for below-`$100 CAD` cart:

- Item: `Tiger PingPong Premium 3-Star Ping Pong Balls 6 Pack Orange`.
- Quantity: `1`.
- Subtotal: `$8.00`.
- Shipping: `$15.00`.
- Total: `$23.00`.
- Cart copy confirmed: orders `$100 CAD` or under use `$15 CAD` flat-rate
  shipping.
- Cart copy confirmed payment truth: payment is confirmed only after backend
  Stripe webhook confirmation.

Not completed:

- Exactly `$100.00 CAD` cart check.
- Over `$100.00 CAD` cart check.
- Stripe Checkout Canada-only address behavior.
- Tax behavior inside Stripe Checkout.

Reason: checkout/payment path remained held by the fresh Render-shell env
validation blocker.

## 12. Mobile smoke result

Mobile smoke performed at `390 x 844` viewport:

- `/`: PASS, `scrollWidth` matched `clientWidth` at `390`.
- `/tables`: PASS, `scrollWidth` matched `clientWidth` at `390`.
- `/catalog/products/tiger-premium-balls-6-orange`: PASS, `scrollWidth`
  matched `clientWidth` at `390`.
- `/cart`: PASS, `scrollWidth` matched `clientWidth` at `390`.

Checkout success mobile page was not tested because no Stripe session was
created.

## 13. Issues found

1. Fresh target Render service-shell env validation could not be executed from
   this local Codex session.
2. Checkout/payment path was correctly held because the runbook requires fresh
   target env validation before checkout.
3. Stripe Dashboard webhook proof remains pending.
4. Paid-order/admin visibility proof remains pending.
5. Full shipping/tax sanity remains pending for exactly `$100 CAD`, over
   `$100 CAD`, Canada-only checkout behavior, and Stripe tax display.

No public storefront/cart blocker was identified in the checks completed.

## 14. Go/no-go recommendation

Recommendation: **Hold launch GO/no-GO.**

Reason: public-path smoke passed for the checked surfaces, but the required
checkout, webhook, and paid-order/admin proof was not collected.

This is not a launch GO until:

1. Fresh target Render API/web env validation passes in the service shells.
2. Stripe test checkout starts and cancel path is verified.
3. Stripe test payment succeeds.
4. Stripe webhook delivery succeeds.
5. Paid order is visible in admin/internal order surfaces.

## 15. Required follow-up tasks

1. Run or provide redacted output for:
   - `pnpm launch:env:validate --surface api --expected-mode test` in the Render
     API service shell.
   - `node scripts/launch/validate-production-env.mjs --surface web --expected-mode test`
     in the Render web service shell.
2. Re-run the checkout portion of the smoke in Stripe test mode only.
3. Capture redacted Stripe webhook delivery proof.
4. Capture redacted paid-order/admin visibility proof.
5. Update this file with final pass/fail evidence and decision.

## 16. Next recommended task

`Complete Stripe test checkout + webhook proof after fresh Render-shell env validation`
