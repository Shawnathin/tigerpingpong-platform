# 043 - Cloudinary Product Media Import Map V1

## Summary

Task 043 adds a controlled Cloudinary upload workflow for the local
`images/` product library, documents the image/catalog mapping, and keeps the
public site on the safe order of Cloudinary media first, fallback media second,
placeholder last.

The raw `images/` directory is a local import source only. It is ignored by Git
and is not included in this branch. The safe mapping output is preserved in the
generated manifest at `docs/media/043-cloudinary-upload-manifest-v1.json`.

PR 42 was confirmed merged before this branch started:
`https://github.com/Shawnathin/tigerpingpong-platform/pull/42`, merged into
`main` on 2026-06-12.

No checkout, cart, Stripe, webhook, order, admin auth, DNS, domain, or database
migration changes were made.

## Image Directory Findings

`images/` contains 25 product folders under four top-level groups:

| Group | Product folders |
| --- | ---: |
| Accessories | 18 |
| Paddles | 1 |
| Replacement Parts | 1 |
| Tables | 5 |

File inventory:

| Type | Count |
| --- | ---: |
| `.jpg` | 175 |
| `.png` | 9 |
| `.json` | 50 |
| Total | 234 |

Image inventory:

| Finding | Result |
| --- | --- |
| Supported image files | 184 |
| Unsupported file types | 0 |
| Duplicate image file hashes | 0 |
| Product folders with `images.json` | 25 |
| Product folders with `variants.json` | 25 |
| Product folders with exactly one `*-main` image | 25 |
| Ambiguous folders | 0 |

Each product folder includes:

- local product images named with ordered numeric prefixes;
- `images.json`, shaped like BigCommerce image records with `product_id`,
  `is_thumbnail`, `sort_order`, descriptions, and source URLs;
- `variants.json`, shaped like BigCommerce variant/SKU records.

The safest local display order is:

1. the single `*-main` file as the product primary/hero image;
2. all remaining numbered image files in folder order as gallery images.

This is safer than relying only on legacy `sort_order` because several
BigCommerce thumbnail records do not appear first in `sort_order`, while the
local file names clearly mark the intended main image.

## Products Mapped For Upload

The dry-run plan maps 11 current checkout-enabled catalog products and 69
image files.

| Product slug | Images | Primary local file |
| --- | ---: | --- |
| `tiger-vice-paddle` | 14 | `08-main.jpg` |
| `tiger-premium-balls-6-white` | 2 | `02-main.jpg` |
| `tiger-premium-balls-140` | 10 | `09-main.jpg` |
| `tiger-net-post-set` | 2 | `01-main.png` |
| `tiger-premium-balls-6-orange` | 6 | `01-main.jpg` |
| `tiger-table-cover-black-polyester` | 3 | `03-main.jpg` |
| `tiger-portland-outdoor-table` | 8 | `04-main.jpg` |
| `tiger-expo-outdoor-table` | 7 | `05-main.jpg` |
| `tiger-portland-indoor-table` | 7 | `04-main.jpg` |
| `tiger-whistler-indoor-table` | 5 | `04-main.jpg` |
| `tiger-plaza-outdoor-table-grey` | 5 | `03-main.jpg` |

All checkout-enabled products currently have a mapped primary image in the dry
run.

## Deferred Mapped Images

Two folders map to existing deferred replacement-part catalog products and are
skipped by default:

| Folder | Product slug | Reason |
| --- | --- | --- |
| `images/Accessories/129-Replacement Net` | `tiger-replacement-net` | Draft replacement part, not public or checkout-enabled |
| `images/Accessories/136-Tiger PingPong Table Net Replacement Set` | `tiger-table-net-replacement-set` | Draft replacement part, not public or checkout-enabled |

They can be included later with the script's `--include-deferred` flag, but
they should stay out of public v1 checkout unless a separate catalog decision
enables them.

## Unmapped Images

Twelve folders do not map to current catalog product keys through the reviewed
media CSV and are skipped:

- `images/Accessories/118-Tiger PingPong Action Ping Pong Paddle`
- `images/Accessories/119-Tiger PingPong Caspa Ping Pong Paddle`
- `images/Accessories/120-Tiger PingPong Elite Ping Pong Paddle`
- `images/Accessories/121-Tiger PingPong Sniper Ping Pong Paddle`
- `images/Accessories/123-Tiger PingPong Viper Ping Pong Paddle`
- `images/Accessories/124-Zuma`
- `images/Accessories/127-Tiger PingPong - Ping Pong Paddle Case`
- `images/Accessories/130-Newgy Table Tennis Balls 144 Balls Orange`
- `images/Accessories/139-Caspa 2 Pack & 6 Balls`
- `images/Paddles/141-Aqua Outdoor Indoor Paddle`
- `images/Replacement Parts/137-Tiger PingPong Replacement Part #40`
- `images/Tables/113-Tiger PingPong Expo Indoor Ping Pong Table Grey, Green or Blue`

Notable reasons:

- several legacy paddle/accessory products were removed from current v1 import
  scope;
- Expo Indoor was removed from the current catalog;
- Aqua products exist as draft/manual-review catalog rows, but the local
  `141-Aqua Outdoor Indoor Paddle` source folder does not map cleanly to the
  four current Aqua product slugs/SKUs;
- Replacement Part #40 is not present in the current reviewed catalog import.

## Current Media And Catalog Flow

Current source of catalog truth:

