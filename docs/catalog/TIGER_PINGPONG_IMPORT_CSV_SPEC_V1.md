# Tiger Ping Pong Import CSV Spec V1

## Purpose

This spec defines reviewed CSV shapes for a later catalog import task. It is
planning only and does not create CSV files, Prisma schema, migrations, Supabase
rows, API routes, frontend pages, checkout, or Cloudinary uploads.

The goal is to convert scrape output into import-ready review files before any
database implementation begins.

## General Rules

- All CSV files must be manually reviewed before import.
- Use stable keys instead of database IDs.
- Preserve original source URLs for traceability.
- Store prices as integer cents.
- Use `CAD` unless reviewed otherwise.
- Keep BigCommerce image URLs as source metadata only.
- Cloudinary fields may be planned, but `cloudinary_secure_url` should stay
  blank until a later upload task.
- Do not include Replacement Parts in v1 public navigation or checkout.
- Do not import scraper-detected `revrating` or `Quantity:` rows as variants.
- Use only one normalized v1 brand: `Tiger PingPong`.
- Keep Newgy wording only in product names, family names, source evidence,
  manufacturer/source notes, or SEO/content fields where useful.

## File Set

Recommended CSV files for the later import-prep artifact:

- `brands_import_v1.csv`
- `categories_import_v1.csv`
- `product_families_import_v1.csv`
- `products_import_v1.csv`
- `product_variants_import_v1.csv`
- `product_media_import_v1.csv`
- `redirects_launch_v1.csv`
- `import_review_flags_v1.csv`

## `brands_import_v1.csv`

| Column            | Required | Notes                                          |
| ----------------- | -------- | ---------------------------------------------- |
| `brand_key`       | Yes      | Stable slug key, for example `tiger-pingpong`. |
| `name`            | Yes      | Display name.                                  |
| `slug`            | Yes      | Public/internal slug.                          |
| `source_evidence` | No       | Product/source evidence used to approve brand. |
| `is_active`       | Yes      | `true` or `false`.                             |
| `notes`           | No       | Manual review notes.                           |

Starter rows:

| brand_key        | name           | slug             | source_evidence                                               | is_active | notes                                                                          |
| ---------------- | -------------- | ---------------- | ------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------ |
| `tiger-pingpong` | Tiger PingPong | `tiger-pingpong` | Site branding, product names, and confirmed business decision | `true`    | The only normalized v1 brand. Newgy may remain as product/source wording only. |

## `categories_import_v1.csv`

| Column                 | Required | Notes                            |
| ---------------------- | -------- | -------------------------------- |
| `category_key`         | Yes      | Stable key.                      |
| `parent_category_key`  | No       | Blank for top-level categories.  |
| `name`                 | Yes      | Display name.                    |
| `slug`                 | Yes      | Public slug candidate.           |
| `description`          | No       | Reviewed description.            |
| `sort_order`           | Yes      | Integer.                         |
| `v1_public_navigation` | Yes      | `true` or `false`.               |
| `v1_checkout_scope`    | Yes      | `true` or `false`.               |
| `source_url`           | No       | Legacy/source URL if applicable. |
| `notes`                | No       | Manual review notes.             |

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

Do not import Home or Sitemap as product categories.

## `product_families_import_v1.csv`

| Column                 | Required | Notes                                 |
| ---------------------- | -------- | ------------------------------------- |
| `family_key`           | Yes      | Stable family key.                    |
| `brand_key`            | Yes      | References `brands_import_v1.csv`.    |
| `primary_category_key` | Yes      | Main browse category.                 |
| `name`                 | Yes      | Family name.                          |
| `slug`                 | Yes      | Family slug.                          |
| `description`          | No       | Reviewed summary.                     |
| `source_evidence`      | No       | URLs/product names supporting family. |
| `notes`                | No       | Manual review notes.                  |

Recommended starter family keys:

- `expo-table`
- `portland-table`
- `whistler-table`
- `plaza-table`
- `premium-3-star-balls`
- `newgy-robo-balls`
- `vice-paddle`
- `paddle-accessories`
- `table-covers`
- `net-sets`
- `replacement-nets`

## `products_import_v1.csv`

| Column                     | Required    | Notes                                                                                         |
| -------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `product_key`              | Yes         | Stable import key.                                                                            |
| `family_key`               | Yes         | References product family.                                                                    |
| `brand_key`                | Yes         | References brand.                                                                             |
| `primary_category_key`     | Yes         | References category.                                                                          |
| `name`                     | Yes         | Reviewed product name.                                                                        |
| `slug`                     | Yes         | Public slug candidate.                                                                        |
| `source_url`               | Yes         | Original product URL.                                                                         |
| `legacy_path`              | Yes         | Original path.                                                                                |
| `sku`                      | Conditional | Required for checkout-ready simple products.                                                  |
| `product_kind`             | Yes         | Suggested values: `table`, `paddle`, `ball`, `net`, `cover`, `accessory`, `replacement_part`. |
| `status`                   | Yes         | Suggested values: `draft`, `active`, `archived`.                                              |
| `v1_public_navigation`     | Yes         | `true` or `false`.                                                                            |
| `v1_checkout_scope`        | Yes         | `true` or `false`.                                                                            |
| `purchase_mode`            | Yes         | `online_checkout_candidate`, `quote_required`, `needs_manual_review`, or `deferred_from_v1`.  |
| `price_cents`              | Conditional | Required for checkout candidates unless variant-level price is used.                          |
| `currency`                 | Yes         | Default `CAD`.                                                                                |
| `shipping_review_required` | Yes         | `true` for all tables before launch.                                                          |
| `short_description`        | No          | Reviewed short description.                                                                   |
| `description`              | No          | Reviewed body copy.                                                                           |
| `source_review_status`     | Yes         | Suggested values: `needs_review`, `approved_for_schema_planning`, `deferred`.                 |
| `notes`                    | No          | Manual review notes.                                                                          |

Rules:

- Replacement Parts use `deferred_from_v1`.
- Tables use `online_checkout_candidate` only after acknowledging table shipping
  policy review is still required before launch.
- Products missing SKU can be `draft` or `needs_manual_review`, but should not
  be treated as checkout-ready.

## `product_variants_import_v1.csv`

| Column                   | Required    | Notes                                        |
| ------------------------ | ----------- | -------------------------------------------- |
| `variant_key`            | Yes         | Stable import key.                           |
| `product_key`            | Yes         | References product.                          |
| `sku`                    | Conditional | Required if variant is purchasable.          |
| `name`                   | No          | Variant display name.                        |
| `option_1_name`          | No          | For example `Color`.                         |
| `option_1_value`         | No          | For example `Grey`.                          |
| `option_2_name`          | No          | For example `Pack size`.                     |
| `option_2_value`         | No          | For example `6`.                             |
| `price_cents`            | Conditional | Required if variant overrides product price. |
| `currency`               | Yes         | Default `CAD`.                               |
| `purchase_mode_override` | No          | Optional variant-level override.             |
| `is_active`              | Yes         | `true` or `false`.                           |
| `source_url`             | Yes         | Original product URL.                        |
| `notes`                  | No          | Manual review notes.                         |

Do not import these option signals:

- `revrating`
- `Quantity:`

Variant options requiring manual approval:

- Table color
- Ball color
- Ball pack size
- Paddle size

## `product_media_import_v1.csv`

