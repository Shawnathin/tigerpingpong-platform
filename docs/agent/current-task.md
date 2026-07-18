# Current Task

## Active task

Tiger Tables Page — “Find Your Table.”

## Selected task card

Rebuild `/tables` as a calm, glassy, product-led shopping page that answers “indoor or outdoor?” quickly, then gives Tiger’s five current tables one large editorial moment each.

## Final page order

1. Existing navigation
2. Real Portland Outdoor patio hero
3. Glass “Where will it live?” chooser
4. Expo Outdoor
5. Portland Indoor
6. Portland Outdoor
7. “Outdoor doesn’t mean outdoors only” education band
8. Whistler Indoor
9. Plaza Outdoor
10. Existing footer

## Boundaries

- Change `/tables` only, apart from canonical Tiger story content, tables media tooling, focused tests, and workflow documentation.
- Preserve navigation behaviour, footer, catalog, cart, checkout, APIs, database, payment truth, protected routes, and public URLs.
- Use the exact owner-cleared `IMG_4919-2.jpg` patio hero without AI alteration.
- Keep `/tables/indoor-tables/` and `/tables/outdoor-tables/` on their existing shared category composition.
- Keep all product names, prices, availability, and primary media sourced from the live catalog.
- Use **PingPong** as one word in all new customer-facing copy and alternatives.
- Do not add filtering, a sticky product rail, a second closing sales pitch, analytics, or new infrastructure.
- Do not deploy or merge; deliver a focused draft PR.

## Required proof

- Hero H1 and phone CTA are visible in the initial desktop and mobile viewport.
- The hero uses the exact patio media URL while `/` and `/about` keep the approved mountain image.
- The chooser answers indoor versus outdoor and preserves the approved Canada-wide table-shipping claim.
- Product order, live prices, CTA destinations, stable anchors, education placement, heading hierarchy, image alternatives, focus states, and reduced motion are covered by Playwright.
- No horizontal overflow at 390, 768, 1280, or 1440 pixels.
- Desktop, tablet, and mobile viewport/full-page captures are stored under ignored `exports/tables-category-qa/`.
- New Cloudinary assets return `200` at their expected dimensions.
- Lint, typecheck, unit tests, focused Playwright, production build, secret scan, and launch preflight are run.

## Status

Implementation and QA are complete on `codex/tables-find-your-table`, stacked on `codex/homepage-summer-in-canada`.

- The owner-selected left-hand concept is implemented with the Portland patio hero, real lifestyle chooser photography, five compact glass product stages, and live catalog prices.
- Every table has a short Tiger-voice “why it exists” explanation.
- The free-table-shipping reassurance is a softened sticky extension of the public navigation, with “Yes, even to cottage country.” visible on desktop and mobile.
- The outdoor-inside education scene uses the owner-provided real ball as its print reference: black Tiger scratches and wordmark, without the `40` or stars.
- Visual comparison has no remaining P0–P2 differences, focused browser coverage passes, all nine media hashes verify, and the final Cloudinary delivery returns `200` at `1899 × 828`.
- Lint, typecheck, 26 unit tests, focused Playwright, production build, tracked-secret scan, and the full launch preflight pass. The production dependency audit reports two moderate advisories and no high or critical advisories.

No deployment or merge is part of this task. Delivery is a focused draft PR for review.
