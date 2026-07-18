# Current Task

## Active task

Tiger Homepage — “Summer in Canada.”

## Selected task card

Rebuild `/` as an established, modern summer storefront using Tiger’s real Vancouver photography, exact product artwork, glass surfaces, and more than 15 years of Canadian history. The page should help people shop quickly, make Aqua the seasonal feature, and give the Tiger story in one concise proof section.

## Final page order

1. Existing navigation
2. Real Vancouver hero
3. Glass “Shop Your Summer” shelf
4. Aqua “Summer in Canada” campaign
5. Portland Outdoor in a softly defocused summer patio setting
6. Vancouver community proof
7. Tiger Table Cover
8. Existing footer

The product-first order reflects the owner’s final browser annotation: Aqua and Portland move up; the Vancouver proof follows Portland.

## Boundaries

- Change `/` only, apart from canonical Tiger story content, homepage media tooling, focused tests, and workflow documentation.
- Preserve navigation behaviour, footer, catalog, cart, checkout, APIs, database, payment truth, protected routes, and public URLs.
- Use the exact owner-cleared `MAY-011` hero without AI alteration.
- Use **PingPong** as one word in all new customer-facing copy and alternatives.
- Keep seasonal campaign switching manual through the typed `summer-canada` / `evergreen` content map.
- Do not add the rejected support/reach cards, an About CTA in the hero, automatic seasonal logic, analytics, or new infrastructure.
- Do not deploy or merge; deliver a focused draft PR.

## Required proof

- Hero H1, table CTA, and phone CTA are visible in the initial desktop and mobile viewport.
- The hero uses the exact real Vancouver media URL and approved crop.
- The page states more than 15 years, nationwide Canadian shipping, and **Summer in Canada**.
- Product/category destinations, stable anchors, section order, heading hierarchy, image alternatives, focus states, and reduced motion are covered by Playwright.
- No horizontal overflow at 390, 768, 1280, or 1440 pixels.
- Desktop, tablet, and mobile viewport/full-page captures are stored under ignored `exports/homepage-summer-qa/`.
- New Cloudinary assets return `200` at their expected dimensions.
- Lint, typecheck, unit tests, focused Playwright, production build, secret scan, and launch preflight are run.

## Status

Implementation and responsive visual QA are complete on `codex/homepage-summer-in-canada`. The final owner annotations are incorporated: Portland keeps the exact product sharp over a softly defocused summer patio, and the page now flows Shop → Aqua → Portland → Vancouver → Cover.

`pnpm launch:preflight` passes with 26 unit tests, 22 browser tests, five intentionally skipped screenshot-only jobs, zero tracked-secret findings, and no high or critical production dependency advisories. The production audit reports two moderate advisories. Focused homepage screenshot capture also passes at 1440, 768, and 390 pixels. All three new Cloudinary deliveries return `200` at their recorded dimensions. No backend, API, database, payment, cart, checkout, navigation, footer, deployment, or URL behaviour changed. Delivery is through a focused draft PR; no deploy or merge is part of this task.
