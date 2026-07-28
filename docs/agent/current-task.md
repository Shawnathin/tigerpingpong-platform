# Current Task

## Active task

Complete the protected admin recovery after the first production deployment was safely blocked by the same saturated Supabase session pool during Prisma pre-deploy.

## Selected task card

Production regression: authenticated admin product and order requests return HTTP `503` while public catalog health remains green.

## Confirmed cause

The production API opens five independent Prisma clients without a connection cap. A read-only Render shell probe reproduced Supabase `EMAXCONNSESSION`: session-mode clients reached the pool limit of 15. PR #153 promoted the runtime cap, but Render's pre-deploy Prisma migration process still used the uncapped raw URL and was rejected before the new API could start.

## Boundaries

- Work only on `codex/fix/admin-predeploy-pool`, created from current `develop`; target its pull request to `develop`, never `main`.
- Reuse the shared URL guard to give only the Prisma migration process a one-connection cap.
- Keep the API's two-connection runtime cap and preserve an explicitly configured `connection_limit`.
- Keep catalog data, database schema/data, orders, checkout, Stripe, webhook payment truth, protected-route auth, shipping, DNS, and production credentials unchanged.
- Shawn approved production promotion; keep every follow-up change on the protected task-branch -> `develop` -> `main` path.

## Required proof

- Supabase session-pool URLs without an explicit override receive a safe connection cap.
- Explicit limits, transaction-pool URLs, local URLs, and invalid/missing configuration retain their existing behavior.
- Focused unit coverage, lint, typecheck, Prisma validation, and the production-style build pass.
- The Render pre-deploy command completes without printing the database URL.
- After reviewed promotion, authenticated admin products and orders return successfully without exposing customer or credential data.

## Status

PR #152 merged into `develop`, and approved production PR #153 merged into `main` after complete hosted validation. Render built commit `b512bba` but safely stopped before release when its uncapped Prisma pre-deploy command hit `EMAXCONNSESSION`; the previous API remains live and no migration or data change occurred. The focused migration-process cap is now in progress.
