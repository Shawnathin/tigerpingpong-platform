# Current Task Card

Status: completed on 2026-06-24.

Result: see `docs/agent/media-artifact-git-safety-triage.md`.

## Task name

Cloudinary media artifact git-safety triage

## Goal

Decide which current untracked Cloudinary/media export artifacts belong in git, which must stay local, and what proof is needed before any media cleanup or PR shipping.

## Why now

The current branch has untracked media/export artifacts under `exports/` and `scripts/media/`. This is launch-relevant because Cloudinary media readiness is a V1 goal, but raw media, secrets, and local upload outputs must not be committed accidentally.

## Expected implementation outcome

A short triage record classifies the untracked media/export paths as commit-ready, local-only, needs Shawn review, or ignore-rule candidates. If needed, make a minimal `.gitignore` or docs update in the selected task, but do not upload media, delete media, rewrite app behavior, or touch secrets.

## Acceptance criteria

- The task reports every currently untracked `exports/` and `scripts/media/` top-level path.
- Candidate files are checked for obvious secret/env-token strings without printing secret values.
- Raw media or local-only bulk export folders are not staged.
- Any recommended git additions are limited to reviewed manifests, reports, scripts, docs, or ignore rules.
- The task records exact files touched, validation commands, and remaining Shawn-review items.

## Expected files/folders

- `exports/tpp-cloudinary-upload-prep/`
- `exports/tpp-media-processed-pack/`
- `exports/tpp-media-recovery-source/`
- `exports/tpp-media-recovery-triage/`
- `scripts/media/`
- Optional task record under `docs/planning/`
- Optional `.gitignore` update only if needed to prevent unsafe raw-media commits

## Out of scope

- No app runtime behavior changes.
- No Cloudinary upload, deletion, or credential use.
- No database writes, imports, migrations, or Prisma schema changes.
- No checkout, Stripe, webhook, order, tax, DNS, SEO, or deployment changes.
- No committing raw media, secrets, `.env` files, credentials, private data, or production customer/order data.

## Validation commands

```bash
git status --short
find exports scripts/media -maxdepth 3 -type f | sort
rg -n "CLOUDINARY_API_SECRET|CLOUDINARY_URL|STRIPE_SECRET|STRIPE_WEBHOOK|DATABASE_URL|SUPABASE_SERVICE_ROLE|INTERNAL_ORDERS_API_TOKEN|PASSWORD|PRIVATE_KEY|BEGIN [A-Z ]*PRIVATE KEY" exports scripts/media
pnpm lint
pnpm typecheck
```

Use safe subsets if full validation is too broad for the selected task. Do not run uploads, imports, migrations, deploys, or dependency installs.

## Workflow-doc update rule

When this task finishes, update `docs/agent/worklog.md`, move the task on `docs/agent/lane-board.md`, and add follow-ups to `docs/agent/parking-lot.md` if any media work remains unselected.

## Stop condition

Stop after the triage record and any selected docs/ignore updates are complete, safe validation is reported, and a commit-ready state is prepared. Do not proceed into media upload, product-page fixes, cleanup, or app implementation.
