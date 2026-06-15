# 061 - Bulk Product Media Mapping Repair

Date: 2026-06-15
Branch / PR: `feature/bulk-product-media-mapping-repair-v1`
Status: Draft PR workflow

## Purpose

This adds a safe repair workflow for product media mappings using the reviewed
Google Drive folder titles and the PR 43 Cloudinary upload manifest.

The workflow is dry-run by default. It does not write to the database unless
`--apply` is passed, and it never deletes Cloudinary assets.

## Dry Run

Run from the repo root:

```bash
node scripts/repair-product-media-mappings.mjs
```

The dry run writes a timestamped JSON report:

```text
var/reports/product-media-mapping-repair-YYYYMMDD-HHMMSS.json
```

The report uses CSV media rows when `DATABASE_URL` is not set. If `DATABASE_URL`
is set, the script also reads current `ProductMedia` rows for a better
before-state view.

## Reading The Report

Key sections:

- `scannedProducts`: catalog products, current fallback media, and whether a
  Cloudinary primary is available.
- `scannedMediaAssets`: Cloudinary manifest uploads and blank secure URL flags.
- `currentMediaRows`: current media rows from the database when available,
  otherwise from `product_media_import_v1.csv`.
- `proposedMappings`: proposed primary and gallery order per product, with
  confidence and reasons.
- `suspiciousConflicts`: wrong-family fallbacks, missing primary images,
  public ID conflicts, and blank secure URLs.
- `recommendedManualReviewList`: the short list to review before applying.

The known `tiger-vice-paddle` issue is intentionally flagged when the current
fallback image points at Aqua prototype media. Its proposed primary should be:

```text
tigerpingpong/products/tiger-vice-paddle/01-main
```

## Safe Apply

Apply mode uses the Prisma Client generated for the `@tigerpingpong/db`
workspace package. Generate it first if it is missing:

```bash
pnpm --filter @tigerpingpong/db prisma:generate
```

Apply mode writes only high-confidence mappings:

```bash
DATABASE_URL='<postgres connection string>' node scripts/repair-product-media-mappings.mjs --apply
```

Apply mode:

- requires `--apply`;
- requires `DATABASE_URL`;
- fails with the exact generate command if the package-scoped Prisma Client is
  missing or not generated;
- updates or creates `ProductMedia` rows for high-confidence Cloudinary assets;
- clears only competing primary flags for the same product;
- skips mappings with public IDs already assigned to another product;
- stores before/after row data in `applyResult.changes` for manual revert.

Do not run apply against production without reviewing the dry-run report first.

## Revert

Use the generated apply report:

1. Open `applyResult.changes`.
2. For each `updated` change, restore the `before` values on that media row.
3. For each `created` change, mark that row inactive or delete it only after
   confirming it was created by this apply run.
4. Restore any `updated_existing_primary_flag` rows to their `before.isPrimary`
   value.

The script does not delete rows automatically because keeping the before/after
record is safer for launch review.

## When To Use The Admin Media Tool Instead

Use the admin media tool when:

- confidence is not `high`;
- a product needs a one-off manual gallery edit;
- the media is not present in the PR 43 Cloudinary manifest;
- the product is deferred from V1 checkout;
- a human needs to choose between visually similar assets.

Use this bulk script when several manifest-backed mappings need the same
deterministic repair pass.
