# App Media Mapping Import Plan

Date: 2026-06-24
Branch: `codex/media-cloudinary-app-mapping`

## Executive Summary

The committed Cloudinary upload-prep evidence is enough to plan the next app media step, but it should not trigger a direct import yet.

The current app media path is:

1. reviewed CSV import data under `data/import-review/tigerpingpong/v1/`
2. Prisma `ProductMedia` rows in the database
3. Nest catalog API responses
4. Next.js product/category views resolving Cloudinary URLs

The safest next implementation task is a dry-run media mapping validator/report. It should read the committed evidence and the current `product_media_import_v1.csv`, then report whether the mapped media rows are consistent with the reviewed evidence before any CSV edit, app change, or database import.

Do not run Cloudinary uploads, database imports, or app behavior changes from this plan alone.

## Current App/Media Architecture Observed

- `packages/db/prisma/schema.prisma` defines `ProductMedia` with `mediaKey`, product/variant relations, `role`, Cloudinary public ID and secure URL fields, dimensions, source traceability fields, alt/title/caption, sort order, primary/public/active flags, and review status.
- `data/import-review/tigerpingpong/v1/product_media_import_v1.csv` is the reviewed import source for product media rows.
- `packages/db/scripts/import-tiger-dev-catalog.mjs` and `packages/db/scripts/import-tiger-deployed-catalog.mjs` read the product media CSV and upsert `ProductMedia` records through Prisma.
- The import scripts set `isPublic` and `reviewStatus` from whether `cloudinary_secure_url` is present. Rows with a secure URL become public/approved; source-only rows remain needs-review.
- `apps/api/src/catalog/catalog.service.ts` reads active product media from the database and exposes public media only when `isPublic` is true for non-internal requests.
- `apps/web/src/lib/catalog-api.ts` fetches catalog data from the API. The web app does not read the CSV directly.
- `apps/web/src/lib/product-media.ts` resolves media by using `cloudinarySecureUrl` first, then `cloudinaryPublicId`, then a media-key-derived fallback.
- `apps/web/src/app/category-pages.ts` currently drives category hero images through product `heroImageSlug` values. There is no standalone category media import/config target in the current app structure.

Root-level `prisma/` does not exist; the schema lives under `packages/db/prisma/schema.prisma`.

## Evidence Files Reviewed

- `docs/media/cloudinary-upload-prep/README.md`
- `docs/media/cloudinary-upload-prep/media-scripts.md`
- `docs/media/cloudinary-upload-prep/qa/upload-prep-review-sheet.md`
- `docs/media/cloudinary-upload-prep/reports/app-media-mapping-report.md`
- `docs/media/cloudinary-upload-prep/reports/cloudinary-upload-results.md`
- `docs/media/cloudinary-upload-prep/reports/do-not-upload.md`
- `docs/media/cloudinary-upload-prep/reports/media-mapping-qa-report.md`
- `docs/media/cloudinary-upload-prep/reports/needs-shawn-review.md`
- `docs/media/cloudinary-upload-prep/reports/upload-prep-summary.md`
- `docs/media/cloudinary-upload-prep/reports/upload-readiness-by-target.md`

## Confirmed Cloudinary/Media Facts

- The upload-prep pack reviewed 73 assets.
- The prep stage itself did not upload to Cloudinary.
- Evidence records 50 `upload_ready` assets and 5 `upload_ready_best_available` assets.
- Evidence records 18 assets needing Shawn review.
- Evidence records 0 assets classified as do-not-upload.
- The committed upload-results report records 55 uploaded Cloudinary assets and 0 failed uploads.
- The committed evidence includes public Cloudinary delivery URLs only; generated JSON/CSV upload-result manifests with Cloudinary result fields remain local and ignored.
- No bulk image folders or generated export outputs are committed in docs.
- No committed script in `scripts/media/` uploads to Cloudinary; the live upload script remains local-only and uncommitted.

## Product/Media Mapping Targets Identified

| Product key                         | Evidence-backed target                                  | Planning status                                     |
| ----------------------------------- | ------------------------------------------------------- | --------------------------------------------------- |
| `tiger-aqua-outdoor-indoor-paddle`  | 1 primary, 5 gallery                                    | Ready candidate                                     |
| `tiger-expo-outdoor-table`          | 1 primary, 5 gallery                                    | Ready candidate, primary is best-available          |
| `tiger-net-post-set`                | 1 primary                                               | Ready candidate                                     |
| `tiger-plaza-outdoor-table-grey`    | 1 primary, 5 gallery                                    | Ready candidate, primary is best-available          |
| `tiger-portland-indoor-table`       | 1 primary, 5 gallery                                    | Ready candidate, primary is best-available          |
| `tiger-portland-outdoor-table`      | 1 primary, 4 gallery using corrected promoted primary   | Ready candidate with explicit wrong-asset exclusion |
| `tiger-table-cover-black-polyester` | 1 primary, 1 gallery                                    | Ready candidate                                     |
| `tiger-vice-paddle`                 | Existing primary retained, 5 uploaded gallery images    | Gallery-ready only; new primary needs Shawn review  |
| `tiger-whistler-indoor-table`       | 1 primary, 5 gallery                                    | Ready candidate, primary is best-available          |
| Ball products                       | Existing earlier Cloudinary product media only          | Do not map new reviewed-upload assets yet           |
| Replacement nets/parts              | Existing source-only or deferred replacement-part media | Do not map new reviewed-upload assets yet           |
| Category/hero assets                | 11 uploaded category assets                             | Do not wire until category media target is designed |

## Products/Assets That Appear Ready

The following assets appear ready as product media candidates if a validator confirms the CSV rows match the evidence:

- Aqua Paddle: primary and five gallery assets are `upload_ready` and `launch_ready`.
- Expo Outdoor: primary is `upload_ready_best_available`; gallery assets are `upload_ready`.
- Portland Indoor: primary is `upload_ready_best_available`; gallery assets are `upload_ready`.
- Portland Outdoor: use the promoted `tpp-portland-outdoor-gallery-02` asset as primary, with gallery assets that remain after avoiding duplication.
- Whistler Indoor: primary is `upload_ready_best_available`; gallery assets are `upload_ready`.
- Plaza Outdoor: primary is `upload_ready_best_available`; gallery assets are `upload_ready`.
- Covers: primary and one gallery asset are `upload_ready`.
- Net/post set: primary asset is `upload_ready`.
- Vice Paddle: uploaded gallery assets are `upload_ready`; keep the existing primary for now.

Best-available table primary images are acceptable planning candidates only because the evidence explicitly marks them as best-available V1 launch assets. They should remain visible as future replacement debt.

## Products/Assets Needing Shawn Review

Do not map these without a separate review/approval task:

- Vice Paddle new primary: background removal was attempted but not accepted.
- Ball product primary and gallery candidates: background removal was attempted but not accepted.
- Replacement nets/parts primary: below launch threshold and replacement parts are deferred from V1 public navigation.
- Category gallery/card assets for tables, indoor tables, outdoor tables, balls, and accessories that are below hero thresholds.
- Indoor tables category primary: marked best-available but not hero-ready.
- Any generated CSV/JSON upload-result manifests that include Cloudinary result fields such as signatures or upload-result metadata.

## Do-Not-Upload / Do-Not-Use Assets

- No assets were classified as do-not-upload in the committed report.
- Do not use the uploaded Portland Outdoor `tpp-portland-outdoor-primary-01` as product media; QA evidence says it is an orange ball image, not Portland Outdoor table media.
- Do not use needs-Shawn-review assets in product media rows until Shawn approves them.
- Do not wire standalone category Cloudinary assets into product media rows.
- Do not commit or import generated export folders, upload-ready folders, local galleries, contact sheets, or raw/bulk media.
- Do not run or preserve the live Cloudinary upload script without a separate Shawn-approved live-upload hardening task.

## Gaps, Risks, And Assumptions

- The evidence says previous local QA imported and visually checked the mapped ProductMedia rows, but this planning task did not run imports, builds, or browser QA.
- The current tracked `product_media_import_v1.csv` already contains mapped Cloudinary rows that appear to match the preserved evidence. Treat that as a candidate mapping set until a validator proves it row-by-row.
- Production and staging will not pick up CSV media changes from deploy alone. A deliberate database import step is required later.
- Category assets are useful evidence but have no current app import target. Adding category media would require a separate app/data design task.
- Best-available table primary images are lower-confidence than preferred assets and should be replaced when stronger approved sources exist.
- Portland Outdoor and Plaza detail-section imagery may still include legacy BigCommerce CDN images outside the `ProductMedia` import path.
- The import scripts do not currently import Cloudinary asset IDs from the CSV; they import public IDs and secure URLs.
- A validator should avoid relying on ignored local export manifests unless a future task explicitly selects and reviews them.

## Recommended Import/Mapping Approach

1. Create a dry-run media mapping validator/report before any import or mapping edit.
2. Validate the current `product_media_import_v1.csv` against the committed Markdown evidence and app constraints.
3. Require the validator to flag:
   - product keys that do not exist in the import catalog
   - duplicate `media_key` or Cloudinary public ID values
   - more than one primary media row per product
   - missing Cloudinary secure URLs for rows intended to be public
   - any `needs_shawn_review` or do-not-use asset included in mapped product rows
   - any standalone category asset inserted into product media
   - the bad Portland Outdoor uploaded primary asset
   - best-available primary rows, as warnings rather than failures
   - source-only replacement-part rows, as deferred/non-public review rows
4. After the validator passes, make any necessary CSV mapping edits in a separate focused task.
5. Run local validation import only after the mapping data is reviewed.
6. Run app/API visual QA only after a local import proves the database state.
7. Consider deployed staging/production import only after review, validation, and explicit approval for that target.

## Required Safety Gates Before Any Real Import/Change

- No Cloudinary upload or delete action.
- No use of Cloudinary credentials.
- No execution of `scripts/media/upload_tpp_cloudinary_approved.mjs`.
- No database import until validator output is reviewed.
- No staging or production import without an explicit selected task and target approval.
- No app runtime behavior change until the data import path is proven sufficient.
- No catalog/product copy, price, option, shipping, payment, Stripe, webhook, DNS, SEO, schema, migration, env, deployment, or dependency change.
- No committed generated export output or bulk media.
- Preserve fallback media until deployed API/UI Cloudinary media is verified.
- Record any best-available primary-image exceptions in the report output.

## First Executable Implementation Task Card Recommendation

Task name: `Create dry-run Cloudinary media mapping validator`

Goal: Add a read-only validator/report that checks the current product media import CSV against committed Cloudinary upload-prep evidence and app media constraints, without editing data, importing to a database, uploading, or changing app behavior.

Scope:

- Read `data/import-review/tigerpingpong/v1/product_media_import_v1.csv`.
- Read only committed docs evidence under `docs/media/cloudinary-upload-prep/`.
- Verify product/media rows for ready candidate products.
- Flag needs-review, bad Portland primary, category-only assets, duplicate primary rows, missing URLs, and best-available warnings.
- Emit a human-readable report to docs or stdout.
- Update workflow docs and commit the validator/report only if validation passes.

Out of scope:

- No CSV mutation.
- No database import.
- No Cloudinary API calls.
- No upload script changes.
- No app/runtime changes.

Recommended next task: create the dry-run Cloudinary media mapping validator/report.
