# Current Task Card

Status: completed on 2026-06-24.

Result: scoped media evidence/ignore changes are ready to commit with targeted validation; the unrelated repo-wide Markdown Prettier baseline failure is recorded as future cleanup.

## Task name

Commit scoped media evidence/ignore change with validation caveat recorded

## Goal

Commit only the scoped media evidence/ignore changes that are already implemented, while recording the repo-wide Markdown Prettier baseline failure as a known unrelated blocker/parking-lot item.

## Why now

The selected media evidence task is complete and safe. Unrelated formatting debt should not block Git hygiene work or drag the launch lane into repo-wide cleanup.

## Expected implementation outcome

A single scoped commit contains `.gitignore`, committed Markdown evidence under `docs/media/cloudinary-upload-prep/`, and workflow docs. Bulk generated exports and unreviewed `scripts/media` source files remain unstaged.

## Acceptance criteria

- Confirm working tree changes are limited to the scoped media evidence/ignore task plus workflow docs.
- Confirm preserved evidence files exist under `docs/media/cloudinary-upload-prep/`.
- Confirm bulk generated exports are ignored and not staged.
- Run targeted validation only for touched files.
- Record the repo-wide Markdown Prettier baseline failure as unrelated future cleanup.
- Stage only scoped docs/ignore files and commit them.

## Expected files/folders

- `.gitignore`
- `docs/media/cloudinary-upload-prep/README.md`
- Selected evidence files copied into `docs/media/cloudinary-upload-prep/`
- `docs/agent/current-task.md`
- `docs/agent/worklog.md`
- `docs/agent/lane-board.md`
- `docs/agent/parking-lot.md` if remaining out-of-scope media follow-up changes

## Recommended next task

Review `scripts/media/*.py` and `scripts/media/*.mjs` as source tooling in a focused script-safety task before any Cloudinary mapping, import, upload, or cleanup work continues.

## Out of scope

- No app runtime behavior changes.
- No Cloudinary upload, deletion, import, cleanup, mapping change, or credential use.
- No database writes, imports, migrations, or Prisma schema changes.
- No checkout, Stripe, webhook, order, tax, DNS, SEO, or deployment changes.
- No committing raw media, secrets, `.env` files, credentials, private data, or production customer/order data.
- No script review or script staging.

## Validation commands

```bash
git status --short
git check-ignore -v --no-index exports || true
find docs/media/cloudinary-upload-prep -maxdepth 3 -type f | sort
git diff --check
pnpm exec prettier --check .gitignore docs/agent/current-task.md docs/agent/worklog.md docs/agent/lane-board.md docs/agent/parking-lot.md docs/media/cloudinary-upload-prep/README.md docs/media/cloudinary-upload-prep/qa/upload-prep-review-sheet.md docs/media/cloudinary-upload-prep/reports/app-media-mapping-report.md docs/media/cloudinary-upload-prep/reports/cloudinary-upload-results.md docs/media/cloudinary-upload-prep/reports/do-not-upload.md docs/media/cloudinary-upload-prep/reports/media-mapping-qa-report.md docs/media/cloudinary-upload-prep/reports/needs-shawn-review.md docs/media/cloudinary-upload-prep/reports/upload-prep-summary.md docs/media/cloudinary-upload-prep/reports/upload-readiness-by-target.md
```

Also verify staged files before committing:

```bash
git diff --name-only --cached
git status --short
```

## Workflow-doc update rule

When this task finishes, update `docs/agent/worklog.md`, move the task on `docs/agent/lane-board.md`, and add the repo-wide Markdown Prettier baseline cleanup to `docs/agent/parking-lot.md`.

## Stop condition

Stop after scoped files are committed. Do not proceed into script review, media cleanup, mapping changes, imports, uploads, or app changes.
