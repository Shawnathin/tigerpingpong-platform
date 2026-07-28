# Current Task

## Active task

Add each approved table manual and setup-video link to the matching product page's Specifications section.

## Selected task card

Help owners find setup information where they are already reading product specifications, while keeping the Replacement Parts manual shelf and product pages on one validated source of truth.

## Boundaries

- Work only on `codex/feature/table-manual-spec-links`, created from current `origin/develop`; target its pull request to `develop`, never `main`.
- Reuse the five implemented manual records and four existing setup-video URLs already published on the Replacement Parts page.
- Match only Expo Outdoor, Portland Indoor, Portland Outdoor, Whistler Indoor, and Plaza Outdoor. Do not infer a manual for another product.
- Do not change manual files, product facts, catalog data, pricing, availability, checkout, payments, shipping, database state, deployment, or production.

## Required proof

- Each of the five matching product pages shows its exact manual download URL inside Specifications without repeating the manifest revision.
- The four products with sourced setup videos show their exact YouTube URL; Plaza does not show a video control.
- Table comparison appears before Specifications, and the setup panel includes a route to Replacement Parts.
- The removed table-package reassurance sentence does not appear in the product purchase panel or table confirmation.
- The Replacement Parts manual shelf continues to show five manuals and four setup videos.
- The resource panel remains visible, keyboard-usable, at least 44 pixels tall per link, and free of horizontal overflow at 390, 417, 768, 1280, and 1440 pixels.
- Lint, typecheck, the two affected browser suites, and the production-style build pass.

## Status

Implemented locally from one shared table-support mapping. The product Specifications section now presents a compact Tiger-styled manual/setup panel for each matching table, and the Replacement Parts page reads the same mapping so the two surfaces cannot drift.

Lint, Prisma client generation, full TypeScript typecheck, the 20-test table-gallery and Replacement Parts browser run, five-width responsive coverage, changed-file formatting, diff validation, and the production-style build pass. The browser run passed 18 active tests with two evidence-only screenshot tests skipped by their existing opt-in gates. Desktop and 390-pixel visual review passed.

Shawn's browser review is incorporated: Table Comparison now precedes Specifications, the table purchase and confirmation no longer repeat the package prompt, the setup panel no longer shows the manual title/revision line, and it now links to Replacement Parts. The 15-test table-gallery and table-accessory browser run passed 14 active tests with one evidence-only screenshot test skipped; lint, typecheck, the production-style build, and local visual review also pass.

Draft PR #146 is published against `develop`. It remains draft and unmerged; required hosted checks will rerun for the browser-review commit.

No catalog, database, checkout, payment, shipping, deployment, or production state changed.
