# 057 Catalog + Media Mapping Diagnostic

Date: 2026-06-15
Branch: `feature/catalog-media-mapping-diagnostic-v1`
Status: Diagnostic PR

## Executive summary

The Vice/Aqua card bug is most likely caused by a production media persistence gap plus an old frontend demo fallback.

Source media files say `tiger-vice-paddle` has a correct Vice Cloudinary primary image and 14 uploaded Vice Cloudinary assets. The live production API currently returns the Vice `primaryMedia.mediaKey`, but `primaryMedia.cloudinarySecureUrl` is blank. Because category cards only use live media when `cloudinarySecureUrl` is present, the storefront falls back to `apps/web/src/lib/public-storefront-demo.ts`. That fallback maps `tiger-vice-paddle` to local Aqua prototype images.

Aqua is present in the catalog data, but not as a current V1 storefront product. It exists as four draft paddle products in `products_import_v1.csv`, with confirmed SKUs/prices, `v1_public_navigation=true`, `v1_checkout_scope=false`, `purchase_mode=needs_manual_review`, and no mapped media rows. Aqua also exists in normalized legacy content as a single legacy page, `aqua-outdoor-indoor-paddle`, under `/paddles/aqua-outdoor-indoor-paddle`. The current V1 import split that into four draft products.

This PR does not change code, mappings, checkout, database schema, migrations, or admin/shipment work. It documents the current source-backed state and recommends the next small fixes.

## Source files inspected

- `apps/api/src/catalog/catalog.controller.ts`
- `apps/api/src/catalog/catalog.service.ts`
- `apps/web/src/lib/catalog-api.ts`
- `apps/web/src/lib/product-content.ts`
- `apps/web/src/lib/public-storefront-demo.ts`
- `apps/web/src/app/category-pages.ts`
- `apps/web/src/app/CategoryLandingPage.tsx`
- `apps/web/src/app/catalog/page.tsx`
- `apps/web/src/app/catalog/products/[slug]/page.tsx`
- `apps/web/src/app/catalog/products/[slug]/ProductMediaGallery.tsx`
- `data/import-review/tigerpingpong/v1/products_import_v1.csv`
- `data/import-review/tigerpingpong/v1/product_media_import_v1.csv`
- `data/import-review/tigerpingpong/v1/product_families_import_v1.csv`
- `data/import-review/tigerpingpong/v1/product_variants_import_v1.csv`
- `data/import-review/tigerpingpong/v1/categories_import_v1.csv`
- `data/import-review/tigerpingpong/v1/redirects_draft_v1.csv`
- `data/product-content/tigerpingpong-product-content-normalized.json`
- `data/legacy-website/tigerpingpong-legacy-inventory.json`
- `docs/media/043-cloudinary-upload-manifest-v1.json`
- `docs/media/043-human-image-review-index-v1.md`
- `docs/build-log/030-v1-product-media-completion-pass-v1.md`
- `docs/build-log/043-cloudinary-product-media-import-map-v1.md`
- `docs/qa/043-cloudinary-product-media-import-map-v1.md`
- Live API checks against `https://tigerpingpong-platform.onrender.com/catalog/products`
- Live API checks against `https://tigerpingpong-platform.onrender.com/catalog/products?includeReplacementParts=true&includeInternal=true`

## Current V1 storefront product list

The storefront category pages call `getProducts()`, which reads `/catalog/products`. The API public product filter is:

- `status = active`
- `v1PublicNavigation = true`
- `productKind != replacement_part`
- `purchaseMode != deferred_from_v1`

As observed from the production API on 2026-06-15, the current public product list is:

