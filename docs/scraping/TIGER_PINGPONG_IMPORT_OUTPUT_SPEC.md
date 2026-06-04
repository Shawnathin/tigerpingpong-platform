# Tiger Ping Pong Import Output Spec

## Output Folder

The scraper writes generated review files under:

```text
var/scrapes/tigerpingpong/latest/
```

The folder is gitignored. Files are for review and import planning only.

## Files

### `scrape_run_report.md`

Human-readable run summary with crawl settings, output location, counts,
purchase mode guess counts, and v1 business-rule notes.

### `urls_discovered.csv`

Fields:

- `normalizedUrl`
- `discoveredFrom`
- `depth`
- `included`
- `classification`
- `fetchStatus`
- `contentType`
- `ignoredReason`

### `products_raw.json`

Raw product extraction records. Each product includes:

- `sourceUrl`
- `legacyPath`
- `slugCandidate`
- `productName`
- `breadcrumb`
- `categoryGuess`
- `productTypeGuess`
- `brand`
- `sku`
- `visiblePrice`
- `priceCents`
- `currency`
- `availability`
- `shippingSummary`
- `description`
- `specsText`
- `warrantyText`
- `relatedUrls`
- `imageUrls`
- `optionCandidates`
- `addToCartVisible`
- `chooseOptionsVisible`
- `purchaseModeGuess`
- `purchaseModeNotes`
- `confidenceNotes`

### `products_clean.csv`

Flattened product review file for spreadsheet triage. Use this file to decide
which products are ready for manual cleanup, import mapping, or deferred review.

### `product_options.csv`

Option and variant candidates detected from selects or labels. These are not
approved variants. Review before using them in schema seed/import data.

### `product_images_manifest.csv`

Product media candidates for future Cloudinary migration planning. The source
image URLs are extracted from TigerPingPong.ca and should not be treated as the
final production hosting strategy.

Fields:

- `product_url`
- `source_url`
- `source_image_url`
- `alt_text`
- `sort_order`
- `suggested_cloudinary_public_id`
- `suggested_cloudinary_folder`
- `suggested_final_filename`
- `role`
- `is_primary`
- `notes`

`source_url` and `source_image_url` both preserve the original product image URL
from TigerPingPong.ca; `source_url` maps to the future `product_media.source_url`
field. Review this file before any later Cloudinary upload or media import task.
This scraper does not upload images to Cloudinary, download raw image files,
commit image files, or hotlink legacy BigCommerce/CDN image URLs as the final
production strategy.

### `categories.csv`

Category page candidates with slug, parent guess, description, and product link
counts.

### `pages_static.csv`

Static page candidates such as about, contact, and shipping/returns content.

### `resources_articles.csv`

Resource article candidates discovered under the resources section.

### `redirect_map_draft.csv`

Draft legacy-path mapping. Final frontend routes are not implemented yet, so the
new path candidates must be reviewed before any redirect task.

### `scrape_flags.csv`

QA flags for manual review.

Common flags:

- `missing_sku`
- `missing_price`
- `missing_images`
- `replacement_part_deferred`
- `table_shipping_review_required`
- `needs_manual_review`
- `option_candidates_detected`
- `duplicate_slug_candidate`

## Purchase Mode Guessing

- Tables: `online_checkout_candidate` by default, with
  `table_shipping_review_required`.
- Paddles, Balls, Nets, Covers, Accessories:
  `online_checkout_candidate` when add-to-cart is visible.
- Replacement Parts: `deferred_from_v1`.
- Missing price, missing SKU, special-order language, discontinued language,
  uncertain fulfillment, or option ambiguity may produce `needs_manual_review`.

## Import Boundary

These files do not create product records, categories, variants, orders,
redirects, checkout records, or database rows. A later explicit import task must
review and map the generated files before any schema, seed, migration, API, or
frontend work.

## Future Product Media Mapping

The future `product_media` database model should support Cloudinary-hosted
images and original source metadata. Planning fields include:

- `cloudinary_public_id`
- `cloudinary_secure_url`
- `source_url`
- `alt_text`
- `title`
- `caption`
- `width`
- `height`
- `format`
- `sort_order`
- `is_primary`

The scraper only prepares metadata for this future mapping. It does not upload
to Cloudinary or write database rows.
