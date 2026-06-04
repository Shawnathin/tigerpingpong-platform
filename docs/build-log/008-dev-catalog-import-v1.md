# 008: Dev Catalog Import V1 Build Log

## What Was Added

- Dev-only Tiger PingPong catalog import script:
  `packages/db/scripts/import-tiger-dev-catalog.mjs`
- Database package command:
  `pnpm --filter @tigerpingpong/db import:tiger:dev`
- Root convenience command:
  `pnpm import:tiger:dev`
- Import operator documentation:
  `docs/import/TIGER_PINGPONG_DEV_IMPORT_V1.md`

## What The Script Reads

- Reviewed CSV artifacts in `data/import-review/tigerpingpong/v1/`.
- Prisma client generated from `packages/db/prisma/schema.prisma`.

The script does not read generated scrape output from `var/scrapes/`.

## What The Script Imports

Import order:

1. Brands
2. Categories
3. Product families
4. Products
5. Product variants and option/value/link records
6. Product media
7. Redirects
8. Import review flags

## Idempotency

- Brands, categories, product families, products, variants, media, and redirects
  use Prisma upserts against stable unique keys.
- Product options and option values use Prisma compound unique upserts.
- Variant option links are refreshed per variant before recreating reviewed CSV
  links.
- Import review flags are matched by `entity_type`, `entity_key`, `source_url`,
  and `flag`, then updated or created.

Running the import twice should not duplicate rows controlled by the reviewed v1
artifact set.

## Safety Controls

The script refuses to run unless:

- `DATABASE_URL` is set.
- `--confirm-dev-import` is passed.
- The environment is not marked production.
- `DATABASE_URL` does not look production-like by name.

Dry run mode is available with `--dry-run` and does not open a database
connection.

## Guardrails Preserved

- One v1 brand only: Tiger PingPong.
- Replacement Parts stay deferred from v1 public navigation and checkout.
- Tables remain checkout candidates with shipping review required.
- Cloudinary secure URLs stay blank.
- BigCommerce image URLs are stored only as source metadata.
- Product media remains non-public and `needs_review`.

## What Was Intentionally Not Added

- No production import.
- No automatic import execution.
- No `.env` files or credentials.
- No generated scrape output committed.
- No Cloudinary upload or image download.
- No frontend/API routes.
- No checkout, Stripe, auth, admin, or order workflow changes.

## Validation Run During This Task

- Missing `DATABASE_URL` safety refusal: passed.
- Placeholder `--dry-run`: passed with expected reviewed CSV row counts.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm db:generate`: passed.
- `git diff --check`: passed.

## Open Review Items

- Shawn must run the real import locally against the confirmed Supabase
  development database.
- Table shipping and freight policy must be approved before public table
  checkout.
- Cloudinary upload remains a later explicit media task.
- Final route patterns must be approved before redirects move beyond draft.
