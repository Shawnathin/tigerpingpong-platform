# 022: Supabase RLS Baseline V1

## What Was Added

- Added a Prisma SQL migration that enables Row Level Security on Tiger Ping
  Pong application-owned tables in the `public` schema.
- Added database documentation for the RLS baseline, table inclusion/exclusion
  decisions, backend access assumptions, Supabase dev application steps, and
  smoke tests.
- Kept the architecture unchanged: frontend -> NestJS API -> Prisma ->
  Supabase Postgres.

## RLS Policy Decision

No Supabase RLS policies were added.

This baseline is intentionally deny-by-default for direct Supabase
anon/authenticated API access. The frontend must continue to use the NestJS API
for catalog and checkout flows. Backend Prisma access must use the trusted
server-side database role configured in `DATABASE_URL`.

## Tables Included

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

- `public._prisma_migrations`, because Prisma migrate owns it and must keep
  reading/writing migration history safely.
- Supabase-managed schemas/tables outside the Prisma application schema.
- Enum types, because RLS applies to tables.

## Backend Impact

The API constructs Prisma clients from backend-only `DATABASE_URL`. If that URL
uses a privileged/table-owner role that bypasses or is not constrained by this
RLS baseline, API behavior should continue unchanged.

This repository does not contain deployed database secrets, so the exact
Supabase role could not be proven locally. Before applying to Supabase dev,
confirm the backend role. If Prisma queries fail after RLS is enabled, stop and
fix the backend database role/access model rather than adding broad public
policies.

## What Was Intentionally Not Added

- No frontend features.
- No checkout UI.
- No Stripe checkout behavior changes.
- No product/catalog data changes.
- No seed or import data.
- No site redesign.
- No direct Supabase frontend access.
- No broad `anon` or `authenticated` policies.
- No `_prisma_migrations` RLS change.

## How To Run Later Against Supabase Dev

Do not apply this migration to production without explicit approval.

Use only the Supabase development database URL:

```bash
DATABASE_URL="postgresql://..." pnpm --filter @tigerpingpong/db exec prisma migrate deploy --schema prisma/schema.prisma
```

Then smoke test:

- `GET /health`
- `GET /catalog/health`
- `GET /catalog/products`
- `POST /checkout/sessions` safe configuration behavior
- `POST /webhooks/stripe` missing signature behavior

Finally, re-check Supabase Security Advisor for `RLS Disabled in Public`
findings on the included tables.

## Validation Commands

Run from the repository root:

```bash
pnpm db:generate
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate
pnpm lint
pnpm typecheck
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build
git diff --check
git status
```

The migration was not applied to Supabase dev or production during this task.
