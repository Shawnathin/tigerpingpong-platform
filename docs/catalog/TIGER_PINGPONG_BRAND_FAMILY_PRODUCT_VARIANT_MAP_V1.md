# Tiger Ping Pong Brand Family Product Variant Map V1

## Purpose

This document proposes a normalized Brand -> Product Family -> Product ->
Variant map from the generated scrape output.

It is planning only. It does not write to Supabase, implement Prisma schema,
create migrations, build API routes, build frontend pages, build checkout, or
upload images to Cloudinary.

## Mapping Rules

- Treat this as a proposed manual review map, not approved import data.
- Deduplicate repeated source URLs before import.
- Normalize every v1 catalog product to the single confirmed brand:
  `Tiger PingPong`.
- Do not model `Newgy` as a separate v1 brand. Keep Newgy only as
  product/source/manufacturer wording where useful.
- Keep product families separate from browse categories.
- Keep replacement parts preserved but deferred from v1 public navigation and
  checkout.
- Keep all image URLs as source metadata until a later Cloudinary upload task.

## Proposed Brands

| Brand key | Brand name | Notes |
| --- | --- | --- |
| `tiger-pingpong` | Tiger PingPong | The only normalized v1 brand. Raw `Tiger`, `Tiger PingPong`, and Newgy-named product rows map here. |

## Proposed Product Family Map

| Brand | Family key | Family name | Primary category | V1 public? | V1 checkout scope? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Tiger PingPong | `expo-table` | Expo Table | Tables | Yes | Yes, after table policy review | Indoor and outdoor products found. |
| Tiger PingPong | `portland-table` | Portland Table | Tables | Yes | Yes, after table policy review | Indoor and outdoor products found. |
| Tiger PingPong | `whistler-table` | Whistler Table | Tables | Yes | Yes, after table policy review | Indoor product found. |
| Tiger PingPong | `plaza-table` | Plaza Table | Tables | Yes | Yes, after table policy review | Outdoor product found. |
| Tiger PingPong | `premium-3-star-balls` | Premium 3-Star Balls | Balls | Yes | Yes, after variant review | Color and pack size are important. |
| Tiger PingPong | `newgy-robo-balls` | Newgy Robo-Balls | Balls | Yes | Yes | Newgy retained as family/source wording only, not a separate v1 brand. |
| Tiger PingPong | `vice-paddle` | Vice Paddle | Paddles | Yes | Yes, after SKU/option review | Possible size option. |
| Tiger PingPong | `paddle-accessories` | Paddle Accessories | Accessories | Yes | Needs review | Paddle case found. |
| Tiger PingPong | `table-covers` | Table Covers | Covers | Yes | Yes, after SKU review | Duplicate source row found. |
| Tiger PingPong | `net-sets` | Net Sets | Nets | Yes | Needs review | Public net/post set candidate. |
| Tiger PingPong | `replacement-nets` | Replacement Nets | Replacement Parts | No | No | Preserve for future review and redirects. |

## Proposed Product And Variant Map

