# 043 - Cloudinary Product Media Import Map V1 QA

## Checklist

- [x] PR 42 confirmed merged before starting.
- [x] Work started from latest `main`.
- [x] Dry-run upload plan reviewed.
- [x] Cloudinary credentials not committed.
- [x] Raw `images/` directory ignored and not committed.
- [x] Cloudinary folder/public ID convention documented.
- [x] Upload manifest generated.
- [x] Every checkout-enabled product has primary media in the dry-run plan.
- [x] Fallback media still works when Cloudinary media is missing.
- [x] `pnpm lint` passed.
- [x] `pnpm typecheck` passed.
- [x] Production-style `pnpm build` passed with Render API base URL.
- [x] `git diff --check` passed.
- [x] Dev catalog import dry run passed.
- [x] No checkout/cart/payment/webhook changes.
- [x] No domain changes.
- [x] No admin/internal auth changes.
- [x] Catalog media mapping has real primary Cloudinary URLs after upload.
- [x] Product detail media path uses Cloudinary media before fallback media.
- [ ] Wrong-image spot check completed by human reviewer.
- [x] Programmatic slug/public ID mapping check passed.
- [x] Real Cloudinary upload completed with approved local credentials.

## Dry-Run Result

Command:

```text
pnpm media:cloudinary:products
```

Equivalent direct Node command:

```text
node scripts/upload-product-media-to-cloudinary.mjs
```

Real upload command, once credentials are present:

```text
pnpm media:cloudinary:products --commit
```

Result:

- 11 current checkout-enabled catalog products planned.
- 69 files planned for upload.
- 0 duplicate image files.
- 0 unsupported file types.
- 0 ambiguous folders.
- 0 checkout-enabled products missing mapped primary images.
- 2 deferred replacement-part folders skipped.
- 12 unmapped legacy/source folders skipped.
- Manifest written to `docs/media/043-cloudinary-upload-manifest-v1.json`.

## Upload Result

Real upload completed with approved local Cloudinary credentials. Credentials
were not printed, staged, or committed.

- 69 files uploaded.
- 0 skipped existing.
- 0 failed.
- 69 real `https://res.cloudinary.com/...` secure URLs written to the
  manifest.
- 11 primary reviewed media CSV rows populated with Cloudinary public IDs and
  secure URLs.
- 69 uploaded URLs verified as image responses.
- 0 manifest slug/public ID mapping issues.

## Media Mapping Spot Checks

Uploaded primary image mappings:

| Product slug | Primary public ID |
| --- | --- |
| `tiger-expo-outdoor-table` | `tigerpingpong/products/tiger-expo-outdoor-table/01-main` |
| `tiger-portland-indoor-table` | `tigerpingpong/products/tiger-portland-indoor-table/01-main` |
| `tiger-portland-outdoor-table` | `tigerpingpong/products/tiger-portland-outdoor-table/01-main` |
| `tiger-whistler-indoor-table` | `tigerpingpong/products/tiger-whistler-indoor-table/01-main` |
| `tiger-plaza-outdoor-table-grey` | `tigerpingpong/products/tiger-plaza-outdoor-table-grey/01-main` |
| `tiger-vice-paddle` | `tigerpingpong/products/tiger-vice-paddle/01-main` |
| `tiger-table-cover-black-polyester` | `tigerpingpong/products/tiger-table-cover-black-polyester/01-main` |
| `tiger-premium-balls-140` | `tigerpingpong/products/tiger-premium-balls-140/01-main` |
| `tiger-premium-balls-6-orange` | `tigerpingpong/products/tiger-premium-balls-6-orange/01-main` |
| `tiger-premium-balls-6-white` | `tigerpingpong/products/tiger-premium-balls-6-white/01-main` |
| `tiger-net-post-set` | `tigerpingpong/products/tiger-net-post-set/01-main` |

## Final Validation

Final command results:

- `pnpm lint`: passed.
- `pnpm typecheck`: passed on rerun after an initial transient
  `spawn sh EAGAIN` process failure.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`:
  passed on rerun after an initial transient `fork: Resource temporarily
  unavailable` process failure.
- `git diff --check`: passed.
- `DATABASE_URL=postgresql://dev-placeholder.invalid/tigerpingpong_platform_dev pnpm import:tiger:dev -- --confirm-dev-import --dry-run`:
  passed.
