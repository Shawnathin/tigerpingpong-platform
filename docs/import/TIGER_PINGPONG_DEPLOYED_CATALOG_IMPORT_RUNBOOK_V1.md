# Tiger PingPong Deployed Catalog Import Runbook V1

## Purpose

This runbook defines the minimum gate for planning and eventually applying
reviewed Tiger PingPong catalog CSVs to deployed Render/Supabase catalog
databases.

The existing Tiger dev importer remains dev-only and must not be pointed at
deployed databases. PR 083 adds a separate deployed-safe command:

```bash
pnpm import:tiger:deployed
```

In PR 083 this command is planning-only. It validates the reviewed CSVs and
prints the affected deployed catalog areas. It does not implement deployed
writes.

## Hard Boundaries

- Do not run `pnpm import:tiger:dev` against deployed Render/Supabase databases.
- Do not change product publishing status as part of validator cleanup.
- Do not publish Aqua through this runbook.
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
PR 083 dry runs do not open a database connection, but `DATABASE_URL` is still
required so operators practice the same invocation shape that a future guarded
write command will require.

Staging dry run:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" pnpm import:tiger:deployed -- --confirm-deployed-import --target=staging --dry-run
```

Production dry run:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" pnpm import:tiger:deployed -- --confirm-deployed-import --target=production --dry-run
```

The deployed importer refuses to run unless all of these are true:

- `DATABASE_URL` is set.
- `--confirm-deployed-import` is present.
- Exactly one target is present: `--target=staging` or `--target=production`.
- `--dry-run` is present.
- `pnpm validate:tiger-import` exits successfully with 0 errors.
- No unknown or ambiguous arguments are passed.

Dry run behavior:

- Runs `pnpm validate:tiger-import`.
- Reads only `data/import-review/tigerpingpong/v1/`.
- Prints planned row counts and sample stable keys by affected table area.
- Prints an Aqua-specific planning snapshot.
- Opens no Prisma/database connection.
- Writes no rows.

## Actual Import Command Status

PR 083 does not implement deployed writes. This command shape is reserved for a
future PR after the planning output, backup steps, and Aqua checklist are
reviewed:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" pnpm import:tiger:deployed -- --confirm-deployed-import --target=production
```

Until a future PR explicitly implements and validates deployed writes, the
approved operational command is dry-run only.

## Expected Affected Tables

The deployed import plan covers reviewed CSV rows for:

- `brands`
- `categories`
- `product_families`
- `products`
- `product_variants`
- `product_media`
- `redirects`
- `import_review_flags`

Variant option CSV columns also imply refreshed rows in:

- `product_options`
- `product_option_values`
- `product_variant_option_values`

No checkout, Stripe, order, tax, shipment, admin, SEO infrastructure, product
media upload, or public styling tables should be touched by this work.

## Backup Before Import

Before any future deployed write is approved:

1. Capture the exact git SHA and CSV artifact state being imported.
2. Export or snapshot the deployed database through the approved Supabase/Render
   database backup process.
3. Export the affected catalog tables listed above to a dated local/private
   backup location.
4. Record the target label, database host, operator, backup location, and import
   command in the launch notes.
5. Re-run `pnpm validate:tiger-import` and the deployed dry run immediately
   before the write.

Do not commit backups, customer/order data, credentials, or raw private exports.

## Rollback Approach

If bad public catalog data appears after a future deployed import:

1. Disable or hide the bad public catalog rows through a minimal safe follow-up
   import or database operation, preserving checkout/payment/order truth.
2. Restore affected catalog rows from the pre-import table exports or database
   snapshot.
3. Re-run the deployed dry-run planner against the corrected CSV state.
4. If the CSVs were wrong, fix the reviewed CSVs first, then re-run the future
   guarded deployed import to restore the intended rows.
5. Verify public pages, cart behavior, and Stripe Checkout prices again before
   considering the rollback complete.

Do not manually delete production rows without an approved rollback plan.

## Media Policy

Reviewed `cloudinary_secure_url` values are allowed in
`product_media_import_v1.csv` when they are valid Cloudinary HTTPS image
delivery URLs and match `cloudinary_public_id`.

Rows without reviewed Cloudinary assignments, including current Aqua source
media rows, should keep Cloudinary fields blank. Source BigCommerce/CDN URLs are
traceability metadata and are not the final production media strategy.

## Current PR 081 Baseline

After validator cleanup, the expected local baseline is:

```text
Tiger import validation PASS: 0 errors, 14 warnings.
```

The previous 11 errors were stale `cloudinary_secure_url` failures for existing
reviewed non-Aqua media rows. Aqua rows validate with blank Cloudinary fields.

## Aqua Post-Import Verification Checklist

After a future deployed write, verify all of the following against the deployed
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
