# Tiger Ping Pong Import CSV Spec V1

## Purpose

This spec defines reviewed CSV shapes for a later catalog import task.

It is planning only. It does not create CSV files, implement Prisma schema, add
migrations, write Supabase data, build API routes, build frontend pages, add
checkout, upload images to Cloudinary, add auth, or add admin functionality.

## General Rules

- CSV files must be manually reviewed before import.
- Use stable keys instead of database IDs.
- Use only one normalized v1 brand: `Tiger PingPong`.
- Do not include a Newgy brand row.
- Keep Newgy wording only in product names, family names, source evidence,
  manufacturer/source notes, or content fields where useful.
- Keep categories separate from product families.
- Preserve original source URLs for traceability.
- Store prices as integer cents.
- Use `CAD` unless reviewed otherwise.
- Keep BigCommerce image URLs as source metadata only.
- Cloudinary is the future media host.
- Leave Cloudinary final URL fields blank until a later upload task.
- Do not include Replacement Parts in v1 public navigation or checkout.
- Do not import scraper-detected `revrating` or `Quantity:` rows as variants.

## File Set

Required reviewed CSV files for later import planning:

- `brands_import_v1.csv`
- `categories_import_v1.csv`
- `product_families_import_v1.csv`
- `products_import_v1.csv`
- `product_variants_import_v1.csv`
- `product_media_import_v1.csv`
- `redirects_draft_v1.csv`
- `import_review_flags_v1.csv`

## `brands_import_v1.csv`

| Column | Required | Notes |
| --- | --- | --- |
| `brand_key` | Yes | Stable key. |
| `name` | Yes | Display name. |
| `slug` | Yes | Public/internal slug. |
| `source_evidence` | No | Evidence used to approve brand. |
| `is_active` | Yes | `true` or `false`. |
| `notes` | No | Manual review notes. |

Starter rows:

| brand_key | name | slug | source_evidence | is_active | notes |
| --- | --- | --- | --- | --- | --- |
| `tiger-pingpong` | Tiger PingPong | `tiger-pingpong` | Site branding, product names, and confirmed business decision | `true` | The only normalized v1 brand. |

No Newgy brand row is allowed in v1.

## `categories_import_v1.csv`

| Column | Required | Notes |
| --- | --- | --- |
| `category_key` | Yes | Stable key. |
| `parent_category_key` | No | Blank for top-level categories. |
| `name` | Yes | Display name. |
| `slug` | Yes | Public slug candidate. |
| `description` | No | Reviewed description. |
| `sort_order` | Yes | Integer. |
| `v1_public_navigation` | Yes | `true` or `false`. |
| `v1_checkout_scope` | Yes | `true` or `false`. |
| `source_url` | No | Legacy/source URL if applicable. |
| `notes` | No | Manual review notes. |

Required category rows:

- `tables`
- `indoor-tables`
- `outdoor-tables`
- `accessories`
- `paddles`
- `balls`
- `nets`
- `covers`
- `replacement-parts`

Do not import Home, Sitemap, or Resources as product categories.

## `product_families_import_v1.csv`

| Column | Required | Notes |
| --- | --- | --- |
| `family_key` | Yes | Stable family key. |
| `brand_key` | Yes | Must reference `tiger-pingpong`. |
| `primary_category_key` | Yes | Main browse category. |
| `name` | Yes | Family name. |
| `slug` | Yes | Family slug. |
| `description` | No | Reviewed summary. |
| `source_evidence` | No | URLs/product names supporting family. |
| `notes` | No | Manual review notes. |

Required starter family rows:

| family_key | brand_key | primary_category_key | name | notes |
| --- | --- | --- | --- | --- |
| `expo-table` | `tiger-pingpong` | `tables` | Expo Table | Indoor/outdoor products found. |
| `portland-table` | `tiger-pingpong` | `tables` | Portland Table | Indoor/outdoor products found. |
| `whistler-table` | `tiger-pingpong` | `tables` | Whistler Table | Indoor product found. |
| `plaza-table` | `tiger-pingpong` | `tables` | Plaza Table | Outdoor product found. |
| `premium-3-star-balls` | `tiger-pingpong` | `balls` | Premium 3-Star Balls | Pack-size and color review required. |
| `newgy-robo-balls` | `tiger-pingpong` | `balls` | Newgy Robo-Balls | Newgy wording retained only as family/source/manufacturer wording. |
| `vice-paddle` | `tiger-pingpong` | `paddles` | Vice Paddle | Possible size option. |
| `paddle-accessories` | `tiger-pingpong` | `accessories` | Paddle Accessories | Paddle case found. |
| `table-covers` | `tiger-pingpong` | `covers` | Table Covers | Duplicate source row found. |
| `net-sets` | `tiger-pingpong` | `nets` | Net Sets | Public net/post candidate. |
| `replacement-nets` | `tiger-pingpong` | `replacement-parts` | Replacement Nets | Deferred from v1 public navigation and checkout. |

## `products_import_v1.csv`