| Product slug | Product name | Kind | Category | Family | API primary media key | API secure URL |
|---|---|---:|---|---|---|---|
| `tiger-net-post-set` | Table Tennis Net & Post Set | net | nets | net-sets | `tiger-net-post-set-primary-01` | blank |
| `tiger-expo-outdoor-table` | Tiger PingPong Expo Outdoor Ping Pong Table Grey or Blue | table | tables | expo-table | `tiger-expo-outdoor-table-primary-01` | blank |
| `tiger-plaza-outdoor-table-grey` | Tiger PingPong Plaza Outdoor Ping Pong Table Grey | table | tables | plaza-table | `tiger-plaza-outdoor-table-grey-primary-01` | blank |
| `tiger-portland-indoor-table` | Tiger PingPong Portland Indoor Ping Pong Table Grey or Green | table | tables | portland-table | `tiger-portland-indoor-table-primary-01` | blank |
| `tiger-portland-outdoor-table` | Tiger PingPong Portland Outdoor Ping Pong Table Grey or Blue | table | tables | portland-table | `tiger-portland-outdoor-table-primary-01` | blank |
| `tiger-premium-balls-140` | Tiger PingPong Premium 3-Star Ping Pong Balls 140 Pack | ball | balls | premium-3-star-balls | `tiger-premium-balls-140-primary-01` | blank |
| `tiger-premium-balls-6-orange` | Tiger PingPong Premium 3-Star Ping Pong Balls 6 Pack Orange | ball | balls | premium-3-star-balls | `tiger-premium-balls-6-orange-primary-01` | blank |
| `tiger-premium-balls-6-white` | Tiger PingPong Premium 3-Star Ping Pong Balls 6 Pack White | ball | balls | premium-3-star-balls | `tiger-premium-balls-6-white-primary-01` | blank |
| `tiger-table-cover-black-polyester` | Tiger PingPong Protective Ping Pong Table Cover Black Polyester | cover | covers | table-covers | `tiger-table-cover-black-polyester-primary-01` | blank |
| `tiger-vice-paddle` | Tiger PingPong Vice Ping Pong Paddle | paddle | paddles | vice-paddle | `tiger-vice-paddle-primary-01` | blank |
| `tiger-whistler-indoor-table` | Tiger PingPong Whistler Indoor Ping Pong Table Green or Blue | table | tables | whistler-table | `tiger-whistler-indoor-table-primary-01` | blank |

Category visibility from the same product list:

| Route | Current products |
|---|---|
| `/accessories/` | `tiger-net-post-set`, `tiger-premium-balls-140`, `tiger-premium-balls-6-orange`, `tiger-premium-balls-6-white`, `tiger-table-cover-black-polyester`, `tiger-vice-paddle` |
| `/accessories/paddles/` | `tiger-vice-paddle` |
| `/accessories/ping-pong-balls/` | `tiger-premium-balls-140`, `tiger-premium-balls-6-orange`, `tiger-premium-balls-6-white` |
| `/accessories/covers/` | `tiger-table-cover-black-polyester` |
| `/accessories/nets/` | `tiger-net-post-set` |

## Products present in source but hidden/missing from storefront

These records exist in `products_import_v1.csv` and/or normalized legacy content but are not current public storefront products:

| Product/source slug | Source state | Why not visible |
|---|---|---|
| `tiger-aqua-single-coral` | Import CSV product | `status=draft`, `v1_checkout_scope=false`, `purchase_mode=needs_manual_review`, no media rows |
| `tiger-aqua-single-ocean-blue` | Import CSV product | `status=draft`, `v1_checkout_scope=false`, `purchase_mode=needs_manual_review`, no media rows |
| `tiger-aqua-outdoor-paddle-pack-4` | Import CSV product | `status=draft`, `v1_checkout_scope=false`, `purchase_mode=needs_manual_review`, no media rows |
| `tiger-aqua-outdoor-paddle-pack-2` | Import CSV product | `status=draft`, `v1_checkout_scope=false`, `purchase_mode=needs_manual_review`, no media rows |
| `aqua-outdoor-indoor-paddle` | Legacy/normalized content product | Not imported as a single current V1 product; appears to be superseded by the four draft Aqua products |
| `ping-pong-paddle-case` | Legacy/normalized content product | Not present in `products_import_v1.csv`; no current V1 product row found |
| `newgy-table-tennis-balls-orange` | Legacy/normalized content product | Not present in `products_import_v1.csv`; no current V1 product row found |
| `expo-indoor-ping-pong-table-grey-green-blue` | Legacy/normalized content product | Product family notes say Expo Indoor was removed from the current catalog |
| `tiger-table-net-replacement-set` | Import CSV product and normalized content | Replacement part, `status=draft`, `v1_public_navigation=false`, `purchase_mode=deferred_from_v1` |
| `tiger-replacement-net` | Import CSV product and normalized content | Replacement part, `status=draft`, `v1_public_navigation=false`, `purchase_mode=deferred_from_v1` |
| `tiger-pingpong-replacement-part-40` | Legacy/normalized content product | Not present in current import CSV; replacement part source retained only in normalized content |

## Product/media mismatch findings

### Production API has media keys without secure URLs

