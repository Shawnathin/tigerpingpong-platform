# Tiger PingPong Dev Catalog Import V1

## Purpose

This document covers the dev-only import script for reviewed Tiger PingPong CSV
artifacts in:

```text
data/import-review/tigerpingpong/v1/
```

The script imports reviewed catalog rows into the migrated Supabase development
database using Prisma from `packages/db`.

It must not be run against production.

## Command

From the repository root:

```bash
pnpm import:tiger:dev -- --confirm-dev-import
```

Dry run, with no database connection opened:

```bash
DATABASE_URL=postgresql://dev-placeholder.invalid/tigerpingpong_platform_dev pnpm import:tiger:dev -- --confirm-dev-import --dry-run
```

The package-level command is also available:

```bash
pnpm --filter @tigerpingpong/db import:tiger:dev -- --confirm-dev-import
```

## Required Environment Variables

- `DATABASE_URL`: Required for every run, including dry run. For the real import,
  this must point at the Supabase development database.

Do not hardcode credentials. Do not commit `.env` files.

## Safety Flags And Refusals

The script refuses to run unless:

- `DATABASE_URL` is set.
- `--confirm-dev-import` is passed.
- The environment is not marked as production through `NODE_ENV=production` or
  `VERCEL_ENV=production`.
- `DATABASE_URL` does not look production-like by name.

The command and script output identify the run as a development-only import. The
script reads only `data/import-review/tigerpingpong/v1/` and does not read
generated scrape output from `var/scrapes/`.

## What It Imports

Import order:

1. `brands_import_v1.csv` -> `Brand`
2. `categories_import_v1.csv` -> `Category`
3. `product_families_import_v1.csv` -> `ProductFamily`
4. `products_import_v1.csv` -> `Product`
5. `product_variants_import_v1.csv` -> `ProductVariant`, `ProductOption`,
   `ProductOptionValue`, and `ProductVariantOptionValue`
6. `product_media_import_v1.csv` -> `ProductMedia`
7. `redirects_draft_v1.csv` -> `Redirect`
8. `import_review_flags_v1.csv` -> `ImportReviewFlag`

Stable CSV keys are used for upserts where Prisma has a unique key. Review flags
are updated by matching `entity_type`, `entity_key`, `source_url`, and `flag`.
Variant option links are refreshed per variant so running the import twice does
not duplicate option-link rows.

## What It Does Not Import

- No generated scrape output from `var/scrapes/`.
- No fake data.
- No production data.
- No Cloudinary upload.
- No image download.
- No API routes.
- No frontend pages.
- No checkout, Stripe, auth, or admin work.
- No automatic redirect approval beyond the reviewed CSV status.

## Business Guardrails

- Only the `Tiger PingPong` v1 brand is accepted.
- Replacement Parts remain draft/deferred, non-public, and out of checkout.
- Table products remain checkout candidates only and keep
  `shipping_review_required=true`.
- Existing BigCommerce image URLs are stored as source metadata only.
- `cloudinary_secure_url` stays blank until a later explicit upload task.
- Product media is imported as non-public and `needs_review`.

## How To Verify In Supabase

After Shawn runs the real dev import, verify counts in Supabase SQL editor:

```sql
select count(*) from brands;
select count(*) from categories;
select count(*) from product_families;
select count(*) from products;
select count(*) from product_variants;
select count(*) from product_media;
select count(*) from redirects;
select count(*) from import_review_flags;
```

Spot-check safety-critical rows:

```sql
select key, product_kind, purchase_mode, v1_public_navigation, v1_checkout_scope
from products
where product_kind = 'replacement_part';

select key, product_kind, purchase_mode, shipping_review_required
from products
where product_kind = 'table';

select media_key, source_provider, source_url, cloudinary_secure_url, is_public
from product_media
order by media_key;
```

Expected review artifact row counts:

| Table area | Expected reviewed rows |
| --- | ---: |
| Brands | 1 |
| Categories | 9 |
| Product families | 10 |
| Products | 17 |
| Product variants | 15 |
| Product media | 13 |
| Redirects | 29 |
| Import review flags | 14 |

## Rollback And Reset Warning

This import is idempotent, but it writes real rows to the target development
database. If the wrong development database is used, reset or rollback through
the approved Supabase/Prisma development reset process. Do not manually delete
production rows, and do not point this script at production.

## Open After Import

- Table freight, curbside, tax, regional, and shipping policy review.
- Final checkout policy review before any public checkout enablement.
- Cloudinary media upload and media dedupe.
- Aqua source URL and source media review.
- Final frontend route patterns before redirect approval.
- Resource article crawl/content work.
