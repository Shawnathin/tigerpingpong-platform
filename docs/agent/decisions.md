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

## 2026-07-20 - Add one Aqua 4-pack shipping exception

Decision: The exact Aqua `4-Pack w/ 3 Balls` variant ships free across Canada when it is the only cart item. Any mixed order follows the normal order-level rule: over $100 CAD ships free; $100 CAD or under uses $15 flat-rate shipping.

Why: Requiring the exact product and variant on every cart line prevents another under-threshold SKU from inheriting the exception. Webhook validation continues to recognize the legacy threshold-only rule for already-pending orders.

Out of scope: No other product exception, price/catalog mutation, schema/migration, payment-truth change, webhook-authority change, international shipping, DNS, deployment, or external-service mutation.
