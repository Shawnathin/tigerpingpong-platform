# Current Task

## Active task

Tiger About page — “West Coast Rally.”

## Selected task card

Replace the empty `/about` route with a two-minute, image-led Tiger story. Open on the current Expo Outdoor table against Vancouver and the North Shore mountains, keep the questionable first table below the first viewport, then move through Vancouver events, outdoor-minded product thinking, better manufacturing, product-name origins, and Tiger’s road across Canada.

## Boundaries

- Change `/about` only; homepage, footer, category, and product-page excerpts remain follow-up work.
- Preserve public navigation, footer, catalog behavior, checkout, APIs, database, payment truth, and protected routes.
- Keep all story wording and media references in a typed canonical content module for later reuse.
- Keep raw archive photography local and outside Git.
- Upload only owner-cleared selections under deterministic Cloudinary IDs; verify source hashes and refuse collisions.
- Preserve historical watermarks and never upscale the small archive sources.
- Use **PingPong** as one word in all customer-facing language.

## Required proof

- The present-day Expo hero and H1 occupy the initial desktop and mobile viewport; the first table remains below the fold.
- Stable anchors, chapter order, product links, final CTAs, heading hierarchy, and image alternatives are covered by Playwright.
- No horizontal overflow at 390, 768, 1280, or 1440 pixels.
- Reduced motion is fully static; mobile removes desktop sticky behavior.
- Desktop, tablet, and mobile viewport and full-page screenshots are captured under ignored `exports/about-story-qa/`.
- Every final Cloudinary URL returns `200` with its expected delivered dimensions.
- Lint, typecheck, unit tests, relevant Playwright tests, production build, secret scan, and launch preflight pass.

## Status

Complete on `codex/about-west-coast-rally`. The typed story, responsive page, tracked image map, collision-safe uploader, eleven new Cloudinary archive assets, focused browser coverage, and desktop/tablet/mobile visual captures are in place. All 12 final delivery URLs return `200` at their expected dimensions. `pnpm launch:preflight` passes with 26 unit tests, 12 browser tests, two intentionally skipped screenshot-only jobs, zero tracked-secret findings, and no high or critical production dependency advisories. No catalog, checkout, API, database, payment, navigation, or footer behavior changed.
