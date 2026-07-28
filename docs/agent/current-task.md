# Current Task

## Active task

Repair the shared table add-to-cart accessory confirmation so every table name stays concise and the cart actions remain reachable at short desktop and mobile viewports.

## Selected task card

Mission-critical storefront regression confirmed on every table flow: the full catalog name overruns the confirmation panel and the action row cannot be reached reliably.

## Boundaries

- Work only on `codex/fix/table-accessory-modal-reachability`, created from current `origin/develop`; target its pull request to `develop`, never `main`.
- Reuse the approved product-page display title instead of deriving shopper copy from the live catalog name.
- Keep the offer choices, table/accessory cart payloads, live prices, discounts, shipping, checkout, Stripe, webhook, order, catalog, database, and deployment behavior unchanged.
- Make the action row persistently reachable on desktop and keep the full modal scrollable on tablet/mobile.

## Required proof

- The live-length catalog names for Expo Outdoor, Portland Indoor, Portland Outdoor, Whistler, and Plaza render with their concise approved confirmation headings.
- At a 1280 x 640 viewport, `Add selected extras`, `Go to cart`, and `Keep shopping` remain inside the visible dialog without first scrolling.
- At 390, 417, 768, 1280, and 1440 pixels, the modal has no horizontal overflow and its actions remain reachable.
- The accessory selection, savings summary, add-selected-extras flow, focus trap, Escape close, and non-table confirmation continue to work.
- Lint, typecheck, focused browser coverage, and the production-style build pass.

## Status

Implementation and local regression validation are complete and draft PR #149 targets `develop`. All five table confirmations, eight focused browser tests, lint, typecheck, the production-style build, diff validation, console review, and side-by-side visual QA passed. No payment, shipping, catalog, database, deployment, or production state changed.