| Column | Required | Notes |
| --- | --- | --- |
| `product_key` | Yes | Stable import key. |
| `family_key` | Yes | References product family. |
| `brand_key` | Yes | Must be `tiger-pingpong`. |
| `primary_category_key` | Yes | References category. |
| `name` | Yes | Reviewed product name. |
| `slug` | Yes | Public slug candidate. |
| `source_url` | Yes | Original product URL. |
| `legacy_path` | Yes | Original path. |
| `sku` | Conditional | Required for checkout-ready simple products. |
| `product_kind` | Yes | Suggested values: `table`, `paddle`, `ball`, `net`, `cover`, `accessory`, `replacement_part`. |
| `status` | Yes | Suggested values: `draft`, `active`, `archived`. |
| `v1_public_navigation` | Yes | `true` or `false`. |
| `v1_checkout_scope` | Yes | `true` or `false`. |
| `purchase_mode` | Yes | `online_checkout_candidate`, `needs_manual_review`, `quote_required`, or `deferred_from_v1`. |
| `price_cents` | Conditional | Required unless variant-level price is used. |
| `currency` | Yes | Default `CAD`. |
| `shipping_review_required` | Yes | `true` for all tables before public checkout. |
| `source_review_status` | Yes | `needs_review`, `approved_for_schema_planning`, or `deferred`. |
| `notes` | No | Manual review notes. |

Rules:

- Tables default to `online_checkout_candidate`, with
  `shipping_review_required=true`.
- Replacement Parts use `deferred_from_v1`,
  `v1_public_navigation=false`, and `v1_checkout_scope=false`.
- Missing-SKU products may be draft/review rows, but not checkout-ready rows.

## `product_variants_import_v1.csv`

| Column | Required | Notes |
| --- | --- | --- |
| `variant_key` | Yes | Stable import key. |
| `product_key` | Yes | References product. |
| `sku` | Conditional | Required if variant is purchasable. |
| `name` | No | Variant display name. |
| `option_1_name` | No | For example `Color`. |
| `option_1_value` | No | For example `Grey`. |
| `option_2_name` | No | For example `Pack size`. |
| `option_2_value` | No | For example `6`. |
| `price_cents` | Conditional | Required if variant overrides product price. |
| `currency` | Yes | Default `CAD`. |
| `purchase_mode_override` | No | Optional variant-level override. |
| `is_active` | Yes | `true` or `false`. |
| `source_url` | Yes | Original product URL. |
| `notes` | No | Manual review notes. |

Do not import these option signals:

- `revrating`
- `Quantity:`

Manual variant approval is required for:

- Table color.
- Ball color.
- Ball pack size.
- Paddle size.

## `product_media_import_v1.csv`

| Column | Required | Notes |
| --- | --- | --- |
| `media_key` | Yes | Stable import key. |
| `product_key` | Yes | References product. |
| `variant_key` | No | Optional variant-specific media reference. |
| `source_url` | Yes | Original BigCommerce/CDN image URL. |
| `cloudinary_public_id` | No | Planned or final Cloudinary public ID. |
| `cloudinary_secure_url` | No | Blank until uploaded in a later task. |
| `suggested_cloudinary_folder` | No | Planning helper. |
| `suggested_final_filename` | No | Planning helper. |
| `alt_text` | No | Reviewed alt text. |
| `title` | No | Optional media title. |
| `caption` | No | Optional caption. |
| `width` | No | Fill after media review/upload. |
| `height` | No | Fill after media review/upload. |
| `format` | No | For example `jpg`, `png`, `webp`. |
| `role` | Yes | `primary`, `gallery`, `detail`, or `lifestyle`. |
| `sort_order` | Yes | Integer. |
| `is_primary` | Yes | `true` for one primary image per product. |
| `notes` | No | Manual review notes. |

Rules:

- BigCommerce image URLs are source metadata only.
- Cloudinary is the production media target.
- Do not upload images in this task.
- Do not commit image files.

## `redirects_draft_v1.csv`

| Column | Required | Notes |
| --- | --- | --- |
| `legacy_path` | Yes | Original path. |
| `new_path_candidate` | Yes | Draft new route. |
| `entity_type` | Yes | `product`, `category`, `static_page`, or `resource_article`. |
| `entity_key` | No | Product/category/static key if known. |
| `redirect_status` | Yes | `draft`, `approved`, or `deferred`. |
| `notes` | No | Manual review notes. |

Do not approve redirects until final frontend route patterns are decided.

## `import_review_flags_v1.csv`

| Column | Required | Notes |
| --- | --- | --- |
| `entity_type` | Yes | `brand`, `category`, `family`, `product`, `variant`, `media`, or `redirect`. |
| `entity_key` | Yes | Stable key. |
| `source_url` | No | Related source URL. |
| `flag` | Yes | Short flag name. |
| `severity` | Yes | `info`, `medium`, `high`, or `blocker`. |
| `resolution_owner` | No | Business, engineering, content, or media. |
| `resolution_status` | Yes | `open`, `resolved`, or `deferred`. |
| `notes` | No | Review notes. |

Recommended initial flags:

- `missing_sku`
- `duplicate_source_url`
- `variant_values_required`
- `replacement_part_deferred`
- `table_shipping_policy_required`
- `cloudinary_upload_required`
- `resource_article_crawl_required`

## Required Review Before Schema Work

Approve these before Prisma schema implementation:

- Final one-brand list containing only Tiger PingPong.
- Final family list.
- Final product rows after dedupe.
- Which products are variants vs separate products.
- Missing SKU resolutions.
- Replacement Part preservation/exclusion behavior.
- Cloudinary media migration naming rules.
- Redirect route patterns.

