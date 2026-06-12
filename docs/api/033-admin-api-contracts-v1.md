# 033 Admin API Contracts V1

These contracts cover the protected backend/admin foundation for a small V1 Tiger Ping Pong staff panel.

All routes are backend API routes on the API service, not public storefront routes.

Base path:

`/api/admin`

Auth for every route:

- Required header: `x-internal-orders-token`
- Required server env var: `INTERNAL_ORDERS_API_TOKEN`
- Missing or invalid token returns `401`
- Admin responses include no-store/noindex headers
- No client-side admin token is introduced

## GET /api/admin/dashboard/summary

Purpose:

Return a compact staff dashboard summary from existing data.

Current implementation status:

Implemented, read-only.

Data source:

- `Order`
- `StripeWebhookEvent`
- `Product`
- `ProductVariant`

Response shape:

```json
{
  "orders": {
    "paidCount": 0,
    "pendingCheckoutCount": 0,
    "failedCheckoutCount": 0,
    "recent": []
  },
  "payments": {
    "webhookEventsTracked": false,
    "status": "no_events",
    "totalWebhookEventsCount": 0,
    "unprocessedWebhookEventsCount": 0,
    "latestProcessedWebhookEvent": null,
    "recentWebhookEvents": []
  },
  "products": {
    "totalCount": 0,
    "activeCount": 0,
    "checkoutScopeCount": 0,
    "variantCount": 0,
    "warnings": {
      "missingCheckoutPriceCount": 0,
      "missingPublicImageCount": 0
    }
  },
  "inventory": {
    "status": "not_configured",
    "warnings": [],
    "message": "Inventory tables are not implemented yet."
  }
}
```

Known gaps:

- Inventory counts cannot be real until inventory tables exist.
- Webhook health is based on minimal `StripeWebhookEvent` records.

Future write endpoint needed:

No dashboard write endpoint needed for V1.

## GET /api/admin/products

Purpose:

Return a protected staff product list from canonical catalog data.

Current implementation status:

Implemented, read-only.

Data source:

- `Product`
- `ProductFamily`
- `Brand`
- `Category`
- `ProductMedia`
- `ProductVariant` count

Response shape:

```json
{
  "count": 0,
  "items": [
    {
      "id": "product_id",
      "key": "product_key",
      "slug": "product-slug",
      "name": "Product name",
      "sku": "SKU",
      "category": {
        "id": "category_id",
        "key": "category_key",
        "slug": "category-slug",
        "name": "Category"
      },
      "type": "paddle",
      "priceCents": 5000,
      "currency": "CAD",
      "status": "active",
      "visible": true,
      "v1CheckoutScope": true,
      "purchaseMode": "online_checkout_candidate",
      "checkoutEligible": true,
      "checkoutEligibilityReasons": [],
      "imageStatus": {
        "status": "public_image_available",
        "primaryImageUrl": "https://example.com/image.jpg"
      },
      "primaryImageUrl": "https://example.com/image.jpg",
      "variantCount": 0,
      "mediaCount": 1
    }
  ]
}
```

Known gaps:

- No inventory count is included because inventory tables do not exist.
- Product edits are not implemented in this PR.

Future write endpoint needed:

Smallest next step: `PATCH /api/admin/products/:id` for narrow fields only after an audit log plan exists.

## GET /api/admin/products/:id

Purpose:

Return protected product detail from canonical catalog data.

Current implementation status:

Implemented, read-only.

Data source:

- `Product`
- `ProductFamily`
- `Brand`
- `Category`
- `ProductVariant`
- `ProductMedia`

Response shape:

```json
{
  "product": {
    "id": "product_id",
    "key": "product_key",
    "slug": "product-slug",
    "name": "Product name",
    "sku": "SKU",
    "priceCents": 5000,
    "currency": "CAD",
    "status": "active",
    "checkoutEligible": true,
    "brand": {},
    "family": {},
    "media": [],
    "variants": [],
    "createdAt": "2026-06-12T00:00:00.000Z",
    "updatedAt": "2026-06-12T00:00:00.000Z"
  }
}
```

Known gaps:

- `:id` is the Prisma product ID from the admin list.
- No write/edit behavior is included.

Future write endpoint needed:

Smallest next step: a narrow product edit route for status, visibility, price, and basic copy only, with audit logging.

## GET /api/admin/orders

Purpose:

Return protected order list with payment/Stripe visibility.

Current implementation status:

Implemented, read-only.

Query params:

- `status`: optional order status filter
- `limit`: optional, capped at `100`

Data source:

- `Order`
- `OrderItem` count

Response shape:

