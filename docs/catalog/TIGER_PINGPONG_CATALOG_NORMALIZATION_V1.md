# Tiger Ping Pong Catalog Normalization V1

## Purpose

This document converts the generated scrape review into a normalized catalog
planning shape. It is documentation only. It does not implement Prisma schema,
SQL, migrations, Supabase writes, API routes, frontend pages, checkout,
Cloudinary uploads, auth, or admin screens.

Source reviewed:

```text
var/scrapes/tigerpingpong/latest/
```

Related review docs:

- `docs/scraping/TIGER_PINGPONG_SCRAPE_OUTPUT_REVIEW_V1.md`
- `docs/scraping/TIGER_PINGPONG_IMPORT_READINESS_V1.md`

## Normalization Verdict

The scrape output is useful for planning, but it is not safe to import directly.

Normalize before schema/import work:

- Deduplicate product rows.
- Normalize all v1 products to the single approved brand.
- Separate categories from product families.
- Preserve replacement parts without putting them in v1 public navigation or
  checkout.
- Replace noisy option extraction with manually approved variant groups.
- Keep BigCommerce image URLs as source metadata only.

## Current Catalog Reality

Reviewed unique products: 16.

Reviewed category counts:

| Category | Unique products | V1 public navigation | V1 checkout scope |
| --- | ---: | --- | --- |
| Tables | 6 | Yes | Yes, after table policy review |
| Balls | 4 | Yes | Yes, after SKU/variant cleanup |
| Replacement Parts | 2 | No | No |
| Covers | 1 | Yes | Yes, after SKU review |
| Paddles | 1 | Yes | Yes, after SKU/option review |
| Nets | 1 | Yes | Yes, after purchase-mode review |
| Accessories | 1 | Yes | Yes, after purchase-mode review |

Raw scrape rows: 17.

Duplicate row to collapse:

- `Tiger PingPong Protective Ping Pong Table Cover Black Polyester`

## Category Normalization

Recommended v1 public navigation:

- Tables
- Paddles
- Balls
- Nets
- Covers
- Accessories

Recommended category hierarchy:

| Category key | Parent key | Name | V1 public navigation | Notes |
| --- | --- | --- | --- | --- |
| `tables` | | Tables | Yes | Top-level catalog section. |
| `indoor-tables` | `tables` | Indoor Tables | Yes | Can be subcategory or filter. |
| `outdoor-tables` | `tables` | Outdoor Tables | Yes | Can be subcategory or filter. |
| `paddles` | `accessories` | Paddles | Yes | Public launch category. |
| `balls` | `accessories` | Balls | Yes | Normalize legacy "Ping Pong Balls" to "Balls". |
| `nets` | `accessories` | Nets | Yes | Keep public nets separate from replacement parts. |
| `covers` | `accessories` | Covers | Yes | Public launch category. |
| `accessories` | | Accessories | Yes | Broad section and catch-all category. |
| `replacement-parts` | | Replacement Parts | No | Preserve for future review and redirects only. |
| `resources` | | Resources | No | Content section, not product category. |

Do not import these as product categories:

- Home
- Sitemap
- Resources article index if content routes are separate

## Brand Normalization

Confirmed v1 brand decision:

- There is only one normalized v1 brand: `Tiger PingPong`.
- Do not model Newgy as a separate brand in v1.
- `Newgy` may remain in product names, product family names, source notes,
  manufacturer/source evidence notes, or SEO/content fields where useful.

| Brand key | Name | Source evidence | Notes |
| --- | --- | --- | --- |
| `tiger-pingpong` | Tiger PingPong | Site branding, product names, and confirmed business decision | Normalize all v1 catalog products to this brand. |

Do not treat raw brand extraction as final. It splits Tiger/Tiger PingPong and
does not reflect the confirmed single-brand v1 decision.

## Product Family Normalization

Product families should be modeled separately from categories.

Recommended family candidates:

| Family key | Brand | Family name | Primary category | Notes |
| --- | --- | --- | --- | --- |
| `plaza-table` | Tiger PingPong | Plaza Table | Tables | Outdoor table currently found. |
| `whistler-table` | Tiger PingPong | Whistler Table | Tables | Indoor table currently found. |
| `portland-table` | Tiger PingPong | Portland Table | Tables | Indoor and outdoor products found. |
| `expo-table` | Tiger PingPong | Expo Table | Tables | Indoor and outdoor products found. |
| `premium-3-star-balls` | Tiger PingPong | Premium 3-Star Balls | Balls | Pack size and color variants. |
| `newgy-robo-balls` | Tiger PingPong | Newgy Robo-Balls | Balls | Keep Newgy as family/source wording only, not as a separate v1 brand. |
| `vice-paddle` | Tiger PingPong | Vice Paddle | Paddles | Possible size option. |
| `paddle-accessories` | Tiger PingPong | Paddle Accessories | Accessories | Paddle case found. |
| `table-covers` | Tiger PingPong | Table Covers | Covers | One duplicate source row found. |
| `net-sets` | Tiger PingPong | Net Sets | Nets | Public net/post product. |
| `replacement-nets` | Tiger PingPong | Replacement Nets | Replacement Parts | Deferred from v1 public navigation and checkout. |

