# Current Task

## Active task

TigerPingPong.ca launch readiness: create final checkout + webhook smoke runbook.

## Current task card

Create final checkout + webhook smoke runbook

## Why this task exists now

After safe runtime validation is in place, the next launch proof is a final checkout + webhook smoke runbook for the final domain.

## What must happen next

1. Draft a final smoke runbook for checkout + webhook proof.
2. Keep the plan strictly read-only (no payments, no env mutation) until all operator confirmations are captured.
3. Document required evidence, pass/fail criteria, and rollback conditions.

## Status update

- Implemented `scripts/launch/validate-production-env.mjs` (read-only, no secret output, no network).
- Added `docs/launch/production-env-validation.md`.
- Added `launch:env:validate` script for operator use.
- Updated launch lane/workflow cards accordingly.
