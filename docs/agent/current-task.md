# Current Task

## Active task

Admin recovery and removal-only storefront cleanup.

## Selected task card

Remove the Make shipment-email runtime dependency so protected order detail no longer requires notification columns, preserve manual shipment records, simplify the add-to-cart dialog, consolidate shipping presentation, and remove audited public marketing filler without changing product descriptions or payment behavior.

## Boundaries

- Do not change payment truth, checkout totals, webhook authority, Prisma schema, or migrations.
- Do not change product descriptions, product-story/detail sections, catalog data, policies, or media.
- Preserve the unrelated untracked media script without modification or staging.
- Do not deploy or perform production checkout/data operations.

## Required proof

- Admin order detail and shipment update work without notification columns.
- The shipment-email endpoint, runtime configuration, response contract, and UI are absent.
- The cart dialog has one cart destination, no add-on recommendations, and retains keyboard behavior.
- Public copy removal follows the audit handoff exclusions and exact shipping rule.
- Full release preflight passes without external service or production-data mutation.

## Status

Repository-local implementation and regression proof are complete on `codex/release-readiness-local-remediation`. `pnpm launch:preflight` passes with 19 unit tests, 6 Chromium workflow tests, a clean tracked-secret scan, and zero high/critical production advisories. The three dormant Prisma notification columns remain for database-owner cleanup after backup and production migration-state verification. External Stripe, database, hosting, DNS, policy approval, monitoring activation, security blockers, and final go/no-go remain Plan B.