```json
{
  "count": 0,
  "status": "all",
  "items": [
    {
      "id": "order_id",
      "orderReference": "public_reference",
      "customer": {
        "name": "Customer",
        "email": "customer@example.com",
        "phone": "1-555-555-5555"
      },
      "currency": "CAD",
      "subtotalCents": 5000,
      "shippingCents": 1500,
      "totalCents": 6500,
      "orderStatus": "paid",
      "paymentStatus": "paid",
      "itemCount": 1,
      "stripe": {
        "checkoutSessionId": "cs_test_...",
        "paymentIntentId": "pi_...",
        "customerId": "cus_..."
      },
      "paidAt": "2026-06-12T00:00:00.000Z",
      "createdAt": "2026-06-12T00:00:00.000Z",
      "updatedAt": "2026-06-12T00:00:00.000Z"
    }
  ]
}
```

Known gaps:

- No order notes.
- No fulfillment fields because no fulfillment table exists.
- No refund controls.

Future write endpoint needed:

Smallest next step: order note creation after `order_notes` and `audit_log` are designed. Do not add status mutation until manual status rules are approved.

## GET /api/admin/orders/:id

Purpose:

Return protected order detail with customer, shipping, items, totals, and Stripe references.

Current implementation status:

Implemented, read-only.

Data source:

- `Order`
- `OrderItem`
- linked `Product`
- linked `ProductVariant`

Identifier:

- Accepts order `id` or `publicReference`.

Response shape:

```json
{
  "order": {
    "id": "order_id",
    "orderReference": "public_reference",
    "customer": {},
    "shipping": {},
    "totals": {},
    "orderStatus": "paid",
    "paymentStatus": "paid",
    "checkoutSource": "stripe_checkout",
    "stripe": {},
    "paidAt": "2026-06-12T00:00:00.000Z",
    "createdAt": "2026-06-12T00:00:00.000Z",
    "updatedAt": "2026-06-12T00:00:00.000Z",
    "items": []
  }
}
```

Known gaps:

- No fulfillment table exists.
- No internal notes table exists.
- No refund controls.

Future write endpoint needed:

Smallest next step: `POST /api/admin/orders/:id/notes` after adding `order_notes` and `audit_log`.

## GET /api/admin/customers

Purpose:

Return simple customer summaries derived from existing orders only.

Current implementation status:

Implemented, read-only.

Data source:

- `Order.customerEmail`
- `Order.customerName`
- `Order.customerPhone`
- `Order.totalCents`
- `Order.status`
- `Order.createdAt`

Response shape:

```json
{
  "count": 0,
  "derivation": "orders",
  "items": [
    {
      "email": "customer@example.com",
      "customerName": "Customer",
      "customerPhone": "1-555-555-5555",
      "orderCount": 1,
      "paidOrderCount": 1,
      "lastOrderDate": "2026-06-12T00:00:00.000Z",
      "totalSpentCents": 6500,
      "currency": "CAD"
    }
  ]
}
```

Known gaps:

- This is not a customer account system.
- No customer profiles, login, segments, CRM notes, or marketing tools.

Future write endpoint needed:

None for V1 launch foundation.

## GET /api/admin/inventory

Purpose:

Return the current inventory visibility state.

Current implementation status:

Implemented as explicit `not_configured`, read-only.

Data source:

No inventory table exists yet.

Response shape:

```json
{
  "items": [],
  "status": "not_configured",
  "message": "Inventory tables are not implemented yet.",
  "futureSmallestNextStep": "Add a simple inventory_items table with product/variant link, on-hand count, reserved count, and updated timestamp before adding adjustment writes."
}
```

Known gaps:

- No real inventory counts.
- No adjustment ledger.

Future write endpoint needed:

Smallest next step: simple adjustment route only after `inventory_items`, `inventory_adjustments`, and `audit_log` exist.

## GET /api/admin/settings

Purpose:

Return safe operational settings visibility.

Current implementation status:

Implemented, read-only.

Data source:

- Safe constants
- Non-secret env presence checks
- Stripe key mode prefix only, never the secret value

Response shape:

```json
{
  "settings": {
    "storeName": "Tiger Ping Pong",
    "supportEmail": "info@tigerpingpong.com",
    "supportPhone": "1-888-552-5259",
    "currency": "CAD",
    "freeShippingThresholdCents": 10000,
    "flatRateShippingCents": 1500,
    "checkoutEnabled": true,
    "stripeMode": "test"
  },
  "secretsExposed": false
}
```

Known gaps:

- No settings table exists.
- Settings edits are not implemented.

Future write endpoint needed:

Smallest next step: settings table plus audited update route only for approved non-secret operational values.

## GET /api/admin/audit-log

Purpose:

Return audit log state without faking records.

Current implementation status:

Implemented as explicit `not_configured`, read-only.

Data source:

No audit log table exists yet.

Response shape:

```json
{
  "items": [],
  "status": "not_configured",
  "message": "Audit log table not implemented yet."
}
```

Known gaps:

- No audit log model/table exists.

Future write endpoint needed:

No direct V1 write endpoint. Future admin mutations should write audit rows server-side.
