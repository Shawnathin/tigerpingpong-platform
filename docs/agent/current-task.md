# Current Task

## Active task

Launch-ready Replacement Parts page.

## Selected task card

Turn `/replacement-parts/` into a focused Tiger support hub with Part 40 first, five downloadable table manuals, four existing setup videos, and direct human help from Vancouver.

## Final page experience

1. Existing public navigation
2. “Keep the rally going” hero with the real Part 40 image
3. Part 40 story, compatibility qualification, and prefilled fit-check email
4. Three-item part-identification checklist
5. Five verified manual downloads and four setup videos
6. Human phone/email support band
7. Existing public footer

## Boundaries

- Change only the replacement-parts route, its scoped content/styles, focused tests, approved Cloudinary assets, safe upload tooling, and workflow documentation.
- Keep Part 40 support-confirmed and manually fulfilled; add no price, inventory promise, cart, or checkout control.
- Preserve navigation, footer, product pages, catalog/API/database contracts, shipping, payment truth, and protected routes.
- Use **Part 40** in customer copy; keep the older source identifier internal.
- Use **PingPong** as one word in new customer-facing copy.
- Do not deploy or merge; deliver one focused draft PR.

## Required proof

- Six source assets match their approved hashes and upload without overwrite.
- All five manuals return PDF content and download as attachments from Cloudinary.
- Correct Part 40 copy, selected-model qualification, email prompts, phone link, manuals, and videos.
- No price, cart, checkout, or unverified compatibility promise.
- One H1, descriptive image alternative, keyboard focus, reduced-motion safety, and no horizontal overflow at 390, 768, and 1440 pixels.
- Desktop, tablet, and mobile viewport/full-page captures under ignored `exports/replacement-parts-qa/`.
- Lint, typecheck, unit tests, focused Playwright, production build, and tracked-secret scan pass.

## Status

Implementation and validation are complete on `codex/replacement-parts-launch-ready`.

- `/replacement-parts/` is now a dedicated static support page; its unnecessary live-catalog request and dynamic rendering flag are gone.
- Part 40 leads the page with the approved packshot, selected-table fit qualification, one dry Tiger story, and a prefilled fit-check email. No price, inventory, cart, or checkout path was added.
- The five approved manuals and four existing setup videos are available from typed page content. The Plaza installation-and-parts document is used instead of the specification sheet.
- All six owner-provided sources matched their approved hashes and were uploaded with deterministic Cloudinary public IDs, collision preflight, and `overwrite=false`.
- Cloudinary PDF delivery was reapplied and live-verified: the Part 40 image and all five PDFs return the expected content types, and every manual download returns an attachment header.
- Desktop, tablet, and mobile viewport/full-page captures were reviewed under ignored `exports/replacement-parts-qa/`; no horizontal overflow or broken card/image treatment was found.
- Final validation passed: lint, typecheck, 26 unit tests, 3 focused Playwright tests with 1 opt-in evidence test skipped, production web build, scoped Prettier check, diff check, and tracked-secret scan with zero findings.
- Navigation, footer, other routes, product pages, catalog/API/database contracts, checkout, payments, shipping, auth, and protected routes were not changed.