| Product key | Brand | Family | Product name | Category | Source URL | SKU status | Price | Variant pattern | Proposed purchase mode | Notes |
| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- |
| `tiger-table-net-replacement-set` | Tiger PingPong | Replacement Nets | Tiger PingPong Table Net Replacement Set | Replacement Parts | `/accessories/tiger-pingpong-table-net-replacement-set` | Missing | `$140` | Replacement net set | `deferred_from_v1` | Preserve for redirects/future planning. |
| `tiger-table-cover-black-polyester` | Tiger PingPong | Table Covers | Protective Ping Pong Table Cover Black Polyester | Covers | `/accessories/ping-pong-table-cover` | Missing | `$55` | Simple product, black polyester | `online_checkout_candidate` after SKU review | Duplicate row in scrape; import once. |
| `tiger-vice-paddle` | Tiger PingPong | Vice Paddle | Vice Ping Pong Paddle | Paddles | `/accessories/vice-ping-pong-paddle` | Missing | `$50` | Possible size option | `online_checkout_candidate` after SKU/option review | `Size: (Required)` detected without values. |
| `tiger-paddle-case` | Tiger PingPong | Paddle Accessories | Ping Pong Paddle Case | Accessories | `/accessories/ping-pong-paddle-case` | `9176` | `$12` | Simple product | `needs_manual_review` | Scrape did not see add-to-cart. |
| `tiger-premium-balls-6-orange` | Tiger PingPong | Premium 3-Star Balls | Premium 3-Star Ping Pong Balls 6 Balls Orange | Balls | `/accessories/ping-pong-balls-premium-3-star-6-balls-orange` | `9156` | `$8` | Pack size: 6; color: orange | `needs_manual_review` | Scrape did not see add-to-cart. |
| `tiger-premium-balls-6-white` | Tiger PingPong | Premium 3-Star Balls | Premium 3-Star Ping Pong Balls 6 Balls White | Balls | `/accessories/ping-pong-balls-premium-3-star-white` | `125-WH` | `$8` | Pack size: 6; color: white | `online_checkout_candidate` | Color option signal detected. |
| `tiger-plaza-outdoor-table-grey` | Tiger PingPong | Plaza Table | Plaza Outdoor Ping Pong Table Grey | Tables | `/tables/plaza-outdoor-ping-pong-table-grey` | `10272` | `$2600` | Environment: outdoor; color: grey | `online_checkout_candidate` after table policy review | Scrape marked manual review because add-to-cart was not detected. |
| `tiger-whistler-indoor-table` | Tiger PingPong | Whistler Table | Whistler Indoor Ping Pong Table Green or Blue | Tables | `/tables/whistler-indoor-ping-pong-table-in-green-blue` | Missing | `$1600` | Environment: indoor; colors: green, blue | `online_checkout_candidate` after SKU/table policy review | Confirm SKU and color variants. |
| `tiger-portland-indoor-table` | Tiger PingPong | Portland Table | Portland Indoor Ping Pong Table Grey, Green or Blue | Tables | `/tables/portland-indoor-ping-pong-table-grey-green-blue` | `7013` | `$1300` | Environment: indoor; colors: grey, green, blue | `online_checkout_candidate` after table policy review | Confirm if colors share SKU or require variants. |
| `tiger-expo-indoor-table` | Tiger PingPong | Expo Table | Expo Indoor Ping Pong Table Grey, Green or Blue | Tables | `/tables/expo-indoor-ping-pong-table-grey-green-blue` | `7016` | `$1200` | Environment: indoor; colors: grey, green, blue | `online_checkout_candidate` after table policy review | Confirm if colors share SKU or require variants. |
| `tiger-expo-outdoor-table` | Tiger PingPong | Expo Table | Expo Outdoor Ping Pong Table Grey, Green or Blue | Tables | `/tables/expo-outdoor-ping-pong-table-grey-green-blue` | `9477` | `$1300` | Environment: outdoor; colors: grey, green, blue | `online_checkout_candidate` after table policy review | Confirm if colors share SKU or require variants. |
| `tiger-portland-outdoor-table` | Tiger PingPong | Portland Table | Portland Outdoor Ping Pong Table Grey or Blue | Tables | `/tables/portland-outdoor-ping-pong-table-grey-blue` | `7736` | `$1500` | Environment: outdoor; colors: grey, blue | `online_checkout_candidate` after table policy review | Confirm if colors share SKU or require variants. |
| `tiger-replacement-net` | Tiger PingPong | Replacement Nets | Replacement Net | Replacement Parts | `/accessories/replacement-net` | `8367` | `$28` | Replacement net | `deferred_from_v1` | Preserve for redirects/future planning. |
| `tiger-net-post-set` | Tiger PingPong | Net Sets | Table Tennis Net & Post Set | Nets | `/accessories/table-tennis-net-post-set` | `6989-B` | `$59` | Simple product | `needs_manual_review` | Public Nets candidate; replacement wording needs manual review. |
| `newgy-robo-balls-144-orange` | Tiger PingPong | Newgy Robo-Balls | Newgy Table Tennis Balls 144 Balls Orange | Balls | `/accessories/newgy-table-tennis-balls-orange` | `11763` | `$100` | Pack size: 144; color: orange | `online_checkout_candidate` | Newgy retained in product/family/source wording only; normalized v1 brand is Tiger PingPong. |
| `tiger-premium-balls-140` | Tiger PingPong | Premium 3-Star Balls | Premium 3-Star Ping Pong Balls 140 Balls White or Orange | Balls | `/accessories/ping-pong-balls-premium-3-star-140-balls-white-orange` | Missing | `$96` | Pack size: 140; color: white or orange | `online_checkout_candidate` after SKU/variant review | Confirm SKU and whether color is selectable. |

## Variant Groups To Confirm

| Variant group | Products affected | Option names | Values seen or inferred | Status |
| --- | --- | --- | --- | --- |
| Table color | Expo, Portland, Whistler, Plaza | Color | grey, green, blue | Inferred from names; confirm values and SKU mapping. |
| Table environment | Expo, Portland, Whistler, Plaza | Environment | indoor, outdoor | Recommend separate products under a family for v1. |
| Ball color | Tiger Premium 3-Star Balls, Newgy Balls | Color | white, orange | Confirm 140-pack color behavior. |
| Ball pack size | Tiger Premium 3-Star Balls, Newgy Balls | Pack size | 6, 140, 144 | Should be variant or product attribute. |
| Paddle size | Vice Paddle | Size | Not extracted | Manual review required. |

## Rows Excluded From Direct Import

The duplicate table-cover scrape row should be excluded from direct import:

- Source URL: `/accessories/ping-pong-table-cover`
- Duplicate slug: `tiger-pingpong-protective-ping-pong-table-cover-black-polyester`

## Replacement Part Handling

Replacement part rows:

- Tiger PingPong Table Net Replacement Set
- Replacement Net

Rules:

- Preserve source URL, slug, price, SKU if present, and source media.
- Exclude from v1 public navigation.
- Exclude from v1 checkout.
- Keep available for future review, redirects, and v1.5/v2 planning.

## Open Manual Review Items

- Confirm missing SKUs.
- Confirm whether table colors are true variants and whether each color has its
  own SKU.
- Confirm whether indoor/outdoor should remain separate products under a family.
- Confirm ball color and pack-size variant strategy.
- Confirm how Newgy wording should appear in product content, source evidence,
  manufacturer notes, and SEO fields.
- Confirm whether `Table Tennis Net & Post Set` is public checkout-ready.
- Confirm Cloudinary public ID naming before upload.
