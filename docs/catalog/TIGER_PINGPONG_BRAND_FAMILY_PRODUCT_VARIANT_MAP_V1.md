# Tiger Ping Pong Brand Family Product Variant Map V1

## Purpose

This document proposes a normalized Brand -> Product Family -> Product ->
Variant map for v1 catalog planning.

It is documentation only. It does not create Prisma schema, migrations,
Supabase rows, API routes, frontend pages, checkout, Cloudinary uploads, auth,
or admin functionality.

## Mapping Rules

- Brand is always `Tiger PingPong` in v1.
- Do not add a Newgy brand.
- Newgy may remain only as product/family/source/manufacturer/content wording.
- Product families remain separate from categories.
- Replacement Parts are preserved but deferred from v1 public navigation and
  checkout.
- Tables remain online checkout candidates, pending shipping policy review.
- BigCommerce image URLs remain source metadata only.

## Brand Map

| Brand key | Brand name | Notes |
| --- | --- | --- |
| `tiger-pingpong` | Tiger PingPong | The only v1 brand. |

No other brand rows are approved for v1.

## Product Family Map

| Family key | Brand | Family name | Primary category | V1 public navigation | V1 checkout scope | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `expo-table` | Tiger PingPong | Expo Table | Tables | Yes | Yes, after table policy review | Indoor and outdoor products found. |
| `portland-table` | Tiger PingPong | Portland Table | Tables | Yes | Yes, after table policy review | Indoor and outdoor products found. |
| `whistler-table` | Tiger PingPong | Whistler Table | Tables | Yes | Yes, after table policy review | Indoor product found; missing SKU. |
| `plaza-table` | Tiger PingPong | Plaza Table | Tables | Yes | Yes, after table policy review | Outdoor product found. |
| `premium-3-star-balls` | Tiger PingPong | Premium 3-Star Balls | Balls | Yes | Yes, after variant/SKU review | Pack size and color choices. |
| `newgy-robo-balls` | Tiger PingPong | Newgy Robo-Balls | Balls | Yes | Yes | Newgy retained only as family/source/manufacturer wording. |
| `vice-paddle` | Tiger PingPong | Vice Paddle | Paddles | Yes | Yes, after SKU/option review | Possible size option. |
| `paddle-accessories` | Tiger PingPong | Paddle Accessories | Accessories | Yes | Needs review | Paddle case found. |
| `table-covers` | Tiger PingPong | Table Covers | Covers | Yes | Yes, after SKU review | Duplicate source row found. |
| `net-sets` | Tiger PingPong | Net Sets | Nets | Yes | Needs review | Public net/post candidate. |
| `replacement-nets` | Tiger PingPong | Replacement Nets | Replacement Parts | No | No | Preserve for future review and redirects. |

## Product And Variant Map

