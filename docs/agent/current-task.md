# Current Task

## Active task

Permanently repair the protected production-promotion lane so a successful `develop -> main` merge does not force a history-only reconciliation before the next release.

## Stable task key

`TPP-PROMOTION-LANE-PERMANENT-REPAIR`

## Selected task card

Remove the self-defeating `main`-ancestor requirement, preserve the exact allowed source branch and merge-only protections, and make only `main`'s required status check non-strict. Keep `develop` strict for task PRs.

## Confirmed cause

A merge-commit promotion creates a new release commit only on `main`, with the reviewed `develop` head as its second parent. The custom ancestry check and `main`'s strict up-to-date setting then immediately reject the next valid `develop -> main` promotion, forcing a zero-file history reconciliation every release.

## Boundaries

- Work only on `codex/fix/permanent-promotion-lane-policy`, created from current `origin/develop`; target its pull request to `develop`, never `main`.
- Preserve PR-only updates, merge-commit-only enforcement, no bypass actors, no force pushes, and the rule that only this repository's `develop` may target `main`.
- Keep `develop`'s required status check strict/up-to-date.
- Change only `main`'s required-status strictness; do not weaken its required check, PR requirement, admin enforcement, merge method, or force-push/deletion protections.
- Do not merge PR #158, deploy, change DNS/providers, send email, or mutate application/database/payment/production state.

## Required proof

- The workflow accepts only this repository's `develop` as a `main` PR source and still rejects `main`/`develop` as direct sources into `develop`.
- The workflow no longer compares `main...develop` ancestry or requests history-only reconciliation.
- The merge-only repository ruleset remains active with no bypass actors.
- `develop` protection remains strict and `main` protection is non-strict, with the same required `validate-promotion-path` context and all other protections unchanged.
- Focused regression coverage, formatting, lint, typecheck, and diff validation pass.

## Status

Local workflow and contract repair completed 2026-08-06 after PR #157 merged correctly into `develop` and immediately reproduced the artificial-behind state on production PR #158. Four focused regression tests, formatting, lint, Prisma generation, typecheck, diff validation, and tracked-secret scanning passed. The external protection change and task PR publication remain pending; no production promotion or deployment occurred.
