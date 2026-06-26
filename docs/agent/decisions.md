# Agent Decision Log

Lightweight record of build-control decisions. Keep this practical: date, decision, why, and what stayed out of scope.

## 2026-06-24 - Install build-control workflow

Decision: Use `goals.md` as the active version source of truth and `docs/agent/current-task.md` as the one selected executable task card.

Why: The repo is in launch-readiness mode with several valuable but risky workstreams. A single selected task keeps Codex work focused and reduces accidental changes to checkout, payment, deployment, schema, media, and domain behavior.

Out of scope: No app behavior, schema, migration, dependency, deployment, env, payment, DNS, or runtime config changes during onboarding.
