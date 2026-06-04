# Tiger Ping Pong Catalog Schema V1

## Purpose

This document describes the v1 Prisma catalog schema for TigerPingPong.ca.

This is schema and migration documentation only. It does not import product
data, seed product data, write live Supabase data, build API routes, build
frontend pages, implement checkout, add Stripe, add auth, add admin screens, or
upload images to Cloudinary.

## Migration

Local migration folder:

```text
packages/db/prisma/migrations/20260604190000_catalog_schema_v1/
```

The migration was generated from the Prisma datamodel as an empty-database SQL
diff. It should be reviewed before applying to any Supabase database.

## Core Catalog Shape

The approved hierarchy is:

```text
Brand
ProductFamily
Product
ProductVariant
```

`Category` remains separate from `ProductFamily`. A family belongs to one brand
and one primary category. A product belongs to one brand, one family, and one
primary category. A variant belongs to one product.

## Models Added

- `Brand`: Normalized brand records with stable key, name, slug, active flag,
  notes, and timestamps. V1 data can later create only Tiger PingPong, but the
  schema does not hardcode that row.
- `Category`: Hierarchical categories with parent-child support, source URL,
  legacy path, public-navigation and checkout-scope flags, sort order, SEO
  fields, active flag, and timestamps.
- `ProductFamily`: Brand-owned family grouping separate from category, with
  stable key, primary category, slug, description, source evidence, public and
  active flags, sort order, and timestamps.
- `Product`: Catalog product records with stable key, brand, family, primary
  category, source URL, legacy path, SKU, kind, status, purchase mode, price,
  currency, public and checkout scope flags, shipping review flag,
  descriptions, review statuses, SEO fields, notes, and timestamps.
- `ProductOption`, `ProductOptionValue`, `ProductVariantOptionValue`: Minimal
  option/value support for variant names and values such as table color, ball
  color, pack size, or paddle size. Scraped option noise should not be imported.
- `ProductVariant`: Product-owned variants with stable key, SKU, name, option
  value links, price override, currency, purchase-mode override, active flag,
  source URL, notes, and timestamps.
- `ProductMedia`: Product-owned media records with optional variant ownership,
  Cloudinary asset metadata, source URL/checksum/provider metadata, media role,
  sort order, primary/public/active flags, alt text, title, caption, review
  status, notes, and timestamps.
- `ProductContentSection`, `ProductSpecGroup`, `ProductSpec`: Practical
  product-page planning support from the catalog proposal for content sections,
  spec groups, and specs. These do not create frontend pages or import content.
- `ProductRelationship`: Typed product-to-product relationships for related
  products, upsells, accessories, replacement parts, compatibility, and similar
  use cases, with active/public flags and sort order.
- `Redirect`: Draft legacy-path to new-path candidate records with entity
  type/key, status, notes, and timestamps.
- `ImportReviewFlag`: Review workflow flags keyed by entity type/key, source
  URL, flag, severity, owner/status, notes, and timestamps.
- `QuoteRequest`, `QuoteRequestItem`: Minimal planning records for future quote
  request workflows.
- `Order`, `OrderItem`: Minimal planning records for future checkout-capable
  products, including table freight/shipping review planning fields.

The existing `PlatformMetadata` foundation model remains in the schema.

## Enums Added

- `ProductKind`: `table`, `paddle`, `ball`, `net`, `cover`, `accessory`,
  `replacement_part`.
- `ProductStatus`: `draft`, `active`, `archived`.
- `PurchaseMode`: `online_checkout_candidate`, `online_checkout`,
  `quote_required`, `dealer_contact`, `needs_manual_review`,
  `deferred_from_v1`, `coming_soon`, `disabled`.
- `SourceReviewStatus`: `needs_review`, `approved_for_schema_planning`,
  `deferred`.
- `MediaRole`: `primary`, `gallery`, `detail`, `lifestyle`, `variant`,
  `source_reference`.
