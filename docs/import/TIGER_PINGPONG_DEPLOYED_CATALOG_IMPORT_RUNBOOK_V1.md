# Tiger PingPong Deployed Catalog Import Runbook V1

Date: 2026-06-16
Status: Safety review only. No deployed database import command exists yet.

## Decision

Do not run `pnpm import:tiger:dev` against the deployed Render/Supabase catalog
database.

The current importer is intentionally development-only. It should only be used
with a confirmed Supabase development database URL.

## Current Commands

Existing dry run with no database connection:

```bash
DATABASE_URL=postgresql://dev-placeholder.invalid/tigerpingpong_platform_dev pnpm import:tiger:dev -- --confirm-dev-import --dry-run
```

Existing real development import command:

```bash
DATABASE_URL="<confirmed Supabase development database URL>" pnpm import:tiger:dev -- --confirm-dev-import
```

No current command is approved for the deployed Render/Supabase catalog database.

## Why The Dev Importer Is Not Safe For Deployed Import

- The root script is named `import:tiger:dev`.
- The package script runs `scripts/import-tiger-dev-catalog.mjs`.
- The script banner says the target is the development database only.
- The docs say it must not be run against production.
- The guard refuses `NODE_ENV=production`, `VERCEL_ENV=production`, and
  `DATABASE_URL` values that look production-like.
- The guard is a development refusal, not a deploy-target confirmation flow.
- The import is broad: it upserts reviewed brands, categories, families,
  products, variants, media, redirects, and import review flags from the whole
  `data/import-review/tigerpingpong/v1/` folder.

## Aqua Import Implication

The current reviewed CSVs include `tiger-aqua-outdoor-indoor-paddle` as an
active checkout candidate with package variants. Importing the full reviewed CSV
set into the deployed database would update more than an isolated Aqua row and
could change live storefront visibility.

Do not treat a passed dry run as approval to write deployed catalog data.

## Required Safe Path Before Deployed Import

Create a separate deploy-safe importer or import mode before touching the
deployed catalog database.

Minimum requirements:

- A new script/package command with deployed/staging naming, not `dev`.
- A `--dry-run` mode that does not open Prisma.
- A required explicit deployed confirmation flag.
- A required target flag, such as `--target=staging` or `--target=production`.
- A required expected database host/project check, without printing secrets.
- A preflight summary of rows that would be created, updated, archived, enabled
  for public navigation, enabled for checkout, or assigned public media.
- A refusal if the command would publish products unexpectedly.
- A transaction for the write path.
- Post-import verification SQL/API checks.
- A rollback/restore plan approved before production writes.

## Exact Next Command

There is no safe deployed import command to run yet.

The next command should be a validation-only check of the reviewed import
artifacts:

```bash
pnpm validate:tiger-import
```

After a deploy-safe importer exists and has passed dry-run review, the eventual
shape should be similar to:

```bash
DATABASE_URL="<deployed Supabase database URL>" pnpm import:tiger:deployed -- --target=production --confirm-deployed-catalog-import --dry-run
```

Do not run a non-dry deployed import until the command exists, the dry-run diff
is reviewed, and Shawn explicitly approves the deployed write.
