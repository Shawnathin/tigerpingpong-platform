# Current Task

## Active task

TigerPingPong.ca launch readiness: run final checkout + webhook smoke on final domain.

## Current task card

Run final checkout + webhook smoke on final domain

## Why this task exists now

The target Render API/web environment validator has passed for required variables
in Stripe test mode. The launch lane can now move from env-gate proof to the
final customer-path checkout + webhook smoke on the final domain.

## What must happen next

1. Confirm the final-domain/operator approvals required by
   `docs/launch/final-checkout-webhook-smoke-runbook.md`.
2. Run the final checkout + webhook smoke on the final domain in Stripe test
   mode.
3. Capture redacted smoke evidence without secret values.
4. Record the go/no-go result for launch review.

## Status update

- Implemented `scripts/launch/validate-production-env.mjs` (read-only, no secret output, no network).
- Added `docs/launch/production-env-validation.md`.
- Added `launch:env:validate` script for operator use.
- Updated launch lane/workflow cards accordingly.
- `2026-06-26`: Recorded target Render API/web validator pass in
  `docs/launch/production-env-validation-results.md`.
- Target API env validation passed for required vars in expected Stripe `test`
  mode.
- Target web env validation passed for required vars in expected Stripe `test`
  mode.
- No secret values were printed or recorded.
- Optional warnings remain for operator review but are not launch-blocking unless
  the operator decides otherwise.
- `2026-06-26`: Created
  `docs/launch/final-checkout-webhook-smoke-results.md` as a hold record. The
  final smoke has not been run because required operator confirmations are still
  pending.

## Latest validation status

- `2026-06-26`: Env gate cleared for final checkout + webhook smoke in Stripe
  test mode.
- Recommended next executable task:
  `Run final checkout + webhook smoke on final domain`.
- Current blocker: collect written operator confirmations for final smoke
  domain, Stripe test mode, dashboard/log/admin access owners, and permission to
  create one Stripe test checkout/order record with a small test cart item.
