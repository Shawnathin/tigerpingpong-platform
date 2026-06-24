# Current Task Card

Status: completed on 2026-06-24.

Result: source-level safety review completed in `docs/agent/media-script-safety-review.md`; no media scripts were run, staged, moved, deleted, or rewritten.

## Task name

Focused script-safety review of scripts/media/_.py and scripts/media/_.mjs

## Goal

Review the untracked `scripts/media/*.py` and `scripts/media/*.mjs` source tooling, classify whether each script is safe/useful to preserve, and produce a clear recommendation before any Cloudinary mapping, import, upload, cleanup, or runtime work continues.

## Why now

The repo now ignores generated exports and preserves Markdown media evidence. The only intentional remaining untracked items are media source scripts. Before committing, deleting, rewriting, or running them, we need a source-level safety review.

## Expected implementation outcome

A docs-only review report classifies each untracked source script by purpose, inputs, outputs, write/upload behavior, env requirements, risks, and recommended action. No scripts are committed in this review task.

## Acceptance criteria

- Inspect every `scripts/media/*.py` and `scripts/media/*.mjs` file with read-only source commands.
- Do not run scripts that upload, mutate files, import data, call APIs, change mappings, or require credentials.
- Classify each source script as `commit-ready source`, `needs edit before commit`, `local-only helper`, `needs Shawn review`, or `do not preserve`.
- Create `docs/agent/media-script-safety-review.md`.
- Update workflow docs with validation proof and next recommended task.
- Stage and commit only review/workflow docs if validation passes.

## Expected files/folders

- `docs/agent/media-script-safety-review.md`
- `docs/agent/current-task.md`
- `docs/agent/worklog.md`
- `docs/agent/lane-board.md`
- `docs/agent/parking-lot.md`

## Recommended next task

Harden and preserve the non-upload media recovery scripts with usage docs and output-root guardrails; leave the Cloudinary upload script local-only unless Shawn explicitly selects a live-upload-tool hardening task.

## Out of scope

- No app runtime behavior changes.
- No Cloudinary upload, deletion, import, cleanup, mapping change, API call, or credential use.
- No database writes, imports, migrations, or Prisma schema changes.
- No checkout, Stripe, webhook, order, tax, DNS, SEO, or deployment changes.
- No committing raw media, secrets, `.env` files, credentials, private data, or production customer/order data.
- No script execution, script rewrite, script move/delete, or script staging.

## Validation commands

```bash
git diff --check
pnpm exec prettier --check docs/agent/current-task.md docs/agent/worklog.md docs/agent/lane-board.md docs/agent/parking-lot.md docs/agent/media-script-safety-review.md
```

## Workflow-doc update rule

When this task finishes, update `docs/agent/worklog.md`, move the task on `docs/agent/lane-board.md`, and park follow-up script hardening/preservation work.

## Stop condition

Stop after the review report and workflow docs are complete, validated, and committed if only review/workflow docs changed. Do not proceed into script cleanup, script commit, Cloudinary mapping, imports, uploads, or app changes.
