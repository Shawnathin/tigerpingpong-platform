# Current Task

## Active task

Launch-readiness review for TigerPingPong.ca: determine what blocks going live today and define exact next actions.

## Current task card

TigerPingPong.ca cutover environment readiness

## Why this task exists now

A launch decision requires a clean answer on blockers before domain launch, not only app-level capability.

## What must happen next

1. Finish custom-domain/cutover plan (canonical + redirect targets).
2. Align API/web env vars for final web origin and Stripe return URLs.
3. Run final paid checkout webhook smoke and protected staff-route smoke.

## Status update

- Discovery completed.
- Audit draft created.
- Required validation checks completed (`lint`, `typecheck`, `db:validate`, `build`) and passed.
