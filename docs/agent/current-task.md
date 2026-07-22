# Current Task

## Active task

Part 40 commerce and replacement-parts foundation.

## Selected task card

Make Part 40 the first approved online replacement part at the live catalog price, keep the existing support/manual hub, and establish a guarded reusable pattern for later curated common parts.

## Boundaries

- Work only on `codex/feature/replacement-parts-commerce-v1` and target its pull request to `develop`, never `main`.
- Preserve Stripe Checkout, webhook payment truth, Canada-only shipping, and the existing `$15` / over-`$100` rule.
- Keep the two replacement-net records draft, private, and deferred.
- Keep replacement parts out of the generic catalog UI, generic product pages, and sitemap.
- Do not write deployed catalog data, upload media, or change schema, migrations, DNS, Render, Stripe, or Cloudinary in this task branch.
- Leave additional parts, table-first finding, interactive diagrams, per-table pages, product-page manual links, and install guidance parked.

## Required proof

- Reviewed catalog validation passes with Part 40 active/online and both nets deferred.
- `--scope=replacement-parts` dry-run prints only the replacement-parts dependencies and records without opening a database connection.
- Checkout/admin eligibility accepts approved Part 40 and rejects deferred nets; client prices remain non-authoritative.
- The page shows the live API price and purchase controls only when Part 40 is currently checkout-ready, with email fallback on API failure.
- One Part 40 produces `$7` subtotal, `$15` shipping, and `$22` pre-tax total in the existing cart.
- Focused and aggregate lint, typecheck, unit, browser, build, and security checks pass.

## Status

Implementation and proof are complete on 2026-07-21. Workflow PR #127 has merged into `develop`, and this feature branch now incorporates that policy. The owner approved a narrow root override from Next's transitive `sharp@0.34.5` to patched `sharp@0.35.3`; the production audit now reports two moderate and zero high/critical advisories, and the production build plus local and Cloudinary Next image routes pass. The two-worker local browser run retained its existing fixed-timeout development-server noise, while the clean hosted rerun passed all 72 active browser tests with 11 evidence-only skips. Draft PR #128, any production catalog write, and deployment all remain separately review-gated.
