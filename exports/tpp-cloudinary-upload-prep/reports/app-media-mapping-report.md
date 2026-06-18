# TigerPingPong App Media Mapping Report

## Files changed

- `data/import-review/tigerpingpong/v1/product_media_import_v1.csv`
- `exports/tpp-cloudinary-upload-prep/reports/app-media-mapping-report.md`

## Products mapped

- `tiger-aqua-outdoor-indoor-paddle`: 1 primary, 5 gallery images.
- `tiger-expo-outdoor-table`: 1 primary, 5 gallery images.
- `tiger-net-post-set`: 1 primary, 0 gallery images.
- `tiger-plaza-outdoor-table-grey`: 1 primary, 5 gallery images.
- `tiger-portland-indoor-table`: 1 primary, 5 gallery images.
- `tiger-portland-outdoor-table`: 1 primary, 4 gallery images. The primary uses uploaded gallery asset `tpp-portland-outdoor-gallery-02` after visual QA found the uploaded primary asset was the wrong product.
- `tiger-table-cover-black-polyester`: 1 primary, 1 gallery image.
- `tiger-vice-paddle`: existing primary retained, 5 uploaded gallery images mapped.
- `tiger-whistler-indoor-table`: 1 primary, 5 gallery images.

## Categories/heroes mapped

- No standalone category media slot exists in the current app data model. Category landing heroes are driven by `heroImageSlug` in `apps/web/src/app/category-pages.ts` and render the selected product primary media.
- Product-primary updates improve the current category hero slots for tables, indoor tables, outdoor tables, covers, and nets where those pages point at mapped products. Paddle/accessories category heroes still use the existing Vice Paddle primary because this upload manifest did not include a new Vice primary.
- Uploaded standalone category assets were not wired into code because adding a new category media system was outside this media mapping task.

## Assets intentionally not mapped

- 11 uploaded category asset(s) were intentionally not mapped because the app has no existing category-image import/config target:
  - `tigerpingpong/recovered/categorys/category-tables/tpp-category-tables-primary-01` (category-tables, primary 1)
  - `tigerpingpong/recovered/categorys/category-indoor-tables/tpp-category-indoor-tables-primary-01` (category-indoor-tables, primary 1)
  - `tigerpingpong/recovered/categorys/category-outdoor-tables/tpp-category-outdoor-tables-primary-01` (category-outdoor-tables, primary 1)
  - `tigerpingpong/recovered/categorys/category-paddles/tpp-category-paddles-primary-01` (category-paddles, primary 1)
  - `tigerpingpong/recovered/categorys/category-paddles/tpp-category-paddles-gallery-01` (category-paddles, gallery 1)
  - `tigerpingpong/recovered/categorys/category-paddles/tpp-category-paddles-gallery-02` (category-paddles, gallery 2)
  - `tigerpingpong/recovered/categorys/category-paddles/tpp-category-paddles-gallery-03` (category-paddles, gallery 3)
  - `tigerpingpong/recovered/categorys/category-balls/tpp-category-balls-primary-01` (category-balls, primary 1)
  - `tigerpingpong/recovered/categorys/category-balls/tpp-category-balls-gallery-01` (category-balls, gallery 1)
  - `tigerpingpong/recovered/categorys/category-balls/tpp-category-balls-gallery-02` (category-balls, gallery 2)
  - `tigerpingpong/recovered/categorys/category-accessories/tpp-category-accessories-primary-01` (category-accessories, primary 1)
- 1 uploaded product asset was intentionally not mapped because visual QA found it was the wrong product:
  - `tigerpingpong/recovered/products/portland-outdoor/tpp-portland-outdoor-primary-01` (orange ball image, not Portland Outdoor table media)
- No assets from `needs-shawn-review` or `do-not-upload` were used.
- No failed upload rows, missing secure URLs, or missing public IDs were used.

## Best-available assets used

- `tiger-expo-outdoor-table` primary 1: `tigerpingpong/recovered/products/expo-outdoor/tpp-expo-outdoor-primary-01` (best_available)
- `tiger-plaza-outdoor-table-grey` primary 1: `tigerpingpong/recovered/products/plaza-outdoor/tpp-plaza-outdoor-primary-01` (best_available)
- `tiger-portland-indoor-table` primary 1: `tigerpingpong/recovered/products/portland-indoor/tpp-portland-indoor-primary-01` (best_available)
- `tiger-whistler-indoor-table` primary 1: `tigerpingpong/recovered/products/whistler-indoor/tpp-whistler-indoor-primary-01` (best_available)

## Products still missing or weak

- `tiger-vice-paddle` has uploaded gallery images, but this manifest did not include a new `primary` image for it; the existing primary media row was retained.
- Ball product primary images remain on the earlier Cloudinary mappings because this upload manifest only included category-level ball assets, not product-level ball assets.
- Replacement-part products remain unmapped/deferred; they are outside V1 public navigation and this upload manifest did not include approved replacement-part assets.
- Best-available table primary images should be replaced later if higher-quality approved source assets become available.

## QA checklist

- Confirmed app product media is defined through `ProductMedia` records imported from `data/import-review/tigerpingpong/v1/product_media_import_v1.csv`.
- Confirmed web image rendering uses `cloudinarySecureUrl` first, then `cloudinaryPublicId` through `apps/web/src/lib/product-media.ts`.
- Confirmed category landing pages currently use product media via `heroImageSlug`, not standalone category image records.
- Updated only successful uploaded rows with valid Cloudinary public IDs and secure URLs.
- Left pricing, availability, inventory, checkout, Stripe, webhook, cart, shipping, tax, order logic, schema, admin code, redirects, DNS, routes, and canonicals unchanged.

## Rollback notes

- Revert `data/import-review/tigerpingpong/v1/product_media_import_v1.csv` to restore the previous app media import mapping.
- Remove `exports/tpp-cloudinary-upload-prep/reports/app-media-mapping-report.md` if rolling back this media mapping report.
- No Cloudinary uploads, deletes, database migrations, or schema changes were performed.
