# 013: Minimal Product Detail Route

## Summary

Added the first minimal public product detail route for Tiger Ping Pong:

```text
/catalog/products/[slug]
```

This is a skeleton detail page for live API verification and future V1 checkout planning. It is not the final ecommerce product page design.

## Route added

Added:

```text
apps/web/src/app/catalog/products/[slug]/page.tsx
apps/web/src/app/catalog/products/[slug]/page.module.css
```

The route is dynamic and fetches one product by slug at request time.

## API client functions reused

Reused the existing frontend catalog API client:

```text
apps/web/src/lib/catalog-api.ts
```

The page uses:

- `getProductBySlug(slug)`

No API endpoints were added or changed.

## /catalog card linking update

The `/catalog` product cards link to:

```text
/catalog/products/[slug]
```

The card accessibility label now describes the link as a product detail link.

## Product fields shown

The detail page shows:

- product name
- formatted price from `priceCents` and `currency`
- slug
- product kind
- purchase mode
- category
- family
- public-safe freight/shipping review language
- short description and description when returned by the API

Products marked as Replacement Parts are not exposed by this public detail route.

## Variant and media handling

Media records render in a simple gallery. When `cloudinarySecureUrl` is present, the Cloudinary image is rendered. When it is null, the page renders an "Image pending" placeholder using available alt/title/caption text.

Variants render in a simple table when `variants` are returned by the API. The table keeps to public-safe fields such as name, SKU, price, purchase mode, status, and options. It does not print source URLs or internal notes.

Spec groups, content sections, and relationships render only when already returned by the API and simple to display safely.

## Table shipping review handling

For products with `shippingReviewRequired: true`, the page uses:

```text
Freight details confirmed before checkout
```

The page does not imply checkout is currently available.

## Stripe hosted checkout direction

V1 commerce direction remains Stripe hosted checkout/payment pages. This route includes only a non-functional placeholder:

```text
Checkout connection planned for V1.
```

No Stripe links, buy buttons, cart, or checkout behavior were added.

## Intentionally excluded

- No final storefront design
- No homepage redesign
- No cart
- No checkout
- No Stripe implementation
- No custom checkout
- No auth
- No admin screens
- No Prisma schema changes
- No migrations
- No database writes
- No Cloudinary uploads
- No Cloudinary workflow implementation
- No BigCommerce source URL display
- No hotlinking old source images

## Local test steps

Run validation from the repository root:

```bash
pnpm lint
pnpm typecheck
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build
git diff --check
git status
```

Run the web app against the deployed API:

```bash
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm --filter @tigerpingpong/web dev
```

Then test:

```text
http://localhost:3000/catalog
http://localhost:3000/catalog/products/tiger-vice-paddle
http://localhost:3000/catalog-preview
```

## Render env var needed

The Render web service needs:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com
```

No Render settings were changed directly in this task.

## Next recommended task

Add the first V1 checkout planning task for Stripe hosted checkout. Keep it separate from the product detail route and avoid custom checkout pages unless the commerce direction changes.
