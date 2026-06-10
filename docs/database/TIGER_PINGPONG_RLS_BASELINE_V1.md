# Tiger Ping Pong RLS Baseline V1

## Purpose

Supabase Security Advisor reports `RLS Disabled in Public` warnings for
application tables created through Prisma migrations in the `public` schema.
This baseline enables Row Level Security on the Tiger Ping Pong application
tables without opening direct browser/client access to those tables.

Current application architecture stays unchanged:

- The Next.js frontend calls the NestJS API.
- The frontend does not query Supabase directly.
- The NestJS API uses Prisma with `DATABASE_URL`.
- Supabase Postgres is the database.
- Prisma migrations remain the source of database schema changes.

## Migration

Local migration folder:

```text
packages/db/prisma/migrations/20260610170000_supabase_rls_baseline_v1/
```

The migration runs `ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY`
for application-owned tables. It does not create policies, grants, seed data,
imports, triggers, functions, checkout behavior, catalog data, frontend code, or
Stripe behavior.

It was not applied to Supabase by this task.

## Tables Included

The included tables are the Prisma application models mapped into the `public`
schema:

- `platform_metadata`
- `brands`
- `categories`
- `product_families`
- `products`
- `product_options`
- `product_option_values`
- `product_variants`
- `product_variant_option_values`
- `product_media`
- `product_content_sections`
- `product_spec_groups`
- `product_specs`
- `product_relationships`
- `quote_requests`
- `quote_request_items`
- `orders`
- `order_items`
- `stripe_webhook_events`
- `redirects`
- `import_review_flags`

## Tables Excluded

- `public._prisma_migrations`: Prisma owns this migration bookkeeping table.
  This baseline intentionally does not enable RLS on it because Prisma migrate
  must continue to read and write migration history normally.
- Supabase-managed schemas and tables such as `auth`, `storage`, `realtime`,
  and extension-owned objects: they are outside the application-owned Prisma
  schema.
- Enum types such as `product_kind`, `purchase_mode`, and `order_status`: RLS
  applies to tables, not enum types.

## Policy Decision

No anonymous or authenticated Supabase policies are added.

This is intentional. Public catalog reads are served by NestJS catalog endpoints,
and checkout/order/webhook writes are performed by the backend through Prisma.
The browser should not receive direct Supabase table access for catalog, order,
checkout, webhook, redirect, import-review, or metadata tables.

With RLS enabled and no policies, Supabase API access using publishable/anon
client credentials should not be able to read or write these tables. A later
task may add narrow policies only if the architecture deliberately changes.

## Backend Prisma Access Assumptions

The API code constructs Prisma clients from `DATABASE_URL` in backend services.
This repository does not contain the real deployed database URL, so this task
cannot prove the exact Postgres role used by Supabase dev or production.

Before applying the migration to Supabase dev, confirm that the backend
`DATABASE_URL` connects as a trusted server-side role that can continue to
operate after RLS is enabled. Safe examples are a privileged/table-owner
database role or another intentionally server-only role configured to bypass or
own the affected tables.

If the backend connects as a role that is subject to RLS and has no matching
policies, catalog reads, checkout order writes, and webhook writes can fail or
return no rows after this migration. In that case, stop and fix the backend
database role/access model. Do not add broad `anon` or public `SELECT`/write
policies to work around it.

## How To Apply Later Against Supabase Dev

Do not apply this migration to production without explicit approval.

Use only the Supabase development database URL:

```bash
DATABASE_URL="postgresql://..." pnpm --filter @tigerpingpong/db exec prisma migrate deploy --schema prisma/schema.prisma
```

Recommended preflight before applying:

```bash
DATABASE_URL="postgresql://..." pnpm db:validate
DATABASE_URL="postgresql://..." pnpm db:generate
git diff --check
```

After applying in Supabase dev, verify the migration history still works:

```bash
DATABASE_URL="postgresql://..." pnpm --filter @tigerpingpong/db exec prisma migrate status --schema prisma/schema.prisma
```

## Smoke Test After Supabase Dev Migration

After the migration is applied to Supabase dev, smoke test the API path rather
than direct Supabase browser access:

- `GET /health`
- `GET /catalog/health`
- `GET /catalog/products`
- `POST /checkout/sessions` safe configuration behavior
- `POST /webhooks/stripe` missing signature behavior

If any API behavior breaks, check the Postgres role used by backend
`DATABASE_URL` before considering policies.

## Supabase Security Advisor Check

After applying the migration to Supabase dev:

- Re-run Supabase Security Advisor.
- Confirm `RLS Disabled in Public` findings are cleared for the included
  application tables.
- Confirm no new broad `anon` or `authenticated` table policies were created.
- Confirm `_prisma_migrations` is either not reported as an application table
  or is deliberately accepted as Prisma-owned migration metadata.

## Intentionally Excluded

- No frontend changes.
- No direct Supabase frontend access.
- No public catalog read policies.
- No checkout/order write policies.
- No Stripe checkout behavior changes.
- No product/catalog data changes.
- No seed or import data.
- No production database migration application.
- No `_prisma_migrations` RLS change.