| Column                        | Required | Notes                                                                                                                                                   |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `media_key`                   | Yes      | Stable import key.                                                                                                                                      |
| `product_key`                 | Yes      | References product.                                                                                                                                     |
| `variant_key`                 | No       | Optional variant-specific media reference.                                                                                                              |
| `source_url`                  | Yes      | Original BigCommerce/CDN image URL.                                                                                                                     |
| `cloudinary_public_id`        | No       | Planned or reviewed final Cloudinary public ID. Required when `cloudinary_secure_url` is populated.                                                     |
| `cloudinary_secure_url`       | No       | Blank for source-only/deferred media, or a reviewed `https://res.cloudinary.com/.../image/upload/...` delivery URL that matches `cloudinary_public_id`. |
| `suggested_cloudinary_folder` | No       | Planning helper.                                                                                                                                        |
| `suggested_final_filename`    | No       | Planning helper.                                                                                                                                        |
| `alt_text`                    | No       | Reviewed alt text.                                                                                                                                      |
| `title`                       | No       | Optional media title.                                                                                                                                   |
| `caption`                     | No       | Optional caption.                                                                                                                                       |
| `width`                       | No       | Fill after media review/upload.                                                                                                                         |
| `height`                      | No       | Fill after media review/upload.                                                                                                                         |
| `format`                      | No       | For example `jpg`, `png`, `webp`.                                                                                                                       |
| `role`                        | Yes      | `primary`, `gallery`, `detail`, or `lifestyle`.                                                                                                         |
| `sort_order`                  | Yes      | Integer.                                                                                                                                                |
| `is_primary`                  | Yes      | `true` for one primary image per product.                                                                                                               |
| `notes`                       | No       | Manual review notes.                                                                                                                                    |

Rules:

- Do not hotlink BigCommerce/CDN images as the final production strategy.
- Dedupe thumbnails and alternate sizes before upload.
- Keep source image URLs for traceability.
- Existing reviewed Cloudinary media rows may include final public IDs and
  secure URLs.
- Aqua source media currently remains source-only and should keep Cloudinary
  fields blank until a reviewed Cloudinary assignment exists.

## `redirects_launch_v1.csv`

| Column               | Required | Notes                                                        |
| -------------------- | -------- | ------------------------------------------------------------ |
| `legacy_path`        | Yes      | Original path.                                               |
| `new_path_candidate` | Yes      | Reviewed destination route.                                  |
| `entity_type`        | Yes      | `product`, `category`, `static_page`, or `resource_article`. |
| `entity_key`         | No       | Product/category/static key if known.                        |
| `redirect_status`    | Yes      | Suggested values: `draft`, `approved`, `deferred`.           |
| `notes`              | No       | Manual review notes.                                         |

Approved rows reflect the reviewed launch route contract. Keep them aligned with the server-side permanent redirect implementation and tests.

## `import_review_flags_v1.csv`

| Column              | Required | Notes                                                       |
| ------------------- | -------- | ----------------------------------------------------------- |
| `entity_type`       | Yes      | Brand, category, family, product, variant, media, redirect. |
| `entity_key`        | Yes      | Stable key.                                                 |
| `source_url`        | No       | Related source URL.                                         |
| `flag`              | Yes      | Short flag name.                                            |
| `severity`          | Yes      | `info`, `medium`, `high`, `blocker`.                        |
| `resolution_owner`  | No       | Business, engineering, content, media.                      |
| `resolution_status` | Yes      | `open`, `resolved`, `deferred`.                             |
| `notes`             | No       | Review notes.                                               |

Recommended initial flags:

- `missing_sku`
- `duplicate_source_url`
- `brand_review_required`
- `variant_values_required`
- `replacement_part_deferred`
- `table_shipping_policy_required`
- `cloudinary_upload_required`
- `resource_article_crawl_required`

## Required Review Before Schema Work

Before Prisma schema implementation, approve:

- Final brand list.
- Final family list.
- Final product rows after dedupe.
- Which products are variants vs separate products.
- Missing SKU resolutions.
- Replacement part preservation/exclusion behavior.
- Cloudinary media migration naming rules.
- Route patterns for redirects.

## Out Of Scope

- Creating real import CSV artifacts.
- Creating Prisma schema.
- Creating migrations.
- Writing Supabase data.
- Building API routes.
- Building frontend pages.
- Building checkout.
- Uploading images to Cloudinary.
