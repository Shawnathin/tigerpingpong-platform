# 007: Normalized Import CSV V1 Build Log

## What Was Added

- Review-only normalized CSV artifacts in
  `data/import-review/tigerpingpong/v1/`.
- One v1 brand row for Tiger PingPong only.
- Reviewed category, family, product, variant, media, redirect, and review-flag
  CSVs following `docs/catalog/TIGER_PINGPONG_IMPORT_CSV_SPEC_V1.md`.
- Sixteen reviewed unique product rows after deduplicating the duplicate table
  cover source row.
- Conservative variant candidates for table colors, ball color/pack sizes, and
  the Vice Paddle size placeholder.
- Primary source-media candidates from the scrape manifest with planned
  Cloudinary folders/public IDs and blank `cloudinary_secure_url` fields.
- Draft redirects only.

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
| `product_families_import_v1.csv` | 11 |
| `products_import_v1.csv` | 16 |
| `product_variants_import_v1.csv` | 20 |
| `product_media_import_v1.csv` | 16 |
| `redirects_draft_v1.csv` | 28 |
| `import_review_flags_v1.csv` | 24 |

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

- Confirm missing SKUs before checkout.
- Confirm table freight, curbside, tax, regional, and shipping policy before
  public table checkout.
- Confirm table color variant values and SKU mapping.
- Confirm whether the 140-pack balls color is selectable.
- Confirm Vice Paddle size values.
- Confirm whether `Table Tennis Net & Post Set` is public checkout-ready.
- Run a separate media dedupe/upload task before using Cloudinary URLs.
- Crawl resource articles in a content-specific pass.
- Approve frontend route patterns before redirect import.
