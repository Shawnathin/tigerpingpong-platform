# 049 Minimal Order Shipment Admin V1

## Deployment Note

This PR includes an additive Prisma migration for minimal order shipment
recordkeeping fields. Before or during deployment to Render/Supabase, run the
explicit migration deploy command against the target environment's `DATABASE_URL`:

```bash
DATABASE_URL="postgresql://..." pnpm db:migrate:deploy
```

The migration adds fulfillment status and shipment record fields to `orders`.
It does not replace or reinterpret `orders.status`; `orders.status` remains the
payment truth and the Stripe webhook-confirmed paid transition remains
authoritative.

Shipment fields are separate fulfillment recordkeeping for staff operations.
They must not be used as payment proof.

Do not use `prisma migrate reset` against Supabase, Render, or any environment
with customer/order data.

## Scope Guardrails

- No checkout behavior changed.
- No payment behavior changed.
- No Stripe webhook behavior changed.
- No product page behavior changed.
- Migrations do not run automatically during normal build, dev, or start
  commands.
