# Launch Lane Board

## In Progress

- `codex/fix/table-accessory-modal-reachability` — mission-critical table confirmation repair to keep the concise product title and cart actions reachable at short viewports without touching commerce calculations or payment logic.

## Awaiting Review

- PR #147 / `develop` -> `main` — the history split is repaired and GitHub reports the production promotion clean, mergeable, and fully green. Explicit production approval remains separate; do not merge as part of the modal hotfix.

## Done

- PR #146 merged the approved table manuals, setup videos, comparison/spec ordering, and Replacement Parts route into `develop`.
- PR #148 merged the zero-file history reconciliation into `develop`, restoring a clean promotion path for PR #147 without changing application files.
- PR #145 merged the safe trusted-branch-policy transition record into `develop`; no production promotion occurred.
- PR #144 merged the protected-lane history repair, merge-only enforcement guidance, and trusted-base policy handoff into `develop`; no production promotion occurred.
- PR #142 merged the Tiger-styled cart empty state and its regression coverage into `develop`.
- PR #140 merged the owner-approved standard net and Expo/Portland upgrade into `develop`; any deployed catalog write remains separately gated.
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
