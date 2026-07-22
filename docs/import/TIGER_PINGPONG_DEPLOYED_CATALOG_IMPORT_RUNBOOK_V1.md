# Tiger PingPong Deployed Catalog Import Runbook V1

## Purpose

This runbook defines the minimum gate for planning and applying reviewed Tiger
PingPong catalog CSVs to deployed Render/Supabase catalog databases.

The existing Tiger dev importer remains dev-only and must not be pointed at
deployed databases. PR 083 added a separate deployed-safe command:

```bash
pnpm import:tiger:deployed
```

PR 084 adds a guarded write path. Dry runs remain connectionless, and writes
require an additional explicit `--write` flag after validation passes.

## Hard Boundaries

- Do not run `pnpm import:tiger:dev` against deployed Render/Supabase databases.
- Do not change product publishing status outside the explicitly reviewed import
  scope and owner-approved catalog rows.
- Do not change checkout, payment, webhook, order truth, tax, shipment/admin
  work, or public styling.
- Do not upload media from this runbook.
- Do not change redirects, canonicals, sitemap, robots, DNS, or SEO
  infrastructure from this runbook.

## Required Preflight Gate

Run from the repository root:

```bash
pnpm validate:tiger-import
```

Minimum status before a deployed import is allowed:

- The command must return `PASS`.
- Error count must be `0`.
- The generated warning list must be reviewed for import scope.
- Blocker-severity warnings must be resolved, explicitly excluded from the
  deployed import scope, or accepted in the import plan before any deployed
  write is allowed.

Warnings are not all equal:

- Table shipping policy and all-checkout-candidates policy warnings block
  public checkout/publishing decisions until resolved or explicitly signed off.
- Aqua source URL review, remaining Cloudinary upload review, and resource
  article crawl warnings are known review notes unless the planned deployed
  import scope depends on them.

## Dry-Run Planning Command

Use a deployed/staging database URL only after confirming the intended target.
Dry runs do not open a database connection, but `DATABASE_URL` is still required
so operators practice the same invocation shape that the guarded write command
requires.

Staging dry run:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" pnpm import:tiger:deployed -- --confirm-deployed-import --target=staging --dry-run
```

Production dry run:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" pnpm import:tiger:deployed -- --confirm-deployed-import --target=production --dry-run
```

Replacement-parts-only production dry run:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" pnpm import:tiger:deployed -- --confirm-deployed-import --target=production --scope=replacement-parts --dry-run
```

`--scope=replacement-parts` limits the planned and written rows to the Tiger
brand dependency, the Replacement Parts category, its families, its products,
their variants/media, and directly related review flags. The full CSV set is
still validated before scoping. Omit `--scope` for the legacy full-catalog
behavior.

The deployed importer refuses to run unless all of these are true:

- `DATABASE_URL` is set.
- `--confirm-deployed-import` is present.
- Exactly one target is present: `--target=staging` or `--target=production`.
- Exactly one mode is present: `--dry-run` or `--write`.
- At most one supported scope is present: `--scope=replacement-parts` or the
  default full-catalog scope.
- `pnpm validate:tiger-import` exits successfully with 0 errors.
- No unknown or ambiguous arguments are passed.

Dry run behavior:

- Runs `pnpm validate:tiger-import`.
- Reads only `data/import-review/tigerpingpong/v1/`.
- Prints planned row counts and sample stable keys by affected table area.
- Prints an Aqua-specific snapshot for the full scope or an exact
  replacement-parts product snapshot for `--scope=replacement-parts`.
- Opens no Prisma/database connection.
- Writes no rows.

## Actual Import Command

Only run this after the preflight gate, backup steps, dry-run output, and Aqua
checklist are reviewed for the intended target.

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" pnpm import:tiger:deployed -- --confirm-deployed-import --target=staging --write
```

Production uses the same shape with `--target=production`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" pnpm import:tiger:deployed -- --confirm-deployed-import --target=production --write
```

An approved replacement-parts-only write uses the same explicit scope as its
reviewed dry run:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" pnpm import:tiger:deployed -- --confirm-deployed-import --target=production --scope=replacement-parts --write
```

Write behavior:

- Runs `pnpm validate:tiger-import` before opening Prisma.
- Refuses to write if validation exits non-zero.
- Connects with Prisma only in `--write` mode.
- Prints reviewed row counts and existing stable-key matches before the
  transaction writes.