- `MediaReviewStatus`: `needs_review`, `approved`, `rejected`, `archived`.
- `MediaSourceProvider`: `bigcommerce`, `cloudinary`, `manual`, `supplier`,
  `unknown`.
- `RelationshipType`: `related`, `upsell`, `cross_sell`, `accessory`,
  `replacement_part`, `compatible_with`, `similar`, `required_part`.
- `RedirectStatus`: `draft`, `approved`, `deferred`.
- `ReviewSeverity`: `info`, `medium`, `high`, `blocker`.
- `ReviewResolutionStatus`: `open`, `resolved`, `deferred`.
- `OrderStatus`: `draft`, `pending_payment`, `paid`, `processing`, `shipped`,
  `delivered`, `cancelled`, `refunded`.
- `QuoteRequestStatus`: `new`, `reviewing`, `contacted`, `closed`.

## Replacement Parts

Replacement parts are preserved by the schema without making them public or
checkout-enabled:

- Use `ProductKind.replacement_part`.
- Use `PurchaseMode.deferred_from_v1`.
- Keep `v1PublicNavigation` false.
- Keep `v1CheckoutScope` false.
- Use `ProductRelationship.relationshipType = replacement_part` when linking
  parts to compatible products.
- Use `Redirect` and `ImportReviewFlag` for future review, redirect planning,
  and import blockers.

## Tables And Shipping Review

Tables can be represented as checkout candidates without being ready for public
checkout:

- Use `ProductKind.table`.
- Use `PurchaseMode.online_checkout_candidate` only after review.
- Keep `shippingReviewRequired` true until freight, curbside delivery, tax,
  region, and table shipping policies are approved.
- Use `Order.containsTableFreightItem` and `Order.shippingReviewRequired` only
  as planning fields for later checkout work.

## Cloudinary Media

`ProductMedia` stores Cloudinary references and source metadata; it does not
store image files and does not upload anything.

Cloudinary fields:

- `cloudinaryAssetId`
- `cloudinaryPublicId`
- `cloudinaryVersion`
- `cloudinarySecureUrl`
- `cloudinaryResourceType`
- `cloudinaryFormat`
- `width`
- `height`
- `bytes`

Source metadata fields:

- `sourceUrl`
- `sourceProvider`
- `sourceChecksum`

BigCommerce image URLs belong in `sourceUrl` with
`MediaSourceProvider.bigcommerce`. They are source evidence only, not final
production media URLs.

## Normalized CSV Mapping

Later reviewed CSV artifacts can map to this schema by stable keys:

- `brands_import_v1.csv` -> `Brand`
- `categories_import_v1.csv` -> `Category`
- `product_families_import_v1.csv` -> `ProductFamily`
- `products_import_v1.csv` -> `Product`
- `product_variants_import_v1.csv` -> `ProductVariant`,
  `ProductOption`, `ProductOptionValue`, and `ProductVariantOptionValue`
- `product_media_import_v1.csv` -> `ProductMedia`
- `redirects_draft_v1.csv` -> `Redirect`
- `import_review_flags_v1.csv` -> `ImportReviewFlag`

CSV artifacts remain review-only until a separate import task is approved.

## Intentionally Deferred

- Product data import and seed rows.
- Normalized CSV artifact creation.
- Live Supabase migration application.
- API routes and backend catalog services.
- Frontend category, listing, and product pages.
- Cart, checkout, Stripe, tax, fulfillment, and auth.
- Admin screens or editorial workflows.
- Cloudinary upload, image dedupe, transformations, or delivery code.
- Final redirect approval, because frontend route patterns are not final.

## Supabase Safety Warning

Do not run this migration against production Supabase without explicit approval.

Before applying to any Supabase project:

- Confirm the target database is local, development, or staging.
- Review the SQL migration and enum/table names.
- Confirm no product seed/import script is being run with it.
- Confirm table shipping, checkout, and media import work are still separate
  follow-up tasks.
