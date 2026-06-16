# Tiger Ping Pong Cloudinary Media Workflow V1

## Purpose

This document defines the planned Cloudinary media workflow for the Tiger
PingPong catalog rebuild.

It is documentation only. It does not upload images, write to Supabase,
implement Prisma schema, create migrations, add API routes, build frontend
pages, create checkout, or configure Cloudinary services.

## Media Decision

Cloudinary is the v1 product media host.

Database records should store Cloudinary references, URLs, and metadata. They
should not store image files.

BigCommerce CDN image URLs from the scrape are source metadata only. Keep them
for traceability and migration review, but do not use them as the final
production media strategy.

Do not upload additional images to Cloudinary until the schema, product mapping,
variant mapping, and media-role mapping for that media set are ready for
review. Existing PR 43 reviewed uploads are accepted V1 product media
assignments.

## Source Media Reality

The scrape found product images for every product row.

Current scrape media facts:

- `product_images_manifest.csv` contains BigCommerce CDN URLs.
- All source image hosts are `cdn11.bigcommerce.com`.
- The manifest includes multiple sizes, thumbnails, and duplicate image
  candidates.
- Suggested Cloudinary IDs from scrape output are planning hints only.

## Recommended Cloudinary Folder Structure

Use stable, reviewable folders that mirror the normalized catalog shape without
depending on database IDs.

```text
tiger-pingpong/
  products/
    tables/
      expo-table/
      portland-table/
      whistler-table/
      plaza-table/
    balls/
      premium-3-star-balls/
      newgy-robo-balls/
    paddles/
      vice-paddle/
    accessories/
      paddle-accessories/
    covers/
      table-covers/
    nets/
      net-sets/
    replacement-parts/
      replacement-nets/
  source-review/
  archive/
```

Folder rules:

- Keep all v1 product media under `tiger-pingpong/products/`.
- Use normalized product family keys for family folders.
- Keep `newgy-robo-balls` under the Tiger PingPong brand folder. Newgy is
  wording only, not a separate v1 brand folder.
- Use `source-review/` for temporary review uploads if needed.
- Use `archive/` only for media that should remain available but not attached
  to active products.

## Public ID Naming Convention

Recommended public ID pattern:

```text
tiger-pingpong/products/{category_key}/{family_key}/{product_key}-{role}-{sort_order}
```

Variant-specific pattern:

```text
tiger-pingpong/products/{category_key}/{family_key}/{product_key}-{variant_key}-{role}-{sort_order}
```

Examples:

```text
tiger-pingpong/products/tables/expo-table/tiger-expo-indoor-table-primary-01
tiger-pingpong/products/balls/newgy-robo-balls/newgy-robo-balls-144-orange-primary-01
tiger-pingpong/products/covers/table-covers/tiger-table-cover-black-polyester-gallery-02
```

Naming rules:

- Use lowercase kebab-case.
- Prefer normalized product and variant keys over raw scraped names.
- Do not include database IDs.
- Do not include BigCommerce file names unless needed in source notes.
- Keep `newgy` only where it is part of the normalized family or product key.

## Media Roles

Recommended media roles:

| Role | Use | Notes |
| --- | --- | --- |
| `primary` | Main catalog/product image | Exactly one primary image per product or approved variant group. |
| `gallery` | Supporting product images | Sort order controls display sequence. |
| `detail` | Close-ups, construction, packaging, parts | Useful for tables, nets, covers, and paddles. |
| `lifestyle` | In-room or in-use images | Optional; review for quality and accuracy. |
| `variant` | Image tied to a specific color/pack/size variant | Use only when variant mapping is approved. |
| `source_reference` | Preserved source-only reference | Not intended for public display. |

## Recommended `product_media` Fields

Later schema/import work should support these fields or equivalents:

