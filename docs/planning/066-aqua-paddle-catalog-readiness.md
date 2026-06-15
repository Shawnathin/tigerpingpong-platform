# Aqua Paddle Catalog Readiness Investigation

Date: 2026-06-15
Branch: `codex/pr-066-aqua-paddle-catalog-readiness`
Status: Investigation only; do not publish Aqua yet.

## Summary

The Aqua paddle products are present in the local import-review catalog data and in the live Render catalog database, but they are intentionally not eligible for the public storefront catalog right now.

They should not be published yet. They are draft/manual-review products, outside V1 checkout scope, without mapped public product media, and still carry open source/media review work.

## Products Investigated

| Product key / slug | Name | Current readiness |
| --- | --- | --- |
| `tiger-aqua-single-coral` | Tiger PingPong Aqua Single Coral Paddle | Not ready |
| `tiger-aqua-single-ocean-blue` | Tiger PingPong Aqua Single Ocean Blue Paddle | Not ready |
| `tiger-aqua-outdoor-paddle-pack-4` | Tiger PingPong Aqua Outdoor Paddle Pack - 4 Pack | Not ready |
| `tiger-aqua-outdoor-paddle-pack-2` | Tiger PingPong Aqua Outdoor Paddle Pack - 2 Pack | Not ready |

## Where They Were Found

- `data/import-review/tigerpingpong/v1/products_import_v1.csv`
  - Four Aqua product rows exist.
  - All four use `primary_category_key=paddles`, `product_kind=paddle`, `status=draft`, `v1_public_navigation=true`, `v1_checkout_scope=false`, and `purchase_mode=needs_manual_review`.
  - SKUs and prices are present:
    - `15891`, `2500` CAD cents for Coral single.
    - `15890`, `2500` CAD cents for Ocean Blue single.
    - `15888`, `8000` CAD cents for 4 pack.
    - `15889`, `4500` CAD cents for 2 pack.
- `data/import-review/tigerpingpong/v1/product_families_import_v1.csv`
  - `aqua-paddles` exists under the `paddles` primary category.
  - Notes say source URLs and media require review because these products were not present in the scrape manifest.
- `data/import-review/tigerpingpong/v1/import_review_flags_v1.csv`
  - Aqua price review is resolved.
  - Aqua source URL review remains open.
  - Product media upload/source review remains open for V1 media, with Aqua called out as needing source media review.
- `data/import-review/tigerpingpong/v1/redirects_draft_v1.csv`
  - Aqua redirect candidates are draft only and require legacy path verification.
- `data/product-content/tigerpingpong-product-content-normalized.json`
  - One legacy source product exists as `aqua-outdoor-indoor-paddle`.
  - `currentAppSlug` is null.
  - The record remains human-review-needed, with missing dimensions and warranty notes.
- `data/legacy-website/tigerpingpong-legacy-inventory.json`
  - The legacy product is `Aqua Outdoor / Indoor Paddle` at `/paddles/aqua-outdoor-indoor-paddle`.
  - It has a price range, feature content, and 10 gallery image links in the legacy scrape notes.
- `docs/media/043-cloudinary-upload-manifest-v1.json`
  - `images/Paddles/141-Aqua Outdoor Indoor Paddle` appears as an unmapped folder with 10 images.
  - It lists SKU refs `141-SI`, `141-SI-1`, `141-2P`, and `141-4P`.
- `apps/web/public/storefront/prototype/aqua-paddle/`
  - Prototype Aqua images exist for demo/fallback use, not as reviewed product media mappings.

## Why They Are Not Live

The public catalog API uses active storefront product filters in `apps/api/src/catalog/catalog.service.ts`:

- `status = active`
- `v1PublicNavigation = true`
- `productKind != replacement_part`
- `purchaseMode != deferred_from_v1`

The four Aqua products fail the public filter because their status is `draft`. Even if status were changed, they are not checkout-ready because the checkout service also requires:

- `status = active`
- `v1PublicNavigation = true`
- `v1CheckoutScope = true`
- `purchaseMode` in `online_checkout` or `online_checkout_candidate`
- active/public family and active/public checkout-scoped category
- CAD currency

Current Aqua values are `status=draft`, `v1CheckoutScope=false`, and `purchaseMode=needs_manual_review`.

## Live API Findings

Public product detail requests on Render return 404 for all four Aqua slugs:

- `/catalog/products/tiger-aqua-single-coral`
- `/catalog/products/tiger-aqua-single-ocean-blue`
- `/catalog/products/tiger-aqua-outdoor-paddle-pack-4`
- `/catalog/products/tiger-aqua-outdoor-paddle-pack-2`

The broader internal-style product query can return them from the live database:

`/catalog/products?includeInternal=true&includeReplacementParts=true`

That response includes the four Aqua records with:

- category `paddles`
- family `aqua-paddles`
- prices and CAD currency
- `purchaseMode=needs_manual_review`
- `v1CheckoutScope=false`
- `primaryMedia=null`

Individual detail requests also return them when both include flags are present:

`/catalog/products/<slug>?includeInternal=true&includeReplacementParts=true`

Those detail responses show `media: []`, no variants, no content sections, and no spec groups.

## Media Findings

The current reviewed import media CSV has no rows for the four Aqua product slugs.

There is evidence of source media:

- The legacy scrape notes say the old Aqua product gallery had 10 CDN image links.
- The PR 43 Cloudinary upload manifest lists `images/Paddles/141-Aqua Outdoor Indoor Paddle` as an unmapped folder with 10 images.

But there is no reviewed mapping from that single legacy/media folder to the four current Aqua product slugs. The prototype storefront images are not sufficient product media for publishing.

## Safe To Publish Now?

No.

The products have confirmed SKUs and prices, and they are assigned to the Paddles category, but they are not catalog-ready or checkout-ready. Publishing them now would either create public product pages with no reviewed media/content depth or require loosening eligibility rules, which this investigation should not do.

## Required Checklist Before Publishing

1. Confirm the desired catalog model:
   - four standalone Aqua products, or
   - one Aqua product with options/variants, or
   - another approved structure.
2. Verify source URLs and legacy paths for the four candidate Aqua routes.
3. Map reviewed Aqua media to the approved product model.
4. Confirm which Cloudinary assets are valid for each Aqua product or variant.
5. Add reviewed product media rows with public primary media and alt text.
6. Confirm product content that is safe to publish:
   - descriptions,
   - feature claims,
   - dimensions if needed,
   - warranty notes if applicable,
   - any SKU/option naming details.
7. Decide whether the products are checkout eligible.
8. Only if checkout eligible, update catalog status/scope/purchase mode through the approved import/database path:
   - `status=active`
   - `v1_checkout_scope=true`
   - `purchase_mode=online_checkout_candidate` or `online_checkout`
9. Validate that the public API returns the Aqua products without internal flags.
10. Browser QA:
    - `/accessories/`
    - `/accessories/paddles/`
    - individual Aqua product pages
    - no broken images
    - no unapproved fallback/prototype Aqua product images
    - add-to-cart only after checkout eligibility is approved.

## Decision For PR 066

Do not publish Aqua in this PR.

This PR records the readiness state and leaves storefront, checkout, payment, webhook, media mapping, database migrations, SEO, and shipment/admin work unchanged.
