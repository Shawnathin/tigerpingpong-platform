# 030 V1 Product Media Completion Pass V1

## Summary

Expanded the temporary frontend-only product media fallback layer so the current
V1 public storefront catalog renders with product imagery when live catalog
Cloudinary media is still missing.

## Files Changed

- `apps/web/src/lib/public-storefront-demo.ts`
- `apps/web/src/app/catalog/page.tsx`
- `docs/build-log/030-v1-product-media-completion-pass-v1.md`

## Products That Received Fallback Media

- `tiger-expo-outdoor-table`
- `tiger-net-post-set`
- `tiger-plaza-outdoor-table-grey`
- `tiger-portland-indoor-table`
- `tiger-portland-outdoor-table`
- `tiger-premium-balls-140`
- `tiger-premium-balls-6-orange`
- `tiger-premium-balls-6-white`
- `tiger-whistler-indoor-table`

Existing fallback media was also kept and customer-facing labels were cleaned
for:

- `tiger-table-cover-black-polyester`
- `tiger-vice-paddle`

## Assets And URLs Used

- `tiger-expo-outdoor-table`
  - `https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/1280x1280/products/114/601/expo_outdoor-01__84166.1651174263.jpg?c=1`
- `tiger-net-post-set`
  - `https://cdn11.bigcommerce.com/s-dh0jici9dm/products/128/images/644/home_accessories-net_post_set__11719.1650711219__23376.1659982669.386.513.png?c=1`
- `tiger-plaza-outdoor-table-grey`
  - `https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/1280x1280/products/117/409/plaza_outdoor-01__91454.1659978562.jpg?c=1`
- `tiger-portland-indoor-table`
  - `https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/1280x1280/products/115/609/portland_indoor-04__35084.1665858559.jpg?c=1`
- `tiger-portland-outdoor-table`
  - `https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/1280x1280/products/112/774/Portland_Outdoor_Black_-_Grey_Top__73629.1685479931.jpg?c=1`
  - `https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/original/image-manager/portland-outdoor-black-grey-top.jpg?t=1685557874`
  - `https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/original/image-manager/adjustable-net.jpg?t=1685557091`
  - `https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/original/image-manager/portland-wheel2.jpg?t=1685558011`
- `tiger-premium-balls-140`
  - `https://cdn11.bigcommerce.com/s-dh0jici9dm/products/126/images/655/Asset_63__05208__66402.1659978470.386.513.jpg?c=1`
- `tiger-premium-balls-6-orange`
  - `https://cdn11.bigcommerce.com/s-dh0jici9dm/products/135/images/688/Asset_34__95063_600x600__38848.1652347243.386.513.jpg?c=1`
- `tiger-premium-balls-6-white`
  - `https://cdn11.bigcommerce.com/s-dh0jici9dm/products/125/images/687/Asset_33__87672.1650713962_600x600__66303.1659982572.386.513.jpg?c=1`
- `tiger-whistler-indoor-table`
  - `https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/1280x1280/products/116/623/whistler_indoor-04__70000.1665858593.jpg?c=1`
- `tiger-table-cover-black-polyester`
  - `/storefront/prototype/table-cover-transparent.png`
- `tiger-vice-paddle`
  - `/storefront/prototype/aqua-paddle/red-paddle-single-cutout.png`
  - `/storefront/prototype/aqua-paddle/blue-paddle-single-cutout.png`
  - `/storefront/prototype/aqua-paddle/aqua-4count-box-angle.jpg`

The BigCommerce URLs are temporary frontend fallbacks sourced from existing
prototype files and reviewed import media records. No Cloudinary upload or
download workflow was added.

## Products Still Using Styled Placeholders

No current public V1 storefront product from the Render catalog remained on a
styled media placeholder after this pass.

The fallback behavior remains in place for future or unmapped products when
live media is missing and no suitable temporary fallback asset is known.

## Live Media Priority Rule

Live media still takes priority:

- Catalog cards use `product.primaryMedia.cloudinarySecureUrl` before any
  fallback image.
- Product detail pages use sorted `product.media` whenever any media item has a
  `cloudinarySecureUrl`.
- Temporary fallback media is only used when live catalog media is missing.

Catalog fallback images now use the fallback media's own customer-facing alt
copy instead of reusing missing-live-media API metadata.

## Customer-Facing Copy

Fallback alt, title, and caption copy was cleaned to avoid customer-visible
internal wording. The rendered smoke checks found no visible `demo`,
`prototype`, or `placeholder` wording on the checked public routes.

## Intentionally Not Changed

- No checkout behavior changed.
- No checkout session creation changed.
- No backend endpoints changed.
- No database writes or API data changes.
- No Prisma schema changes.
- No migrations.
- No webhook changes.
- No internal orders behavior changed.
- No cart, admin, customer accounts, or email changes.
- No public internal links were added.
- No Cloudinary upload/download workflow was added.

## Validation Results

- `pnpm db:generate`
  - Passed.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate`
  - Passed.
- `pnpm lint`
  - Passed.
- `pnpm typecheck`
  - Passed.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`
  - Passed.
- External fallback URL HEAD checks
  - Passed for all added BigCommerce URLs.

## Smoke Test Results

Production web app was smoke tested locally on `http://localhost:3002` with
`NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com`.

- `/`
  - 200 OK.
  - Browser check: images loaded, no public internal links.
- `/catalog`
  - 200 OK.
  - Browser check: 11 product-card images rendered and loaded.
  - Browser check: no visible `demo`, `prototype`, or `placeholder` wording.
  - Browser check: no public internal links.
- `/catalog/products/tiger-vice-paddle`
  - 200 OK.
  - Browser check: 3 paddle images loaded.
- `/catalog/products/tiger-expo-outdoor-table`
  - 200 OK.
  - Browser check: table image loaded.
- `/catalog/products/tiger-portland-outdoor-table`
  - 200 OK.
  - Browser check: 4 table/detail images loaded.
- `/catalog/products/tiger-table-cover-black-polyester`
  - 200 OK.
  - Browser check: table cover image loaded.
- Additional improved product pages checked:
  - `/catalog/products/tiger-portland-indoor-table`
  - `/catalog/products/tiger-whistler-indoor-table`
  - `/catalog/products/tiger-plaza-outdoor-table-grey`
  - `/catalog/products/tiger-premium-balls-140`
  - `/catalog/products/tiger-premium-balls-6-orange`
  - `/catalog/products/tiger-premium-balls-6-white`
  - `/catalog/products/tiger-net-post-set`
  - Browser check: each page loaded its mapped fallback image.
- `/shipping`
  - 200 OK.
- `/contact`
  - 200 OK.
- `/checkout/success`
  - 200 OK.
- `/checkout/cancel`
  - 200 OK.
- `/internal/orders`
  - 401 Unauthorized.
  - Not publicly linked from checked public routes.

## Next Recommended Task

Complete the canonical catalog media workflow by uploading approved product
media to Cloudinary, storing the resulting live media records in the catalog,
and then removing or narrowing this temporary frontend fallback map.
