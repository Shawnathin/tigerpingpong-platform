# 004: Scrape Output Review Build Log

## What Was Added

- `docs/scraping/TIGER_PINGPONG_SCRAPE_OUTPUT_REVIEW_V1.md`
- `docs/scraping/TIGER_PINGPONG_IMPORT_READINESS_V1.md`

## What Was Reviewed

Generated scrape output under:

```text
var/scrapes/tigerpingpong/latest/
```

Generated scrape files remain uncommitted.

## Summary

The scrape output is useful for schema planning and manual normalization, but it
is not ready for direct import.

Reviewed findings:

- 17 raw product rows.
- 16 reviewed unique products.
- 6 tables.
- 4 balls.
- 2 replacement parts.
- 1 cover.
- 1 paddle.
- 1 net.
- 1 accessory.
- Product option output is mostly noise.
- Six raw product rows are missing SKUs.
- No products are missing prices.
- No products are missing images.
- Images are BigCommerce CDN URLs and need later Cloudinary migration.
- Resource articles were discovered but not fully fetched in the capped run.

## Business Decisions Reflected

- There is only one v1 brand: Tiger PingPong.
- Newgy is not modeled as a separate v1 brand.
- Newgy may remain only as product/family/source/manufacturer/content wording.
- Tables are online checkout candidates, but require freight, curbside, tax,
  region, and shipping policy review before public checkout.
- Replacement Parts are preserved but deferred from v1 public navigation and
  checkout.
- Cloudinary is the future product media host.
- BigCommerce image URLs are source metadata only.

## Intentionally Not Changed

- Prisma schema
- SQL or migrations
- Supabase data
- API routes
- Frontend pages
- Checkout, Stripe, auth, or admin
- Cloudinary uploads
- Generated scrape output files

## Next Step

Approve a normalized Brand -> Product Family -> Product -> Variant map before
Prisma schema work begins.

