# Current Task

## Active task

Tiger Gear Categories — “Everything for the Rally.”

## Selected task card

Rebuild the retained Accessories, Paddles, Balls, Covers, Nets, and Replacement Parts routes as shorter, lighter siblings of the Tiger Tables experience. Make the broad Accessories duplication feel deliberate by leading with essentials before the Paddles and Balls already exposed in the main navigation.

## Final route experiences

- `/accessories/` — Covers, Nets, and Replacement Parts first; Aqua, Vice, and all ball packs second.
- `/accessories/paddles/` — Aqua versus Vice decision help and two live product stages.
- `/accessories/ping-pong-balls/` — Six versus 140 guidance, paired colour packs, and a larger 140-pack moment.
- `/accessories/covers/` — Cover story plus explicit Plaza compatibility warning.
- `/accessories/nets/` — Upgrade-oriented Net & Post Set story with an explicit Tiger replacement-net distinction.
- `/replacement-parts/` — Human support path with no invented catalog or inventory promise.

## Boundaries

- Preserve all six public URLs, the existing main navigation, footer, product routes, cart, checkout, APIs, database, payment truth, protected routes, and live catalog ownership of prices and availability.
- Preserve the exact V1 shipping rule: over $100 ships free; $100 or under is $15 across Canada.
- Reuse cleared current product, Aqua, Cover, and product-detail media. Upload no new assets.
- Keep provisional product stories internally marked and invisible to customers.
- Use **PingPong** as one word in all new copy, metadata, and alternatives.
- Do not add redirects, canonicals, sitemap, robots, backend work, a form, part search, analytics, or new infrastructure.
- Do not deploy or merge; deliver one focused draft PR.

## Required proof

- Metadata, hero copy/media, gear links, and active state on all six routes.
- Correct filtering, ordering, live prices, images, and product destinations.
- Aqua appears on both Paddles and All Accessories.
- Essentials precede repeated Paddles/Balls on All Accessories.
- Orange and White six-packs retain distinct destinations.
- Cover compatibility warning and Net fit-help destination are correct.
- Replacement Parts remains support-only.
- Exact current shipping threshold wording appears and is not sticky.
- No horizontal overflow at 390, 417, 768, 1280, or 1440 pixels.
- Every individual product stage fits within one 844-pixel mobile viewport.
- Keyboard focus, alternatives, lazy loading, and reduced motion remain accessible.
- Desktop, tablet, and mobile viewport/full-page evidence for all six routes is stored under ignored `exports/gear-categories-qa/`.
- Existing Tables suites remain green.
- Lint, typecheck, unit tests, focused Playwright, production build, secret scan, audit, and launch preflight are run.

## Status

Implementation and validation are complete on `codex/gear-categories-west-coast-rally`.

- All six routes now use one typed server-rendered `GearCategoryExperience` and one live `GearProductStage`.
- Accessories uses the approved Essentials-first hierarchy and restores Aqua to the broad product order.
- Aqua is labelled **Starting at $25.00**, redundant availability labels have been removed, and the Vice hero crop now fills its supporting frame.
- The Net & Post Set is correctly positioned as a way to upgrade other tables or turn a suitable tabletop into a play space. It is explicitly not described as a Tiger replacement net, and its square product image retains a square hero frame at narrow widths.
- Mobile gear navigation is a compact, stable six-option segmented control with three equal choices per row; the oversized Parts treatment has been removed at narrow widths.
- The desktop-only **Keep the rally ready** chooser is hidden below 900 pixels to avoid repeating the same actions immediately before their product sections.
- The Paddle and Ball decision shelves are also desktop-only; mobile shoppers move directly from category navigation into the products.
- The shipping threshold, product links, live prices, fallback media, product roles, and support destinations are covered by a focused route matrix.
- Desktop, tablet, and mobile visual evidence has been captured and reviewed for every route.
- No media was uploaded and no storefront behavior outside these route compositions was changed.
- Focused gear suite: 13 passed, 1 evidence-only test skipped in the normal run. Final visual capture: 1 passed.
- Full launch preflight passed: lint, Prisma generation and validation, typecheck, 26 unit tests, production build, 47 Playwright tests with 8 opt-in evidence tests skipped, zero tracked-secret findings, and a production audit with two moderate findings and no high-severity failure.
- Post-review mobile navigation and flow refinements were revalidated with lint, typecheck, and the focused 13-test gear suite; the opt-in capture test remained skipped.
- All changed files pass Prettier. The repo-wide format check remains non-zero because 64 existing files outside this focused change are not currently Prettier-clean.
