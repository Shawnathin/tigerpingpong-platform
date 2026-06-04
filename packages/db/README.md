# @tigerpingpong/db

Database foundation package for TigerPingPong.ca.

This package owns Prisma setup for the Supabase Postgres database. The backend
API will use this package for database access once application models are
introduced.

The schema includes the v1 catalog planning models for Brand -> Product Family
-> Product -> Variant, product media references, draft redirects, import review
flags, quote request planning, and order planning. It does not include seed
data, product imports, API routes, frontend pages, checkout implementation,
Stripe, auth, admin screens, or Cloudinary upload code.

See `docs/database/TIGER_PINGPONG_CATALOG_SCHEMA_V1.md` for the catalog schema
summary and Supabase migration warnings.

## Commands

```sh
pnpm --filter @tigerpingpong/db prisma:validate
pnpm --filter @tigerpingpong/db prisma:generate
pnpm --filter @tigerpingpong/db prisma:format
```
