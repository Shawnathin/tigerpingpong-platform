# Current Task

## Active task

Tiger-styled cart empty state.

## Selected task card

Replace the broken, oversized empty-cart presentation with a focused Tiger PingPong experience that uses the approved brand voice, cleared storefront imagery, and useful shopping routes.

## Boundaries

- Work only on `codex/fix/cart-empty-state-tiger-v1`, created from current `develop`; target any pull request to `develop`, never `main`.
- Use the approved empty-cart copy from the Tiger storytelling content map and a cleared image from the brand media map.
- Preserve the shared storefront navigation, cart storage, line-item behavior, catalog refresh, shipping calculations, discounts, hosted Stripe Checkout, and webhook payment truth.
- Do not invent prices, availability, shipping promises, product claims, or a parallel visual system.
- Keep the experience responsive, keyboard accessible, motion-safe, and free of horizontal overflow.

## Required proof

- The empty cart shows exactly one `h1`, the approved “Nothing here yet.” / “Let’s find your next rally.” copy, the cleared `MAY-011` Vancouver image, a normal-height “Keep Shopping” action, and four working category routes.
- Empty-state browser coverage passes at 390, 417, 768, 1280, and 1440 pixels without horizontal overflow or CTA stretching.
- Existing replacement-parts cart-empty expectations are updated without weakening their cart behavior proof.
- Formatting, lint, typecheck, unit tests, the production-style build, focused browser tests, and tracked-secret scanning pass.

## Status

Implementation and local visual review are complete, and PR #142 is ready for review against `develop`. The empty cart now uses the shared Tiger story layer, approved copy, cleared Vancouver lifestyle imagery, a compact primary action, and direct routes to tables, paddles, balls, and all gear. The layout has been reviewed at 390, 417, 768, 1280, and 1440 pixels with no horizontal overflow and a consistent 52-pixel CTA height.

The populated-cart calculations, shipping, discounts, catalog reconciliation, Checkout request, and payment-truth paths were not changed. Lint, typecheck, all 128 unit tests, the production-style build, three focused cart browser tests, responsive empty-state proof, changed-file formatting, tracked-secret scanning, and diff validation pass. The repository-wide formatting command still reports 49 files that were already outside Prettier style; none is part of this task.

The first PR release-readiness run passed 87 active browser tests and failed only because the table-accessory checkout test still expected the replaced checkout-error sentence. That assertion now matches the approved Tiger copy, the exact formerly failing test passes locally, and the subsequent hosted branch-policy and release-readiness checks pass.

No database write, deployment, Stripe payment, catalog mutation, merge, or production promotion has occurred. Publishing the task branch for draft review does not change production.
