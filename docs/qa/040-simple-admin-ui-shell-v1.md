# 040 Simple Admin UI Shell V1 QA

Date: 2026-06-12

Branch: `feature/040-simple-admin-ui-shell-v1`

## Preflight

- [x] Started from latest `main`.
- [x] PR #39 confirmed merged: `fix: make admin dashboard summary degrade gracefully`, merge commit `f35a52cae3c26d03c11400e19594ccdf778d1454`, merged 2026-06-12 17:23:12 UTC.
- [x] Production admin API surface confirmed deployed/protected by Render responses:
  - `/api/admin/dashboard/summary` without token returned `401`.
  - `/api/admin/orders` without token returned `401`.

## Protected Route Checklist

- [x] `/admin` requires auth.
- [x] `/admin/orders` requires auth.
- [x] `/admin/products` requires auth.
- [x] `/admin/customers` requires auth.
- [x] `/admin/settings` requires auth.
- [x] `/admin/inventory` requires auth.
- [x] `/admin/audit-log` requires auth.

Local built-web auth QA used temporary QA Basic Auth values:

- No credentials: all admin routes returned `401`.
- Wrong credentials: `/admin` returned `401`.
- Valid temporary QA credentials: all admin routes returned `200`.

## Safety Checklist

- [x] No public storefront nav links to `/admin`.
- [x] Admin token is not exposed client-side.
- [x] Dashboard loads data from protected API.
- [x] Orders page shows protected order data.
- [x] Products page shows catalog/product data.
- [x] Customers page derives from orders.
- [x] Settings page exposes no secrets.
- [x] Inventory/audit `not_configured` states render cleanly.
- [x] Checkout/cart/webhook behavior unchanged.
- [x] Public storefront still builds.

## Data Rendering QA

A temporary local mock admin API required `x-internal-orders-token: qa-token` and returned representative read-only admin responses. A web-only QA build pointed at that mock confirmed:

- Dashboard rendered paid order count, pending checkout count, recent order `TPP-QA-1001`, product count/warnings area, webhook/payment health, inventory status, and audit-log status.
- Orders rendered order reference, customer, total, statuses, item count, dates, and Stripe reference summary.
- Products rendered product name, slug, price, category/type, visibility/status, checkout eligibility, and image warning state.
- Customers rendered name, email, phone, order count, last order date, and total spent.
- Settings rendered store name, support email, support phone, currency, shipping thresholds, checkout enabled, and Stripe mode without secrets.
- Inventory rendered `Inventory editing is not configured yet.`
- Audit log rendered `Audit log is not configured yet.`

Real production admin data was not fetched manually because this local checkout does not contain a matching production `INTERNAL_ORDERS_API_TOKEN`. Production no-token and wrong-token probes returned `401` for all admin API endpoints.

## Token Safety

- The browser pages fetch admin data through server components only.
- `apps/web/src/lib/admin-api.ts` is marked `server-only`.
- The backend header `x-internal-orders-token` is only set inside the server-only helper.
- `.next/static` scan found no `INTERNAL_ORDERS_API_TOKEN`, `x-internal-orders-token`, or temporary QA token string.

## Validation

- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`
- [x] Public HTML scan for `/admin` links
- [x] Client static bundle token scan

Note: the first full production-base build attempt hit a local `fork: Resource temporarily unavailable` error in Prisma generation. The same command was rerun and passed, and was rerun again after mock QA to leave the workspace in the requested production-base build state.
