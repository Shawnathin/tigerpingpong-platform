# 028 Product Media Demo Content Polish V1

## Summary

Added a frontend-only storefront fallback layer for demo product media and customer-safe copy when live catalog media or copy is missing or still contains internal placeholder wording. Live Cloudinary/catalog media remains the first choice.

## Files Changed

- `apps/web/src/lib/public-storefront-demo.ts`
- `apps/web/src/app/catalog/page.tsx`
- `apps/web/src/app/catalog/products/[slug]/page.tsx`
- `docs/build-log/028-product-media-demo-content-polish-v1.md`

## Fallback Media Added

- `tiger-vice-paddle`
  - `/storefront/prototype/aqua-paddle/red-paddle-single-cutout.png`
  - `/storefront/prototype/aqua-paddle/blue-paddle-single-cutout.png`
  - `/storefront/prototype/aqua-paddle/aqua-4count-box-angle.jpg`
- `tiger-table-cover-black-polyester`
  - `/storefront/prototype/table-cover-transparent.png`

## Products Improved

- `tiger-vice-paddle`
  - Catalog card now uses a paddle image when live media is missing.
  - Product detail gallery now uses the paddle cutout, alternate paddle cutout, and paddle box prototype assets when live media is missing.
  - Sparse/internal copy is replaced in the UI with generic customer-facing table tennis and ping pong copy.
- `tiger-table-cover-black-polyester`
  - Catalog card and product detail gallery now use the table cover prototype asset when live media is missing.
  - Internal/source-note copy is replaced in the UI with generic customer-facing accessory copy while preserving the current Plaza compatibility note from catalog data.
- Other public products
  - Customer-facing card/detail copy is polished when API copy contains internal placeholder markers such as `candidate`, `source product`, or `business correction`.

## Live Media Priority

Live catalog media still takes priority:

- Catalog cards use `product.primaryMedia.cloudinarySecureUrl` first.
- Product detail pages use sorted live `product.media` when any media item has a `cloudinarySecureUrl`.
- Fallback media is only used when no live product media URL is present.

## Placeholders Remaining

No fallback prototype asset was added for:

- `tiger-net-post-set`
- `tiger-expo-outdoor-table`
- `tiger-plaza-outdoor-table-grey`
- `tiger-portland-indoor-table`
- `tiger-portland-outdoor-table`
- `tiger-premium-balls-140`
- `tiger-premium-balls-6-orange`
- `tiger-premium-balls-6-white`
- `tiger-whistler-indoor-table`

These products still render styled media placeholders until live catalog media or suitable static demo assets are available.

## Intentionally Not Changed

- No Stripe Checkout behavior changed.
- No checkout session creation changed.
- No webhook behavior changed.
- No internal orders behavior changed.
- No Prisma schema changes.
- No migrations.
- No backend endpoints.
- No cart, admin, customer accounts, email, or upload workflow.
- No internal routes exposed publicly.
- No API data or database records modified.

## Validation Results

- `pnpm db:generate`
  - Passed on retry.
  - First attempt hit a transient local process launch issue: `fork: Resource temporarily unavailable`.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate`
  - Passed.
- `pnpm lint`
  - Passed.
- `pnpm typecheck`
  - Passed on retry.
  - First attempt reached the web precheck and then hit the same transient local process launch issue.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`
  - Passed.
- `git diff --check`
  - Passed.
- `git status`
  - Branch: `feature/028-product-media-demo-content-polish-v1`
  - Modified/added files are limited to the storefront UI helper, catalog/product detail pages, and this build log.

## Smoke Test Results

Smoke tested the built web app locally with `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com`.

- `/`
  - 200 OK.
  - Page rendered with no public internal links.
- `/catalog`
  - 200 OK.
  - Fallback images loaded for `tiger-vice-paddle` and `tiger-table-cover-black-polyester`.
  - Remaining products without mapped assets kept styled placeholders.
  - No public internal links found.
- `/catalog/products/tiger-vice-paddle`
  - 200 OK.
  - Product detail gallery loaded all three mapped paddle fallback assets.
  - No image placeholder remained on this page.
  - No public internal links found.
- `/shipping`
  - 200 OK.
- `/checkout/success`
  - 200 OK.
  - Rendered the expected missing-session status state.
- `/checkout/cancel`
  - 200 OK.
- `/internal/orders`
  - 401 Unauthorized.

Dev-mode note: `next dev` on local port 3002 reported `EMFILE: too many open files, watch` and served only the not-found route in this sandbox. Production `next start` smoke testing passed.

## Next Recommended Task

Add real live catalog media through the planned Cloudinary/media workflow, then remove or narrow the temporary storefront fallback map once public product media coverage is complete.
