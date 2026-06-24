# Current Task Card

Status: completed on 2026-06-24.

Result: reviewed committed Cloudinary upload-prep evidence against the current catalog/media architecture and created `docs/media/cloudinary-upload-prep/app-media-mapping-import-plan.md`. No imports, uploads, app changes, catalog data edits, or live-upload script changes were made.

## Task name

Review Cloudinary evidence for app media mapping/import plan

## Goal

Review the committed Cloudinary/media evidence and produce a precise mapping/import plan for how uploaded Cloudinary assets should feed the app catalog/media system, without running uploads, imports, app changes, or database changes.

## Why now

The generated exports are ignored, the reviewed Markdown evidence is preserved, and non-upload scripts are hardened. Before changing app media mappings or import data, the repo needs a clear plan that ties the evidence to the current app structure and identifies gaps/risks.

## Expected implementation outcome

A docs-only plan explains the current `ProductMedia` import/API/web path, evidence-backed ready mapping areas, assets needing Shawn review, do-not-use risks, import safety gates, and the safest next implementation task.

## Acceptance criteria

- Inspect the committed Cloudinary upload-prep evidence.
- Inspect app/media/catalog architecture with read-only commands.
- Create `docs/media/cloudinary-upload-prep/app-media-mapping-import-plan.md`.
- Recommend a small safe first implementation task.
- Do not edit app runtime files, catalog data, mappings, schema, env, deployment, package files, generated exports, or the live upload script.
- Validate touched docs before committing.

## Expected files/folders

- `docs/media/cloudinary-upload-prep/app-media-mapping-import-plan.md`
- `docs/agent/current-task.md`
- `docs/agent/worklog.md`
- `docs/agent/lane-board.md`
- `docs/agent/parking-lot.md`

## Recommended next task

Create a dry-run Cloudinary media mapping validator/report that checks the current product media import CSV against committed evidence and app constraints without editing data, importing to a database, uploading, or changing app behavior.

## Out of scope

- No app runtime behavior changes.
- No catalog/media mapping file edits.
- No product data edits.
- No Cloudinary upload, deletion, import, cleanup, credential use, or live upload script change.
- No database writes, imports, migrations, or Prisma schema changes.
- No checkout, Stripe, webhook, order, tax, DNS, SEO, deployment, env, package, or lockfile changes.
- No generated export output staging.

## Validation commands

```bash
git diff --check
pnpm exec prettier --check docs/agent/current-task.md docs/agent/worklog.md docs/agent/lane-board.md docs/agent/parking-lot.md docs/media/cloudinary-upload-prep/app-media-mapping-import-plan.md
```

## Workflow-doc update rule

When this task finishes, update `docs/agent/worklog.md`, move the task on `docs/agent/lane-board.md`, and park any future category-media or best-available-image follow-up that is not selected.

## Stop condition

Stop after the plan and workflow updates are committed. Do not begin validator implementation, script cleanup, mapping edits, imports, uploads, cleanup, or app changes.
