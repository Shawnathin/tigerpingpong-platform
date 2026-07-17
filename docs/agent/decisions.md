# Agent Decision Log

Lightweight record of build-control decisions. Keep this practical: date, decision, why, and what stayed out of scope.

## 2026-06-24 - Install build-control workflow

Decision: Use `goals.md` as the active version source of truth and `docs/agent/current-task.md` as the one selected executable task card.

Why: The repo is in launch-readiness mode with several valuable but risky workstreams. A single selected task keeps Codex work focused and reduces accidental changes to checkout, payment, deployment, schema, media, and domain behavior.

Out of scope: No app behavior, schema, migration, dependency, deployment, env, payment, DNS, or runtime config changes during onboarding.

## 2026-07-16 - Separate local remediation from external launch operations

Decision: Complete code, test, policy-draft, security, and handoff gates on a dedicated release branch. Keep Stripe, production database, Render, DNS, monitoring activation, and deployment as an explicitly owned second plan.

Why: The repository can be made auditable and reproducible without exposing credentials or creating production side effects. External proof requires authorized operators and named go/no-go ownership.

Out of scope: No payment-truth, total, webhook-authority, schema, migration, production configuration, external-service, or production-data mutation.
