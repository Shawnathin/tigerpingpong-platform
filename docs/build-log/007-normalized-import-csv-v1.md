# 007: Normalized Import CSV V1 Build Log

## What Was Added

- Review-only normalized CSV artifacts in
  `data/import-review/tigerpingpong/v1/`.
- One v1 brand row for Tiger PingPong only.
- Reviewed category, family, product, variant, media, redirect, and review-flag
  CSVs following `docs/catalog/TIGER_PINGPONG_IMPORT_CSV_SPEC_V1.md`.
- Seventeen reviewed current/deferred product rows after applying Shawn's
  catalog and SKU corrections.
- Conservative variant candidates for table colors, current and legacy Portland
  Outdoor models, and ball color/pack sizes.
- Primary source-media candidates from the scrape manifest with planned
  Cloudinary folders/public IDs and blank `cloudinary_secure_url` fields.
- Draft redirects only.

## Business Corrections Applied

- Removed Expo Indoor, Newgy Robo-Balls, and Ping Pong Paddle Case from current
  v1 review rows.
- Removed Expo Outdoor Green and Portland Indoor Blue variants.
- Updated Portland Indoor to Grey SKU `9476` and Green SKU `7012`.
- Updated Expo Outdoor to Grey SKU `15224` and Blue SKU `15225`.
- Updated Portland Outdoor current V2 to Grey SKU `14445` and Blue SKU `14446`.
- Preserved Portland Outdoor legacy V1 Grey SKU `15223` and Blue SKU `15222` as
  inactive/deferred variants only.
- Updated Whistler, Plaza, balls, Vice Paddle, cover, net, and replacement-net
  SKUs from the business correction.
- Added Aqua paddle product rows for Coral, Ocean Blue, 4 Pack, and 2 Pack.
- Updated Aqua product rows with confirmed prices: 4 Pack `8000`, 2 Pack
  `4500`, Single Coral `2500`, and Single Ocean Blue `2500`.
- Confirmed Table Tennis Net & Post Set SKU `6989-B` as checkout-ready, while
  leaving global checkout policy review open.

## Source Material Inspected

- `docs/catalog/TIGER_PINGPONG_IMPORT_CSV_SPEC_V1.md`
- `docs/catalog/TIGER_PINGPONG_CATALOG_NORMALIZATION_V1.md`
- `docs/catalog/TIGER_PINGPONG_BRAND_FAMILY_PRODUCT_VARIANT_MAP_V1.md`
- `docs/scraping/TIGER_PINGPONG_IMPORT_READINESS_V1.md`
- `docs/scraping/TIGER_PINGPONG_SCRAPE_OUTPUT_REVIEW_V1.md`
- `docs/media/TIGER_PINGPONG_CLOUDINARY_MEDIA_WORKFLOW_V1.md`
- `docs/build-log/006-catalog-schema-v1.md`
- Local generated scrape output under `var/scrapes/tigerpingpong/latest/`

## CSV Row Counts

Counts exclude header rows.

| File | Rows |
| --- | ---: |
| `brands_import_v1.csv` | 1 |
| `categories_import_v1.csv` | 9 |
| `product_families_import_v1.csv` | 10 |
| `products_import_v1.csv` | 17 |
| `product_variants_import_v1.csv` | 15 |
| `product_media_import_v1.csv` | 13 |
| `redirects_draft_v1.csv` | 29 |
| `import_review_flags_v1.csv` | 14 |

## Review Artifact Boundary

These CSVs are review artifacts only. They were not imported into a database and
are not seed data.

## Validation

- CSV parse/count validation: passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `git diff --stat origin/main...HEAD`: run for final PR review.
- `git diff --name-status origin/main...HEAD`: run for final PR review.
- `git status`: run for final PR review.

## What Was Intentionally Not Added

- No Supabase writes.
- No product import.
- No seed script or import script.
- No Prisma schema changes.
- No migration changes.
- No API routes.
- No frontend pages.
- No checkout, Stripe, auth, admin, or upload work.
- No generated scrape output committed.
- No image files committed.
- No Cloudinary upload.

## Open Review Items

- Confirm table freight, curbside, tax, regional, and shipping policy before
  public table checkout.
- Confirm Aqua paddle source URLs and source media before checkout.
- Confirm final route patterns before approving draft redirects.
- Run a separate media dedupe/upload task before using Cloudinary URLs.
- Crawl resource articles in a content-specific pass.
