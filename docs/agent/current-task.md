# Current Task

## Active task

TigerPingPong.ca launch readiness: create production env validation proofing before final cutover.

## Current task card

Create read-only production env validation script

## Why this task exists now

A launch decision should be supported by a safe local/operator env proof command that validates required runtime settings before final domain cutover and before paid smoke tests are re-run.

## What must happen next

1. Finish validator implementation and docs alignment.
2. Run validation commands in web/API operator context (`--surface web`, `--surface api`, `--surface all`).
3. Record cutover proof command results before moving into final domain smoke testing.

## Status update

- Implemented `scripts/launch/validate-production-env.mjs` (read-only, no secret output, no network).
- Added `docs/launch/production-env-validation.md`.
- Added `launch:env:validate` script for operator use.
- Updated launch lane/workflow cards accordingly.
