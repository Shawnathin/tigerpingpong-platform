# 011: Frontend Catalog API Foundation

## Summary

Created a small frontend foundation in `apps/web` for consuming the deployed Tiger Ping Pong catalog API from the Next.js app.

## Frontend environment variable

Added:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

Local development can use the local API fallback:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

Production should use the deployed Render API:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com
```

The existing homepage `NEXT_PUBLIC_API_URL` health check was left unchanged.

## API client functions

Added `apps/web/src/lib/catalog-api.ts` with:

- `getCatalogHealth()`
- `getCategories()`
- `getProductFamilies()`
- `getProducts()`
- `getProductBySlug(slug)`
- `getFamilyBySlug(slug)`

The helper centralizes the API base URL, JSON fetch behavior, no-store cache setting, and API error formatting.

## Catalog response types

Added `apps/web/src/types/catalog.ts` with lightweight types for current catalog API responses:

- `CatalogHealth`
- `CatalogCategory`
- `CatalogFamily`
- `CatalogProductSummary`
- `CatalogProductDetail`
- `ProductMediaSummary`

The types intentionally model only the fields needed for current frontend planning and verification.

## Preview route

Added:

```text
/catalog-preview
```

The route fetches catalog health, categories, product families, and products, then renders:

- catalog counts from `/catalog/health`
- public category hierarchy from `/catalog/categories`
- public product family list from `/catalog/product-families`
- public product table from `/catalog/products` with name, slug, price, category, family, shipping review flag, and primary media alt/title

Each resource fetch is handled independently so API failures show useful error messages instead of a blank page.

## Local testing

To run the web app against the deployed catalog API:

```bash
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm --filter @tigerpingpong/web dev
```

Then open:

```text
http://localhost:3000/catalog-preview
```

Expected deployed catalog counts:

- Brands: 1
- Categories: 9
- Product families: 10
- Products: 17
- Variants: 15
- Media: 13

The list endpoints are public-filtered, so category, family, and product list totals may be lower than the full catalog health counts.

## Render configuration

The Render web service should be configured with:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com
```

No Render settings were changed directly in this branch.

## Intentionally excluded

- No full storefront
- No homepage redesign
- No final product pages
- No cart
- No checkout
- No Stripe
- No auth
- No admin screens
- No Prisma schema changes
- No migrations
- No database writes
- No Cloudinary uploads

## Next recommended frontend step

Create a deliberately scoped public catalog listing/page plan using this API client, including route structure, loading/error states, and the minimum product-card fields needed before implementing final storefront views.