- Uses stable-key upserts for catalog rows where supported.
- Refreshes variant option links only for imported variants.
- Does not delete unknown catalog rows.
- Does not write redirect rows.

## Expected Affected Tables

The deployed import writes reviewed CSV rows for:

- `brands`
- `categories`
- `product_families`
- `products`
- `product_variants`
- `product_media`
- `import_review_flags`

Variant option CSV columns also imply refreshed rows in:

- `product_options`
- `product_option_values`
- `product_variant_option_values`

Reviewed rows in `redirects_launch_v1.csv` are still validated and printed in
planning output, but deployed writes skip the `redirects` table until URL
structure and redirect policy are explicitly approved.

No checkout, Stripe, order, tax, shipment, admin, SEO infrastructure, product
media upload, or public styling tables should be touched by this work.

## Backup Before Import

Before any deployed write is approved:

1. Capture the exact git SHA and CSV artifact state being imported.
2. Export or snapshot the deployed database through the approved Supabase/Render
   database backup process.
3. Export the affected catalog tables listed above plus the exact stable keys
   printed by the dry run. For `--scope=replacement-parts`, include the
   Replacement Parts category, `replacement-nets` and `table-opening-parts`
   families, all three reviewed replacement-part products, their media, and
   directly related review flags.
4. Record the target label, database host, operator, backup location, and import
   command in the launch notes.
5. Re-run `pnpm validate:tiger-import` and the deployed dry run immediately
   before the write.

Do not commit backups, customer/order data, credentials, or raw private exports.

## Rollback Approach

If bad public catalog data appears after a deployed import:

1. Disable or hide the bad public catalog rows through a minimal safe follow-up
   import or database operation, preserving checkout/payment/order truth.
2. Restore affected catalog rows from the pre-import table exports or database
   snapshot.
3. Re-run the deployed dry-run planner against the corrected CSV state.
4. If the CSVs were wrong, fix the reviewed CSVs first, then re-run the guarded
   deployed import to restore the intended rows.
5. Verify public pages, cart behavior, and Stripe Checkout prices again before
   considering the rollback complete.

Do not manually delete production rows without an approved rollback plan.

## Identifying Rows Changed By Import

Use the reviewed stable keys in `data/import-review/tigerpingpong/v1/*.csv`.
The deployed importer upserts by:

- `brands.key`
- `categories.key`
- `product_families.key`
- `products.key`
- `product_variants.key`
- `product_media.media_key`
- `import_review_flags` matched by `entity_type`, `entity_key`, `source_url`,
  and `flag`

For Aqua-specific inspection:

```sql
select key, slug, status, v1_public_navigation, v1_checkout_scope, purchase_mode
from products
where key in (
  'tiger-aqua-outdoor-indoor-paddle',
  'tiger-aqua-single-coral',
  'tiger-aqua-single-ocean-blue',
  'tiger-aqua-outdoor-paddle-pack-2',
  'tiger-aqua-outdoor-paddle-pack-4'
)
order by key;

select pv.key, pv.sku, pv.name, pv.price_cents, pv.is_active
from product_variants pv
join products p on p.id = pv.product_id
where p.key = 'tiger-aqua-outdoor-indoor-paddle'
order by pv.key;
```

## Aqua Visibility Rollback

If Aqua needs to be removed from public storefront visibility while preserving
traceability, restore the pre-import values from the backup or apply a reviewed
CSV/SQL rollback that sets:

- `tiger-aqua-outdoor-indoor-paddle`: previous `status`,
  `v1_public_navigation`, `v1_checkout_scope`, and `purchase_mode`.
- `tiger-aqua-single-coral`, `tiger-aqua-single-ocean-blue`,
  `tiger-aqua-outdoor-paddle-pack-2`, and
  `tiger-aqua-outdoor-paddle-pack-4`: previous visibility/status values if the
  package rows need to be returned to their prior deployed state.

Minimum SQL shape for an emergency visibility rollback, after comparing against
the backup and getting approval:

```sql
update products
set status = 'draft',
    v1_public_navigation = false,
    v1_checkout_scope = false,
    purchase_mode = 'disabled'
where key = 'tiger-aqua-outdoor-indoor-paddle';
```

Prefer a corrected CSV plus guarded deployed import over manual SQL whenever the
situation is not urgent.

## Rerun From Previous CSV State

To rerun from a previous reviewed CSV state:

