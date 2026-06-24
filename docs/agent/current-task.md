# Current Task

## Active task

TigerPingPong.ca launch readiness: run production env validator in target environment.

## Current task card

Run production env validator in target environment

## Why this task exists now

The checkout + webhook runbook is ready, so we now need proof that target production env vars are loaded and shaped correctly in the actual execution context before any final smoke check.

## What must happen next

1. Run the committed validator in the target web/API production environments.
2. Capture redacted results in `docs/launch/production-env-validation-results.md`.
3. Recommend the next launch step only after target validation pass/fail is confirmed.

## Status update

- Implemented `scripts/launch/validate-production-env.mjs` (read-only, no secret output, no network).
- Added `docs/launch/production-env-validation.md`.
- Added `launch:env:validate` script for operator use.
- Updated launch lane/workflow cards accordingly.