The production API returns a `primaryMedia.mediaKey` for each current public product, but `primaryMedia.cloudinarySecureUrl` is blank for all inspected public products. This means category cards and product detail image selection do not use the source Cloudinary URL even when the import CSV and upload manifest contain one.

Relevant code paths:

- `apps/api/src/catalog/catalog.service.ts` selects `cloudinarySecureUrl` on media records and serializes it.
- `apps/web/src/app/CategoryLandingPage.tsx` uses live primary media only when `product.primaryMedia?.cloudinarySecureUrl` is truthy.
- `apps/web/src/lib/public-storefront-demo.ts` supplies fallback media when live primary media has no secure URL.
- `apps/web/src/app/catalog/products/[slug]/page.tsx` uses Cloudinary media first, then appends frontend fallback media if only one live image exists, or uses fallback media entirely when live media has no URLs.

### Source CSV has secure URLs for public primary media

`product_media_import_v1.csv` has Cloudinary secure URLs for the public product primary rows, including:

- `tiger-vice-paddle-primary-01` -> `https://res.cloudinary.com/djfcisldm/image/upload/v1781303652/tigerpingpong/products/tiger-vice-paddle/01-main.jpg`
- `tiger-table-cover-black-polyester-primary-01`
- `tiger-premium-balls-6-orange-primary-01`
- `tiger-premium-balls-6-white-primary-01`
- `tiger-premium-balls-140-primary-01`
- all active table primary rows
- `tiger-net-post-set-primary-01`

This suggests the current production DB/API media rows are behind the reviewed source artifact, or an import/update step did not persist `cloudinary_secure_url`.

### Upload manifest has gallery assets that are not represented in the CSV/API

`docs/media/043-cloudinary-upload-manifest-v1.json` reports 69 uploaded files across 11 public products. Examples:

| Product slug | Uploaded assets in manifest | CSV/API primary rows |
|---|---:|---:|
| `tiger-vice-paddle` | 14 | 1 |
| `tiger-premium-balls-140` | 10 | 1 |
| `tiger-portland-outdoor-table` | 8 | 1 |
| `tiger-expo-outdoor-table` | 7 | 1 |
| `tiger-portland-indoor-table` | 7 | 1 |
| `tiger-premium-balls-6-orange` | 6 | 1 |
| `tiger-plaza-outdoor-table-grey` | 5 | 1 |
| `tiger-whistler-indoor-table` | 5 | 1 |
| `tiger-table-cover-black-polyester` | 3 | 1 |
| `tiger-net-post-set` | 2 | 1 |
| `tiger-premium-balls-6-white` | 2 | 1 |

The manifest and human review index therefore contain gallery truth that is not fully mapped into `product_media_import_v1.csv` or exposed by the current API.

## Vice/Aqua paddle finding

The Vice card appears to show Aqua because of fallback behavior, not because the source Cloudinary Vice asset is Aqua.

Evidence:

- `product_media_import_v1.csv` maps `tiger-vice-paddle-primary-01` to the Vice source URL and to Cloudinary public ID `tigerpingpong/products/tiger-vice-paddle/01-main`.
- The downloaded Cloudinary Vice primary image is a pink Vice paddle with a ball on it, matching the legacy/normalized media note: "Tiger PingPong vice pink paddle with white ball on it."
- The live production API returns `tiger-vice-paddle-primary-01`, but does not return a `cloudinarySecureUrl`.
- `apps/web/src/lib/public-storefront-demo.ts` maps `tiger-vice-paddle` fallback media to local Aqua prototype assets:
  - `/storefront/prototype/aqua-paddle/red-paddle-single-cutout.png`
  - `/storefront/prototype/aqua-paddle/blue-paddle-single-cutout.png`
  - `/storefront/prototype/aqua-paddle/aqua-4count-box-angle.jpg`
- `CategoryLandingPage` displays fallback media when live `cloudinarySecureUrl` is absent.

Classification:

- Wrong media mapping in source CSV: no evidence for Vice primary.
- Wrong Cloudinary public ID assignment: no evidence for Vice primary.
- Wrong primary image selection: yes at runtime, because the live API lacks the secure URL and the frontend fallback for Vice is Aqua.
- Product slug mismatch: no evidence for Vice; source and API slug are both `tiger-vice-paddle`.
- Aqua category visibility issue: yes, but separate. Aqua draft products exist and are intentionally hidden by current V1 filters.
- Legacy import gap: yes for Aqua. Legacy normalized content has one Aqua page; current import CSV has four draft Aqua products with no media rows.

## Products with missing or suspicious primary images

