# Tiger Ping Pong Internal Orders Read-Only V1

## Purpose

This V1 adds a narrow protected internal order review surface for
TigerPingPong.ca staff.

It is not a full admin system. It exists so trusted staff can review paid
Stripe orders without making Supabase the normal operational workflow.

## Routes Added

Web:

```text
/internal/orders
/internal/orders/[publicReference]
```

API:

```http
GET /internal/orders?status=paid&limit=50
GET /internal/orders/:publicReference
```

## Protection Model

The API requires a server-side internal token:

```text
INTERNAL_ORDERS_API_TOKEN
```

Requests must include that value in this header:

```http
x-internal-orders-token: <token>
```

If `INTERNAL_ORDERS_API_TOKEN` is missing on the API service, the endpoint fails
closed with `401`. Missing or incorrect request tokens also return `401`.

The web route is protected by Basic Auth middleware for `/internal/*` routes.
The web page calls the internal API from server-rendered code using
`INTERNAL_ORDERS_API_TOKEN`. The token is not stored in `NEXT_PUBLIC_*`, not
rendered into the page, and not passed to browser code.

## Environment Variables

API service:

```text
INTERNAL_ORDERS_API_TOKEN
DATABASE_URL
```

Web service:

```text
INTERNAL_ORDERS_BASIC_AUTH_USER
INTERNAL_ORDERS_BASIC_AUTH_PASSWORD
INTERNAL_ORDERS_API_TOKEN
NEXT_PUBLIC_API_BASE_URL
```

`NEXT_PUBLIC_API_BASE_URL` is still only the API base URL. It is not a secret.

## List Endpoint

```http
GET /internal/orders?status=paid&limit=50
```

Behavior:

- Defaults `status` to `paid`.
- Defaults `limit` to `50`.
- Caps `limit` at `100`.
- Sorts by `paidAt` descending, then `createdAt` descending.
- Reads only. It performs no order mutations.

Returned order fields:

- `publicReference`
- `status`
- `customerName`
- `customerEmail`
- `customerPhone`
- `currency`
- `subtotalCents`
- `shippingCents`
- `totalCents`
- `itemCount`
- `stripeCheckoutSessionId`
- `stripePaymentIntentId`
- `stripeCustomerId`
- `paidAt`
- `createdAt`

## Detail Endpoint

```http
GET /internal/orders/:publicReference
```

Behavior:

- Looks up by `publicReference`.
- Does not accept or expose internal database IDs.
- Reads only. It performs no order mutations.
- Returns `404` for missing or invalid references.

Returned order fields:

- `publicReference`
- `status`
- `customerName`
- `customerEmail`
- `customerPhone`
- `shippingName`
- `shippingPhone`
- `shippingAddress`
- `currency`
- `subtotalCents`
- `shippingCents`
- `totalCents`
- `shippingRule`
- `checkoutSource`
- `stripeCheckoutSessionId`
- `stripePaymentIntentId`
- `stripeCustomerId`
- `paidAt`
- `createdAt`
- `updatedAt`
- item snapshots

Returned item snapshot fields:

- `productKey`
- `productSlug`
- `variantKey`
- `sku`
- `name`
- `currency`
- `unitPriceCents`
- `quantity`
- `lineTotalCents`
- `createdAt`

The API sanitizes `shippingAddressJson` into the limited staff-facing
`shippingAddress` object with `line1`, `line2`, `city`, `state`, `postalCode`,
and `country` when present.

## Web Pages

`/internal/orders` shows:

- paid timestamp
- public reference
- customer name and email
- total
- status
- item count
- Stripe PaymentIntent ID
- link to the detail page

`/internal/orders/[publicReference]` shows:

- public reference
- read-only note
- status
- paid timestamp
- customer contact info
- shipping name, phone, and address
- subtotal, shipping, total, and currency
- shipping rule
- item snapshot rows
- Stripe Checkout Session ID
- Stripe PaymentIntent ID
- Stripe Customer ID

Both pages render safe fallback states when the internal API is unavailable.
The detail page renders a safe fallback when an order is not found.

## Intentionally Excluded

V1 does not add:

- order mutations
- fulfillment status
- refunds
- email sending
- cart behavior
- customer accounts
- full admin navigation
- product or catalog editing
- checkout creation changes
- webhook paid-transition changes
- Prisma schema changes
- migrations
- raw Stripe payloads
- public customer order lookup

Webhook event summaries are also excluded from V1. The current
`StripeWebhookEvent` table records event IDs, type, and processed timestamp, but
it does not store an order relationship or safe order-specific event summary.
Adding that relationship would require model work outside this read-only task.

## Security Cautions

- Keep `INTERNAL_ORDERS_API_TOKEN` out of all `NEXT_PUBLIC_*` variables.
- Rotate the API token if it is ever pasted into a browser, client bundle, log,
  or support transcript.
- Treat customer contact data, shipping addresses, and Stripe IDs as sensitive
  operational data.
- Do not add links from public customer routes into `/internal/*`.
- Do not expose database errors or stack traces from these endpoints.
- Do not add writes to the internal orders service without a separate design
  and audit pass.

## Render Env Vars To Add

API service:

```text
INTERNAL_ORDERS_API_TOKEN
```

Web service:

```text
INTERNAL_ORDERS_BASIC_AUTH_USER
INTERNAL_ORDERS_BASIC_AUTH_PASSWORD
INTERNAL_ORDERS_API_TOKEN
NEXT_PUBLIC_API_BASE_URL
```

The API and web service must share the same `INTERNAL_ORDERS_API_TOKEN`.

## Manual Test Steps

API:

```bash
curl -i https://<api-host>/internal/orders
curl -i -H 'x-internal-orders-token: wrong' https://<api-host>/internal/orders
curl -i -H 'x-internal-orders-token: <token>' 'https://<api-host>/internal/orders?status=paid&limit=50'
curl -i -H 'x-internal-orders-token: <token>' https://<api-host>/internal/orders/<publicReference>
```

Expected:

- no token returns `401`
- wrong token returns `401`
- correct token returns safe staff fields only
- list defaults to paid orders
- detail uses `publicReference`
- no endpoint changes order state
- API responses do not include raw Stripe payloads or database error details

Web:

```text
/internal/orders
/internal/orders/<publicReference>
```

Expected:

- `/internal/*` prompts for Basic Auth
- missing Basic Auth env vars fail closed
- the page renders after valid credentials
- page source does not include `INTERNAL_ORDERS_API_TOKEN`
- unavailable API renders a safe fallback
- missing detail reference renders a safe fallback

## Validation Commands

Run from the repository root:

```bash
pnpm db:generate
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate
pnpm lint
pnpm typecheck
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build
git diff --check
git status
```

## Next Recommended Task

After this read-only V1 is deployed and smoke-tested, create a launch operations
runbook that names the staff order reviewer, the Stripe reconciliation process,
and the manual fulfillment handoff. Keep fulfillment mutations out of the app
until a dedicated fulfillment model is designed.
