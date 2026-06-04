# 005: Catalog Normalization Build Log

## What Was Added

- `docs/catalog/TIGER_PINGPONG_CATALOG_NORMALIZATION_V1.md`
- `docs/catalog/TIGER_PINGPONG_BRAND_FAMILY_PRODUCT_VARIANT_MAP_V1.md`
- `docs/catalog/TIGER_PINGPONG_IMPORT_CSV_SPEC_V1.md`

## Summary

The catalog normalization docs translate scrape review findings into the
confirmed v1 planning shape:

```text
Brand
-> Product Family
-> Product
-> Variant
```

Key decisions captured:

- One v1 brand only: Tiger PingPong.
- No Newgy brand row in v1.
- Newgy wording is retained only as product/family/source/manufacturer/content
  wording.
- Categories remain separate from product families.
- Tables are online checkout candidates but require freight, curbside, tax,
  region, and shipping policy review before public checkout.
- Replacement Parts are preserved but deferred from v1 public navigation and
  checkout.
- Product images will be hosted in Cloudinary in the future.
- BigCommerce image URLs are source metadata only.

## Product Families Captured

- Expo Table
- Portland Table
- Whistler Table
- Plaza Table
- Premium 3-Star Balls
- Newgy Robo-Balls
- Vice Paddle
- Paddle Accessories
- Table Covers
- Net Sets
- Replacement Nets

## Import CSV Spec Captured

- `brands_import_v1.csv`
- `categories_import_v1.csv`
- `product_families_import_v1.csv`
- `products_import_v1.csv`
- `product_variants_import_v1.csv`
- `product_media_import_v1.csv`
- `redirects_draft_v1.csv`
- `import_review_flags_v1.csv`

The brand starter row includes only Tiger PingPong. No Newgy brand row is
included.

## Intentionally Not Changed

- Prisma schema
- SQL or migrations
- Supabase data
- API routes
- Frontend pages
- Checkout, Stripe, auth, or admin
- Cloudinary uploads
- Generated scrape output files

## Recommended Next Step

Review and approve the normalization docs before any Prisma schema, migration,
seed, or data import task begins.

