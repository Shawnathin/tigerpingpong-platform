# @tigerpingpong/db

Database foundation package for TigerPingPong.ca.

This package owns Prisma setup for the Supabase Postgres database. The backend
API will use this package for database access once application models are
introduced.

Only a neutral `PlatformMetadata` foundation model is defined so Prisma Client
generation works. Product, cart, checkout, auth, and admin schema decisions
should be added in later tasks.

## Commands

```sh
pnpm --filter @tigerpingpong/db prisma:validate
pnpm --filter @tigerpingpong/db prisma:generate
pnpm --filter @tigerpingpong/db prisma:format
```
