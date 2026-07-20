# Current Task

## Active task

Table Gallery, Variant Restoration & Launch-Day Purchasing Rail V2.

## Selected task card

Restore and harden the product galleries and required colour selection on Expo Outdoor, Portland Indoor, Portland Outdoor, Whistler Indoor, and Plaza Outdoor after the Aqua gallery work.

## Deliverable

- A tracked 21-asset manifest covering the five table galleries, exact live variant keys, order, ownership, checksums, dimensions, Cloudinary identifiers, roles, and alternatives.
- Full curated galleries before selection; matching colour media plus shared details after selection.
- Required table-colour choices that preserve the existing SKU, variant key, live price, cart line, and Stripe Checkout payload.
- Responsive Cloudinary derivatives at 480, 800, 1200, and 1600 pixels with contained white gallery canvases.
- Dry-run-first upload and catalog-repair tools with collision checks, transactional apply, verification, snapshot, and rollback support.
- Focused unit and Playwright regression proof for all five tables, Aqua V2, and one non-table accessory.
- Aqua's approved content-height Purchasing Rail V2 on all five table pages, using exact live table prices, restored variant thumbnails, and table-specific Tiger copy.
- A launch-day selector fallback that maps each existing table variant key to its exact approved Cloudinary gallery image when production media rows have not yet received variant assignments.
- The owner-selected 1600-pixel PingPong Balls category photograph as the Balls hero image.

## Locked decisions

- Initial leads remain Blue for Expo, Portland Outdoor, and Whistler; Green for Portland Indoor; Grey for Plaza.
- The lead image does not select a cart colour. Every table still requires an explicit choice.
- Portland Outdoor retains its approved current-model nine-image sequence. The obsolete local `Portland Outdoor v1` folder is prohibited.
- Exact current-model Portland sources below the preferred 1600-pixel threshold are retained only where no larger matching original could be recovered; they are never upscaled.
- Expo Green/Black and exact/near-duplicate images stay out of the restored gallery.
- Aqua keeps its approved V2 gallery and purchasing rail. All five tables reuse that approved rail skin without changing their galleries, prices, variant keys, cart lines, or checkout payloads.
- Table rails use `In stock. Ready to ship.`, the approved free-Canada-wide table shipping message and cottage-country line, and a real-person colour-help link.
- Existing API-assigned variant media remains authoritative. The tracked gallery manifest is used only when an exact live variant-media match is absent; no colour is inferred from labels or swatches.

## Boundaries

- No production catalog write before owner visual approval.
- No variant creation, pricing change, checkout change, public API schema change, database migration, URL/SEO change, payment change, deployment, or automatic merge.
- No Cloudinary deletion and no database-history deletion.
- Raw source media stays local and ignored.

## Required proof

- All five default galleries, lead images, prices, choices, media dimensions, and destinations are correct.
- Every colour changes the featured image and removes other-colour media while retaining shared images.
- Exact selected variant keys reach cart and mocked checkout unchanged, including Plaza's single Grey choice.
- White contained canvases, alternatives, keyboard control, thumbnail scrolling, reduced motion, and zero overflow at 390, 417, 768, 1280, and 1440 pixels.
- Aqua V2 and a non-table accessory remain unchanged.
- Formatting, lint, typecheck, unit tests, focused Playwright, production build, secret scan, and launch preflight are recorded.

## Status

Implementation and local visual QA are complete on `codex/table-gallery-variant-restoration`, based on the merged Aqua V2 work from PR #119.

- Ten missing high-resolution assets were uploaded under deterministic Cloudinary IDs and added to the tracked manifest; all 21 delivery URLs verify successfully.
- The catalog repair tool validates all five live products and exact existing variants with zero errors, but `--apply` has not been run.
- Desktop and mobile screenshots for all five product pages show correct product models, white contained media, compact galleries, and explicit colour choices with no open P0–P2 visual issue.
- Focused gallery, cart, Aqua, `/tables`, and table-subcategory browser regressions pass after giving the two multi-route checks an appropriate 60-second test budget.
- Full launch preflight passes: lint, Prisma generation/validation, typecheck, 41 unit tests, production build, 61 active browser tests, tracked-secret scan, and the high-severity production audit gate. Eleven screenshot-only browser jobs are intentionally skipped; two moderate dependency advisories remain.
- Production catalog remains unchanged pending owner approval of all five local pages.
- The launch-day rail pass removes the legacy empty purchasing-panel height, adds colour-specific table thumbnails on white canvases, and gives Plaza's single Grey choice the full selector width.
- Follow-up branch `codex/table-variant-selector-images` verifies the launch rail against production API data: table colour choices now show their approved table photographs instead of fallback colour dots, while the original variant keys and checkout path remain unchanged.
- The Balls category hero now uses the exact owner-supplied Cloudinary image at 1600 × 1600. No catalog, media, API, pricing, cart, or checkout data was changed.
