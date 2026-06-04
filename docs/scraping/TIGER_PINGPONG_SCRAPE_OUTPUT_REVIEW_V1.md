# Tiger Ping Pong Scrape Output Review V1

## Source Reviewed

Generated output folder:

```text
var/scrapes/tigerpingpong/latest/
```

Scrape run generated: `2026-06-02T23:00:50.737Z`

This review covers the generated files only. It does not implement Prisma
schema, migrations, Supabase writes, API routes, frontend pages, checkout, image
uploads, or Cloudinary migration.

## Executive Summary

The scrape found real catalog structure and enough product signal to inform the
next data-model step, but the output is not import-ready.

The reality of the current TigerPingPong.ca catalog appears to be:

- A small, focused catalog with Tables and Accessories as top-level sections.
- Nested category pages for Indoor Tables, Outdoor Tables, Paddles, Ping Pong
  Balls, Covers, and Nets.
- Product families that matter more than categories alone: Expo, Portland,
  Whistler, Plaza, Tiger Premium 3-Star Balls, Newgy Balls, Vice Paddle, table
  covers, net sets, and replacement nets.
- The confirmed v1 brand model has one brand only: Tiger PingPong. Newgy
  wording should remain only in product/family/source/manufacturer/content
  fields where useful.
- Product names often encode variant-like decisions such as indoor/outdoor,
  color, pack size, and replacement/public-launch status.
- The generated option data is mostly scraper noise and should not be imported
  as variants without cleanup.
- Cloudinary migration should be treated as a real future task: all extracted
  image references currently point to BigCommerce CDN URLs.

## 1. Product Count By Category

Raw scrape category counts from `products_raw.json`:

| Raw category guess | Product rows |
| --- | ---: |
| Accessories | 11 |
| Tables | 6 |
| Total | 17 |

Reviewed unique-product count after removing the duplicate table-cover row:

| Reviewed category | Unique products |
| --- | ---: |
| Tables | 6 |
| Balls | 4 |
| Replacement Parts | 2 |
| Covers | 1 |
| Paddles | 1 |
| Nets | 1 |
| Accessories | 1 |
| Total unique products | 16 |

Notes:

- `Tiger PingPong Protective Ping Pong Table Cover Black Polyester` appears
  twice with the same source URL and slug candidate.
- The raw `productTypeGuess` field incorrectly labels many products as
  `paddle`. Product names and URLs are more trustworthy than that field for this
  review.
- All products have prices and at least one image candidate.

## 2. Category Structure Found

`categories.csv` found 11 category-like pages:

| Category page | Parent guess | Product link count |
| --- | --- | ---: |
| Home | | 16 |
| Sitemap | | 6 |
| Tables | | 12 |
| Indoor Tables | Tables | 8 |
| Outdoor Tables | Tables | 8 |
| Accessories | | 16 |
| Paddles | Accessories | 7 |
| Ping Pong Balls | Accessories | 9 |
| Covers | Accessories | 6 |
| Nets | Accessories | 7 |
| Resources | | 6 |

Recommended interpretation:

- Public catalog navigation should keep Tables and Accessories as the broad
  parents.
- The v1 public launch categories from planning are visible in the scrape:
  Tables, Paddles, Balls, Nets, Covers, and Accessories.
- Indoor Tables and Outdoor Tables behave like subcategories or filters under
  Tables.
- Resources is content, not a product category.
- Sitemap should not become a public catalog category.

## 3. Product Family Candidates

Strong product family candidates:

| Family candidate | Product examples | Notes |
| --- | --- | --- |
| Expo table | Expo Indoor, Expo Outdoor | Indoor/outdoor and color appear variant-like. |
| Portland table | Portland Indoor, Portland Outdoor | Indoor/outdoor and color appear variant-like. |
| Whistler table | Whistler Indoor | Color appears variant-like. |
| Plaza table | Plaza Outdoor | Grey appears in product name. |
| Tiger Premium 3-Star Balls | 6-pack orange, 6-pack white, 140-pack white/orange | Color and pack size should be modeled intentionally. |
| Newgy Balls | 144 balls orange | Newgy should remain as family/source/manufacturer wording only, not a separate v1 brand. |
| Vice Paddle | Vice Ping Pong Paddle | Size appears as a possible option label. |
| Paddle Case | Tiger PingPong Paddle Case | Accessory, likely simple product. |
| Table Cover | Protective Table Cover | Duplicate scrape row needs cleanup. |
| Nets and Replacement Nets | Net & Post Set, Replacement Net, Table Net Replacement Set | Replacement parts must be separated from v1 public checkout. |

## 4. Brand Candidates

Raw brand extraction found:

| Raw brand value | Product rows |
| --- | ---: |
| Tiger PingPong | 12 |
| Tiger | 5 |

