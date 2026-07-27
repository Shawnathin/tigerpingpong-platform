# Current Task

## Active task

Standard Replacement Net and Expo & Portland Net Upgrade System commerce.

## Selected task card

Add the two owner-approved net choices to the dedicated Replacement Parts support hub: a `$20 CAD` live-catalog seed for the net-only standard replacement and a `$149.99 CAD` live-catalog seed for the complete Expo and Portland upgrade.

## Boundaries

- Work only on `codex/feature/replacement-nets-commerce-v1` created from current `develop`; target its pull request to `develop`, never `main`.
- Preserve Part 40, manuals, setup videos, navigation, footer, generic-catalog/PDP/sitemap exclusions, hosted Stripe Checkout, webhook payment truth, Canada-only shipping, and the existing shipping calculator.
- Prices and availability remain live catalog truth. The reviewed CSV values are activation seeds, not hardcoded storefront copy or trusted client totals.
- Keep internal SKUs `8367` and `15875` out of public copy.
- State fit and included items exactly: the standard product is net-only for any standard PingPong table; the complete upgrade fits every indoor/outdoor Expo and Portland and does not fit Whistler or Plaza.
- Keep supplier and reordering history out of customer copy. Do not imply planned obsolescence.
- Do not add a fit selector, new schema, migration, payment rule, shipping exception, generic replacement-parts catalogue, or production catalog write.

## Required proof

- The reviewed import accepts both active replacement parts only with exact SKU, positive CAD price, approved primary Cloudinary media, public/checkout flags, and `online_checkout`.
- The page uses live price and availability, adds each product through the existing cart, and falls back to photo help without exposing stale prices when catalog data is unavailable.
- Standard-net cart math is `$20` subtotal, `$15` shipping, and `$35` pre-tax total.
- Expo and Portland upgrade cart math is `$149.99` subtotal, free shipping under the existing over-`$100` rule, and `$149.99` pre-tax total.
- Compatibility, included items, older-system guidance, Whistler/Plaza exclusions, image alternatives, focus behaviour, and generic-discovery exclusions have focused coverage.
- Cloudinary delivery verification, import validation, scoped dry-run, lint, typecheck, unit tests, focused browser tests, production build, and secret scanning pass.

## Status

PR #133 and the follow-up browser-test stabilization in PR #138 are merged into `develop`; the table accessory offer is no longer the active lane.

Shawn approved the two replacement-net products, their compatibility, included items, current availability, and catalog seed prices on 2026-07-27. The exact product images are processed, stripped of sensitive metadata, uploaded to Cloudinary, and verified in `data/media/replacement-nets-commerce-media-v1.json`.

The local branch implementation and proof are complete. Draft PR #140 is open against `develop`. The dedicated support hub now welcomes people into a general parts finder, keeps Part 40 in its own section, distinguishes the net-only choice from the complete Expo/Portland upgrade, reads live catalog price and availability, uses the shared cart and exact shipping rule, links cart lines back to the right card, and falls back to photo help without showing stale prices.

Import validation and the connectionless replacement-parts staging dry-run pass with no blocking gates. Lint, typecheck, 124 unit tests, the production build, tracked-secret scan, high-severity dependency gate, 10 focused browser tests, all 86 active browser tests, and responsive visual review pass. The two delivered Cloudinary files return exact hash-matching JPEG bytes.

Shawn's page review removed the redundant net-section explainer, replaced “table-side system” with **Replace the whole net setup.**, and reframed the hero around common parts, manuals, and photo help rather than repeating Part 40. The Part 40 card now keeps one quiet fit-check path, removes the repeated email action from its purchase panel, and replaces the context-dependent four-foot-rod joke with **Replace the clip—not the whole opening system.**

No database write, deployment, Stripe payment, production catalog activation, merge, or production promotion has occurred. The next step is continued review of PR #140; any catalog write remains separately approval-gated.
