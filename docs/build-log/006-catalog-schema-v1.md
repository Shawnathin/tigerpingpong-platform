# 006: Catalog Schema V1 Build Log

## What Was Added

- Prisma catalog schema for Brand -> Product Family -> Product -> Variant.
- Category hierarchy support that remains separate from product families.
- Product option, option value, variant, and variant-option join models.
- Product media model for Cloudinary references, review metadata, and
  BigCommerce/source URL traceability.
- Product content sections, spec groups, specs, and product relationships.
- Draft redirect and import review flag models for legacy-route planning and
  pre-import review workflow.
- Planning tables for quote requests, quote request items, orders, and order
  items.
- Controlled Prisma enums for product kind/status, purchase mode, review
  status, media role/provider, quote status, order status, redirect status,
  relationship type, review severity, and review resolution status.
- Migration folder:
  `packages/db/prisma/migrations/20260604190000_catalog_schema_v1/`.
- Schema reference:
  `docs/database/TIGER_PINGPONG_CATALOG_SCHEMA_V1.md`.

The existing `PlatformMetadata` model was kept. Because this repository did not
previously contain a Prisma migration, the generated migration also creates the
existing `platform_metadata` table.

## What Was Intentionally Not Added

- No product data import.
- No seed data or fake product rows.
- No generated scrape output.
- No API routes.
- No frontend pages.
- No cart or checkout implementation.
- No Stripe integration.
- No auth.
- No admin screens.
- No Cloudinary upload scripts or uploaded image records.
- No production Supabase migration application.
- No API, frontend, checkout, auth, admin, or Stripe implementation work.

## Migration Name

- `20260604190000_catalog_schema_v1`

The migration SQL was generated from the Prisma datamodel with `prisma migrate
diff --from-empty --to-schema-datamodel ... --script`. It was not applied to a
database.

## Validation Commands

Run from the repository root:

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_catalog_schema_v1 pnpm db:generate`
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_catalog_schema_v1 pnpm db:validate`
- `pnpm lint`
- `pnpm typecheck`
- `git diff --stat origin/main...HEAD`
- `git diff --name-status origin/main...HEAD`
- `git status`

The `DATABASE_URL` above is a local placeholder used only so Prisma can parse
and generate from the schema. It was not written to `.env`, and no database was
migrated.

## Open Follow-Up Tasks

- Review and approve normalized catalog import CSVs before importing data.
- Confirm missing SKUs and variant boundaries.
- Confirm table freight, curbside delivery, tax, regional, and shipping policy
  before public table checkout.
- Run a separate Cloudinary media dedupe/upload/review task.
- Decide final frontend route patterns before approving redirects.
- Create and review normalized import CSV artifacts in a separate task.
- Build backend API routes only in a later task.
- Build frontend catalog pages only in a later task.
- Implement checkout only after policy and payment decisions are approved.

## Warning

No product data was imported in this task. Replacement Parts are representable
as deferred from v1 public navigation and checkout, and Tables are representable
as online checkout candidates with shipping review required, but no rows were
created for either case.