| Field | Purpose |
| --- | --- |
| `media_key` | Stable import/review key. |
| `product_key` | Normalized product reference. |
| `variant_key` | Optional variant reference. |
| `cloudinary_asset_id` | Cloudinary asset identifier after upload. |
| `cloudinary_public_id` | Stable Cloudinary public ID. |
| `cloudinary_version` | Optional Cloudinary version for cache control. |
| `cloudinary_secure_url` | HTTPS delivery URL. |
| `cloudinary_resource_type` | Usually `image`. |
| `cloudinary_format` | Final uploaded format, such as `jpg`, `png`, or `webp`. |
| `width` | Final source width after upload. |
| `height` | Final source height after upload. |
| `bytes` | File size metadata. |
| `role` | Primary, gallery, detail, lifestyle, variant, or source_reference. |
| `sort_order` | Display ordering. |
| `is_primary` | One true primary image per product or approved variant group. |
| `alt_text` | Reviewed accessibility text. |
| `title` | Optional media title. |
| `caption` | Optional display caption. |
| `source_url` | Original BigCommerce CDN URL. |
| `source_provider` | `bigcommerce` for scraped source images. |
| `source_checksum` | Optional dedupe hash from downloaded source file. |
| `review_status` | `needs_review`, `approved`, `rejected`, or `archived`. |
| `notes` | Manual review notes. |

## Upload, Review, And Dedupe Workflow

Recommended workflow for a later media task:

1. Approve the Brand -> Product Family -> Product -> Variant map.
2. Approve product keys, variant keys, category keys, and media roles.
3. Export source image candidates from `product_images_manifest.csv`.
4. Remove thumbnails, alternate sizes, and duplicate source URLs.
5. Download source candidates into a temporary, uncommitted review location.
6. Calculate checksums to dedupe identical files.
7. Choose primary, gallery, detail, lifestyle, and variant roles.
8. Confirm alt text and product/variant attachment.
9. Upload approved files to Cloudinary using final folders and public IDs.
10. Record Cloudinary references and original BigCommerce source metadata in
    the reviewed media import data.
11. Keep downloaded source files and generated upload output out of Git.

## Recommended Transformations

Use Cloudinary transformations at delivery time rather than creating many
stored copies.

Recommended transformation presets:

| Preset | Suggested use | Notes |
| --- | --- | --- |
| `product_card` | Product listing cards | Square or 4:3 crop, auto quality, auto format. |
| `product_gallery_main` | Main product detail image | Fit within large display area, auto quality, auto format. |
| `product_gallery_thumb` | Gallery thumbnails | Small square crop, auto quality, auto format. |
| `cart_thumb` | Cart and checkout thumbnails | Small square crop, consistent background. |
| `admin_review` | Internal review views | Preserve detail; avoid aggressive cropping. |

Suggested transformation behavior:

- Use `f_auto` and `q_auto` for public delivery.
- Use consistent aspect ratios for card and thumbnail contexts.
- Avoid cropping tables so heavily that legs, nets, or table edges are hidden.
- Preserve enough resolution for zoom/detail views.
- Use reviewed alt text instead of deriving public alt text from file names.

## Import Readiness

Media is not ready for production import until:

- Normalized product and variant keys are approved.
- One-brand v1 decision is reflected in all media folder paths.
- Replacement Parts are marked as deferred from v1 public navigation and
  checkout.
- Product media roles are reviewed.
- Duplicate and thumbnail images are removed.
- Cloudinary public IDs are approved.
- Source BigCommerce URLs are retained as metadata only.

Reviewed Cloudinary secure URLs are allowed in `product_media_import_v1.csv`
when they are valid `https://res.cloudinary.com/.../image/upload/...` delivery
URLs and match the row's Cloudinary public ID. Source-only rows should keep
Cloudinary fields blank until a reviewed assignment exists.

## Out Of Scope For This Documentation

- Cloudinary account configuration.
- Upload scripts or API calls.
- Image downloading.
- Image transformations in code.
- Database schema implementation.
- Supabase writes.
- Frontend rendering.
- Checkout or cart work.
