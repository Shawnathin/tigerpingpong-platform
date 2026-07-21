# Launch Lane Board

## In Progress

- `codex/feature/replacement-parts-commerce-v1` — Part 40 online commerce plus the guarded foundation for later curated common parts. Production catalog write remains separately approval-gated.

## Done

- Owner confirmed TigerPingPong.ca live and working on 2026-07-21.
- Post-launch repository cleanup: consolidated to one clean worktree, preserved dirty/unique work, created and pushed `develop`, aligned local `main` with live `origin/main`, and installed a local direct-`main` push guard.
- Frozen SEO cutover local gate: `pnpm launch:preflight` passed 59 unit tests, production build, 69 active Chromium tests, secret scanning, and the high-severity dependency gate; 11 evidence-only tests skipped and two moderate advisories remain below the gate.
- Approved `.ca` URL contract, 28 path-specific redirects, redirect-only `.com`/`www` hosts, 34-URL sitemap behavior, canonicals/noindex/robots metadata, and restored sourced resource coverage implemented with focused local proof.
- Aqua 4-pack Canada-wide free-shipping exception: exact product/variant matching is shared across checkout, webhook validation, cart/PDP estimates, customer policy copy, and protected settings while legacy pending orders remain valid.
- Admin recovery and removal-only storefront cleanup: removed Make runtime coupling, preserved manual shipment records, simplified the cart dialog, and stripped audited public marketing filler. Aggregate preflight passed.
- Added repository-local dependency, security, test, CI, policy, accessibility, and operator-handoff remediation without external service mutation.
- `Release readiness: repository-local remediation and operator handoff` — aggregate preflight passed; candidate staged for review.
- `docs/launch/final-checkout-webhook-smoke-runbook` — doc-only final checkout/webhook smoke plan completed.
- `Run production env validator in target environment` — target Render API/web required env validation passed in expected Stripe `test` mode; optional warnings remain for operator review and no secret values were printed.
- `docs/launch/final-checkout-webhook-smoke-results.md` - updated with partial public-path smoke pass and checkout/webhook/admin proof blocker.
- Route/auth architecture and payment-truth design reviewed.
- Checkout API and webhook security behavior confirmed in code.
- Launch audit and workflow docs generated.
- `docs/launch/launch-readiness-audit` — draft complete and validation checks pass.
- `docs/launch/cutover-environment-readiness.md` — cutover readiness plan completed.
- `docs/launch/production-env-contract.md` — production variable ownership and validation contract completed.
- `Create read-only production env validation script` — implemented `scripts/launch/validate-production-env.mjs` and `docs/launch/production-env-validation.md`.