Confirmed brand normalization:

- There is only one normalized v1 brand: `Tiger PingPong`.
- Raw `Tiger` values are treated as shorthand or extraction artifacts for
  Tiger PingPong.
- Do not model `Newgy` as a separate v1 brand.
- `Newgy` appears in `Newgy Table Tennis Balls 144 Balls Orange`, but should
  remain only as product/family/source/manufacturer/content wording.

Schema implication: brand should not be a freeform text field only. Use a
controlled brand list with only Tiger PingPong for v1 before import.

## 5. Variant And Option Patterns

`product_options.csv` contains 110 rows:

| Option signal | Rows | Import readiness |
| --- | ---: | --- |
| `revrating` review dropdown values | 85 | Noise. Do not import. |
| `Quantity:` labels | 17 | UI label noise. Do not import as product options. |
| `Color: (Required)` labels | 7 | Real option signal, but values were not extracted. |
| `Size: (Required)` label | 1 | Possible real option signal for the Vice Paddle. |

Real variant/option patterns inferred from product names:

- Table color: grey, green, blue.
- Table environment: indoor vs outdoor.
- Ball color: white vs orange.
- Ball pack size: 6, 140, 144.
- Paddle size: likely present on the Vice Paddle, but values need manual review.
- Net products split between public nets and deferred replacement net products.

Do not import `product_options.csv` directly. It mostly captures review-rating
and quantity UI, not sellable variant choices.

## 6. Missing SKU Issues

Six product rows have missing SKU flags:

- Tiger PingPong Table Net Replacement Set
- Tiger PingPong Protective Ping Pong Table Cover Black Polyester
- Tiger PingPong Vice Ping Pong Paddle
- Tiger PingPong Whistler Indoor Ping Pong Table Green or Blue
- Tiger PingPong Protective Ping Pong Table Cover Black Polyester duplicate row
- Tiger PingPong Premium 3-Star Ping Pong Balls 140 Balls White or Orange

Impact:

- These products should not be checkout imports until SKU values are confirmed.
- Missing SKU is especially important for tables and future Cloudinary asset
  naming, because SKU is a stable operational handle.

## 7. Missing Image Issues

No missing-image flags were generated.

However, images are not production-ready:

- `product_images_manifest.csv` contains 182 image rows.
- All image source hosts are `cdn11.bigcommerce.com`.
- Rows include multiple image sizes and thumbnails.
- Suggested Cloudinary IDs are useful planning metadata, not approved final
  asset IDs.

## 8. Missing Price Issues

No products are missing prices in this scrape output.

Observed prices range from low-cost accessories and balls to tables:

- Replacement Net: `$28`
- Paddle Case: `$12`
- Balls: `$8`, `$96`, `$100`
- Cover: `$55`
- Nets: `$59`, `$140`
- Tables: `$1200` to `$2600`

Impact:

- Price presence is encouraging.
- Checkout readiness still depends on SKU, availability, shipping, tax, and
  table freight policy.

## 9. Replacement Parts Discovered

Replacement/deferred products found:

| Product | Source path | Price | SKU |
| --- | --- | ---: | --- |
| Tiger PingPong Table Net Replacement Set | `/accessories/tiger-pingpong-table-net-replacement-set` | `$140` | Missing |
| Replacement Net | `/accessories/replacement-net` | `$28` | `8367` |

Related public-net product:

- `Table Tennis Net & Post Set` appears to be a public Nets product, but the
  scrape flagged replacement-related text in its description. It needs manual
  review before deciding checkout/public navigation behavior.

Decision implication:

- Replacement Parts should remain scraped and preserved for review and
  redirects.
- They should not enter v1 public navigation or checkout scope.

## 10. Resource And Article Findings

`resources_articles.csv` is empty.

The crawl discovered, but did not fetch within the 30-page cap, these resource
article URLs:

- `/resources/choose-a-ping-pong-table`
- `/resources/ping-pong-rules`
- `/resources/room-size`
- `/resources/indoor-vs-outdoor-ping-pong-tables`

Static pages found:

- `/shipping-returns`
- `/about`

The `/contact` seed was discovered but not fetched before the page cap was hit.

Impact:

- Resource content exists and should be crawled in a content-specific pass.
- The current output is product-catalog useful, but incomplete for content and
  resource import planning.

## 11. Redirect Findings

`redirect_map_draft.csv` contains 30 draft rows:

| Page type | Draft redirect rows |
| --- | ---: |
| Product | 17 |
| Category | 11 |
| Static page | 2 |

Findings:

