# 044 - Product Media Gallery Options V1

## Summary

Task 044 fixes the product detail media UI so it can render a usable image
gallery when multiple media rows are present, and adds the minimal required V1
table top colour selector for table products with multiple active colour
variants.

PR 43 was confirmed merged before this branch started:
`https://github.com/Shawnathin/tigerpingpong-platform/pull/43`, merged into
`main` on 2026-06-12 at 23:07 UTC.

No Stripe payment truth, webhook paid-transition behavior, checkout/session
architecture, Supabase schema, migrations, admin auth, internal order
protection, DNS/domain settings, raw image files, or Cloudinary credentials were
changed.

## Media Data Findings

PR 43 added Cloudinary upload and mapping artifacts for 11 current V1 checkout
products. The reviewed media manifest documents 69 mapped image files across
those 11 products, and `data/import-review/tigerpingpong/v1/product_media_import_v1.csv`
contains Cloudinary secure URLs for the mapped current product rows.

The catalog API shape already supports:

- product list `primaryMedia`;
- product detail `media[]`;
- Cloudinary-first rendering in the web layer;
- fallback media when Cloudinary URLs are missing.

Current deployed API check on 2026-06-12 against
`https://tigerpingpong-platform.onrender.com` returned one media row and zero
Cloudinary URLs for each checked V1 product. That means the code and mapping are
ready for multi-image Cloudinary galleries, but the deployed database/API data
still needs the PR 43 media import data before the live site can display those
Cloudinary galleries.

Answers:

- Are Cloudinary URLs present in catalog/product data? In the PR 43 repo
  mapping files, yes. In the currently deployed API response checked on
  2026-06-12, no.
- Are multiple images available per product? In the PR 43 manifest/mapping,
  yes for the 11 mapped V1 products. In the currently deployed API response,
  no; it returned one media row per checked product.
- Does the product detail UI render only the first image? Before this task, the
  detail page used the first image as the main image and rendered passive
  thumbnails without thumbnail switching.
- Does the catalog card use primary media correctly? Yes. Catalog cards already
  prefer `primaryMedia.cloudinarySecureUrl` and fall back only when it is
  missing.
- Are fallbacks still active? Yes. Product detail, catalog cards, cart
  thumbnails, and Stripe image selection still fall back safely when mapped
  Cloudinary media is absent.

## Gallery UI Result

Product detail media now renders through a client gallery component:

- the first media item remains the initial main image;
- every available media item renders as a thumbnail button;
- clicking a thumbnail changes the main image;
- image load failures are replaced with the existing product placeholder
  instead of showing broken image icons;
- mobile thumbnails scroll horizontally without page overflow;
- catalog cards continue to show only the primary image.

## Table Colour Option Findings

The canonical import variant data shows active table colour choices:

| Product slug                     | Active top colour values          | Selector |
| -------------------------------- | --------------------------------- | -------- |
| `tiger-expo-outdoor-table`       | Grey, Blue                        | Yes      |
| `tiger-portland-outdoor-table`   | Grey, Blue on current V2 variants | Yes      |
| `tiger-portland-indoor-table`    | Grey, Green                       | Yes      |
| `tiger-whistler-indoor-table`    | Green, Blue                       | Yes      |
| `tiger-plaza-outdoor-table-grey` | Grey only                         | No       |

The selector is intentionally limited to table top colour. Ball colour/pack
variants remain unchanged because they are not the requested V1 table top colour
selector and their product names already separate or identify the pack/color
context.

## Option Selector Result

Applicable table product detail pages now show a required `Top colour` selector
before Add to cart. No default is selected. Add to cart is disabled until the
customer selects a colour, with clear inline text explaining the required
selection.

The client stores selected options as option keys and values plus display labels
for cart UI. Checkout submits only the product slug, quantity, and selected
option key/value pairs.

## Cart Result

Cart line identity now includes selected options. The same product with
different selected colours becomes separate cart rows, for example:

- Expo Outdoor table / Top colour: Grey
- Expo Outdoor table / Top colour: Blue

Selected options are shown in the add-to-cart modal and cart page. Quantity
updates, removes, cart count, add-on modal behavior, and checkout-from-cart use
the option-specific cart line id.

## Checkout And Order Result

Checkout still re-fetches server-trusted product data and uses server-trusted
prices. The checkout API now validates selected options against active canonical
product variants before creating pending orders or Stripe line items.

Accepted table colour selections:

- must use the canonical `Color` option key;
- must match an active canonical colour value;
- must match exactly one active checkoutable variant.

Rejected selections:

- arbitrary option names or values;
- missing required colour for multi-colour table products;
- selected options on products that do not require the V1 table colour selector;
- duplicate cart lines with the same product and same selected option signature.

Order item structured option JSON is not available in the current schema. No
migration was created. The selected colour is preserved through the safest V1
path available today:

- server-validated order item display name, such as
  `Tiger PingPong Expo Outdoor Ping Pong Table Grey or Blue (Top colour: Grey)`;
- server-connected `variantKey` and variant SKU where the selected colour maps
  to an active variant;
- Stripe line item product name using the same validated display name;
- internal order detail showing the item name, variant key, and SKU.

## Fallback Media Result

Fallback media remains in place and is still used whenever catalog media is
missing a Cloudinary URL. The gallery component also replaces failed image loads
with the existing placeholder treatment.

## Risks

- The currently deployed API data checked on 2026-06-12 does not yet expose the
  PR 43 Cloudinary URLs or multiple media rows. Human visual QA on production
  will continue to see fallback or single-image behavior until the PR 43 media
  import data reaches the deployed database/API.
- The current order item schema has no structured options JSON. The V1
  implementation preserves selected colour in validated display names,
  variant keys, and SKUs, but a later schema change would be needed for
  first-class option snapshots.
