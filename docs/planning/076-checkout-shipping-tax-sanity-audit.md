# PR 076: Checkout Shipping Tax Sanity Audit

Date: 2026-06-16
Branch: `codex/pr-076-checkout-shipping-tax-sanity-audit`
Status: Draft PR audit report

## Summary

Deployed Render checkout was audited against the V1 money-path rules. Shipping,
cart totals, Stripe Checkout totals, required table colour selection, and
success/cancel payment-truth behavior passed the tested scenarios.

Tax did not pass launch-readiness review. I found no app-managed tax calculation
and no explicit Stripe Checkout tax configuration in the checkout session
payload. Stripe Checkout pages tested in Sandbox showed subtotal, shipping, and
total due, but no tax line. Before launch, Shawn should confirm the Canadian
province tax approach and configure/verify it in Stripe or the app.

No checkout, payment, webhook, database migration, product media, admin,
shipment, Aqua, or SEO code was changed.

## Scope

Audited deployed services:

- Storefront: `https://tigerpingpong-web.onrender.com`
- API: `https://tigerpingpong-platform.onrender.com`
- API health: `GET /health` returned `{"status":"ok","service":"tigerpingpong-api"}`

This audit created Stripe Sandbox checkout sessions and left them unpaid. No
real paid order was completed.

## Implementation Findings

- Cart shipping is client-displayed from `apps/web/src/lib/cart.ts`:
  - `FREE_SHIPPING_THRESHOLD_CENTS = 10000`
  - `FLAT_SHIPPING_CENTS = 1500`
  - shipping is free only when `subtotalCents > 10000`
- Backend checkout independently recalculates shipping in
  `apps/api/src/checkout/checkout.service.ts` with the same `> 10000` rule.
- Backend Checkout Session creation sends:
  - `shipping_address_collection.allowed_countries: ["CA"]`
  - exactly one `shipping_options` entry
  - Stripe line items from stored `OrderItem` snapshots
  - no trusted client price, shipping, or total values
- Backend table checkout validates the required `Color` option and rejects
  table checkout requests when the option is missing.
- Success page reads backend checkout status and only treats `paid` as paid.
  It does not mark payment state from the redirect.
- Cancel page does not mark an order failed, paid, or fulfilled.
- Webhook code remains the only paid transition path found. It verifies session
  status, payment status, totals, shipping, shipping country, order state, and
  shipping rule before moving an order to `paid`.
- Tax search found no implemented checkout tax fields such as `automatic_tax`,
  `tax_rates`, `tax_behavior`, `amount_tax`, or app-managed tax totals in the
  checkout code path.

## Tested Scenarios

| Scenario | Expected | Actual | Result |
| --- | --- | --- | --- |
| Accessory under $100: 1x Vice Paddle, $50 | $15 shipping, $65 total | API returned subtotal `5000`, shipping `1500`, total `6500`; Stripe showed `CA$50.00` subtotal, `Standard shipping - $15`, `CA$65.00` total due | Pass |
| Accessory over $100: 1x 140-pack balls + 1x 6-pack balls, $104 | Free shipping, $104 total | API returned subtotal `10400`, shipping `0`, total `10400`; Stripe showed `CA$104.00` subtotal, `Standard shipping - Free`, `CA$104.00` total due | Pass |
| Exactly $100: 2x Vice Paddle | $15 shipping, $115 total | API returned subtotal `10000`, shipping `1500`, total `11500`; Stripe showed `CA$100.00` subtotal, `Standard shipping - $15`, `CA$115.00` total due | Pass |
| Table order: Portland Outdoor with Blue top colour | Free shipping | API returned subtotal `150000`, shipping `0`, total `150000`; cart and Stripe showed `CA$1,500.00` total due with free shipping | Pass |
| Table required colour selection | Add-to-cart blocked until colour selected | Deployed product page showed Blue/Grey radios. Clicking Add to cart with no choice showed `Select top colour to add this item.` Choosing Blue allowed add-to-cart | Pass |
| Selected table colour in cart/modal | Selected colour visible and carried forward | Modal and cart showed `Top colour: Blue`; Stripe line item showed `Tiger PingPong Portland Outdoor Ping Pong Table Grey or Blue (Top colour: Blue)` | Pass |
| Backend table checkout without colour | Request rejected | API returned `A required product option is missing.` | Pass |
| Stripe Checkout opens on Render | Hosted Checkout opens in safe/test mode | Stripe Checkout opened with `Sandbox` banner and merchant title `Home Billiards Sales and Tiger Ping Pong` | Pass |
| Canada-only shipping | Country restricted to Canada | Stripe Checkout showed country/region selected as Canada and disabled | Pass |
| Success page for unpaid session | Do not mark paid from redirect | Direct success URL for unpaid session showed `Payment confirmation is pending`, order status `Checkout Pending`, and payment truth `Not confirmed as paid yet.` Cart remained present | Pass |
| Cancel page | No payment/order mutation from cancel page | Cancel page stated no payment was completed and it does not mark an order failed, paid, or fulfilled. Cart remained present | Pass |
| Tax visibility/configuration | Province tax approach should be clear before launch | No tax line appeared in tested Stripe summaries; no explicit tax implementation/configuration found in code | Fail / Blocker |

