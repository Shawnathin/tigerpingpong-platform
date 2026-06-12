# 040 Simple Admin UI Shell V1 Build Log

Date: 2026-06-12

Branch: `feature/040-simple-admin-ui-shell-v1`

## Goal

Build the first lightweight, protected, read-only Tiger Ping Pong admin UI shell on top of the protected admin backend endpoints from PR #38 and the PR #39 dashboard stability fix.

## Preflight

- Checked out `main`.
- Pulled latest `origin/main`, fast-forwarding to PR #39 merge commit `f35a52c`.
- Confirmed PR #39 is merged.
- Confirmed the deployed Render admin API surface is protected by probing production admin endpoints without a token and receiving `401`.
- Created `feature/040-simple-admin-ui-shell-v1` from updated `main`.

## Implementation Summary

- Extended the existing internal Basic Auth middleware to protect `/admin` and `/admin/:path*`.
- Added a server-only admin API client that calls protected backend admin endpoints with `x-internal-orders-token` from server env only.
- Added a shared admin layout with protected navigation:
  - Dashboard
  - Orders
  - Products
  - Customers
  - Inventory
  - Settings
  - Audit Log
- Added read-only pages:
  - `/admin`
  - `/admin/orders`
  - `/admin/products`
  - `/admin/customers`
  - `/admin/settings`
  - `/admin/inventory`
  - `/admin/audit-log`
- Kept the public storefront navigation unchanged.
- Added no write/edit/delete controls.
- Added no migrations.
- Changed no checkout, cart, Stripe, webhook, payment truth, or internal order logic.

## Auth Model

Browser routes use the existing Basic Auth pattern from `/internal/orders`.

Backend admin data is fetched server-side through `apps/web/src/lib/admin-api.ts`. The browser receives rendered page data and never receives `INTERNAL_ORDERS_API_TOKEN` or the `x-internal-orders-token` value.

## Page Results

- Dashboard: Shows paid orders, pending checkout, product counts, recent orders, product warnings, webhook/payment status, inventory status, and audit-log status.
- Orders: Shows order reference, customer, total, payment/order status, item count, paid date, created date, and Stripe summary.
- Products: Shows product name, slug, price, category/type, visibility/status, checkout eligibility, and image warning.
- Customers: Shows customer name, email, phone, order count, last order date, and total spent from order-derived customer summaries.
- Settings: Shows safe store/support/currency/shipping/checkout/Stripe-mode values without secrets.
- Inventory: Shows `Inventory editing is not configured yet.` when the endpoint returns `not_configured`.
- Audit Log: Shows `Audit log is not configured yet.` when the endpoint returns `not_configured`.

## QA Notes

- Local built-web route QA confirmed every admin route returns `401` without Basic Auth and `200` with temporary valid QA Basic Auth.
- Production backend probes confirmed no-token and wrong-token requests return `401` for all admin API endpoints.
- Mock protected API QA confirmed successful data rendering through the server-only admin fetch helper.
- Browser QA confirmed the admin dashboard shell renders with 7 admin nav links and successful mock dashboard data.
- Public home HTML and storefront source scans found no public `/admin` navigation links.
- Client static bundle scan found no admin token/header strings.

## Validation

- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`: passed.
- `git diff --check`: passed.
- `git status`: showed only the expected admin UI, middleware, QA, and build-log changes before staging.

The first full production-base build attempt failed before app code due to a local Prisma child-process fork error. Rerunning the same command passed, and the final requested production-base build also passed after mock QA.
