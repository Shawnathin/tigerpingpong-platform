# Release Readiness Local Remediation

Date: 2026-07-16

Branch: `codex/release-readiness-local-remediation`

Status: repository-local release candidate; external launch gates remain blocked

## Accepted scope and traceability

| Accepted gate                     | Repository evidence                                             | Handoff status                          |
| --------------------------------- | --------------------------------------------------------------- | --------------------------------------- |
| Build, types, lint, schema        | `pnpm launch:preflight`; CI workflow                            | Automated locally and in CI             |
| Dependency/security remediation   | exact framework versions, production audit, tracked-secret scan | High/critical gate automated            |
| Checkout and shipping invariants  | Vitest shipping, price, option, auth, webhook tests             | Local fakes only; no payment mutation   |
| Customer routes and accessibility | policy routes, footer, promise matrix, Playwright smoke         | Draft policy approval still required    |
| Production configuration          | hardened redacted env validator and read-only smoke             | Operator must run in service shells     |
| Data safety and rollback          | operator worksheet and cutover/rollback checklist               | Supabase backup/restore proof deferred  |
| Monitoring/support coverage       | operations handoff with alert patterns and owner cells          | Named people and active alerts deferred |
| Known risks and acceptance        | security disposition and risk register                          | Owner signatures deferred               |

## Baseline and remediation comparison

The pre-remediation baseline had one production-env-validator lint error, no release-focused unit or browser suite, and a production audit containing 9 high, 13 moderate, and 2 low advisories. The local candidate has zero lint errors, release-focused Vitest and Playwright coverage, and zero high/critical production advisories. The two remaining moderate advisories have explicit applicability and disposition in `security-hardening-and-advisories.md`.

Next is pinned to `15.5.18`, not the initially proposed `15.5.16`: the latter still produced a high-severity production advisory and could not satisfy the accepted zero-high/critical gate. React and React DOM remain pinned to `18.3.1`. Nest packages are pinned to `11.1.28` and the Nest CLI to `11.0.24` as planned.

## Locked boundaries preserved

- Stripe redirect remains non-authoritative; webhook-confirmed backend status remains payment truth.
- Prices, options, shipping, totals, and order state remain server-authoritative.
- Stripe endpoint, production databases, Render, DNS, Cloudinary, production data, Prisma schema, and migrations were not accessed or mutated.
- React and React DOM remain at `18.3.1`.
- The unrelated untracked media script remains unmodified and unstaged.

## Draft PR summary

### Summary

- Upgrade Next and Nest to patched compatible releases and update framework contracts.
- Add release unit/browser tests, secret and dependency gates, local mocks, and CI.
- Harden redacted production environment validation and add a read-only launch smoke.
- Add owner-review policy drafts, public footer links, promise review, and dialog keyboard fixes.
- Add operator ownership, monitoring, risk, evidence, cutover, and rollback handoff records.

### Validation

Attach the final `pnpm launch:preflight` summary and the local mock-backed evidence below. Do not include credentials, cookies, customer data, Stripe payloads, environment values, or response bodies containing private data.

- `docs/qa/release-readiness-local-remediation/privacy-policy-desktop.png`
- `docs/qa/release-readiness-local-remediation/returns-policy-mobile.png`
- `docs/qa/release-readiness-local-remediation/add-to-cart-dialog-mobile.png`

### Review focus

- Next 15 App Router compatibility and Nest 11/Express 5 raw-body/CORS/auth behavior.
- Policy and promise language requires business-owner approval.
- CSP remains staged; HSTS remains post-SSL only.
- Database, Stripe/tax, Render, monitoring, DNS, and live-domain proof remain Plan B.

## Handoff gate

`pnpm launch:preflight` passed on 2026-07-16: lint, typecheck, Prisma generation/validation, 17 Vitest tests, production build, 5 Chromium release-smoke tests, tracked-secret scan, and the production audit gate all passed. The audit reported two moderate advisories and no high/critical advisories.

This branch is handoff-ready and staged; Git status contains only the staged release candidate plus the intentionally preserved untracked media script. It is not launch authorization. Launch requires every Plan B owner field, approval field, and evidence reference to be complete.
