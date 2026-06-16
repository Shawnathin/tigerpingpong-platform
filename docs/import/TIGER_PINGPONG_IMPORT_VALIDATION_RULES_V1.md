# Tiger PingPong Import Validation Rules V1

## Scope

These rules define the local-only dry-run checks for the Tiger PingPong
normalized import CSV artifacts.

Input directory:

```text
data/import-review/tigerpingpong/v1/
```

Schema source:

```text
packages/db/prisma/schema.prisma
```

Output directory:

```text
var/import-validation/tigerpingpong/latest/
```

## Expected Files

The validator expects all of these files:

- `brands_import_v1.csv`
- `categories_import_v1.csv`
- `product_families_import_v1.csv`
- `products_import_v1.csv`
- `product_variants_import_v1.csv`
- `product_media_import_v1.csv`
- `redirects_draft_v1.csv`
- `import_review_flags_v1.csv`

Missing files are errors.

## Required Columns

Each CSV must include the columns documented in
`docs/catalog/TIGER_PINGPONG_IMPORT_CSV_SPEC_V1.md`.

Missing columns are errors. Extra columns are allowed, but they are not used by
the v1 validator.

## Required Values

Required values must be populated for stable keys, display names, slugs, entity
references, booleans, core statuses, source URLs, and other fields marked as
required in the CSV spec.

Blank required values are errors.

Conditional values such as SKU and price remain review-dependent. They are not
always errors because some products are intentionally draft, deferred, or still
under business review.

## Type Checks

Boolean columns must use:

```text
true
false
```

Integer columns must use integer text when populated.

Invalid boolean or integer values are errors.

## Prisma Enum Checks

The validator reads enum values from `schema.prisma` and checks:

- Product `product_kind` against `ProductKind`.
- Product `status` against `ProductStatus`.
- Product `purchase_mode` against `PurchaseMode`.
- Product `source_review_status` against `SourceReviewStatus`.
- Variant `purchase_mode_override` against `PurchaseMode` when populated.
- Media `role` against `MediaRole`.
- Redirect `redirect_status` against `RedirectStatus`.

Invalid enum values are errors.

## Stable Key And Slug Uniqueness

Stable import keys must be unique:

- `brand_key`
- `category_key`
- `family_key`
- `product_key`
- `variant_key`
- `media_key`
- redirect `legacy_path`

Slugs must be unique within schema-unique CSV groups:

- brand slugs
- category slugs
- product family slugs
- product slugs

Duplicate keys or schema-unique slugs are errors.

## Reference Checks

The validator checks foreign-key-style references by stable key:

- Category `parent_category_key` references an existing category when present.
- Family `brand_key` references an existing brand.
- Family `primary_category_key` references an existing category.
- Product `family_key` references an existing product family.
- Product `brand_key` references an existing brand.
- Product `primary_category_key` references an existing category.
- Variant `product_key` references an existing product.
- Media `product_key` references an existing product.
- Media `variant_key` references an existing variant when present.
- Redirect `entity_key` references a known entity where practical.
- Review flag `entity_key` references a known entity where practical.

Missing practical references are errors. Aggregate review keys such as
`all-product-media-v1` are allowed.

## One-Brand Rule

The only normalized v1 brand is:

```text
tiger-pingpong
```

Rules:

- `brands_import_v1.csv` must contain exactly one brand row.
- That row must use `brand_key` `tiger-pingpong`.
- Every product family must use `brand_key` `tiger-pingpong`.
- Every product must use `brand_key` `tiger-pingpong`.

Violations are errors.

## Replacement Part Rules

Replacement Parts are preserved for traceability, redirects, and future review.
They are not part of v1 public navigation or checkout.

Rules:

- The `replacement-parts` category must exist.
- The `replacement-parts` category must use `v1_public_navigation=false`.
- The `replacement-parts` category must use `v1_checkout_scope=false`.
- Replacement Part products must use `product_kind=replacement_part`.
- Replacement Part products must use `v1_public_navigation=false`.
- Replacement Part products must use `v1_checkout_scope=false`.
- Replacement Part products must use `purchase_mode=deferred_from_v1` or an
  equivalent disabled purchase mode.

Public navigation, checkout scope, or purchase-mode violations are errors.
Missing deferral review flags are warnings.

## Table Rules

Tables are purchasable candidates only after shipping policy review.

Rules:

- Table products must have `shipping_review_required=true` or an open
  `table_shipping_policy_required` review flag.
- Table products must not use fully approved `purchase_mode=online_checkout`
  before policy review.
- Table variants must not override purchase mode to `online_checkout` before
  policy review.

Missing table shipping review coverage is an error. Open table shipping review
is a warning.

## Media Rules

BigCommerce and source image URLs are source metadata only. Cloudinary is the
accepted V1 product media host for reviewed media assignments. The validator
does not upload media or call Cloudinary APIs.

Rules:

- Media `source_url` must be populated.
- Media `cloudinary_secure_url` may be blank for source-only or deferred media.
- Populated `cloudinary_secure_url` values must be HTTPS Cloudinary image
  delivery URLs under `res.cloudinary.com`.
- Populated `cloudinary_secure_url` values require `cloudinary_public_id`, and
  the public ID parsed from the URL must match the CSV public ID.
- Media source URLs should be HTTP(S) metadata URLs.
- Suggested Cloudinary folders should stay under an accepted Tiger PingPong
  product media prefix. Current uploaded media uses `tigerpingpong/products/`;
  older source-only planning rows may still use `tiger-pingpong/products/`.
- More than one primary media row for the same product is a warning.

Invalid or mismatched Cloudinary secure URLs are errors. Valid reviewed
Cloudinary secure URLs are allowed.

## Confirmed Business Update Rules

The validator includes the latest confirmed business values for products that
were previously under review.

Confirmed Aqua prices:

| Product key | SKU | price_cents |
| --- | --- | ---: |
| `tiger-aqua-outdoor-paddle-pack-4` | `15888` | 8000 |
| `tiger-aqua-outdoor-paddle-pack-2` | `15889` | 4500 |
| `tiger-aqua-single-coral` | `15891` | 2500 |
| `tiger-aqua-single-ocean-blue` | `15890` | 2500 |

Confirmed Net & Post status:

| Product key | SKU | Expected state |
| --- | --- | --- |
| `tiger-net-post-set` | `6989-B` | Active v1 checkout candidate |

Mismatched confirmed SKUs or prices are errors. A still-open Net & Post flag
that says checkout readiness is unknown is an error. The Aqua price review flag
should be resolved, while Aqua source/media review may remain open.

## Review Flag Rules

Review flags keep unresolved work visible without making the dry run fail.

Rules:

- Flag severity must be `info`, `medium`, `high`, or `blocker`.
- Flag resolution status must be `open`, `resolved`, or `deferred`.
- Expected open review flags should remain open at the dry-run stage.
- Open review flags are emitted as warnings.

Important open warning types include:

- `table_shipping_policy_required`
- `cloudinary_upload_required`
- `checkout_policy_required`
- Aqua source/media review flags
- `resource_article_crawl_required`

## Exit Behavior

The validator exits successfully when there are no errors, even if warnings are
present.

Warnings represent known review work. Errors represent structural problems that
should block a future import task.

Minimum deployed import gate:

- `pnpm validate:tiger-import` must return `PASS` with zero errors before any
  deployed catalog import tooling is run.
- Warning rows must be reviewed before a deployed import. Blocker-severity
  warnings, including table shipping policy and checkout policy review, block
  public checkout/publishing decisions unless explicitly resolved or accepted
  in the import runbook scope.
