# 005: Catalog Normalization Build Log

## What Was Added

- `docs/catalog/TIGER_PINGPONG_CATALOG_NORMALIZATION_V1.md`
- `docs/catalog/TIGER_PINGPONG_BRAND_FAMILY_PRODUCT_VARIANT_MAP_V1.md`
- `docs/catalog/TIGER_PINGPONG_IMPORT_CSV_SPEC_V1.md`
- `docs/media/TIGER_PINGPONG_CLOUDINARY_MEDIA_WORKFLOW_V1.md`

## Source Inputs

- `var/scrapes/tigerpingpong/latest/products_raw.json`
- `var/scrapes/tigerpingpong/latest/products_clean.csv`
- `var/scrapes/tigerpingpong/latest/categories.csv`
- `var/scrapes/tigerpingpong/latest/product_options.csv`
- `var/scrapes/tigerpingpong/latest/product_images_manifest.csv`
- `var/scrapes/tigerpingpong/latest/scrape_flags.csv`
- `docs/scraping/TIGER_PINGPONG_SCRAPE_OUTPUT_REVIEW_V1.md`
- `docs/scraping/TIGER_PINGPONG_IMPORT_READINESS_V1.md`

## Summary

The normalization docs translate raw scrape findings into a proposed
Brand -> Product Family -> Product -> Variant shape.

Key normalization decisions:

- Keep categories separate from product families.
- Normalize every v1 product to the single confirmed brand: Tiger PingPong.
- Keep Newgy as product/family/source/manufacturer wording only, not as a
  separate v1 brand.
- Deduplicate the table-cover scrape row.
- Keep Replacement Parts preserved but deferred from v1 public navigation and
  checkout.
- Treat scrape option output as mostly noise until manually reviewed.
- Preserve BigCommerce image URLs as source metadata only.
- Plan Cloudinary fields, folders, naming, roles, dedupe, upload review, and
  transformations without uploading images.

## Intentionally Not Changed

- Prisma schema
- SQL or migrations
- Supabase data
- API routes
- Frontend pages
- Cart or checkout
- Stripe
- Auth
- Admin screens
- Cloudinary uploads
- Downloaded/raw image files
- Generated scrape output

## Recommended Next Step

Create manually reviewed import CSV artifacts from
`TIGER_PINGPONG_IMPORT_CSV_SPEC_V1.md`. Those CSVs should be reviewed before
any Prisma schema, migration, seed, or data import task begins.
