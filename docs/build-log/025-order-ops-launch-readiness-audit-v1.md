# 025: Order Ops And Launch Readiness Audit V1

## What Was Audited

Audited current `main` after confirming PR #29 / Task 023-024 was merged.

Reviewed:

- `apps/api`
- `apps/web`
- `packages/db`
- Prisma schema and migrations
- checkout session creation code
- checkout status API code
- Stripe webhook verification and paid transition code
- catalog API and frontend catalog client
- product detail checkout flow
- checkout success/cancel pages
- shipping page and shipping helper copy
- environment variable usage
- Render/deployment docs
- existing build logs and planning docs
- import review CSVs and open review flags

## Files Created

- `docs/ops/TIGER_PINGPONG_ORDER_OPERATIONS_V1_PLAN.md`
- `docs/ops/TIGER_PINGPONG_CUSTOMER_POST_PAYMENT_SUPPORT_V1.md`
- `docs/audit/TIGER_PINGPONG_LAUNCH_READINESS_AUDIT_V1.md`
- `docs/build-log/025-order-ops-launch-readiness-audit-v1.md`

## Files Changed

- Documentation only.
- No production code changed.
- No checkout behavior changed.
- No webhook behavior changed.
- No Prisma schema changed.
- No migrations created.
- No admin, cart, email, or Cloudinary upload work implemented.

## Key Findings

- Payment truth is correctly centered on verified Stripe webhook handling, not
  the success redirect.
- Pending `Order` and `OrderItem` snapshots already contain most fields needed
  for staff order review.
- The success page safely reads backend order status and avoids treating the
  redirect as payment confirmation.
- The largest launch-readiness gap is operational visibility: there is no
  protected staff order list/detail view and no notification workflow.
- Customer post-payment support is incomplete: pending, unavailable, not-found,
  and manual-review states need clearer "what to do now" instructions.
- `publicReference` is the right customer-safe reference. Internal order IDs
  should not be used in public support flows.
- Current checkout creation response includes `orderId`; current UI does not
  display it, but the public response contract should be reviewed before
  launch hardening.
- Table shipping/freight/tax/regional policy remains an open blocker in import
  review flags.
- Cloudinary media upload is not implemented; media import rows intentionally
  keep `cloudinary_secure_url` blank.
- Render setup docs predate checkout/webhook/status env requirements and need
  a launch runbook update.
- The RLS baseline exists, but this audit did not prove whether it has been
  applied to the current Supabase environment or whether the backend role has
  been confirmed after RLS.
- Catalog API `includeInternal` behavior should be reviewed before launch if
  the deployed API is public.

## Validation Results

- `pnpm db:generate`: passed.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate`:
  passed. This Prisma validation did not require a live Postgres connection.
- `pnpm lint`: passed.
- `pnpm typecheck`: first run failed because local dependencies were stale
  after pulling latest `main`; TypeScript could not resolve the `stripe`
  package referenced by the API. Ran `pnpm install --frozen-lockfile` with no
  lockfile changes, then reran `pnpm typecheck`: passed.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`:
  passed.
- `git diff --check`: passed.
- `git status`: showed the expected new documentation files before staging.

## Recommended Next Task

Build a narrow protected read-only internal order review path:

- paid orders list
- order detail
- customer/shipping/totals/items/Stripe references
- no mutations
- no refunds
- no fulfillment automation
- no product/catalog editing

If protected internal access is not ready, formalize the manual Supabase review
checklist and assign a named order-review owner before any checkout launch.

## Warnings

- This was a repo/doc audit, not a deployed production smoke test.
- No database migrations were applied.
- No live Stripe checkout was created.
- No Cloudinary upload was performed.
- No order visibility implementation was added.
- Render deployment docs were reviewed but not changed in this task.
