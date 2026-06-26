# TigerPingPong Media Mapping QA Report

Date: 2026-06-18
Branch: `codex/media-cloudinary-app-mapping`
Status: Completed for imported ProductMedia/gallery/card media

## Build

- Build passed successfully on this branch, per Shawn's handoff before this QA pass.

## Ingestion path confirmed

- The running app/API does not read `data/import-review/tigerpingpong/v1/product_media_import_v1.csv` directly.
- The CSV is an import source for `packages/db/scripts/import-tiger-dev-catalog.mjs` and `packages/db/scripts/import-tiger-deployed-catalog.mjs`.
- Those scripts read `data/import-review/tigerpingpong/v1/product_media_import_v1.csv`, upsert `ProductMedia` rows through Prisma, and the Nest catalog API reads those `ProductMedia` rows from the database.
- The web app fetches catalog data from the API through `apps/web/src/lib/catalog-api.ts` and resolves product images through `apps/web/src/lib/product-media.ts`.

## Import command

Local validation setup used:

```bash
brew install postgresql@16
/opt/homebrew/Cellar/postgresql@16/16.14/bin/initdb -D var/postgres-validation --auth=trust --username=postgres
/opt/homebrew/Cellar/postgresql@16/16.14/bin/pg_ctl -D var/postgres-validation -o "-p 5432" -l var/postgres-validation.log start
/opt/homebrew/Cellar/postgresql@16/16.14/bin/createdb -h localhost -p 5432 -U postgres tigerpingpong_validation
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm --filter @tigerpingpong/db exec prisma migrate deploy --schema prisma/schema.prisma
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm import:tiger:dev -- --confirm-dev-import
```

Final import result after the Portland Outdoor media fix:

- brands: 1
- categories: 9
- product families: 10
- products: 18
- product variants: 19
- option/value/link records touched: 54
- product media: 49
- redirects: 30
- import review flags: 14

## Production/deploy pickup

- Production will not automatically pick up this CSV change from a web/API deploy alone.
- A deployed database import step is required after review, using the deployed import runbook/command for the intended target.
- The relevant deployed command shape is:

```bash
DATABASE_URL="postgresql://..." pnpm import:tiger:deployed -- --confirm-deployed-import --target=staging --write
```

or, when approved for production:

```bash
DATABASE_URL="postgresql://..." pnpm import:tiger:deployed -- --confirm-deployed-import --target=production --write
```

## Local runtime used for QA

- API: `http://localhost:3001`, backed by `postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation`
- Web: `http://localhost:3002`, with `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`
- `localhost:3000` was already occupied by a different Next app, so TigerPingPong web used port `3002`.

## Products visually checked

All requested PDPs loaded from the local imported database with no visible broken images, no visible local file paths, and ProductMedia gallery/card media resolving to Cloudinary.

- Expo Outdoor: pass. Correct table media, Cloudinary gallery, no broken images.
- Portland Indoor: pass. Correct table media, Cloudinary gallery, no broken images.
- Portland Outdoor: pass after fix. Correct table media, Cloudinary gallery, no broken images.
- Whistler Indoor: pass. Correct table media, Cloudinary gallery, no broken images.
- Plaza Outdoor: pass. Correct table media, Cloudinary gallery, no broken images.
- Vice Paddle: pass. Existing Cloudinary primary retained; uploaded Cloudinary gallery images visible.
- Aqua Paddle: pass. Correct paddle media, Cloudinary gallery, no broken images.
- Covers: pass. Correct cover media, Cloudinary primary/gallery, no broken images.
- Net/Post Set: pass. Correct net/post media, Cloudinary primary, no broken images.

Browser DOM QA summary:

- Product pages checked: 9
- Product pages with broken visible images: 0
- Product pages with visible local image paths: 0
- ProductMedia gallery/card images with missing Cloudinary URLs: 0

## Category/listing pages visually checked

All requested category/listing pages loaded from the local imported database with no visible broken images and no visible local file paths.

- Tables: pass. Hero/card media uses corrected Portland Outdoor table primary plus mapped table product media.
- Indoor tables: pass. Hero/card media uses Portland Indoor and Whistler mapped table media.
- Outdoor tables: pass. Hero/card media uses corrected Portland Outdoor table primary plus mapped outdoor table media.
- Paddles: pass. Hero/card media uses existing Vice primary and mapped Aqua primary.
- Accessories: pass. Hero/card media uses existing Vice primary plus mapped net, cover, and existing ball Cloudinary media.

Browser DOM QA summary:

- Category/listing pages checked: 5
- Category/listing pages with broken visible images: 0
- Category/listing pages with visible local image paths: 0
- Category/listing card images with missing Cloudinary URLs: 0

## Issues found

- Fixed: the uploaded Portland Outdoor `primary` asset was an orange ball image, which was the wrong product for table hero/card/PDP primary use.
- Remaining debt: Portland Outdoor and Plaza PDP detail-section imagery still includes legacy BigCommerce CDN images from hardcoded product detail content, outside the imported `ProductMedia` gallery/card path. These were not broken and were not changed because UI/content-section architecture is frozen for this pass.

## Fixes applied

- Promoted the uploaded Portland Outdoor grey table gallery asset `tigerpingpong/recovered/products/portland-outdoor/tpp-portland-outdoor-gallery-02` to the Portland Outdoor primary ProductMedia row.
- Removed the duplicate Portland Outdoor gallery row for that promoted image.
- Left the bad uploaded Portland Outdoor primary ball asset intentionally unmapped.
- Rebuilt and reimported the local validation database after the CSV fix.
- Regenerated visual contact sheets:
  - `exports/tpp-cloudinary-upload-prep/qa/media-product-gallery-contact-sheet.png`
  - `exports/tpp-cloudinary-upload-prep/qa/media-category-card-contact-sheet.png`

## Remaining media debt

- Deployed staging/production database import still needs to run after review; deploy alone will not ingest the CSV.
- Decide later whether standalone category upload assets need a new category media mapping system; this remains intentionally out of scope.
- Vice Paddle still uses the existing Cloudinary primary because this upload manifest did not include a new approved Vice primary.
- Ball product pages still use the earlier product-level Cloudinary mappings because this upload manifest only included category-level ball assets.
- Portland Outdoor and Plaza detail sections still include legacy BigCommerce CDN images outside the ProductMedia import path.

## PR-ready

Yes, for the scoped media mapping PR.

Rationale: local DB import now succeeds, the app/API consumed the imported ProductMedia rows, requested PDP and category/listing pages were visually checked, the one wrong-product media defect found during QA was fixed, and no UI/layout/component behavior was changed.
