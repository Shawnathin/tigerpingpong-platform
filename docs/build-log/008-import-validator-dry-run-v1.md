# 008: Import Validator Dry Run V1 Build Log

## What Was Added

- Local Tiger PingPong import validator:
  `tools/tiger-import-validator/src/validate-tiger-import.mjs`
- Root script:
  `pnpm validate:tiger-import`
- Gitignore entry for generated validation output:
  `var/import-validation/`
- Import validator README:
  `docs/import/TIGER_PINGPONG_IMPORT_VALIDATOR_README.md`
- Validation rule reference:
  `docs/import/TIGER_PINGPONG_IMPORT_VALIDATION_RULES_V1.md`

## What The Validator Reads

- Reviewed CSV artifacts in `data/import-review/tigerpingpong/v1/`.
- Prisma schema source in `packages/db/prisma/schema.prisma`.

## What The Validator Produces

Generated dry-run reports are written to:

```text
var/import-validation/tigerpingpong/latest/
```

Generated files:

- `import_validation_report.md`
- `import_validation_summary.json`
- `import_validation_errors.csv`
- `import_validation_warnings.csv`

The generated output folder is gitignored and should not be committed.

## Validation Coverage

The validator checks:

- Expected file presence.
- Required columns.
- Required stable values.
- Boolean and integer values.
- Prisma enum values.
- Unique stable keys and slugs.
- Foreign-key-style references by stable key.
- The one-brand v1 rule for `tiger-pingpong`.
- Replacement Part deferral rules.
- Table shipping/freight policy review rules.
- Confirmed Aqua price and Net & Post checkout-ready business updates.
- Cloudinary media dry-run rules.
- Draft redirect references where practical.
- Review flag severity, status, and open business/media/content warnings.

## Initial Dry-Run Result

`pnpm validate:tiger-import` passed with:

- Errors: 0
- Warnings: 14

Warnings are expected at this stage. They preserve open review items for table
shipping policy, checkout policy, Aqua source/media review, Cloudinary upload,
and resource article crawling. Aqua price review is resolved after the confirmed
business price update.

## What Was Intentionally Not Added

- No Supabase writes.
- No database migrations.
- No product imports.
- No seed data.
- No API routes.
- No frontend pages.
- No checkout, Stripe, auth, admin, or Cloudinary upload work.
- No generated validation output committed.

## Confirmed Business Updates Applied

Confirmed Aqua prices:

| Product | SKU | price_cents |
| --- | --- | ---: |
| Aqua Outdoor Paddle Pack - 4 Pack | `15888` | 8000 |
| Aqua Outdoor Paddle Pack - 2 Pack | `15889` | 4500 |
| Aqua Single Coral | `15891` | 2500 |
| Aqua Single Ocean Blue | `15890` | 2500 |

Confirmed Net & Post status:

- Table Tennis Net & Post Set SKU `6989-B` is checkout-ready.
- No checkout-readiness-unknown flag remains open for `tiger-net-post-set`.
- Global checkout policy review still remains open.

Cloudinary context:

- Confirmed cloud name for a later task: `djfcisldm`.
- No Cloudinary credentials were committed.
- No images were uploaded.
- Environment variable documentation uses placeholders only:

```text
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Source Material Inspected

- `packages/db/prisma/schema.prisma`
- `docs/build-log/006-catalog-schema-v1.md`
- `docs/build-log/007-normalized-import-csv-v1.md`
- `docs/catalog/TIGER_PINGPONG_IMPORT_CSV_SPEC_V1.md`
- `docs/catalog/TIGER_PINGPONG_CATALOG_NORMALIZATION_V1.md`
- `docs/media/TIGER_PINGPONG_CLOUDINARY_MEDIA_WORKFLOW_V1.md`
- CSV artifacts under `data/import-review/tigerpingpong/v1/`

## Open Review Items Surfaced

- Table freight, curbside, tax, regional, and shipping policy review remains
  open before public table checkout.
- Overall checkout policy review remains open.
- Aqua paddle source/media review remains open.
- Cloudinary upload remains open and out of scope for this task.
- Resource article crawl remains open and out of scope for this task.
