# Current Task

## Active task

Tiger Contact page — “Real Help, Right Here.”

## Selected task card

Replace the stock `/contact` route with a short, human, conversion-focused experience. Open with a real Vancouver game-night photograph and immediate phone/email actions, then move through common reasons to call, useful order details, and Tiger’s no-runaround support promise.

## Boundaries

- Change `/contact` only, apart from the canonical Tiger story content, shared Open Graph brand spelling, focused browser proof, and workflow documentation.
- Preserve the existing phone number, email address, homepage `#order-help-title` link, navigation, footer, catalog, cart, checkout, APIs, database, payment truth, and protected routes.
- Add no contact form, submission handler, support hours, response-time promise, street address, analytics, or new infrastructure.
- Reuse the owner-cleared `NIT-034` image already recorded in the About media map; upload no new media and never upscale the 750-pixel source.
- Use **PingPong** as one word in all new customer-facing language and shared Open Graph site naming.

## Required proof

- The Contact H1, phone action, and email action are visible in the initial desktop and mobile viewport.
- Native `tel:` and `mailto:` destinations, section order, heading hierarchy, image alternative, order-help anchor, and final CTAs are covered by Playwright.
- There is no form or nonfunctional contact control.
- No horizontal overflow at 390, 768, 1280, or 1440 pixels.
- Reduced motion is fully static.
- Desktop and mobile viewport and full-page screenshots are captured under ignored `exports/contact-real-help-qa/`.
- Lint, typecheck, unit tests, relevant Playwright tests, production build, secret scan, and launch preflight pass.

## Status

Complete on `codex/contact-real-help-right-here`, rebased onto `main` after the About page merged. The human-first hero, editorial support routes, order-help section, closing promise, canonical typed copy, metadata, responsive behavior, and focused browser coverage are in place. The reused `NIT-034` delivery returns `750 × 500`, and desktop/mobile before-and-after viewport plus full-page captures are stored under ignored `exports/contact-real-help-qa/`.

`pnpm launch:preflight` passes with 26 unit tests, 20 browser tests, four intentionally skipped screenshot-only jobs, zero tracked-secret findings, and no high or critical production dependency advisories. The production audit reports two moderate advisories. No form, backend, API, database, payment, navigation, footer, or deployment behavior changed.
