# Current Task

## Active task

Restore protected admin orders and products after the live API exhausted the Supabase session pool.

## Selected task card

Production regression: authenticated admin product and order requests return HTTP `503` while public catalog health remains green.

## Confirmed cause

The production API opens five independent Prisma clients without a connection cap. A read-only Render shell probe reproduced Supabase `EMAXCONNSESSION`: session-mode clients reached the pool limit of 15.

## Boundaries

- Work only on `codex/fix/admin-api-connection-pool`, created from current `develop`; target its pull request to `develop`, never `main`.
- Cap only implicit Supabase session-pool connections and preserve an explicitly configured `connection_limit`.
- Keep catalog data, database schema/data, orders, checkout, Stripe, webhook payment truth, protected-route auth, shipping, DNS, and production credentials unchanged.
- Do not mutate production or merge/promote the fix without Shawn's separate approval.

## Required proof

- Supabase session-pool URLs without an explicit override receive a safe connection cap.
- Explicit limits, transaction-pool URLs, local URLs, and invalid/missing configuration retain their existing behavior.
- Focused unit coverage, lint, typecheck, Prisma validation, and the production-style build pass.
- After reviewed promotion, authenticated admin products and orders return successfully without exposing customer or credential data.

## Status

Root cause is confirmed and the focused connection cap is complete. Full lint, typecheck, 132 unit tests, Prisma generation/validation, changed-file formatting, diff validation, and the production-style build pass. Draft PR #152 targets `develop` and its hosted checks are queued; no production setting, deployment, database data/schema, payment, shipping, or auth state changed.
