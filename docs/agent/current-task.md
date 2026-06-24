# Current Task Card

Status: ready / not started.

## Task name

Launch readiness audit

## Goal

Inspect the repo and deployment assumptions to produce a launch-blocker list and exact task sequence to get TigerPingPong.ca live.

## Key question

What exactly blocks TigerPingPong.ca from going live today?

## Why now

The active version goal is now `TigerPingPong Website Launch v1`. Recent media work remains useful launch support, but the next selected work needs to identify the concrete blockers between the current repo/deployment state and a customer-usable production website.

## Expected implementation outcome

A review/proof report classifies launch findings and recommends the exact next task sequence. The audit should not implement fixes.

## Finding classification

- Must fix before live
- Should fix before live
- Can ship with caveat
- Parking lot

## Expected files/folders

- `docs/agent/launch-readiness-audit.md`
- `docs/agent/current-task.md`
- `docs/agent/worklog.md`
- `docs/agent/lane-board.md`
- `docs/agent/parking-lot.md`
- `docs/agent/decisions.md` only if a real launch decision is recorded

## Suggested review areas

- Current branch, Git state, recent commits, and untracked local-only files.
- Package scripts and safe validation commands.
- Render web/API deployment assumptions.
- Supabase/Prisma schema and import expectations.
- Stripe checkout, webhook, paid-order truth, and shipping assumptions.
- Public storefront routes, category/product/cart/checkout paths, and protected admin/internal routes.
- Production env/config documentation without printing secrets.
- Cloudinary/media state only as launch readiness requires.
- SEO/domain/DNS assumptions and known guardrails.
- Existing docs, QA notes, deployment notes, and known parked work.

## Out of scope

- No app runtime changes.
- No catalog/media mapping changes.
- No imports, uploads, cleanup, or generated export changes.
- No database writes, schema edits, or migrations.
- No env/deployment/DNS/config changes.
- No Stripe, webhook, payment, shipping, checkout, admin, SEO, or route behavior changes.
- No dependency installs or package/lockfile changes.
- No repo-wide formatting cleanup.

## Validation expectation

Run only review-safe commands needed to support the audit. If the audit creates docs, validate touched docs with `git diff --check` and targeted Prettier.

## Stop condition

Stop after the launch readiness audit report and workflow docs are complete. Do not start implementation fixes.