1. Check out the prior git SHA or restore the previous CSV artifacts.
2. Run `pnpm validate:tiger-import`.
3. Run the deployed dry run against the same target:

   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" pnpm import:tiger:deployed -- --confirm-deployed-import --target=staging --dry-run
   ```

4. Review the affected-row summary and Aqua snapshot.
5. Run the guarded write only after approval:

   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" pnpm import:tiger:deployed -- --confirm-deployed-import --target=staging --write
   ```

## Rollback Verification

After rollback or rerun:

- Re-run `pnpm validate:tiger-import`.
- Re-run the deployed dry run and compare the planned rows to the approved CSV
  state.
- Verify Aqua public product visibility and package option behavior in the
  deployed storefront/API.
- Confirm the archived package slugs do not appear public unless the rollback
  intentionally restored them.
- Confirm no checkout, webhook, order status, tax, shipment/admin, redirect,
  canonical, sitemap, robots, DNS, or styling behavior changed.

## Media Policy

Reviewed `cloudinary_secure_url` values are allowed in
`product_media_import_v1.csv` when they are valid Cloudinary HTTPS image
delivery URLs and match `cloudinary_public_id`.

Rows without reviewed Cloudinary assignments, including current Aqua source
media rows, should keep Cloudinary fields blank. Source BigCommerce/CDN URLs are
traceability metadata and are not the final production media strategy.

## Current Validation Baseline

The warning count evolves as reviewed catalog evidence grows. The durable gate
is zero errors plus human review of every warning in the selected scope:

```text
Tiger import validation PASS: 0 errors, <reviewed warning count> warnings.
```

Do not pin an old warning count as proof. Attach the current validator report
and scoped dry-run output to the release review.

## Part 40 Post-Import Verification Checklist

After an approved replacement-parts scoped write, verify:

- `/catalog/products` returns `tiger-pingpong-replacement-part-40` with active
  checkout flags, current CAD price, and the approved Cloudinary primary image.
- `/replacement-parts/` shows the live price, `$15 CAD` under-threshold shipping
  disclosure, Add to Cart, photo-help fallback, five manuals, and four videos.
- A one-unit cart shows `$7.00` subtotal, `$15.00` shipping, and `$22.00`
  pre-tax total when the reviewed live price remains 700 cents.
- The cart item returns to `/replacement-parts/#part-40`; the generic product
  route and sitemap do not publish Part 40.
- `tiger-table-net-replacement-set` and `tiger-replacement-net` remain draft,
  private, deferred, and non-checkoutable.
- Checkout resolves the price from the deployed catalog and rejects a stale or
  tampered client price before an order or Stripe session is created.

## Part 40 Visibility Rollback

Prefer a corrected reviewed CSV plus the same guarded scoped importer. Return
Part 40 to support-only mode by setting its reviewed row to `status=draft`, both
public/checkout flags to `false`, and `purchase_mode=deferred_from_v1`; then run
the scoped dry run and approved scoped write. Do not delete the product or its
media. The Replacement Parts page will automatically hide price and purchase
controls and retain the working photo-email support path.

## Aqua Post-Import Verification Checklist

After a deployed write, verify all of the following against the deployed
storefront and API-backed checkout flow:

- `/accessories/` loads successfully and does not expose duplicate Aqua package
  product pages.
- `/accessories/paddles/` loads successfully and shows the intended Aqua parent
  product placement.
- `/catalog/products/tiger-aqua-outdoor-indoor-paddle` loads as the single
  public Aqua product page.
- The archived package product slugs do not resolve as duplicate public product
  pages:
  - `tiger-aqua-single-coral`
  - `tiger-aqua-single-ocean-blue`
  - `tiger-aqua-outdoor-paddle-pack-2`
  - `tiger-aqua-outdoor-paddle-pack-4`
- The Aqua product exposes four required package options:
  - Single - Coral Red: `$25.00 CAD`
  - Single - Ocean Blue: `$25.00 CAD`
  - 2-Pack w/ 3 Balls: `$45.00 CAD`
  - 4-Pack w/ 3 Balls: `$80.00 CAD`
- Add-to-cart requires a package option before adding Aqua.
- Cart and cart modal show the selected Aqua package label.
- Stripe Checkout uses the selected package price, not the parent fallback price
  or another package price.
- No checkout, webhook, order status, tax, shipment/admin, product media mapping,
  styling, SEO, redirect, canonical, sitemap, robots, or DNS behavior changed as
  part of the import.
