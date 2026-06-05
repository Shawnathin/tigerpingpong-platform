# 012: Public Catalog Listing Skeleton

## Summary

Added the first public-facing catalog browsing skeleton for Tiger Ping Pong at:

```text
/catalog
```

This moves beyond the internal `/catalog-preview` verification page while keeping the UI intentionally basic and non-final.

## Route added

Added:

```text
apps/web/src/app/catalog/page.tsx
apps/web/src/app/catalog/page.module.css
```

The route is a dynamic Next.js server page so catalog data is fetched from the API at request time.

## API client functions reused

Reused the existing frontend catalog API client from:

```text
apps/web/src/lib/catalog-api.ts
```

The page uses:

- `getCategories()`
- `getProductFamilies()`
- `getProducts()`

No new API endpoints were added.

## Public catalog behavior

The page fetches public categories, product families, and products from the deployed catalog API configured by:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com
```

Each resource is loaded independently. If one request fails, the page renders a useful error state for that resource instead of blanking the full page.

## Product fields shown

Product cards show:

- product name
- future product URL path using the product slug
- slug
- formatted price from `priceCents` and `currency`
- category
- family
- formatted `productKind`
- primary media alt/title text when available
- clean image placeholder when `cloudinarySecureUrl` is null
- table freight/shipping review indicator when `shippingReviewRequired` is true

## Replacement Parts handling

The API list endpoints are expected to be public-filtered. The public `/catalog` page also applies a defensive frontend exclusion for records marked as Replacement Parts by key, slug, name, or product kind.

Replacement Parts are not shown by default in category navigation, family summaries, or product listings.

## Table shipping review handling

Products with `shippingReviewRequired: true` render a public-safe badge:

```text
Freight details confirmed before checkout
```

The page does not imply checkout is live.

## Intentionally excluded

- No final storefront design
- No homepage redesign
- No full product detail pages
- No cart
- No checkout
- No Stripe
- No auth
- No admin screens
- No Prisma schema changes
- No migrations
- No database writes
- No Cloudinary uploads
- No Cloudinary workflow implementation
- No complex filters or search

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
http://localhost:3000/catalog-preview
```

## Render env var needed

The Render web service needs:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com
```

No Render settings were changed directly in this task.

## Next recommended task

Add the first minimal product detail route at:

```text
/catalog/products/[slug]
```

That task should stay debug/basic at first, fetch by slug through the existing client, and avoid checkout/cart scope.