- reviewed CSVs live under `data/import-review/tigerpingpong/v1/`;
- `product_media_import_v1.csv` stores product media planning fields including
  `cloudinary_public_id` and `cloudinary_secure_url`;
- Prisma already has `ProductMedia` fields for Cloudinary asset id, public id,
  secure URL, resource type, format, dimensions, bytes, media role, primary
  flag, and review status.

Current API flow:

- `packages/db/scripts/import-tiger-dev-catalog.mjs` imports reviewed CSVs into
  the dev catalog database;
- `apps/api/src/catalog/catalog.service.ts` reads active product media;
- catalog listing responses expose `primaryMedia.cloudinarySecureUrl`;
- product detail responses expose ordered `media[]` items.

Current frontend flow:

- `apps/web/src/app/catalog/page.tsx` uses API
  `primaryMedia.cloudinarySecureUrl` for cards and hero media first;
- if API Cloudinary media is absent, catalog cards use
  `getPrimaryProductMediaFallback`;
- fallback media lives in `apps/web/src/lib/public-storefront-demo.ts` and
  includes BigCommerce CDN/prototype media;
- product detail pages now filter to catalog media rows that actually have
  `cloudinarySecureUrl`; if none exist, they use fallback media; if fallback is
  also absent, they render the existing placeholder.

Cloudinary config before this task:

- no Cloudinary app dependency was present;
- `.env.example` did not include Cloudinary variables;
- no local Cloudinary credentials were present in the current shell.

Cloudinary config after this task:

- `.env.example` documents empty `CLOUDINARY_CLOUD_NAME`,
  `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` placeholders;
- secrets are not committed.

## Cloudinary Upload Convention

The 043 convention is:

```text
tigerpingpong/products/<product-slug>/<order>-<role>
```

Examples:

```text
tigerpingpong/products/tiger-expo-outdoor-table/01-main
tigerpingpong/products/tiger-expo-outdoor-table/02-gallery
tigerpingpong/products/tiger-vice-paddle/01-main
```

Rules:

- product slug folders are used for every mapped catalog product;
- first upload item is always the local `*-main` image and becomes `01-main`;
- remaining images become ordered `NN-gallery` assets;
- public IDs are deterministic and stable across reruns;
- upload commit mode uses `overwrite=false`;
- real upload requires explicit `--commit`;
- unmapped and deferred folders are listed in the manifest and skipped by
  default.

## Upload Workflow

New script:

```text
scripts/upload-product-media-to-cloudinary.mjs
```

Root command:

```text
pnpm media:cloudinary:products
```

Dry run is the default. Real upload requires:

```text
pnpm media:cloudinary:products -- --commit
```

Commit mode requires:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

`CLOUDINARY_URL` is also supported by the script, but the explicit three
variable form is documented in `.env.example`.

Commit mode refuses to run when:

- Cloudinary credentials are missing;
- duplicate image files exist;
- unsupported files exist;
- ambiguous folders exist;
- checkout-enabled products lack mapped primary images.

Manifest path:

```text
docs/media/043-cloudinary-upload-manifest-v1.json
```

The manifest is safe to commit because it contains local source paths,
catalog slugs, planned Cloudinary public IDs, image role/order, skipped folder
summaries, and dry-run upload status only. It does not contain raw image
binaries or Cloudinary credentials.

Dry-run manifest result:

| Field | Result |
| --- | ---: |
| Product folders found | 25 |
| Image files found | 184 |
| Products planned | 11 |
| Files planned | 69 |
| Deferred mapped folders skipped | 2 |
| Unmapped folders skipped | 12 |
| Ambiguous folders | 0 |
| Checkout-enabled products missing mapped images | 0 |
| Uploaded | 0 |

Real upload was not performed because Cloudinary credentials are not available
in the current shell.

## Site Mapping Decision

Smallest safe mapping path:

1. Keep `product_media_import_v1.csv` as the reviewed source mapping surface.
2. Let the upload script generate reviewed Cloudinary public IDs and a manifest.
3. After real upload and human media review, populate
   `cloudinary_secure_url` in the reviewed media import source or import from
   the reviewed manifest.
4. The dev import now respects nonblank Cloudinary secure URLs and marks those
   rows public/approved.
5. The existing API/frontend path then serves Cloudinary media first, with the
   frontend fallback layer still available.

No new schema or migration was needed.

## Validation

Validation commands completed:

- `pnpm lint` passed.
- `pnpm typecheck` passed on rerun. The first attempt hit a transient
  `spawn sh EAGAIN` process issue before TypeScript diagnostics ran.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`
  passed on rerun. The first attempt hit a transient
  `fork: Resource temporarily unavailable` issue during `nest build`.
- `git diff --check` passed.
- `DATABASE_URL=postgresql://dev-placeholder.invalid/tigerpingpong_platform_dev pnpm import:tiger:dev -- --confirm-dev-import --dry-run`
  passed.

Dry-run upload validation completed:

```text
node scripts/upload-product-media-to-cloudinary.mjs
```

Result: clean dry run, manifest written, no upload performed.

## Remaining Risks

- Human image review is still required before real upload.
- The Aqua source folder is not safely mapped to current Aqua draft product
  slugs/SKUs.
- The unmapped legacy folders may need future catalog decisions before upload.
- The reviewed media CSV still needs secure URLs populated after a real upload.
- The live database must be re-imported or updated after reviewed Cloudinary
  URLs are approved.
