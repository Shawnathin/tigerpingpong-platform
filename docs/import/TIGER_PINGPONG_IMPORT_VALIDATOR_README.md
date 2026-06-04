# Tiger PingPong Import Validator README

## Purpose

The Tiger PingPong import validator is a local dry-run tool for the normalized
CSV review artifacts in:

```text
data/import-review/tigerpingpong/v1/
```

It checks the reviewed CSV files against the catalog schema shape documented in
Prisma and the import CSV specs, then writes a human-readable readiness report.

The validator is meant to answer one question:

```text
Are these CSV review artifacts structurally ready for a future import task?
```

## What It Does

- Confirms the expected CSV files exist.
- Parses each CSV file.
- Confirms required columns are present.
- Confirms required stable keys are populated and unique.
- Checks duplicate keys and slugs where the Prisma schema expects uniqueness.
- Checks foreign-key-style references by stable key.
- Checks Prisma enum values for product kind, status, purchase mode, review
  status, media role, and redirect status.
- Enforces the one-brand v1 rule for `tiger-pingpong`.
- Confirms Replacement Parts stay deferred from v1 public navigation and
  checkout.
- Confirms table rows remain marked for shipping/freight policy review.
- Confirms the business-approved Aqua prices and Net & Post checkout-ready
  status stay reflected in the CSVs.
- Confirms Cloudinary secure URLs are still blank.
- Surfaces open review flags as warnings.
- Writes a local import validation report.

## What It Does Not Do

- Does not write to Supabase.
- Does not run Prisma migrations.
- Does not insert catalog rows.
- Does not seed product data.
- Does not import the CSVs.
- Does not build API routes.
- Does not build frontend pages.
- Does not add checkout, Stripe, auth, admin, or Cloudinary upload work.
- Does not upload or download media.

## How To Run

From the repository root:

```bash
pnpm validate:tiger-import
```

The command runs:

```bash
node tools/tiger-import-validator/src/validate-tiger-import.mjs
```

## Generated Reports

Generated validation output is written to:

```text
var/import-validation/tigerpingpong/latest/
```

The generated files are:

- `import_validation_report.md`
- `import_validation_summary.json`
- `import_validation_errors.csv`
- `import_validation_warnings.csv`

The generated output folder is gitignored and should not be committed.

## Errors Versus Warnings

Errors are structural blockers. They indicate that a future import would be
unsafe or impossible without correcting the review artifacts first.

Examples:

- Missing expected CSV files.
- Missing required columns.
- Blank required stable keys.
- Duplicate stable keys or schema-unique slugs.
- References to missing brands, categories, families, products, variants, or
  media rows where the relationship is practical to validate.
- Invalid Prisma enum values.
- Replacement Parts marked as public navigation or checkout scope.
- Table products treated as fully approved checkout without policy review.
- Non-blank `cloudinary_secure_url` values before a Cloudinary upload task.

Warnings are readiness notes. They keep known business, content, checkout, and
media issues visible without blocking the dry run.

Examples:

- Open table freight, curbside, tax, regional, and shipping policy review.
- Open checkout policy review.
- Open Aqua source/media review.
- Open Cloudinary upload review.
- Open resource article crawl review.
- Draft redirect or media quality issues that need later manual approval.

## Cloudinary Context

Cloudinary remains out of scope for this dry run. The confirmed cloud name for a
later media task is `djfcisldm`, but the validator does not use Cloudinary
credentials and does not upload images.

If Cloudinary environment variables are documented or added in a later task, use
placeholders only:

```text
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Do not commit Cloudinary API secrets or credentials.

## Why It Does Not Write To The Database

These CSVs are review artifacts, not import data. The validator only checks
whether the artifacts are internally consistent and aligned with the Prisma
catalog schema. Keeping it read-only avoids accidentally turning a review pass
into a data mutation task.

A future import task should be separate, explicit, and reviewed on its own.
