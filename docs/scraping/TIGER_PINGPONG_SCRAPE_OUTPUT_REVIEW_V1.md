# Tiger Ping Pong Scrape Output Review V1

## Purpose

This document reviews the generated TigerPingPong.ca scrape output for catalog
planning. It is documentation only.

It does not implement Prisma schema, add migrations, write to Supabase, add API
routes, build frontend pages, add checkout, add Stripe, add auth, add admin
features, upload images to Cloudinary, or commit generated scrape output files.

## Source Reviewed

Generated output folder:

```text
var/scrapes/tigerpingpong/latest/
```

Generated scrape output remains local and gitignored. This review summarizes
the output; it does not commit generated files from `var/scrapes/`.

## Summary Verdict

The scrape output is useful for schema planning and manual catalog
normalization, but it is not ready for direct product import.

Important findings:

- 17 raw product rows were found.
- 16 reviewed unique products remain after deduplicating the duplicate table
  cover row.
- Product option output is mostly noise and should not be imported directly.
- Six raw product rows are missing SKUs.
- No product rows are missing prices.
- No product rows are missing images.
- Current product image URLs are BigCommerce CDN URLs and must be treated as
  source metadata only until a later Cloudinary migration.
- Resource article URLs were discovered, but article content was not fully
  fetched in the capped run.

## Product Counts

Raw scrape product rows:

| Raw group | Product rows |
| --- | ---: |
| Tables | 6 |
| Accessories | 11 |
| Total | 17 |

Reviewed unique products:

| Reviewed group | Unique products |
| --- | ---: |
| Tables | 6 |
| Balls | 4 |
| Replacement Parts | 2 |
| Covers | 1 |
| Paddle | 1 |
| Net | 1 |
| Accessory | 1 |
| Total | 16 |

Duplicate row to collapse before import:

- `Tiger PingPong Protective Ping Pong Table Cover Black Polyester`

## Category Signals

The scrape confirms broad current catalog navigation around Tables and
Accessories, with nested pages for indoor tables, outdoor tables, paddles,
balls, covers, and nets.

Recommended interpretation:

- Categories answer where products browse.
- Product families answer what product line the item belongs to.
- Categories should remain separate from product families.
- Resources is a content section, not a product category.
- Sitemap and Home should not become product categories.

## Brand Signals

Confirmed v1 brand decision:

- There is only one v1 brand: `Tiger PingPong`.
- Do not model Newgy as a separate v1 brand.
- Newgy may remain only as product/family/source/manufacturer/content wording.

Raw brand extraction split some rows between `Tiger PingPong` and `Tiger`. That
split should be normalized to `Tiger PingPong`. The product named `Newgy Table
Tennis Balls 144 Balls Orange` should also normalize to brand `Tiger PingPong`
for v1, while retaining Newgy wording where useful for source evidence and
content clarity.

## Product Family Signals

Strong family candidates from the reviewed output:

| Family candidate | Reviewed interpretation |
| --- | --- |
| Expo Table | Table family with indoor/outdoor products and color choices. |
| Portland Table | Table family with indoor/outdoor products and color choices. |
| Whistler Table | Table family with an indoor product and color choices. |
| Plaza Table | Table family with an outdoor grey product. |
| Premium 3-Star Balls | Tiger PingPong balls with pack-size and color choices. |
| Newgy Robo-Balls | Balls family under Tiger PingPong brand; Newgy wording retained only as family/source/manufacturer wording. |
| Vice Paddle | Paddle family with a possible size option. |
| Paddle Accessories | Paddle case/accessory family. |
| Table Covers | Cover family; duplicate scrape row must be deduped. |
| Net Sets | Public net/post set candidate. |
| Replacement Nets | Replacement Parts family deferred from v1 public navigation and checkout. |

## Product Options Review

The generated `product_options.csv` should not be imported directly.

Most option rows are storefront/UI noise:

- Review rating dropdown values are not product options.
- Quantity labels are not product options.
- Detected color and size labels are useful signals, but the scrape did not
  reliably extract final sellable option values.

Manual variant review is still required for:

- Table color.
- Table indoor/outdoor handling.
- Ball color.
- Ball pack size.
- Paddle size.

## SKU Review

Six raw product rows are missing SKUs:

- Tiger PingPong Table Net Replacement Set
- Tiger PingPong Protective Ping Pong Table Cover Black Polyester
- Tiger PingPong Vice Ping Pong Paddle
- Tiger PingPong Whistler Indoor Ping Pong Table Green or Blue
- Tiger PingPong Protective Ping Pong Table Cover Black Polyester duplicate row
- Tiger PingPong Premium 3-Star Ping Pong Balls 140 Balls White or Orange

After deduplication, five unique products still need SKU review. Missing SKU
products should not be treated as checkout-ready imports.

## Price Review

No missing-price flags were found.

Price presence is useful, but checkout readiness still depends on SKU,
availability, purchase-mode review, freight rules for tables, tax/region rules,
and final shipping policy.

## Image Review

No missing-image flags were found.

Current image reality:

- Product image URLs point to BigCommerce CDN locations.
- BigCommerce URLs are source metadata only.
- Cloudinary is the future media host.
- The database should store Cloudinary references/URLs after a later media
  migration task, not local image files.
- No Cloudinary upload work is included in this documentation task.

## Replacement Parts Review

Replacement Parts discovered:

| Product | Source path | SKU status | V1 public navigation | V1 checkout |
| --- | --- | --- | --- | --- |
| Tiger PingPong Table Net Replacement Set | `/accessories/tiger-pingpong-table-net-replacement-set` | Missing | No | No |
| Replacement Net | `/accessories/replacement-net` | Present | No | No |

Replacement Parts should be preserved for source tracking, redirects, support,
and future planning, but deferred from v1 public navigation and checkout.

## Table Checkout Review

Tables are purchasable in v1 planning and default to
`online_checkout_candidate`.

Before public checkout, every table still requires review for:

- Freight.
- Curbside delivery.
- Tax handling.
- Region/service area.
- Shipping policy and customer-facing shipping language.

## Resource Article Review

Resource article URLs were discovered, but the capped crawl did not fully fetch
resource article content.

Discovered resource examples:

- `/resources/choose-a-ping-pong-table`
- `/resources/ping-pong-rules`
- `/resources/room-size`
- `/resources/indoor-vs-outdoor-ping-pong-tables`

Resource content should be handled in a later content-specific crawl/review.

## Import Implications

Do not import the generated scrape files directly.

Use the reviewed output to plan:

- Brand -> Product Family -> Product -> Variant normalization.
- Category mapping separate from product families.
- Replacement Part preservation/deferment.
- Table checkout policy review.
- Cloudinary media migration planning.
- Import CSV shape for later review.

