# 027 Visible Storefront Demo Pass V1

## Reference Files Used

- `/Users/admin/Documents/Tiger PingPong Website 2/index.html`
- `/Users/admin/Documents/Tiger PingPong Website 2/tables.html`
- `/Users/admin/Documents/Tiger PingPong Website 2/portland-outdoor.html`
- `/Users/admin/Documents/Tiger PingPong Website 2/styles.css`
- `/Users/admin/Documents/Tiger PingPong Website 2/assets/table-cover-transparent.png`
- `/Users/admin/Documents/Tiger PingPong Website 2/assets/aqua-paddle/blue-paddle-single-cutout.png`
- `/Users/admin/Documents/Tiger PingPong Website 2/assets/aqua-paddle/red-paddle-single-cutout.png`
- `/Users/admin/Documents/Tiger PingPong Website 2/assets/aqua-paddle/aqua-4count-box-angle.jpg`

The prototype was used as visual direction for the glass navigation, orange/blue/teal palette, hero treatment, category cards, product purchase panel, specs styling, and CTA language. Static cart/account concepts and old shipping copy were not copied.

## Pages Changed

- `/`
- `/catalog`
- `/catalog/products/[slug]`
- `/shipping`
- `/checkout/success`
- `/checkout/cancel`

## Visual Improvements

- Added a shared public glass navigation with only Home, Catalog, and Shipping links.
- Replaced the homepage API-health scaffold with a storefront hero, category cards, shipping promise, and contact/support band.
- Converted `/catalog` from scaffold output into a storefront page with a hero, category jump links, family story cards, product cards, image placeholders, prices, shipping copy, and product CTAs.
- Reworked product detail pages into a sellable layout with a large media/gallery area, purchase panel, price, checkout CTA, shipping message, product facts, options, specs, and highlights.
- Polished `/shipping` around the locked V1 Canada shipping rule.
- Applied light checkout success/cancel visual consistency while preserving payment status behavior.
- Added responsive mobile styling and verified no horizontal overflow on key routes.

## Placeholder Status

- Product cards and product detail pages use live catalog media when `cloudinarySecureUrl` is present.
- Products without live media show styled placeholders instead of broken image states.
- `/catalog/products/tiger-vice-paddle` currently renders without a product image because the live catalog response does not expose media for that product.

## Image Assets

Copied static prototype assets into the web app for the visible demo:

- `apps/web/public/storefront/prototype/table-cover-transparent.png`
- `apps/web/public/storefront/prototype/aqua-paddle/blue-paddle-single-cutout.png`
- `apps/web/public/storefront/prototype/aqua-paddle/red-paddle-single-cutout.png`
- `apps/web/public/storefront/prototype/aqua-paddle/aqua-4count-box-angle.jpg`

The storefront still relies on live catalog media and one prototype table reference URL for some demo imagery. A later asset pass should attach canonical product media to the catalog data for every public product.

## Routes For Stakeholder Demo

- `/`
- `/catalog`
- `/catalog/products/tiger-vice-paddle`
- `/shipping`
- `/checkout/success`
- `/checkout/cancel`

## Intentionally Not Changed

- Stripe Checkout request behavior.
- Checkout session/status API behavior.
- Stripe webhook behavior.
- Internal orders API and page behavior.
- Prisma schema or migrations.
- Backend endpoints.
- Cart, account, admin, email, or Cloudinary upload workflows.
- Public links to `/internal/orders`.
- Freight or manual-review shipping language for tables.

## Shipping Copy Status

The V1 shipping rule is reflected in public copy:

- Canada only.
- Orders over $100 CAD ship free across Canada.
- Orders $100 CAD or under use $15 flat-rate shipping.
- Exactly $100.00 CAD still uses $15 flat-rate shipping.
- Tables and high-priced products say "Free shipping across Canada."
- Lower-priced products say "Free shipping on orders over $100."

## Validation Results

- `pnpm db:generate`: passed.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate`: passed on rerun after a transient local fork/process-limit failure.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`: passed.
- `git diff --check`: passed.
- `git status`: pending branch changes only.

## Smoke Test Results

Local preview used:

```sh
WATCHPACK_POLLING=true NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm exec next dev -H 127.0.0.1 -p 3000
```

Browser checks confirmed:

- `/`: 200, storefront hero visible, public nav is Home/Catalog/Shipping, no cart/account/internal links, images present.
- `/catalog`: 200, storefront hero visible, public nav is clean, no old shipping copy, no horizontal overflow.
- `/catalog/products/tiger-vice-paddle`: 200, product purchase panel visible, checkout button still uses existing slug plus quantity 1 flow, no public cart/account/internal links.
- `/shipping`: 200, locked Canada shipping copy visible, no freight/manual-review language.
- `/checkout/success`: 200, status page renders without changing payment truth behavior.
- `/checkout/cancel`: 200, cancellation page renders without changing payment truth behavior.
- `/internal/orders`: `401 Unauthorized` via direct request and is not linked from public navigation. Browser direct navigation was blocked by the browser extension before page load, so direct HTTP was used for this protected-route check.
- Mobile viewport `390x844`: checked `/`, `/catalog`, `/catalog/products/tiger-vice-paddle`, `/shipping`, `/checkout/success`, and `/checkout/cancel`; no horizontal overflow.

## Next Recommended Task

Run a product media and content completion pass: attach canonical image assets to every public catalog product, add polished product descriptions/specs where the API currently returns sparse data, and replace any remote reference image URLs with managed storefront/catalog media.
