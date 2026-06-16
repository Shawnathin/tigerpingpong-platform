# PR 090: Final Launch Smoke Test Report

Date: 2026-06-16
Branch / PR: `codex/090-final-launch-smoke-test-report`
Status: Draft PR report

## Scope

Full deployed storefront smoke test against:

- Storefront: `https://tigerpingpong-web.onrender.com`
- API/platform: `https://tigerpingpong-platform.onrender.com`

This was a docs-only QA pass. No code, DNS, Stripe webhook endpoint, payment truth logic, or PR #49 work was changed. No real payment was completed.

## Summary

Overall result: **Pass with no launch-blocking failures found in the tested deployed paths.**

The deployed storefront pages loaded, key category/resource/PDP URLs returned 200, cart worked, checkout opened in Stripe test/sandbox mode, V1 shipping rules were confirmed from the deployed checkout API, the Stripe Checkout tax line appeared, robots and sitemap were reachable, and protected public API flags returned 401 without the internal token.

## Pass / Fail Table

| Area | URL / check | Result | Notes |
| --- | --- | --- | --- |
| Homepage | `/` | Pass | 200, expected homepage title. |
| Tables | `/tables` | Pass | 200. `/tables/` redirects to `/tables` with 308. |
| Indoor tables | `/tables/indoor-tables` | Pass | 200. Slash form redirects with 308. |
| Outdoor tables | `/tables/outdoor-tables` | Pass | 200. Slash form redirects with 308. |
| Accessories | `/accessories` | Pass | 200. Slash form redirects with 308. |
| Paddles | `/accessories/paddles` | Pass | 200. |
| Balls | `/accessories/ping-pong-balls` | Pass | 200. |
| Covers | `/accessories/covers` | Pass | 200. |
| Nets | `/accessories/nets` | Pass | 200. |
| Resources | `/resources` | Pass | 200. |
| Resource article | `/resources/choose-a-ping-pong-table` | Pass | 200. |
| Resource article | `/resources/room-size` | Pass | 200. |
| Resource article | `/resources/indoor-vs-outdoor-ping-pong-tables` | Pass | 200. |
| Resource article | `/resources/ping-pong-rules` | Pass | 200. |
| Expo table PDP | `/catalog/products/tiger-expo-outdoor-table` | Pass | 200; required color options present via API/UI. |
| Aqua PDP with package options | `/catalog/products/tiger-aqua-outdoor-indoor-paddle` | Pass | 200; package options present; 4-pack selected and added to cart at 390px. |
| Vice Paddle PDP | `/catalog/products/tiger-vice-paddle` | Pass | 200. |
| Cart | `/cart` | Pass | 200; mobile cart displayed selected Aqua 4-pack line and checkout control. |
| Checkout opens | Deployed checkout API -> Stripe Checkout | Pass | Checkout URL returned and opened on `checkout.stripe.com` in sandbox/test mode. |
| `STRIPE_TAX_ENABLED=true` visible behavior | Stripe Checkout order summary | Pass | Tax line appeared with `Enter address to calculate`. Payment not completed. |
| Shipping: under threshold branch | Vice Paddle, subtotal `$50.00 CAD` | Pass | API returned `$15.00 CAD` shipping and `$65.00 CAD` total. |
| Shipping: under threshold branch | Aqua 4-pack, subtotal `$80.00 CAD` | Pass | API returned `$15.00 CAD` shipping and `$95.00 CAD` total. |
| Shipping: exact threshold branch | Two Vice Paddles, subtotal `$100.00 CAD` | Pass | API returned `$15.00 CAD` shipping and `$115.00 CAD` total. |
| Shipping: over threshold branch | Two Aqua 4-packs, subtotal `$160.00 CAD` | Pass | API returned free shipping and `$160.00 CAD` total. |
| Shipping: table over threshold | Expo Grey table, subtotal `$1,300.00 CAD` | Pass | API returned free shipping and `$1,300.00 CAD` total. |
| `robots.txt` | `/robots.txt` | Pass | 200; allows public site and disallows admin/internal/api/catalog-preview/checkout. |
| `sitemap.xml` | `/sitemap.xml` | Pass | 200; 26 locs; expected tested routes present with `https://tigerpingpong.ca` canonical URLs. |
| Public API debug flags | `?includeInternal=true` | Pass | Products/categories/families/product detail returned 401 without token. |
| Public API debug flags | `?includeReplacementParts=true` | Pass | Products/categories/families returned 401 without token. |
| Unsupported query note | `?includeDrafts=true` | Pass / note | Returns public product list because this is not an implemented protected debug flag in current API code. |
| Mobile 390px visual pass | Homepage, tables, resources, Vice PDP, Aqua PDP, cart | Pass | No horizontal overflow observed; no completed broken images observed on checked pages. |

## Blockers

None found in the requested deployed smoke-test scope.

## Non-Blocking Polish / Follow-Up Notes

- Slash-suffixed category URLs, such as `/tables/`, return 308 redirects to slashless canonical paths. This is expected for current Next.js behavior, but launch docs and shared URLs should prefer the slashless paths.
- The old Aqua slug `/catalog/products/aqua-outdoor-indoor-paddle` returns 404. The deployed API, sitemap, and passing PDP use `/catalog/products/tiger-aqua-outdoor-indoor-paddle`. This is not a blocker for current canonical URLs, but should be considered during any legacy redirect-map review.
- Stripe Checkout tax was verified as a visible tax line, not as a final calculated tax amount. I did not enter a full shipping address or complete payment.
- The browser cart had an older localStorage item from prior testing, so shipping-rule truth was verified through fresh checkout API sessions rather than the mixed local browser cart subtotal.

## Recommended Next Step

Proceed with final human review of the draft PR and, before domain cutover, run one approved end-to-end Stripe test-mode payment using a Canadian shipping address to verify the final calculated tax amount, webhook-confirmed paid transition, success-page status, and internal order visibility.

## Validation Evidence

Commands and checks run:

- HTTP status/title pass against deployed storefront routes listed above.
- Deployed API checks for catalog health, products, protected catalog debug flags, and protected internal routes.
- Deployed checkout API session creation for Vice Paddle, Aqua 4-pack, two Vice Paddles, two Aqua 4-packs, and Expo Grey table.
- In-app browser opened Stripe Checkout and confirmed sandbox checkout page with product, shipping, and tax line.
- In-app browser 390px viewport pass on homepage, tables, resources, Vice PDP, Aqua PDP, and cart.
- Sitemap content check confirmed expected public routes are present.
- Robots content check confirmed public allow plus admin/internal/API/checkout disallows.

Not run:

- No real or test payment was completed.
- No DNS/custom-domain cutover checks were performed.
- No PR #49 work was touched.
- No code build/lint/typecheck was run because this PR is a deployed smoke-test report with docs-only changes.