## Product And Variant Boundaries

### Tables

Tables should remain purchasable in v1 planning, but every table requires
shipping/freight/curbside/tax/region policy review before public checkout.

Recommended modeling:

- Family: Expo Table
  - Products: Expo Indoor Table, Expo Outdoor Table
  - Variants: colors from product name, pending exact option values
- Family: Portland Table
  - Products: Portland Indoor Table, Portland Outdoor Table
  - Variants: colors from product name, pending exact option values
- Family: Whistler Table
  - Product: Whistler Indoor Table
  - Variants: green and blue, pending exact SKU/value mapping
- Family: Plaza Table
  - Product: Plaza Outdoor Table
  - Variant: grey

Open decision before import:

- Whether indoor/outdoor should be separate products or a variant option within
  the same family. For v1, separate products under one family is simpler and
  matches current URLs.

### Balls

Recommended modeling:

- Family: Tiger PingPong Premium 3-Star Balls
  - Variants by pack size and color.
  - Known rows: 6 orange, 6 white, 140 white/orange.
- Family: Newgy Robo-Balls
  - Product/variant: 144 orange.
  - Normalized brand: Tiger PingPong.
  - `Newgy` retained as product/family/source/manufacturer wording only.

Open issue:

- `White or Orange` in the 140-pack product name likely means selectable color,
  but the scrape did not capture option values. Confirm before import.

### Paddles

Recommended modeling:

- Family: Vice Paddle
- Product: Vice Ping Pong Paddle
- Possible option: size

Open issue:

- `Size: (Required)` was detected, but no size values were extracted. Confirm
  manually before creating variants.

### Nets And Replacement Parts

Recommended split:

- `Table Tennis Net & Post Set`: public Nets category candidate.
- `Tiger PingPong Table Net Replacement Set`: Replacement Parts, deferred.
- `Replacement Net`: Replacement Parts, deferred.

Replacement Parts should be preserved for redirects and future planning, but
excluded from v1 public navigation and checkout.

### Covers And Accessories

Recommended modeling:

- `Tiger PingPong Protective Ping Pong Table Cover Black Polyester`: Covers.
- `Tiger PingPong - Ping Pong Paddle Case`: Accessories.

Open issue:

- Table cover row is duplicated in the scrape output and missing SKU. Import
  only one reviewed row after SKU confirmation.

## Purchase Mode Normalization

Recommended normalized purchase states:

| Product group | Normalized purchase mode | Notes |
| --- | --- | --- |
| Tables | `online_checkout_candidate` | Public launch allowed only after table shipping/freight/tax/region policy confirmation. |
| Balls | `online_checkout_candidate` | Confirm SKU and variant mapping first. |
| Covers | `online_checkout_candidate` | Confirm missing SKU first. |
| Paddles | `online_checkout_candidate` | Confirm missing SKU and size option first. |
| Nets | `online_checkout_candidate` or `needs_manual_review` | Confirm whether the net/post set is public checkout-ready. |
| Accessories | `online_checkout_candidate` or `needs_manual_review` | Confirm add-to-cart and SKU behavior. |
| Replacement Parts | `deferred_from_v1` | Preserve but exclude from public navigation and checkout. |

Do not use scrape `needs_manual_review` as the final purchase mode. It often
means the crawler did not see an add-to-cart signal, not that the product is
business-approved for quote-only handling.

## SKU Normalization

Missing SKU products:

- Tiger PingPong Table Net Replacement Set
- Tiger PingPong Protective Ping Pong Table Cover Black Polyester
- Tiger PingPong Vice Ping Pong Paddle
- Tiger PingPong Whistler Indoor Ping Pong Table Green or Blue
- Tiger PingPong Premium 3-Star Ping Pong Balls 140 Balls White or Orange

The table cover appeared twice in the raw scrape, but should count as one
missing-SKU product after dedupe.

Rules:

- Do not import checkout products without SKU review.
- Allow products to exist as draft/import-review rows if SKU is missing.
- Prefer variant-level SKU where color/pack/size choices are real.

## Media Normalization

Cloudinary is the future media host.

Current scrape reality:

- All source image URLs are BigCommerce CDN URLs.
- The media manifest includes duplicate sizes/thumbnails.
- Source URLs should be preserved as `source_url`.
- Cloudinary public IDs and folders are suggestions, not approved uploaded
  assets.

Recommended media rule:

- Do not hotlink BigCommerce/CDN images as final production media.
- Do not import image rows as final product media until a later Cloudinary
  migration task dedupes, uploads, and records Cloudinary references.

## Import Readiness

Ready for:

- Manual normalization.
- Schema planning adjustments.
- Import CSV shape design.

Not ready for:

- Direct product import.
- Direct variant import.
- Direct media import.
- Direct redirects.
- Public checkout.

## Recommended Next Step

Create and review normalized CSV files using
`TIGER_PINGPONG_IMPORT_CSV_SPEC_V1.md` before implementing Prisma schema.

The next implementation task after approval should be:

```text
docs/catalog-normalized-import-csv-v1
```

That task should create reviewed CSV artifacts, not database rows.
