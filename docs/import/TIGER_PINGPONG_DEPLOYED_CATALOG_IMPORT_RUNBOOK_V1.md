# Tiger PingPong Deployed Catalog Import Runbook V1

## Purpose

This runbook defines the minimum gate before any future deployed catalog import
tooling is built or run against Render/Supabase catalog databases.

There is no approved deployed catalog importer yet. The existing Tiger importer
is dev-only and must not be pointed at deployed databases.

## Hard Boundaries

- Do not run `pnpm import:tiger:dev` against deployed Render/Supabase databases.
- Do not change product publishing status as part of validator cleanup.
- Do not publish Aqua through this runbook.
- Do not change checkout, payment, webhook, order truth, tax, shipment/admin
  work, or public styling.
- Do not upload media from this runbook.

## Required Preflight Gate

Run from the repository root:

```bash
pnpm validate:tiger-import
```

Minimum status before a deployed import is allowed:

- The command must return `PASS`.
- Error count must be `0`.
- The generated warning list must be reviewed for import scope.
- Blocker-severity warnings must be resolved, explicitly excluded from the
  deployed import scope, or accepted in the import plan before any deployed
  write is allowed.

Warnings are not all equal:

- Table shipping policy and all-checkout-candidates policy warnings block
  public checkout/publishing decisions until resolved or explicitly signed off.
- Aqua source URL review, remaining Cloudinary upload review, and resource
  article crawl warnings are known review notes unless the planned deployed
  import scope depends on them.

## Media Policy

Reviewed `cloudinary_secure_url` values are allowed in
`product_media_import_v1.csv` when they are valid Cloudinary HTTPS image
delivery URLs and match `cloudinary_public_id`.

Rows without reviewed Cloudinary assignments, including current Aqua source
media rows, should keep Cloudinary fields blank. Source BigCommerce/CDN URLs are
traceability metadata and are not the final production media strategy.

## Current PR 081 Baseline

After validator cleanup, the expected local baseline is:

```text
Tiger import validation PASS: 0 errors, 14 warnings.
```

The previous 11 errors were stale `cloudinary_secure_url` failures for existing
reviewed non-Aqua media rows. Aqua rows validate with blank Cloudinary fields.
