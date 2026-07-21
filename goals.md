# TigerPingPong Website Launch v1

## Version status

**Shipped.** Shawn confirmed on 2026-07-21 that the production site is live and working. The pre-launch scope and proof list below are retained as the historical v1 contract; unchecked evidence must not be retroactively claimed without a recorded source.

## Version name

TigerPingPong Website Launch v1

## Why this version matters

This version proves TigerPingPong.ca can operate as a real ecommerce website, not just a local/staging build. It needs to be live, customer-usable, and safe enough to take real orders.

## Ship definition

The website is live online at the intended production domain, with the v1 catalog visible, product pages working, cart and Stripe checkout working, paid order capture working, essential admin/order visibility working, production environment variables configured, and launch-blocking QA issues resolved or explicitly accepted.

## Primary users

- Customers buying Tiger PingPong products in Canada.
- Shawn / Home Billiards operators reviewing orders and fulfillment state.
- Future admin users managing catalog/media/order details.

## Must-have scope

- Production website is reachable.
- Core navigation works.
- Category pages work.
- Product pages work.
- V1 reviewed catalog is visible.
- Product images/media are acceptable for launch, even if not perfect.
- Cart works.
- Stripe checkout works in the correct production/test mode selected for launch.
- Stripe webhook records paid orders correctly.
- Canada-only shipping behavior is correct enough for launch.
- Basic order/admin visibility exists.
- Critical SEO/page metadata is not obviously broken.
- Production env/config is documented without exposing secrets.
- Render/Supabase/Stripe/Cloudinary production setup is verified.
- No obvious security foot-guns: secrets not committed, unsafe debug endpoints not exposed, no test checkout accidentally live.
- Launch QA checklist exists and passes.

## Explicit non-goals

- Perfect media pipeline.
- Perfect Cloudinary automation.
- Full admin CMS.
- Full inventory management.
- Full SEO rebuild.
- Full redesign.
- International shipping.
- BigCommerce migration.
- Major architecture rewrite.
- Repo-wide formatting cleanup unless blocking.
- Live Cloudinary upload tooling unless explicitly selected.
- Any unrelated side quests.

## Required proof before ship

- `pnpm lint` passes.
- `pnpm typecheck` passes.
- Production build passes.
- Prisma/schema validation passes if applicable.
- Stripe checkout smoke test documented.
- Stripe webhook paid-order proof documented.
- Production env checklist reviewed without exposing secrets.
- Core customer path QA documented:
  - home
  - category
  - product page
  - cart
  - checkout
  - paid order
- Admin/order visibility proof documented.
- Mobile smoke test documented.
- Known launch caveats listed.

## Release/ship checklist

- [ ] Confirm production branch.
- [ ] Confirm clean Git status.
- [ ] Confirm deployment target.
- [ ] Confirm production domain/DNS.
- [ ] Confirm Render services healthy.
- [ ] Confirm Supabase production database reachable.
- [ ] Confirm Stripe production configuration.
- [ ] Confirm Cloudinary production asset URLs.
- [ ] Confirm checkout/order/webhook flow.
- [ ] Confirm fulfillment statuses/order records.
- [ ] Confirm launch-blocking visual/media issues reviewed.
- [ ] Confirm rollback plan.
- [ ] Confirm post-launch monitoring plan.

## Parking lot rule

Anything not required to safely launch v1 goes to `docs/agent/parking-lot.md`. Media polish, deeper admin tools, product description upgrades, image automation, SEO expansion, design refinements, and repo-wide formatting cleanup are parked unless selected as launch blockers.

## Post-launch direction

Post-launch work can focus on stability and measured improvements: media cleanup, product cards, richer admin tools, SEO expansion, inventory/availability controls, catalog editing, and conversion improvements. Every task starts on its own branch created from current `develop`, merges back only into `develop`, and reaches production `main` only through an approved pull request from `develop`.
