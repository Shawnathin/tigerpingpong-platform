# Tiger Ping Pong Import Readiness V1

## Readiness Verdict

Not ready for direct product import.

Ready for schema planning and manual normalization.

The scrape output contains useful evidence, but it still needs review before it
can become database seed/import data.

## Readiness By Area

| Area | Status | Reason |
| --- | --- | --- |
| Category structure | Mostly ready | Tables and Accessories structure is clear; Resources should be content. |
| Product list | Needs cleanup | 17 rows, but one duplicate table-cover row. |
| Product categories | Needs normalization | Raw output only says Accessories/Tables; reviewed categories are richer. |
| Brands | Mostly ready | Confirmed v1 brand list has only Tiger PingPong; raw Tiger/Newgy wording still needs mapping notes. |
| Product families | Needs modeling | Expo, Portland, Whistler, Plaza, balls, nets, and covers need family grouping. |
| Variants/options | Not ready | Option file mostly contains review-rating and quantity UI noise. |
| SKUs | Needs manual review | Six rows are missing SKUs. |
| Prices | Mostly ready | All product rows have a visible price. |
| Images | Needs media task | Images exist, but all point to BigCommerce CDN and need Cloudinary migration. |
| Replacement parts | Needs rules | Found and should be preserved, but excluded from v1 public checkout. |
| Static pages | Partial | About and shipping/returns found; contact was not fetched in capped run. |
| Resources/articles | Not ready | Resource article URLs discovered but not fetched. |
| Redirects | Draft only | Final frontend routes are not approved. |
| Checkout readiness | Not ready | Table shipping/freight/tax/region policy still required. |

## Product Counts

Raw scrape category counts:

- Accessories: 11 product rows
- Tables: 6 product rows
- Total: 17 product rows

Reviewed unique-product counts:

- Tables: 6
- Balls: 4
- Replacement Parts: 2
- Covers: 1
- Paddles: 1
- Nets: 1
- Accessories: 1
- Total unique products: 16

## Import Blockers

- Duplicate product: `Tiger PingPong Protective Ping Pong Table Cover Black
  Polyester`.
- Missing SKUs on six product rows.
- Product type guessing is unreliable.
- Option extraction is not variant-ready.
- Brand normalization must enforce the one-brand v1 decision: Tiger PingPong
  only, with no Newgy brand row.
- Product family boundaries are not yet approved.
- Replacement parts need preserved/deferred handling.
- Cloudinary migration is only planned, not executed.
- Resource articles were discovered but not extracted.
- Table checkout cannot launch without freight, curbside, tax, regional, and
  shipping policy decisions.

## Import-Ready Fields

These fields are generally useful as review inputs:

- `sourceUrl`
- `legacyPath`
- `slugCandidate`
- `productName`
- `categoryGuess`
- `visiblePrice`
- `priceCents`
- `availability`
- `description`
- `imageUrls`
- `purchaseModeGuess`

These fields require manual review before import:

- `productTypeGuess`
- `brand`
- `sku`
- `optionCandidates`
- `purchaseModeNotes`
- `confidenceNotes`

## Recommended Manual Mapping Columns

Before schema implementation, create a normalized review spreadsheet with:

- `approved_brand`
- `approved_family`
- `approved_product_name`
- `approved_category`
- `approved_subcategory`
- `is_replacement_part`
- `v1_public_navigation`
- `v1_checkout_scope`
- `purchase_mode`
- `approved_sku`
- `variant_group`
- `variant_option_1_name`
- `variant_option_1_value`
- `variant_option_2_name`
- `variant_option_2_value`
- `price_cents`
- `source_url`
- `legacy_path`
- `primary_source_image_url`
- `cloudinary_folder`
- `cloudinary_public_id_candidate`
- `manual_review_notes`

## Schema Planning Implications

The Prisma schema should be adjusted before implementation to support:

- Brands as controlled data, with only Tiger PingPong in the v1 import set.
- Product families separate from categories.
- Product variants with option values.
- Replacement products preserved but hidden from v1 public launch and checkout.
- Cloudinary media references and original source URL metadata.
- Legacy URL/source fields for import traceability.
- Draft redirects after route decisions are final.

## Next Task Recommendation

Do a manual catalog normalization pass before writing Prisma schema.

Recommended task name:

```text
docs/catalog-import-normalization-v1
```

Expected output:

- Approved brand/family/product/variant mapping with Tiger PingPong as the only
  v1 brand.
- Deduplicated product list.
- Confirmed replacement-part exclusions.
- Confirmed table product and variant boundaries.
- Confirmed Cloudinary naming rules.
- Import-ready CSV shape for the later schema/import work.

Only after that should the Prisma schema task begin.
