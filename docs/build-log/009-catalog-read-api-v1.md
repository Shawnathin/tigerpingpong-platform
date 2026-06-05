# 009: Catalog Read API V1 Build Log

## What Was Added

- Read-only NestJS catalog API module:
  `apps/api/src/catalog/`
- API module registration in `apps/api/src/app.module.ts`.
- Minimal Prisma re-export from `packages/db/src/index.ts` so API database
  access goes through the db package.
- API package dependency on `@tigerpingpong/db`.
- Catalog API documentation:
  `docs/api/TIGER_PINGPONG_CATALOG_API_V1.md`

## Endpoints Added

- `GET /catalog/health`
- `GET /catalog/categories`
- `GET /catalog/product-families`
- `GET /catalog/products`
- `GET /catalog/products/:slug`
- `GET /catalog/families/:slug`

## Read-Only Boundary

The catalog API only reads through Prisma. This task did not add mutations,
imports, seed data, schema changes, migrations, checkout, Stripe, auth, admin
screens, frontend pages, or Cloudinary uploads.

## Public Filtering

- Categories return `isActive=true` and `v1PublicNavigation=true`.
- Product families return active/public families whose primary category is
  public.
- Product lists/details return active public products by default.
- Replacement Parts are excluded by default and require
  `includeReplacementParts=true` for internal review workflows.
- Internal source and legacy metadata requires `includeInternal=true`.

## Table Shipping Review

Table products can remain visible as catalog records, but
`shippingReviewRequired` is preserved in responses. Frontend checkout must not
treat `online_checkout_candidate` as live checkout enablement.

## Media Handling

Media responses include Cloudinary fields where available but do not upload or
transform images. BigCommerce source URLs are exposed only with
`includeInternal=true`.

## Validation Run During This Task

- `pnpm db:generate`: passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm build`: passed.
- `git diff --check`: passed.

## Local API Testing

A development `DATABASE_URL` was not available in the Codex session, so local
testing could not verify live Supabase catalog rows.

The built API was started locally with no `DATABASE_URL`:

- `GET /health`: returned 200 `ok`.
- `GET /catalog/health`: returned 503 with
  `DATABASE_URL is required to configure the database package.`

No database writes were performed.
