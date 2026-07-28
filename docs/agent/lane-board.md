# Launch Lane Board

## In Progress

- Draft PR #142 / `codex/fix/cart-empty-state-tiger-v1` — implementation, responsive visual review, and regression proof are complete for the Tiger-styled cart empty state. The stale checkout-error assertion exposed by the first hosted run is corrected and passes locally; the hosted rerun and review remain pending against `develop`.

## Awaiting Review

- PR #140 / `codex/feature/replacement-nets-commerce-v1` — implementation and release proof are complete for the owner-approved standard net and Expo/Portland upgrade. Exact media, live-catalog purchase controls, fit/included-item guidance, cart behavior, fallback help, and responsive QA pass; PR review and any deployed catalog write remain separately gated.

## Done

- PR #138 merged the focused table-accessory checkout browser-test stabilization into `develop`.
- PR #133 merged the table-triggered 30% accessory offer, server-authoritative pricing snapshots, Stripe net-line handling, and protected savings presentation into `develop`; migration, targeted catalog write, Stripe test-mode proof, deployment, and promotion remain separately approval-gated.
- PR #132 merged the Vice bundle catalog foundation with exact bundle SKU `15488` into `develop`; staging and production catalog writes remain separately approval-gated.
- PR #130 merged Stripe successful-payment owner alerts and required hosted-Checkout phone collection into `develop`.
- PR #128 merged the Part 40 commerce and replacement-parts foundation into `develop`; production catalog write and deployment remain separately approval-gated.
- PR #127 merged the branch-policy enforcement task into `develop`; only a later explicitly approved `develop` pull request may promote it to `main`.
- Created the dedicated `codex/enforce-development-branch-flow` branch from current `develop`; documented and automated the required `task branch -> develop -> main` promotion path.
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
