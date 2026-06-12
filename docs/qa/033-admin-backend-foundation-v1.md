# 033 Admin Backend Foundation V1 QA Checklist

## Auth And Exposure

- [ ] Admin endpoints require `x-internal-orders-token`.
- [ ] Unauthenticated admin endpoint requests fail with `401`.
- [ ] Wrong-token admin endpoint requests fail with `401`.
- [ ] No admin token is exposed client-side.
- [ ] No public nav link exposes admin routes.
- [ ] Admin responses include no-store/noindex headers.

## Data Safety

- [ ] Product endpoints return real catalog data.
- [ ] Order endpoints return real order data.
- [ ] Customer endpoint derives customers from orders only.
- [ ] Inventory endpoint does not fake inventory records.
- [ ] Settings endpoint exposes no secrets.
- [ ] Audit endpoint does not fake records.
- [ ] Payment/Stripe status visibility comes from backend order fields and webhook event records.

## Checkout/Webhook/Internal Safety

- [ ] Cart/checkout still builds.
- [ ] Checkout/session creation behavior is unchanged.
- [ ] Webhook code is unchanged.
- [ ] Webhook paid-transition behavior is unchanged.
- [ ] Internal orders backend API remains protected.
- [ ] Internal orders web routes remain Basic Auth protected.
- [ ] Public storefront routes still build.

## Scope Control

- [ ] No production migrations were created.
- [ ] No refund controls were added.
- [ ] No fulfillment mutations were added.
- [ ] No CSV import commit/import mutations were added.
- [ ] No customer account system was added.
- [ ] No advanced CRM/reporting/marketing tools were added.

## Validation Commands

- [ ] `pnpm db:generate`
- [ ] `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`
- [ ] `git diff --check`
- [ ] `git status`
