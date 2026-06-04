# Tiger Ping Pong Catalog Normalization V1

## Purpose

This document converts the reviewed scrape output into a normalized catalog
planning shape.

It is documentation only. It does not implement Prisma schema, add migrations,
write to Supabase, add API routes, build frontend pages, add checkout, add
Stripe, add auth, add admin work, upload to Cloudinary, or commit generated
scrape output.

## Confirmed Catalog Architecture

Use this hierarchy for v1 planning:

```text
Brand
-> Product Family
-> Product
-> Variant
```

Categories remain separate from product families.

- Categories answer where a product appears in browsing/navigation.
- Product families answer which product line a product belongs to.
- Products represent the customer-facing item page or reviewed sellable concept.
- Variants represent SKU/configuration choices such as color, pack size, size,
  or other sellable options.

## Confirmed Business Decisions

- There is only one v1 brand: `Tiger PingPong`.
- Do not model Newgy as a separate v1 brand.
- Newgy may remain only as product/family/source/manufacturer/content wording.
- Tables are purchasable in v1 planning.
- Tables default to `online_checkout_candidate`.
- Tables require freight, curbside, tax, region, and shipping policy review
  before public checkout.
- Replacement Parts are preserved but deferred from v1 public navigation and
  checkout.
- Cloudinary is the future product media host.
- Database records should store Cloudinary references/URLs, not image files.
- BigCommerce image URLs are source metadata only.

## Reviewed Catalog Counts

Raw scrape rows:

- 17 product rows.

Reviewed unique products:

| Group | Unique products |
| --- | ---: |
| Tables | 6 |
| Balls | 4 |
| Replacement Parts | 2 |
| Covers | 1 |
| Paddle | 1 |
| Net | 1 |
| Accessory | 1 |
| Total | 16 |

Duplicate to collapse:

- `Tiger PingPong Protective Ping Pong Table Cover Black Polyester`

## Category Normalization

Recommended v1 category rows:

| Category key | Parent key | Name | V1 public navigation | V1 checkout scope | Notes |
| --- | --- | --- | --- | --- | --- |
| `tables` | | Tables | Yes | Yes | Public section; table policy review still required before checkout launch. |
| `indoor-tables` | `tables` | Indoor Tables | Yes | Yes | Category or filter under Tables. |
| `outdoor-tables` | `tables` | Outdoor Tables | Yes | Yes | Category or filter under Tables. |
| `accessories` | | Accessories | Yes | Yes | Broad accessory section. |
| `paddles` | `accessories` | Paddles | Yes | Yes | Public launch category. |
| `balls` | `accessories` | Balls | Yes | Yes | Normalize legacy "Ping Pong Balls" wording to Balls where appropriate. |
| `nets` | `accessories` | Nets | Yes | Yes | Public net products only. |
| `covers` | `accessories` | Covers | Yes | Yes | Public cover products. |
| `replacement-parts` | | Replacement Parts | No | No | Preserve for future review and redirects only. |

Do not import Home, Sitemap, or Resources as product categories. Resources is
content, not catalog.

## Brand Normalization

Approved v1 brand table:

| Brand key | Name | Notes |
| --- | --- | --- |
| `tiger-pingpong` | Tiger PingPong | The only v1 brand. Raw Tiger, Tiger PingPong, and Newgy-named product rows normalize here. |

No `Newgy` brand row should be created for v1.

## Product Family Normalization

Approved family candidates:

| Family key | Brand | Family name | Primary category | Notes |
| --- | --- | --- | --- | --- |
| `expo-table` | Tiger PingPong | Expo Table | Tables | Indoor/outdoor products found. |
| `portland-table` | Tiger PingPong | Portland Table | Tables | Indoor/outdoor products found. |
| `whistler-table` | Tiger PingPong | Whistler Table | Tables | Indoor product found. |
| `plaza-table` | Tiger PingPong | Plaza Table | Tables | Outdoor product found. |
| `premium-3-star-balls` | Tiger PingPong | Premium 3-Star Balls | Balls | Pack size and color need review. |
| `newgy-robo-balls` | Tiger PingPong | Newgy Robo-Balls | Balls | Newgy retained only as family/source/manufacturer wording. |
| `vice-paddle` | Tiger PingPong | Vice Paddle | Paddles | Possible size option. |
| `paddle-accessories` | Tiger PingPong | Paddle Accessories | Accessories | Paddle case found. |
| `table-covers` | Tiger PingPong | Table Covers | Covers | Duplicate source row found. |
| `net-sets` | Tiger PingPong | Net Sets | Nets | Public net/post candidate. |
| `replacement-nets` | Tiger PingPong | Replacement Nets | Replacement Parts | Deferred from v1 public navigation and checkout. |

## Product And Variant Rules

### Tables

Tables should remain in v1 planning as purchasable products, with
`online_checkout_candidate` as the default purchase mode.

Before public checkout, all tables require review for:

- Freight.
- Curbside delivery.
- Tax.
- Region/service area.
- Shipping policy.

Recommended table modeling:

| Family | Product boundary | Variant review |
| --- | --- | --- |
| Expo Table | Expo Indoor Table and Expo Outdoor Table | Color values; SKU mapping. |
| Portland Table | Portland Indoor Table and Portland Outdoor Table | Color values; SKU mapping. |
| Whistler Table | Whistler Indoor Table | Green/blue color handling; missing SKU. |
| Plaza Table | Plaza Outdoor Table | Grey color handling. |

For v1, keeping indoor/outdoor as separate products under one family is the
simplest planning assumption because it matches current URL structure.

### Balls

Recommended ball modeling:

| Family | Product/variant review |
| --- | --- |
| Premium 3-Star Balls | Pack sizes 6 and 140; colors white/orange. |
| Newgy Robo-Balls | 144 orange product under Tiger PingPong brand; Newgy wording retained only as family/source/manufacturer wording. |

The 140-pack "White or Orange" row needs manual confirmation before import.

### Paddles And Accessories

Recommended modeling:

| Family | Product | Review need |
| --- | --- | --- |
| Vice Paddle | Vice Ping Pong Paddle | Missing SKU and possible size option. |
| Paddle Accessories | Ping Pong Paddle Case | Purchase-mode review. |

### Nets And Replacement Parts

Recommended split:

| Product | Group | V1 public navigation | V1 checkout |
| --- | --- | --- | --- |
| Table Tennis Net & Post Set | Nets | Yes | Needs review |
| Tiger PingPong Table Net Replacement Set | Replacement Parts | No | No |
| Replacement Net | Replacement Parts | No | No |

Replacement Parts must stay preserved for future support, redirects, and
planning, but out of v1 public navigation and checkout.

### Covers

The table cover should import as one reviewed product after deduplication and
SKU review.

## Media Normalization

Cloudinary is the future product media host.

Rules:

- Preserve BigCommerce image URLs as `source_url` metadata only.
- Do not hotlink BigCommerce URLs as the final production media strategy.
- Do not store local image files in the database.
- Store Cloudinary public IDs and secure URLs after a later media migration.
- Do not upload images in this docs task.

## Import Readiness

Ready for:

- Schema planning.
- Manual catalog normalization.
- Import CSV design.

Not ready for:

- Direct product import.
- Direct variant import.
- Direct media import.
- Public checkout launch.
- Prisma schema implementation before mapping approval.

