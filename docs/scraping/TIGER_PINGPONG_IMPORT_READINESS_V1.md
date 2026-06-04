# Tiger Ping Pong Import Readiness V1

## Verdict

The scrape output is not ready for direct import.

It is ready for schema planning and manual normalization.

Before Prisma schema work begins, the catalog needs an approved
Brand -> Product Family -> Product -> Variant map and reviewed import CSV
shape.

## Readiness Summary

| Area | Status | Reason |
| --- | --- | --- |
| Product count | Needs cleanup | 17 raw product rows, 16 reviewed unique products after deduping the table cover. |
| Categories | Planning-ready | Tables, Accessories, and subcategory signals are clear, but categories must stay separate from families. |
| Brand | Planning-ready | Single v1 brand is confirmed: Tiger PingPong only. |
| Product families | Needs approval | Expo, Portland, Whistler, Plaza, ball, paddle, cover, net, and replacement-net families need final review. |
| Products | Needs manual normalization | Raw product names encode family, environment, color, pack size, and replacement status. |
| Variants | Not import-ready | Generated option output is mostly noise and real option values need manual confirmation. |
| SKUs | Not import-ready | Six raw rows are missing SKUs. |
| Prices | Review-ready | No missing prices were found. |
| Images | Not import-ready | Images exist, but current URLs are BigCommerce CDN source metadata and need later Cloudinary migration. |
| Tables | Policy review required | Tables are online checkout candidates, but freight/curbside/tax/region/shipping policy must be confirmed before public checkout. |
| Replacement Parts | Deferred | Preserve records, but exclude from v1 public navigation and checkout. |
| Resources | Incomplete | Resource articles were discovered but not fully fetched in the capped run. |
| Redirects | Draft only | Route patterns are not approved yet. |

## Product Counts

Reviewed unique-product counts:

- Tables: 6
- Balls: 4
- Replacement Parts: 2
- Covers: 1
- Paddle: 1
- Net: 1
- Accessory: 1
- Total unique products: 16

Raw scrape rows:

- Total raw product rows: 17
- Duplicate raw row: `Tiger PingPong Protective Ping Pong Table Cover Black
  Polyester`

## Import Blockers

- Approved brand/family/product/variant mapping does not exist yet.
- Product option output is mostly storefront UI noise.
- Six raw product rows are missing SKUs.
- Replacement Parts need preserved/deferred handling.
- Tables require freight, curbside, tax, region, and shipping policy review
  before public checkout.
- Product media must be migrated to Cloudinary in a later task.
- BigCommerce image URLs must remain source metadata only.
- Resource article content was not fully fetched.
- Draft redirects need approved route patterns.

## Brand Readiness

Ready for v1 planning:

- Brand starter list must contain only `Tiger PingPong`.
- Raw `Tiger` and `Tiger PingPong` values normalize to `Tiger PingPong`.
- Newgy is not a v1 brand row.
- Newgy may remain only in product/family/source/manufacturer/content wording.

## Family And Variant Readiness

Ready for manual review:

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

Not ready for automated import:

- Table colors and indoor/outdoor handling.
- Ball pack sizes and colors.
- Paddle size values.
- Replacement net public/deferred split.

## Media Readiness

Not ready for direct media import.

Required later work:

- Choose Cloudinary folder and public ID conventions.
- Dedupe BigCommerce thumbnail/size variants.
- Upload selected source images to Cloudinary.
- Store Cloudinary references/URLs in the database.
- Preserve BigCommerce URLs as source metadata.

No image files should be committed, and no Cloudinary upload work belongs in
this task.

## Recommended Next Step

Approve the normalization docs and create reviewed import CSV artifacts from
`docs/catalog/TIGER_PINGPONG_IMPORT_CSV_SPEC_V1.md`.

Only after that review should Prisma schema implementation begin.

