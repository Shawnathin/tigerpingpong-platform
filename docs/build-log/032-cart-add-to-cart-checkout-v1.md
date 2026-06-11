# 032 Cart Add To Cart Checkout V1 Build Log

Date: 2026-06-11

Branch: `feature/032-cart-add-to-cart-checkout-v1`

## Start Gate

- Started from `main`.
- Pulled `origin/main`.
- Confirmed PR #36 is merged into `main`.
- PR #36: `https://github.com/Shawnathin/tigerpingpong-platform/pull/36`
- Merge commit present locally: `8dd5f575b93852e6f5755458692862a5d9c976bd`

## Current Checkout Flow Findings

Product page checkout button:

- The existing customer checkout entry lived in `apps/web/src/app/catalog/products/[slug]/CheckoutButton.tsx`.
- The product detail page rendered it inside the checkout panel in `apps/web/src/app/catalog/products/[slug]/page.tsx`.
- Before this task, the button called `createCheckoutSession({ items: [{ productSlug, quantity: 1 }] })` and redirected the browser directly to `session.checkoutUrl`.

Checkout/session API route:

- `apps/api/src/checkout/checkout.controller.ts` exposes `POST /checkout/sessions`.
- The controller delegates to `CheckoutService.createCheckoutSession`.
- `GET /checkout/sessions/:sessionId/status` remains the public backend-confirmed success-page status endpoint.

Catalog product lookup:

- `CheckoutService.loadCheckoutProducts` re-fetches products server-side by submitted slug.
- `CheckoutService.isProductCheckoutable` validates active status, public navigation, checkout scope, non-replacement product kind, checkout purchase mode, active/public family, active/checkoutable category, and CAD currency.
- The client checkout request does not provide trusted prices, totals, or shipping.

Pending order creation:

- `CheckoutService.createPendingOrder` creates an `Order` with status `checkout_pending`.
- It persists server-calculated subtotal, shipping, total, `shippingRule`, `checkoutSource`, and optional customer email before Stripe Checkout is created.

Order item snapshot creation:

- The pending order transaction creates `OrderItem` rows from server-side snapshot items.
- Snapshots include product key, slug, variant key, SKU, name, image URL, unit price, quantity, line total, and currency.

Stripe Checkout line item creation:

- `CheckoutService.createStripeSession` builds Stripe Checkout `line_items` from the stored order items.
- `CheckoutService.createStripeLineItem` uses stored item name, image, unit amount, currency, and quantity.
- Shipping is sent to Stripe as a fixed shipping option based on the server-calculated order shipping amount.
- Shipping address collection remains Canada-only.

Success/cancel URL handling:

- Success and cancel URLs come from checkout config.
- The success page reads `session_id` and calls the backend status endpoint.
- The success page continues to state that Stripe redirect is not payment truth.
- The cancel page does not mutate payment state and does not imply a failed payment.

Internal orders assumptions:

- `/internal/orders` and `/internal/orders/[publicReference]` remain protected by Next middleware Basic Auth.
- The web app calls the internal API with a server-side internal token only.
- The internal API is read-only and protected by `x-internal-orders-token`.
- The internal list already shows item count.
- The internal detail page already renders all order item snapshots, totals, shipping rule, checkout source, and Stripe references.
- Multi-item cart orders should flow through without schema changes because the existing `OrderItem` model supports multiple rows per order.

## Implementation Notes

- Added anonymous cart state in `apps/web/src/lib/cart.ts`.
- Added a React cart subscription hook in `apps/web/src/lib/use-cart.ts`.
- Cart state is client-side only and persisted in `localStorage`.
- Cart item display data includes slug, name, unit price, quantity, currency, image URL, product kind, and category name.
- Header cart count reads from localStorage and updates through the cart subscription event.
- Product detail pages now use Add to cart instead of direct Stripe redirect.
- Added an in-app added-to-cart modal with item summary, recommended add-ons, keep shopping, view cart, checkout, and close controls.
- Recommended add-ons are selected from real catalog products returned by the catalog API and filtered to checkoutable products.
- Added `/cart` with cart items, thumbnails, quantity controls, remove actions, subtotal, shipping, total, threshold copy, checkout, empty state, and continue shopping.
- Cart checkout calls the existing `POST /checkout/sessions` API with only product slugs and quantities.
- Added success-page cart cleanup only when the backend status endpoint reports `paid`.

## Payment Truth Preservation

- Stripe redirect still does not mark payment paid.
- Client cart checkout does not submit trusted prices, totals, or shipping.
- The backend still re-fetches products by slug before order and Stripe session creation.
- The backend still calculates subtotal, shipping, and total.
- The backend still creates `checkout_pending` orders and item snapshots before Stripe Checkout.
- The webhook-confirmed paid transition remains the payment truth.
- The success page continues to read backend-confirmed order status.
- Internal orders remain read-only and protected.

## Validation Results

Initial focused validation:

- `pnpm --filter @tigerpingpong/web typecheck`: passed.

Final validation:

- `pnpm db:generate`: passed.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate`: passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`: passed.
- `git diff --check`: passed.
- Package test scripts: none found in workspace `package.json` files.

Local browser validation:

- Started the local storefront on `http://127.0.0.1:3002` with `WATCHPACK_POLLING=true` and `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com`.
- Opened `/catalog` and confirmed the catalog rendered product links.
- Opened `/catalog/products/tiger-portland-outdoor-table`.
- Confirmed direct `Buy with Stripe` copy was absent.
- Confirmed one `Add to cart` button was present.
- Clicked `Add to cart`.
- Confirmed added-to-cart modal opened with the table product.
- Confirmed header cart count updated from `Cart0` to `Cart1`.
- Confirmed real catalog recommendations rendered in the modal, including `Tiger PingPong Vice Ping Pong Paddle`.
- Added the paddle recommendation from the modal.
- Confirmed header cart count updated to `Cart2`.
- Opened `/cart` from the modal.
- After client hydration, confirmed cart page showed two items.
- Confirmed subtotal/total for table plus paddle was `$1,550.00`.
- Confirmed shipping line displayed `Free`.
- Confirmed shipping copy displayed `Free shipping across Canada`.
- Increased paddle quantity and confirmed header count `Cart3` and subtotal `$1,600.00`.
- Decreased paddle quantity, removed paddle, and confirmed header count `Cart1`.
- Reloaded `/cart` and confirmed the table persisted after refresh.
- Set a 390px mobile viewport.
- Confirmed mobile cart page had no horizontal overflow.
- Opened `/catalog/products/tiger-vice-paddle`, clicked `Add to cart`, and confirmed the mobile modal had no horizontal overflow.
- Did not click the cart checkout button locally because the local app was configured against the deployed API and that would create a production pending Stripe Checkout order.

## Production Proof Status

Not run in this local build. Render deployment and Stripe/Supabase production proof remain required before final merge readiness.