### Missing live API secure URL

All current public products inspected from production have a primary media key but no primary media secure URL in the API response:

- `tiger-net-post-set`
- `tiger-expo-outdoor-table`
- `tiger-plaza-outdoor-table-grey`
- `tiger-portland-indoor-table`
- `tiger-portland-outdoor-table`
- `tiger-premium-balls-140`
- `tiger-premium-balls-6-orange`
- `tiger-premium-balls-6-white`
- `tiger-table-cover-black-polyester`
- `tiger-vice-paddle`
- `tiger-whistler-indoor-table`

### Suspicious fallback mappings

- `tiger-vice-paddle` fallback is Aqua prototype imagery. This is the current visible mismatch when the API secure URL is blank.
- `tiger-table-cover-black-polyester` fallback is a local prototype image, while source/CSV/Cloudinary has a real uploaded cover image.
- Other public products have BigCommerce fallback URLs that are more product-appropriate, but they still bypass Cloudinary because the production API secure URLs are blank.

### Source products with no mapped primary image

- The four Aqua draft products have no media rows in `product_media_import_v1.csv`.
- Replacement part rows have source media rows, but no Cloudinary secure URLs and are deferred from V1 public navigation.

## Products with gallery images available but not mapped

The Cloudinary upload manifest includes gallery assets for every uploaded public product, but the current CSV/API path exposes only the single primary row per product.

Most important gaps before product-card polish:

- `tiger-vice-paddle`: 14 uploaded images available, but only one CSV/API media row.
- `tiger-premium-balls-140`: 10 uploaded images available, but only one CSV/API media row.
- `tiger-portland-outdoor-table`: 8 uploaded images available, but only one CSV/API media row.
- `tiger-expo-outdoor-table`: 7 uploaded images available, but only one CSV/API media row.
- `tiger-portland-indoor-table`: 7 uploaded images available, but only one CSV/API media row.
- `tiger-premium-balls-6-orange`: 6 uploaded images available, but only one CSV/API media row.

## Recommended fixes

1. Restore production API `cloudinarySecureUrl` values from reviewed source artifacts.
   - First compare production DB media rows to `product_media_import_v1.csv`.
   - If the DB rows exist with blank URLs, run a safe non-migration data update/import that fills `cloudinarySecureUrl` and `cloudinaryPublicId` from the reviewed CSV.
   - This should be treated as data repair, not a schema migration.

2. Remove or replace the Aqua fallback on `tiger-vice-paddle` only after deciding the production media data repair path.
   - A minimal static fallback fix would replace the Vice fallback assets with the real Vice Cloudinary URL or BigCommerce source image.
   - This report does not apply that fix because the deeper issue is that every public product API primary media secure URL is blank.

3. Decide the Aqua catalog model before exposing it.
   - Confirm whether current storefront should expose one legacy Aqua product, four split Aqua products, or variants under one Aqua family.
   - Confirm names, descriptions, option/variant structure, and media source before changing `status`, `v1_checkout_scope`, or checkout eligibility.

4. Generate or import gallery media rows from the Cloudinary upload manifest.
   - Use the manifest as source evidence for public IDs, secure URLs, product keys, order, local source folder, and alt text.
   - Keep primary row ordering explicit.
   - Do not remove fallback media until the deployed API/UI is verified with Cloudinary URLs.

5. Add a small diagnostic check for media drift.
   - A script or admin read-only page could flag products where `primaryMedia.mediaKey` exists but `cloudinarySecureUrl` is blank.
   - Also flag fallback usage on public category cards once Cloudinary media should be authoritative.

## Recommended future admin tool scope

Keep the future admin tool small and operational:

- View current product images.
- Choose primary image from existing Cloudinary assets.
- Reorder gallery images.
- Assign and unassign existing Cloudinary assets to products.
- Edit basic product description.
- Edit available inventory quantity.

Explicitly out of scope for the first admin pass:

- Upload/delete workflows.
- A full media-library manager.
- Bulk image transformations.
- Full catalog modeling or merchandising suite.
- Checkout, payment, webhook, or order-truth changes.

## Non-goals / things not changed

- No code changes.
- No static fallback mapping changes.
- No checkout, payment, Stripe, webhook, success page, cart truth, or order behavior changes.
- No database migrations.
- No production data writes.
- No DNS, redirect, canonical, sitemap, or robots changes.
- No PR #49 shipment/admin work.
- No visual product-card redesign.
- No broad admin editor.
