# Product Imagery Audit and Exact-Match Refresh

Date: 2026-07-17

Branch: `codex/product-imagery-audit-refresh`

Website reviewed: `https://tigerpingpong-web.onrender.com`

Local preview: `http://localhost:3010`

Source library: `/Users/shawncleve/Downloads/tiger - photos reorganized`

## Outcome

The storefront already has a consistent image container system. Product cards, category grids, galleries, and feature cards use stable dimensions and `object-fit: contain`; the main launch issue is source quality and missing feature-photo connections, not layout CSS.

This pass connected 25 exact local technical-detail photos to the existing feature cards for Expo Outdoor, Plaza Outdoor, Portland Indoor, and Whistler. The photos were uploaded to new deterministic Cloudinary public IDs and delivered with automatic format and quality. No catalog records, product-media rows, product names, prices, variants, availability, checkout behavior, routes, or database data changed.

## Audit counts

- Public products found: 12.
- Usable local source images found: 333.
- Finder AppleDouble sidecar files excluded: 21.
- Exact technical-detail matches implemented: 25 assets across 4 products.
- Source images modified or background-removed: 0.
- Images upscaled: 0.
- Source images left unused by this exact-match pass: 308.
- Cloudinary delivery checks: 25 of 25 returned HTTP `200`.
- Products with exact, usable local primary or technical-detail families: 7 — Expo Outdoor, Plaza Outdoor, Portland Indoor, Portland Outdoor, Whistler, 140-Pack Balls, and Orange 6-Pack Balls.
- Products with multiple/probable candidates requiring an owner decision: 2 — Vice Paddle and Net & Post Set.
- Products without an approved launch-quality local primary: 3 — Aqua Paddle, White 6-Pack Balls, and Table Cover.

The five previously refreshed production primary images (Expo, Plaza, Whistler, 140-Pack Balls, and Orange 6-Pack Balls) were already present when this task began. They were audited but were not uploaded or remapped again.

## How imagery currently works

- Catalog primary and gallery media come from the API and resolve through `apps/web/src/lib/product-media.ts`.
- Category cards and product galleries reuse those catalog media records rather than maintaining separate desktop/mobile image lists.
- Table feature photos are presentation content in `ProductDetailSections.tsx`; this is where the placeholder feature art lived.
- Shared containers already preserve product scale with stable dimensions and `object-fit: contain`.
- Cloudinary remains the canonical delivery service; local source originals remain outside the repository.

## Standardization approach

- Preserve the existing card and carousel dimensions.
- Use exact product-folder and exact feature-filename matches only.
- Keep original source pixels; do not crop, stretch, upscale, or remove backgrounds.
- Deliver through Cloudinary with `f_auto,q_auto` and deterministic product/feature public IDs.
- Reuse one uploaded source when the same feature appears in the main feature carousel and the smaller detail cards.
- Provide specific alt text describing the visible product detail.
- Leave every ambiguous primary, gallery, colour, or model-revision match unchanged.

## Implemented exact matches

| Product         | Implemented assets |
| --------------- | -----------------: |
| Expo Outdoor    |                  8 |
| Plaza Outdoor   |                  4 |
| Portland Indoor |                  8 |
| Whistler        |                  5 |

The complete machine-readable mapping, source dimensions, public IDs, final URLs, match rationale, and status are in `data/media/product-detail-image-map-v1.json`.

## Deferred or ambiguous products

| Product                        | Reason existing imagery remains                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Aqua Paddle                    | No corresponding local product folder or approved source master.                                                                            |
| White 6-Pack Balls             | Available local exports are too small for a launch-quality primary.                                                                         |
| Table Cover                    | No approved product-photo master exists in the source library.                                                                              |
| Vice Paddle                    | Several clean face/colour candidates exist; the exact sold face and primary colour need owner confirmation.                                 |
| Net & Post Set                 | Detail images exist, but there is no approved high-resolution complete packaged-set primary.                                                |
| Portland Outdoor feature cards | Existing remote feature images remain because several local candidates are only 220px and the `v1` model revision still needs confirmation. |
| Table colour variants          | Blue/Grey/Green visual-to-variant associations remain deferred until colour defaults and existing variant IDs are owner-confirmed.          |

## Existing inconsistencies still requiring review

- Portland Indoor and Portland Outdoor need confirmed default-colour imagery tied to existing variant IDs.
- Expo gallery colour metadata must be reconciled with the actual Blue/Grey sellable options.
- Several galleries still include older 386px sources even where the primary image is now high resolution.
- Aqua and some homepage/catalog fallbacks still depend on legacy BigCommerce URLs.
- Replacement Parts remains a deferred catalog area and should not receive bulk image mappings without approved product records.

## Recommended image standards

| Family                | Preferred source                                                   | Display behavior                          |
| --------------------- | ------------------------------------------------------------------ | ----------------------------------------- |
| Table primary/gallery | 2400×1500 preferred; 2000×1250 minimum                             | Landscape, `contain`, full table visible  |
| Square product        | 1600×1600 preferred                                                | Square, `contain`, 8–12% breathing room   |
| Technical detail      | 1200×900 preferred; do not upscale smaller approved legacy details | 4:3, `contain`, feature remains visible   |
| Lifestyle/hero        | 2400×1600 landscape                                                | `cover` only with an approved focal point |

The implemented legacy technical details range from 450×450 to 6144×4096. They are displayed in contained, stable slots and are never enlarged through asset processing.

## Validation evidence

- Current/live evidence: `current/`
- Local implementation evidence: `after/`
- Cloudinary upload evidence: `product-detail-upload-results.json`
- Complete unused-source list: `unused-source-images.csv`
- Machine-readable exact-match map: `data/media/product-detail-image-map-v1.json`
- Reversible upload command: `node scripts/media/upload-product-detail-visuals.mjs` is dry-run by default; `--commit` creates only missing deterministic Cloudinary assets and refuses dimension collisions.

## Rollback

The application rollback is a single code revert because no product-media or database rows were changed. The newly uploaded Cloudinary assets are unreferenced after that revert and can remain harmlessly in place or be removed later through a separately approved cleanup.
