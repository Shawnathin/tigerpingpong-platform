# Tiger PingPong Catalog API V1

## Purpose

This document describes the first read-only catalog endpoints in the NestJS API.
The endpoints expose catalog data already imported into the Supabase development
database through Prisma.

This API does not create, update, import, seed, or delete catalog data.

## Required Environment

- `DATABASE_URL`: Required for catalog endpoints. It must point at the intended
  Supabase development database when testing dev catalog data.

Do not commit `.env` files or database credentials.

## Endpoints

### `GET /catalog/health`

Confirms the catalog API can reach the database and returns record counts:

```json
{
  "status": "ok",
  "service": "tigerpingpong-catalog-api",
  "timestamp": "2026-06-04T00:00:00.000Z",
  "counts": {
    "brands": 1,
    "categories": 9,
    "productFamilies": 10,
    "products": 17,
    "variants": 15,
    "media": 13
  }
}
```

### `GET /catalog/categories`

Returns active public-navigation categories only. Replacement Parts are excluded
because their `v1PublicNavigation` flag is false.

Response shape:

```json
{
  "categories": [
    {
      "key": "tables",
      "slug": "tables",
      "name": "Tables",
      "sortOrder": 10,
      "v1PublicNavigation": true,
      "v1CheckoutScope": true,
      "children": []
    }
  ]
}
```

### `GET /catalog/product-families`

Returns active/public product families whose primary category is public.

Response shape:

```json
{
  "productFamilies": [
    {
      "key": "expo-table",
      "slug": "expo-table",
      "name": "Expo Table",
      "brand": {
        "key": "tiger-pingpong",
        "name": "Tiger PingPong",
        "slug": "tiger-pingpong"
      },
      "primaryCategory": {
        "key": "tables",
        "name": "Tables",
        "slug": "tables"
      }
    }
  ]
}
```

### `GET /catalog/products`

Returns active public products by default. Replacement Parts are excluded by
default because they are deferred from v1 public navigation and checkout.

Supported query params:

- `includeReplacementParts=true`: includes non-archived replacement-part records
  for internal review workflows.
- `includeInternal=true`: includes source URL, legacy path, SKU, and media
  source metadata where selected.

Response shape:

```json
{
  "products": [
    {
      "key": "tiger-net-post-set",
      "slug": "tiger-net-post-set",
      "name": "Table Tennis Net & Post Set",
      "productKind": "net",
      "purchaseMode": "online_checkout_candidate",
      "priceCents": 5900,
      "currency": "CAD",
      "v1PublicNavigation": true,
      "v1CheckoutScope": true,
      "shippingReviewRequired": false,
      "family": {
        "key": "net-sets",
        "slug": "net-sets",
        "name": "Net Sets"
      },
      "category": {
        "key": "nets",
        "slug": "nets",
        "name": "Nets"
      },
      "primaryMedia": {
        "mediaKey": "tiger-net-post-set-primary-01",
        "role": "primary",
        "cloudinarySecureUrl": null,
        "altText": "Table Tennis Net & Post Set"
      }
    }
  ]
}
```

### `GET /catalog/products/:slug`

Returns product detail by slug with family, category, variants, media, content
sections, specs, and relationships where available.

Missing products return 404.

Replacement Parts are not public by default. Use
`includeReplacementParts=true` only for internal review workflows.

### `GET /catalog/families/:slug`

Returns family detail and products in that family. This is intended for
frontend planning around family landing pages or filtered product lists.

## Replacement Parts Handling

Replacement Parts remain preserved in the database but excluded from public
category and product responses by default. They can be requested explicitly with
`includeReplacementParts=true` for review/debug workflows.

Frontend public navigation should not link to Replacement Parts in v1.

## Table Shipping Review Handling

Tables may appear as `online_checkout_candidate`, but this does not mean public
checkout is ready. Frontend code must honor `shippingReviewRequired`; table
checkout remains blocked until freight, curbside delivery, tax, region, and
shipping policy are approved.

## Media Handling

Product media rows currently hold source/placeholder metadata. The API returns
Cloudinary fields where present, but no upload is performed by this work.

Default responses do not expose BigCommerce source image URLs. Use
`includeInternal=true` for internal review metadata only.

## Frontend Consumption Guidance

- Use `GET /catalog/categories` for public navigation.
- Use `GET /catalog/products` for public listing pages.
- Use `GET /catalog/products/:slug` for product detail planning.
- Treat `purchaseMode=online_checkout_candidate` as planning data, not live
  checkout enablement.
- Do not render Replacement Parts in public v1 navigation unless product
  strategy changes in a later approved task.
- Prefer Cloudinary secure URLs when available. Do not treat source URLs as
  production media delivery URLs.

## Local Testing

From the repository root:

```bash
pnpm db:generate
DATABASE_URL="postgresql://..." pnpm dev:api
```

Then test:

```bash
curl http://localhost:3001/health
curl http://localhost:3001/catalog/health
curl http://localhost:3001/catalog/categories
curl http://localhost:3001/catalog/product-families
curl http://localhost:3001/catalog/products
```

Use only a development `DATABASE_URL`.

## Intentionally Excluded

- No frontend pages.
- No checkout.
- No Stripe.
- No auth.
- No admin screens.
- No Cloudinary upload.
- No Prisma schema changes.
- No migrations.
- No seed/import data.
- No product/category writes.