| Product key | Brand | Family | Product name | Category | Source path | SKU status | Price | Variant pattern | Purchase mode |
| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| `tiger-table-net-replacement-set` | Tiger PingPong | Replacement Nets | Tiger PingPong Table Net Replacement Set | Replacement Parts | `/accessories/tiger-pingpong-table-net-replacement-set` | Missing | `$140` | Replacement net set | `deferred_from_v1` |
| `tiger-table-cover-black-polyester` | Tiger PingPong | Table Covers | Protective Ping Pong Table Cover Black Polyester | Covers | `/accessories/ping-pong-table-cover` | Missing | `$55` | Simple product; black polyester | `online_checkout_candidate` after SKU review |
| `tiger-vice-paddle` | Tiger PingPong | Vice Paddle | Vice Ping Pong Paddle | Paddles | `/accessories/vice-ping-pong-paddle` | Missing | `$50` | Possible size option | `online_checkout_candidate` after SKU/option review |
| `tiger-paddle-case` | Tiger PingPong | Paddle Accessories | Ping Pong Paddle Case | Accessories | `/accessories/ping-pong-paddle-case` | `9176` | `$12` | Simple product | `needs_manual_review` |
| `tiger-premium-balls-6-orange` | Tiger PingPong | Premium 3-Star Balls | Premium 3-Star Ping Pong Balls 6 Balls Orange | Balls | `/accessories/ping-pong-balls-premium-3-star-6-balls-orange` | `9156` | `$8` | Pack size 6; orange | `needs_manual_review` |
| `tiger-premium-balls-6-white` | Tiger PingPong | Premium 3-Star Balls | Premium 3-Star Ping Pong Balls 6 Balls White | Balls | `/accessories/ping-pong-balls-premium-3-star-white` | `125-WH` | `$8` | Pack size 6; white | `online_checkout_candidate` |
| `tiger-plaza-outdoor-table-grey` | Tiger PingPong | Plaza Table | Plaza Outdoor Ping Pong Table Grey | Tables | `/tables/plaza-outdoor-ping-pong-table-grey` | `10272` | `$2600` | Outdoor; grey | `online_checkout_candidate` after table policy review |
| `tiger-whistler-indoor-table` | Tiger PingPong | Whistler Table | Whistler Indoor Ping Pong Table Green or Blue | Tables | `/tables/whistler-indoor-ping-pong-table-in-green-blue` | Missing | `$1600` | Indoor; green/blue | `online_checkout_candidate` after SKU/table policy review |
| `tiger-portland-indoor-table` | Tiger PingPong | Portland Table | Portland Indoor Ping Pong Table Grey, Green or Blue | Tables | `/tables/portland-indoor-ping-pong-table-grey-green-blue` | `7013` | `$1300` | Indoor; grey/green/blue | `online_checkout_candidate` after table policy review |
| `tiger-expo-indoor-table` | Tiger PingPong | Expo Table | Expo Indoor Ping Pong Table Grey, Green or Blue | Tables | `/tables/expo-indoor-ping-pong-table-grey-green-blue` | `7016` | `$1200` | Indoor; grey/green/blue | `online_checkout_candidate` after table policy review |
| `tiger-expo-outdoor-table` | Tiger PingPong | Expo Table | Expo Outdoor Ping Pong Table Grey, Green or Blue | Tables | `/tables/expo-outdoor-ping-pong-table-grey-green-blue` | `9477` | `$1300` | Outdoor; grey/green/blue | `online_checkout_candidate` after table policy review |
| `tiger-portland-outdoor-table` | Tiger PingPong | Portland Table | Portland Outdoor Ping Pong Table Grey or Blue | Tables | `/tables/portland-outdoor-ping-pong-table-grey-blue` | `7736` | `$1500` | Outdoor; grey/blue | `online_checkout_candidate` after table policy review |
| `tiger-replacement-net` | Tiger PingPong | Replacement Nets | Replacement Net | Replacement Parts | `/accessories/replacement-net` | `8367` | `$28` | Replacement net | `deferred_from_v1` |
| `tiger-net-post-set` | Tiger PingPong | Net Sets | Table Tennis Net & Post Set | Nets | `/accessories/table-tennis-net-post-set` | `6989-B` | `$59` | Simple product | `needs_manual_review` |
| `newgy-robo-balls-144-orange` | Tiger PingPong | Newgy Robo-Balls | Newgy Table Tennis Balls 144 Balls Orange | Balls | `/accessories/newgy-table-tennis-balls-orange` | `11763` | `$100` | Pack size 144; orange | `online_checkout_candidate` |
| `tiger-premium-balls-140` | Tiger PingPong | Premium 3-Star Balls | Premium 3-Star Ping Pong Balls 140 Balls White or Orange | Balls | `/accessories/ping-pong-balls-premium-3-star-140-balls-white-orange` | Missing | `$96` | Pack size 140; white/orange | `online_checkout_candidate` after SKU/variant review |

## Variant Groups To Confirm

| Variant group | Products affected | Option names | Values seen or inferred | Status |
| --- | --- | --- | --- | --- |
| Table color | Expo, Portland, Whistler, Plaza | Color | Grey, green, blue | Inferred from names; confirm SKU mapping. |
| Table environment | Expo, Portland, Whistler, Plaza | Environment | Indoor, outdoor | Recommend separate products under a family for v1. |
| Ball color | Premium 3-Star Balls, Newgy Robo-Balls | Color | White, orange | Confirm 140-pack color behavior. |
| Ball pack size | Premium 3-Star Balls, Newgy Robo-Balls | Pack size | 6, 140, 144 | Confirm product vs variant treatment. |
| Paddle size | Vice Paddle | Size | Not extracted | Manual review required. |

## Exclusions And Deferrals

Exclude from direct import:

- Duplicate table-cover raw row.
- `revrating` option rows.
- `Quantity:` option rows.
- Generated scrape output files.

Defer from v1 public navigation and checkout:

- Tiger PingPong Table Net Replacement Set
- Replacement Net

## Open Review Items

- Confirm missing SKUs.
- Confirm table color SKU mapping.
- Confirm whether table indoor/outdoor stays as separate products.
- Confirm ball pack-size and color variant strategy.
- Confirm Vice Paddle size values.
- Confirm public checkout readiness for the net/post set and paddle case.
- Confirm Cloudinary naming rules before any upload work.

