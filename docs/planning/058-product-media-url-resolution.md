# PR 058 Product Media URL Resolution

Date: 2026-06-15
Branch / PR: feature/product-media-url-resolution-v1 / PR 058
Status: Draft PR planned

## What was wrong

The production catalog API returned public product media rows with stable media keys, such as
`tiger-vice-paddle-primary-01`, but blank `cloudinarySecureUrl` values. Storefront cards and
product galleries only treated `cloudinarySecureUrl` as usable live media, so products fell through
to temporary frontend fallback imagery.

For Vice Paddle, that fallback was the Aqua prototype paddle media in
`apps/web/src/lib/public-storefront-demo.ts`, which made Vice appear to use Aqua imagery even though
the reviewed Cloudinary media for Vice exists.

## Resolver behavior added

Storefront media now resolves in this order:

1. Use explicit `cloudinarySecureUrl` when present.
2. Use explicit `cloudinaryPublicId` when present.
3. Resolve stable product media keys like `<product-slug>-primary-01` to the public Cloudinary
   delivery path `tigerpingpong/products/<product-slug>/01-main`.
4. Fall back to temporary prototype/BigCommerce media only when no usable Cloudinary media URL can be
   resolved.

The public catalog API now includes `cloudinaryPublicId` in media responses. The frontend still
supports media-key resolution for current/older responses that only include `mediaKey`.

## Products checked

- `tiger-vice-paddle`: production API has `tiger-vice-paddle-primary-01` and blank
  `cloudinarySecureUrl`; resolver maps it to Vice Cloudinary media instead of Aqua fallback.
- `tiger-portland-outdoor-table`: production API has `tiger-portland-outdoor-table-primary-01` and
  blank `cloudinarySecureUrl`; resolver maps it to the Portland Cloudinary primary image.
- Public product list: all current public products inspected had primary media keys and blank secure
  URLs, so category/catalog cards should now prefer Cloudinary delivery URLs across the launch set.
- Products with no media row or no resolvable Cloudinary key still use the existing fallback or image
  pending state.

## Future admin/media mapping work

This PR does not build an admin media editor and does not repair production data. Future tools should:

- Surface products whose media rows have a key/public ID but blank `cloudinarySecureUrl`.
- Import or repair reviewed `cloudinaryPublicId` and `cloudinarySecureUrl` values from the approved
  Cloudinary manifest/source artifacts.
- Add and review full gallery media rows for products where the manifest has more images than the API
  currently exposes.
- Keep fallback media until deployed API/UI media is verified product by product.
