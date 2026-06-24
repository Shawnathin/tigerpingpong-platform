# Current Task Card

Status: completed on 2026-06-24.

Result: hardened and committed the four non-upload `scripts/media/` recovery/prep scripts with dry-run defaults, output-root guardrails, readable argument validation, and usage docs. The live Cloudinary upload script remains uncommitted/local-only.

## Task name

Harden and preserve non-upload media recovery scripts

## Goal

Harden and commit only the useful non-upload media scripts from `scripts/media/`, with guardrails and usage docs. Leave the live Cloudinary upload script uncommitted/local-only unless Shawn explicitly selects a separate live-upload-tool hardening task.

## Why now

The script safety review found four non-upload scripts worth preserving after edits. These scripts support media recovery/prep work and should be safe, documented, and committed before future Cloudinary mapping/import/upload/cleanup work continues.

## Expected implementation outcome

The four non-upload scripts are committed with guarded CLI behavior. Documentation explains run order, inputs, outputs, safe example commands, generated output locations, and the intentional exclusion of live Cloudinary upload tooling.

## Acceptance criteria

- Add dry-run/help behavior where appropriate.
- Add argument validation and readable error messages.
- Add output-root guardrails so scripts write only under intended generated `exports/` folders.
- Avoid accidental overwrite where practical.
- Keep the scripts free of secrets and Cloudinary calls.
- Create `docs/media/cloudinary-upload-prep/media-scripts.md`.
- Do not stage, rewrite, run, or commit `scripts/media/upload_tpp_cloudinary_approved.mjs`.
- Validate script syntax and touched Markdown docs before committing.

## Expected files/folders

- `scripts/media/prepare_tpp_cloudinary_upload.py`
- `scripts/media/process_tpp_media_pack.py`
- `scripts/media/recover-tpp-source-images.mjs`
- `scripts/media/triage-tpp-source-images.mjs`
- `docs/media/cloudinary-upload-prep/media-scripts.md`
- `docs/agent/current-task.md`
- `docs/agent/worklog.md`
- `docs/agent/lane-board.md`
- `docs/agent/parking-lot.md`

## Recommended next task

Review how committed Cloudinary upload evidence should feed the app media mapping/import plan without running uploads, imports, or app changes yet.

## Out of scope

- No app runtime behavior changes.
- No Cloudinary upload, deletion, import, cleanup, mapping change, or credential use.
- No database writes, imports, migrations, or Prisma schema changes.
- No checkout, Stripe, webhook, order, tax, DNS, SEO, or deployment changes.
- No committing raw media, secrets, `.env` files, credentials, private data, or production customer/order data.
- No live upload script staging or hardening.
- No generated export output staging.

## Validation commands

```bash
git diff --check
pnpm exec prettier --check docs/agent/current-task.md docs/agent/worklog.md docs/agent/lane-board.md docs/agent/parking-lot.md docs/media/cloudinary-upload-prep/media-scripts.md
python3 -m py_compile scripts/media/prepare_tpp_cloudinary_upload.py scripts/media/process_tpp_media_pack.py
node --check scripts/media/recover-tpp-source-images.mjs
node --check scripts/media/triage-tpp-source-images.mjs
```

## Workflow-doc update rule

When this task finishes, update `docs/agent/worklog.md`, move the task on `docs/agent/lane-board.md`, and leave any live-upload-tool work parked unless Shawn explicitly selects it.

## Stop condition

Stop after the hardened non-upload scripts, docs, and workflow updates are committed. Do not begin Cloudinary mapping, imports, uploads, cleanup, or app changes.
