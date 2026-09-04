# Universal table pages recovery

Date: 2026-09-04
Branch: `codex/feature/recover-universal-table-pages`
Source: safety stash `ecd2dd5`, including its preserved untracked files.

## Recovered

All five table definitions, the shared story/feature/comparison/specification renderer, accessible horizontal feature carousel, reviewed-media mappings, local Portland patio composite, and unit/browser coverage applied cleanly to current `develop`. The original stash remains intact. No catalog write, stock change, payment/email change, or deployment occurred.

## Fresh proof

- Lint, typecheck, 189 unit tests, and production-style build passed.
- Tracked-secret scan passed with zero findings; high-severity dependency audit passed with five existing moderate advisories.
- Portland Outdoor screenshots at 390, 768, and 1440 pixels were captured in local, uncommitted `var/table-recovery/` and visually inspected at mobile and desktop widths. Story, horizontal feature cards, comparison cards, and responsive specifications are restored. No document overflow was measured at those three widths.
- Full browser run: 91 passed, 11 existing evidence-only skips, one five-route colour test timed out waiting for the final page's load event. The final test change only increases its budget to 60 seconds, matching the other five-route test; the original load wait and assertions remain. The colour test passed on rerun in 3.7 seconds. A trial DOM-ready wait was discarded after it clicked before hydration. Six other focused table tests also passed. Historical results in `design-qa.md` remain historical evidence only.

## Before production promotion

Owner annotation follow-up (2026-09-04): replaced the equal-height specification card grid with responsive label/value rows, preserving every factual value. Shortened visible resource action labels to Installation guide and Setup video while retaining descriptive accessible names and destinations. Parts/support are secondary text links. Confirmed the local desktop result in the in-app browser; lint and web typecheck pass. Production remains unchanged.

- Shawn reviewed the Portland patio composite, requested removal of the old patio photo, and approved moving this release forward. This release serves the reviewed processed rendition bundled with the web app. Its manifest remains `local_preview_only`/excluded from catalog application because it has not been uploaded to Cloudinary; a later media-storage follow-up must preserve that provenance.
- Comparison requires all three configured models. Shawn separately selected publication of Whistler as out of stock; after that activation the configured Portland Indoor comparison can include it. No comparison fallback behavior changed.
- Recovered fact sheets cite a July 28 owner decision and current product records. Review the recovered specifications, warranty language, and media with the page preview before promotion; recovery is not a new confirmation of those claims.

## Whistler release preparation

Shawn explicitly requested Whistler be published but out of stock. The production record was inspected read-only: archived, public navigation false, checkout scope false. The existing admin available-for-sale toggle couples publication and checkout, so it must not be used for this activation.

The storefront now labels non-checkout tables Out of stock in the purchase panel, table listing, and comparison. Existing backend checkout eligibility continues rejecting these products; no payment logic changed.

After the approved develop-to-main release is deployed, run the following from the repository root in the API production environment (with built database package and its existing database environment):

```sh
node scripts/launch/publish-whistler-out-of-stock.mjs
node scripts/launch/publish-whistler-out-of-stock.mjs --apply
```

Review the dry-run first. The script targets only `tiger-whistler-indoor-table`, validates its type/state, uses an optimistic updatedAt guard, and sets active/public=true/checkout=false without changing price, variants, or media. Verify the public product and Tables page after activation, and that no Add to cart control is offered. Do not enable the admin available-for-sale toggle. Local dry-run failed database initialization; no production catalog mutation or deployment has occurred.

Fresh stock-change proof: `pnpm lint`, `pnpm typecheck`, `pnpm test` (190 tests), and production-style `pnpm build` pass. A backend regression test proves an active/public Whistler with checkout scope false is rejected. With `MOCK_WHISTLER_OUT_OF_STOCK=1`, the local browser shows the complete Whistler page, both colour images, Out of stock in the purchase panel and comparison, and no Add to cart button. The mock switch is opt-in and leaves ordinary browser fixtures unchanged. Full browser coverage was not rerun for this final stock-label change; the focused browser inspection supplements the recovery suite above.

Release approval: Shawn said "okay lets move forward" after the production promotion and guarded activation steps were presented. The first hosted final gate passed 91 browser tests but caught support links below the established 44px touch-target threshold. Increased only their minimum clickable height from 36px to 44px, retaining the reviewed secondary-link presentation and unchanged assertions.

## Production completion — 2026-09-04

- PR #169 merged into develop as `67a1aa9`; approved promotion #170 merged into main as `8a124f63e4c5afa7e5e02a02b0142045d0b0295b`.
- Corrected branch and production promotion both passed full hosted release readiness. Complete local browser suite: 92 passed, 11 existing evidence-only skips. Unit suite: 190 passed.
- Render API deploy `dep-dadkjarm8hqs73cdf4v0` and web deploy `dep-dadkjarm8hqs73cdf4pg` both show the exact production commit live.
- Ran the guarded script dry-run, reviewed the exact archived Whistler target, and applied it in the newly deployed API shell. Only status/public navigation/checkout scope changed; price, variants, and media stayed intact.
- Public catalog confirms Whistler public=true, checkout=false. Homepage, Tables, Whistler, and Portland Outdoor return HTTP 200. Tables and Whistler show Out of stock; Portland renders the new universal table page and resources layout.
- Live Whistler browser inspection confirms complete gallery/story/specifications and no Add to cart control. Direct POST `/checkout/sessions` for Whistler returns HTTP 400: requested item unavailable; no checkout session created. No paid transaction or email was triggered.
- No DNS, auth, payment-truth, or email behavior change. The API health check returned HTTP 200. No outage was observed during the checks; this was not continuous uptime monitoring.
- Deferred: move the owner-reviewed bundled Portland processed image to Cloudinary with preserved provenance, and any further copy/comparison polish. Do not use the current admin available-for-sale toggle to manage visible out-of-stock Whistler; it couples visibility and checkout.