- Draft product redirects use `/products/{slug}`.
- Draft category redirects use `/categories/{slug}`.
- `/shipping-returns` and `/about` currently map to themselves.
- `/resources` is mapped as a category, but should likely be a content route.
- The duplicate table-cover product creates duplicate redirect candidates.

Do not import redirects until final frontend route patterns are approved.

## 12. Cloudinary Migration Observations

The media manifest is useful for planning, not for production import.

Observed:

- 182 image rows.
- 17 primary image guesses and 165 gallery rows.
- All source URLs are BigCommerce CDN URLs.
- File formats: 173 JPG, 9 PNG.
- Multiple dimensions and thumbnail variants appear for the same underlying
  product asset.
- Suggested Cloudinary folder paths are useful planning hints, but final folder
  paths should be reviewed against the normalized catalog/media workflow.

Recommendations:

- Use `source_url` only as original-source metadata.
- Upload original/highest-quality source images to Cloudinary in a separate
  explicit media task.
- Dedupe thumbnails and alternate sizes before upload.
- Keep `cloudinary_public_id`, `cloudinary_secure_url`, `source_url`,
  `alt_text`, `title`, `caption`, `width`, `height`, `format`, `sort_order`,
  and `is_primary` available in the future `product_media` model.

## 13. Brand -> Product Family -> Product -> Variant Implications

The catalog should not be modeled as flat products only.

Recommended hierarchy:

1. Brand
2. Product family
3. Product
4. Variant

Examples:

- Brand: Tiger PingPong
  Family: Portland Table
  Product: Portland Indoor Table
  Variants: grey, green, blue

- Brand: Tiger PingPong
  Family: Expo Table
  Product: Expo Indoor Table and Expo Outdoor Table
  Variants: color values, possibly indoor/outdoor as product or variant

- Brand: Tiger PingPong
  Family: Premium 3-Star Balls
  Product: 6-pack balls and 140-pack balls
  Variants: white, orange

- Brand: Tiger PingPong
  Family: Newgy Robo-Balls
  Product: 144-pack balls
  Variant: orange

Schema implication:

- Categories answer "where does it browse?"
- Families answer "what product line is this?"
- Variants answer "which purchasable SKU/configuration is this?"

Those concepts should not be collapsed into one field.

## 14. Risks Before Prisma Schema

Key risks:

- Product type guesses are unreliable and should not drive schema or seed data.
- Option extraction is mostly noise from review-rating and quantity controls.
- Product family and variant boundaries need business review.
- Raw brand extraction splits Tiger/Tiger PingPong and misses Newgy wording in
  source names; reviewed v1 mapping should normalize the brand to Tiger
  PingPong only.
- Duplicate product rows would create duplicate products and redirects.
- Replacement parts are present and must be kept out of v1 public checkout.
- Tables are priced but still require freight, curbside, tax, regional, and
  shipping policy confirmation before public checkout.
- Resource article extraction is incomplete because the bounded scrape did not
  fetch article pages.
- Cloudinary upload strategy is not implemented and image dedupe is needed.

## 15. Recommended Schema Adjustments

Adjust the planned schema before implementation:

- Add `brands` or an equivalent controlled brand reference with Tiger PingPong
  as the only v1 brand.
- Add `product_families` or family fields so Expo, Portland, Whistler, Plaza,
  Premium 3-Star Balls, and Newgy Balls are not lost.
- Keep categories separate from families.
- Add import/source fields such as `source_url`, `legacy_path`,
  `source_platform`, `source_status`, and `import_review_status`.
- Keep product-level `purchase_mode`, but support SKU/variant-level overrides.
- Ensure `product_variants` can represent color, pack size, size, and possibly
  indoor/outdoor choices.
- Add product media fields for Cloudinary: `cloudinary_public_id`,
  `cloudinary_secure_url`, `source_url`, `alt_text`, `title`, `caption`,
  `width`, `height`, `format`, `sort_order`, and `is_primary`.
- Add a way to mark replacement parts as preserved but excluded from v1 public
  navigation and checkout.
- Consider redirect records as launch-support data, but only after frontend
  route patterns are final.

## 16. Recommended Next Implementation Task

Recommended next task:

Create a normalized catalog import mapping document from this scrape review.

That task should:

- Produce a manually reviewed product/family/category mapping table.
- Map raw Tiger/Tiger PingPong extraction values to the single Tiger PingPong
  v1 brand and retain Newgy only as product/family/source/manufacturer wording.
- Deduplicate the table-cover product.
- Confirm which table products are products vs variants.
- Confirm ball color and pack-size variant strategy.
- Confirm public Nets vs deferred Replacement Parts.
- Define approved Cloudinary folder/public ID rules without uploading images.
- Produce an import-ready CSV shape for the later Prisma/schema task.

Do not move directly from the current generated files into Prisma schema or
seed data.
