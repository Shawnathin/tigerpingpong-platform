# 055 Product Page Gallery + Required Table Colour Options Source Review

Date: 2026-06-15
Branch: feature/product-gallery-colour-options-v1
Status: Source review complete

## Sources inspected

- `docs/media/043-cloudinary-upload-manifest-v1.json`
- `data/import-review/tigerpingpong/v1/product_media_import_v1.csv`
- `data/import-review/tigerpingpong/v1/products_import_v1.csv`
- `data/import-review/tigerpingpong/v1/product_variants_import_v1.csv`
- `data/product-content/tigerpingpong-product-content-normalized.json`
- `data/legacy-website/tigerpingpong-legacy-inventory.json`
- `docs/build-log/043-cloudinary-product-media-import-map-v1.md`
- `docs/build-log/044-product-media-gallery-options-v1.md`
- `docs/qa/043-cloudinary-product-media-import-map-v1.md`
- `docs/qa/044-product-media-gallery-options-v1.md`
- Product detail, cart, checkout, catalog API, and checkout API code paths.

## Product photos found

The local raw `images/` folder was not present in this checkout, and no raw image files were
found under `images/`.

Committed source-of-truth media records were found in the Cloudinary upload manifest and media
import CSV. The manifest records the prior local source folders, image counts, Cloudinary public
IDs, secure URLs, dimensions, alt text, upload status, and skipped/deferred folders. It documents
184 local image files discovered during PR 043 and 69 uploaded Cloudinary images for 11 current V1
checkout-enabled products.

Small prototype fallback assets were found under `apps/web/public/storefront/prototype/`.
Existing BigCommerce CDN and prototype fallback media are defined in
`apps/web/src/lib/public-storefront-demo.ts`.

Raw images were not committed.

## Image mappings and manifests found

Primary mapping files:

- `docs/media/043-cloudinary-upload-manifest-v1.json`
- `data/import-review/tigerpingpong/v1/product_media_import_v1.csv`

The manifest and CSV agree that Cloudinary secure URLs are available for current V1 mapped product
media. The frontend product detail path uses catalog Cloudinary media first, then fallback media,
then a placeholder.

## Old HTML and legacy references

No committed `.html` or `.htm` product-page exports were found outside ignored build dependency
folders. The available legacy product-page references in this checkout are extracted or normalized
artifacts:

- `data/product-content/tigerpingpong-product-content-normalized.json`
- `data/legacy-website/tigerpingpong-legacy-inventory.json`
- source URLs and legacy paths in the import CSV files
- PR 043 and PR 044 build/QA notes

The product page should preserve sourced commerce content from those artifacts where customer-safe:
product name, price, category/family context, SKU/variant data, sourced descriptions, source
shipping notes through the approved V1 shipping copy, options, specs, dimensions, warranty notes,
and availability/checkout status. Internal review notes, source-workflow notes, and placeholder
claims should not be shown as customer copy.

## Products with multiple images

Cloudinary manifest image counts for current mapped V1 products:

| Product slug | Images |
| --- | ---: |
| `tiger-vice-paddle` | 14 |
| `tiger-premium-balls-6-white` | 2 |
| `tiger-premium-balls-140` | 10 |
| `tiger-net-post-set` | 2 |
| `tiger-premium-balls-6-orange` | 6 |
| `tiger-table-cover-black-polyester` | 3 |
| `tiger-portland-outdoor-table` | 8 |
| `tiger-expo-outdoor-table` | 7 |
| `tiger-portland-indoor-table` | 7 |
| `tiger-whistler-indoor-table` | 5 |
| `tiger-plaza-outdoor-table-grey` | 5 |

## Required table colour options

Canonical variant data in `product_variants_import_v1.csv` identifies these active table colour
choices:

| Product slug | Active checkout colour values | Required selector |
| --- | --- | --- |
| `tiger-expo-outdoor-table` | Grey, Blue | Yes |
| `tiger-portland-outdoor-table` | Grey, Blue | Yes |
| `tiger-portland-indoor-table` | Grey, Green | Yes |
| `tiger-whistler-indoor-table` | Green, Blue | Yes |
| `tiger-plaza-outdoor-table-grey` | Grey | No |

Portland Outdoor also has legacy V1 grey/blue rows, but those are inactive and marked
`deferred_from_v1`, so the active V2 rows are the checkout source.

Ball colour and pack variants are not part of the V1 required table top colour selector. Their
product names already separate or identify the customer-facing pack/color context.

## Current product-page behavior

The current product detail route is `apps/web/src/app/catalog/products/[slug]/page.tsx`.

Current implementation:

- sorts catalog media and keeps Cloudinary media with secure URLs first;
- appends fallback media only when there is a single Cloudinary image, or uses fallback media when
  Cloudinary media is missing;
- renders a stable main image and clickable thumbnail buttons through
  `ProductMediaGallery.tsx`;
- falls back to a product placeholder when image URLs are missing or fail;
- derives required table `Top colour` options from active product variants;
- shows sourced product story, facts, option/variant table, specs, highlights, relationships, V1
  shipping copy, and support links without exposing admin/internal navigation.

## Cart, checkout, and order architecture

Cart state is anonymous/localStorage based and is not payment truth. Cart line identity includes
the product slug plus selected option key/value pairs, so different colours become separate cart
lines.

The product add-to-cart modal and cart page both display selected options using cart option labels.
The cart checkout request sends only product slug, quantity, and selected option name/value pairs.

The backend checkout service reloads product, media, and variant data from the database. It
calculates prices and shipping server-side, validates required table colour selections against
active checkoutable variants, rejects arbitrary options, and writes the selected colour into the
server-validated order item display name plus variant key/SKU. No client code marks payment paid.
Stripe webhook-confirmed backend order state remains payment truth.

The current order item schema does not have structured option snapshot JSON. No migration was
created or required for this review.

## Gaps and risks

- Raw local `images/` files are intentionally not present or committed in this checkout. The
  committed Cloudinary manifest is the available source for local image inventory, image order, and
  uploaded secure URLs.
- No committed legacy `.html` exports were found. Product-page content review depends on normalized
  legacy JSON, import CSV source URLs/legacy paths, and existing build notes.
- Live gallery behavior depends on the target API/database exposing the PR 043 Cloudinary media
  rows. If production data has only one media row per product, the UI can only render what the API
  returns plus fallback media.
- Order item options are preserved through validated display names, variant keys, and SKUs. A later
  schema change would be needed for first-class structured option snapshots.

## Explicit guardrails preserved

- No raw images were committed.
- No Cloudinary credentials or secrets were committed.
- No DNS, redirect, sitemap, robots, or canonical-domain work was done.
- No Stripe payment-truth, webhook endpoint, or client-paid-status changes were made.
- No database migration was created.
- PR 049 shipment/admin draft work was not touched.