## Stripe Checkout Notes

Observed Stripe Sandbox summaries:

- Under threshold:
  - Product: `Tiger PingPong Vice Ping Pong Paddle`
  - Subtotal: `CA$50.00`
  - Shipping: `Standard shipping - $15`, `CA$15.00`
  - Total due: `CA$65.00`
- Over threshold:
  - Products: `Tiger PingPong Premium 3-Star Ping Pong Balls 140 Pack` and
    `Tiger PingPong Premium 3-Star Ping Pong Balls 6 Pack Orange`
  - Subtotal: `CA$104.00`
  - Shipping: `Standard shipping - Free`
  - Total due: `CA$104.00`
- Exactly threshold:
  - Product: `Tiger PingPong Vice Ping Pong Paddle`, quantity 2
  - Subtotal: `CA$100.00`
  - Shipping: `Standard shipping - $15`, `CA$15.00`
  - Total due: `CA$115.00`
- Table:
  - Product: `Tiger PingPong Portland Outdoor Ping Pong Table Grey or Blue
    (Top colour: Blue)`
  - Subtotal: `CA$1,500.00`
  - Shipping: `Standard shipping - Free`
  - Total due: `CA$1,500.00`

No screenshots were saved because DOM/Stripe summary text was sufficient for the
audit record.

## Tax Assessment

Current observed behavior:

- The app stores subtotal, shipping, and total, but no tax amount.
- The checkout session code does not set Stripe `automatic_tax`.
- The checkout session code does not attach tax rates to line items or shipping.
- The tested Stripe Sandbox pages did not show a tax line before payment.
- There is no visible province-specific tax calculation in the app checkout
  path.

Recommended launch interpretation:

- Checkout/shipping/payment-truth behavior is safe from this audit perspective.
- Tax is not launch-safe until the business confirms whether tax is Stripe Tax,
  Stripe Dashboard tax settings, or app-managed tax, and a deployed checkout test
  verifies the expected Canadian province tax line.

## Recommended Follow-Up PRs

1. Tax configuration decision and implementation/verification.
   - Decide app-managed tax vs Stripe Tax.
   - Configure Canadian province tax behavior.
   - Add a deployed Stripe Sandbox checkout proof for at least BC and one other
     province if applicable.
   - Decide how tax is represented in stored order totals and internal order UI.
2. Optional checkout status/admin cleanup for abandoned audit sessions.
   - This audit created unpaid Sandbox sessions. No customer-facing issue was
     observed, but the admin/internal view may show additional pending orders.
3. Optional copy follow-up.
   - If tax will be added at checkout, public cart/checkout support copy should
     say tax is calculated in Stripe Checkout once configured.

## Launch Safety Call

From this audit perspective:

- Shipping threshold behavior: safe for launch.
- Canada-only Stripe shipping collection: safe for launch.
- Cart totals vs Stripe totals: safe for launch for tested scenarios.
- Table colour selection and checkout payload carry-through: safe for launch.
- Payment truth/webhook authority: safe for launch; no redirect/client paid
  mutation was observed.
- Tax: not safe for launch until explicitly configured and re-tested.

