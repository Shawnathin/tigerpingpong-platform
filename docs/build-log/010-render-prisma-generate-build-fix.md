# 010: Render Prisma Generate Build Fix

## Root Cause

Render API builds run the API prebuild path, which builds
`@tigerpingpong/shared` and then `@tigerpingpong/db`.

The db package compiled TypeScript directly with `tsc -p tsconfig.json`.
Because Prisma Client had not been generated yet in the fresh Render build
environment, `@prisma/client` did not expose the generated `Prisma` and
`PrismaClient` exports needed by `packages/db/src/index.ts`.

## Fix

Added a db package `prebuild` script:

```sh
pnpm prisma:generate
```

Now `pnpm --filter @tigerpingpong/db build` generates Prisma Client before the
db TypeScript compile step runs. This covers the Render API prebuild path and
the root monorepo build path.

## Guardrails Preserved

- No Prisma schema changes.
- No migrations.
- No database writes.
- No frontend changes.
- No catalog endpoint behavior changes.
- No checkout, auth, admin, or Cloudinary work.

## Validation Run During This Task

- `pnpm install`: passed.
- `pnpm db:generate`: passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm build`: passed.
- `git diff --check`: passed.
- `git status`: reviewed.

During `pnpm build`, `@tigerpingpong/db` ran `prebuild` before
`tsc -p tsconfig.json` in both the root db build and the API prebuild path.
