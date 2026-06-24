# TigerPingPong Custom Ecommerce Launch V1

## Version name

Custom ecommerce launch / V1 launch readiness for TigerPingPong.

## Why this version matters

This version gets TigerPingPong to a working custom ecommerce launch without breaking the existing payment and order foundation. The business value is a shoppable storefront with real product content, trusted checkout, protected staff review, media readiness, and a clear path to domain cutover later.

## Ship definition

Customers can browse launch products, view polished product pages with accurate media/options/content, add valid items to cart, complete hosted Stripe Checkout, and land on a success flow that reflects backend-confirmed order/payment status. Staff can review paid orders through protected internal/admin routes.

## Primary users

- Customers shopping for TigerPingPong tables, paddles, balls, nets, covers, and accessories.
- TigerPingPong staff reviewing paid orders and fulfillment details.
- Shawn and future Codex sessions coordinating launch-critical work.

## Must-have scope

- Public storefront, category, resource, cart, checkout success, and checkout cancel paths remain usable.
- Product pages use sourced facts only, Cloudinary-first media where verified, fallback media where still needed, and required options before add-to-cart.
- Hosted Stripe Checkout remains the payment collection surface.
- Backend/webhook-confirmed paid order status remains payment truth.
- Canada-only shipping remains over `$100 CAD` free, `$100 CAD` or under `$15 CAD`, including exactly `$100.00 CAD`.
- `/admin` and `/internal/*` remain protected, and public navigation does not expose them.
- Launch URL/SEO/domain decisions are reviewed before DNS, redirects, canonicals, sitemap, or robots changes.
- Cloudinary media workflows keep raw media local and credentials out of git.

## Explicit non-goals

- No Shopify, BigCommerce, or theme-platform rebuild.
- No custom payment form.
- No DNS or domain cutover until explicitly selected.
- No unreviewed redirects, canonical-domain changes, sitemap changes, or robots changes.
- No invented product facts, prices, dimensions, colours, warranties, availability, or shipping promises.
- No full admin clone, inventory system, refund flow, automated shipment email, analytics/tracking, or new paid service unless explicitly selected.

## Required proof before ship

- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build` passes.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate` passes when Prisma/database-facing code changes.
- Final safe launch smoke verifies public routes, cart, required options, Stripe Checkout handoff, success/cancel behavior, protected admin/internal routes, webhook/payment truth, and mobile 390px usability.
- Any production-like checkout smoke uses approved Stripe test-mode steps and does not create real/live payment activity without explicit approval.

## Release/ship checklist

- [ ] Current task lane board has no launch-blocking item in `Blocked`.
- [ ] Product media/content readiness is reviewed for launch products.
- [ ] Checkout, shipping, tax, webhook, and success-page behavior are smoke-tested.
- [ ] Render env/deployment checklist is current and reviewed without printing secrets.
- [ ] Admin/internal protection is verified.
- [ ] Footer/header public links are reviewed for approved URL decisions.
- [ ] Domain cutover plan is reviewed separately before any DNS or canonical redirect work.

## Parking lot rule

Anything useful but not required for this V1 launch goes to `docs/agent/parking-lot.md`. Parking an idea means it is remembered, not selected.

## What happens after this version ships

After V1 launch, choose the next version goal from observed launch needs: richer fulfillment/admin operations, broader SEO redirects/search-console work, media cleanup, accessibility polish, product expansion, analytics, or post-launch customer-support improvements.
