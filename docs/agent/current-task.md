# Current Task

## Active task

Tiger Indoor & Outdoor Table Pages.

## Selected task card

Rebuild `/tables/indoor-tables/` and `/tables/outdoor-tables/` as focused chapters of the approved “Find Your Table” experience, carrying over its glass, typography, compact product stages, sticky shipping reminder, live catalog data, and Tiger product stories.

## Final page experiences

### Indoor — “Bring the Rally Home”

1. Existing navigation
2. Whistler Indoor lobby hero
3. All / Indoor / Outdoor category switch
4. Sticky Canada-wide table-shipping reassurance
5. Portland Indoor
6. “Keep it dry. Let it rip.” editorial interlude
7. Whistler Indoor
8. Existing footer

### Outdoor — “Take It Outside”

1. Existing navigation
2. Portland Outdoor shaded-patio hero shared with `/tables`
3. All / Indoor / Outdoor category switch
4. Sticky Canada-wide table-shipping reassurance
5. Expo Outdoor
6. Portland Outdoor
7. “Outdoor doesn’t mean outdoors only” education scene
8. Plaza Outdoor
9. Existing footer

## Boundaries

- Change the two table subcategory routes only, apart from shared table-stage extraction, canonical Tiger story content, focused tests, and workflow documentation.
- Keep `/tables` visually and functionally unchanged.
- Preserve navigation behaviour, footer, live catalog filtering and prices, cart, checkout, APIs, database, payment truth, protected routes, and public URLs.
- Reuse cleared media already tracked in the Tiger story source; upload no new assets.
- Use **PingPong** as one word in all new customer-facing copy and alternatives.
- Do not add filtering, a product rail, backend work, analytics, or new infrastructure.
- Do not deploy or merge; deliver one focused draft PR.

## Required proof

- Correct metadata, hero copy/media, category links and active state for both routes.
- Correct product filtering, order, live prices, stories, images, and destinations.
- Indoor interlude and outdoor education placement.
- Sticky shipping copy clears the compact navigation and remains legible on mobile.
- Every product stage fits inside one 390–417 pixel mobile viewport.
- No horizontal overflow at 390, 768, 1280, or 1440 pixels.
- Keyboard focus, descriptive alternatives, lazy loading, and reduced motion remain accessible.
- Desktop, tablet, and mobile viewport/full-page captures are stored under ignored `exports/table-subcategories-qa/`.
- Lint, typecheck, unit tests, focused Playwright, production build, secret scan, and launch preflight are run.

## Status

Implementation and QA are complete on `codex/table-subcategories-tiger-vibe`.

- Both routes use one typed, server-rendered category experience and the same shared live product-stage renderer as `/tables`.
- Indoor keeps its distinct Whistler lobby photography and orange playing-feel interlude.
- Per owner direction, Outdoor intentionally reuses the stronger shaded Portland patio hero from `/tables` so direct search visitors receive the best first impression.
- The owner-approved shipping tab and cottage-country byline remain visible on desktop and mobile.
- Design QA passes with matching desktop comparisons plus desktop, tablet, and mobile viewport/full-page evidence.
- Lint, typecheck, 26 unit tests, focused category and `/tables` regression tests, production build, and tracked-secret scan pass. The production audit reports two moderate advisories and no high or critical advisories.
- The exact launch-preflight command reached the full parallel browser phase, where four existing homepage/About/policy checks timed out under suite contention. All four passed immediately when rerun serially; the new category suite and `/tables` regression remained green throughout.
- No deployment or merge is part of this task. Delivery is one focused draft PR for review.
