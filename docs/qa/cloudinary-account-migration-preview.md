# Cloudinary account migration: local preview evidence

Date: 2026-10-02. Status: **owner approved production cutover; PDF delivery now verified**.
PDF follow-up: after Shawn reported enabling PDF/ZIP delivery, all five public
originals and all five attachment URLs returned HTTP 200; all five downloaded
SHA-256 hashes matched. The original PDF blocker is resolved by delivery evidence.
The agent did not change Cloudinary settings.

Branch: `codex/cloudinary-account-migration-preview`, based on current `develop`
`470084557323b3fe6e373bcdc22dfc6abfad5d77`. Local preview: `http://127.0.0.1:4170`.

## Copy evidence

The owner approved the initial 114 assets, then the exact additional 46 images
on 2026-10-02 at 21:33:23 UTC: **160 Tiger assets** from `djfcisldm` to `scp4c76g`.
Authenticated account pings succeeded. Exact-ID source/destination preflight
found all originals and zero destination conflicts. All 160 uploaded with
`overwrite=false`: 155 images and five raw PDF manuals, totaling 87,190,164 bytes.
Required public IDs, delivery/resource types, raw extensions, image dimensions,
formats, tags/context and display names match destination metadata. No source
asset was deleted or altered. PaddleBuddy `svl1myo8` is excluded.

All 155 image-original SHA-256 hashes match the source backup. All 158 observed
image delivery URLs return 200 and decode, including dynamic product-detail
URLs and background-removal delivery. This is exact-original fidelity and
delivery proof; it does not claim every possible transformation variant was tested.
One original is HEIC: its bytes/hash and container signature verify, and its
browser-ready transformed delivery decodes. Original HEIC pixel decoding was not
performed by the bitmap verifier.

Five PDF originals and attachment downloads return 401 (`deny or ACL failure`).
Their destination resource records exist with matching bytes/public IDs. A read-only
authenticated `GET /asset/download` for each exact asset ID returned PDF bytes with
all five SHA-256 hashes matching their source backups. **All 160 asset originals
are content-verified**, but public PDF delivery and attachment behavior remain
blocked. Signed download URLs and credentials were never printed or saved.
Cloudinary documents PDF delivery blocking on Free accounts and the product
environment Security option **Allow delivery of PDF and ZIP files**:
[official delivery documentation](https://cloudinary.com/documentation/image_delivery_options).
That is a likely explanation, not a claim that the account toggle was inspected.
Read-only `GET /config?settings=true` succeeded, reporting dynamic folder mode,
but it does not expose the PDF delivery setting. The exact policy cause remains
unconfirmed; asset-copy approval does not authorize changing settings.
No security/access setting was changed. An authorized owner must inspect the
`scp4c76g` delivery policy before a separately authorized setting change. Recheck
public PDF downloads and attachment names after policy correction and cached-error expiry.

## Inventory correction and remaining scope

The first 114-asset inventory missed 46 additional assets from imported runtime
manifests. A path-resolution filter dropped imports when `/tmp` resolved to
`/private/tmp`. The corrected inventory verifies all 46 exact source IDs and
45,783,609 source bytes. These are about/home/category/Aqua-story images and
additional gallery references. The owner subsequently approved their exact scope;
all 46 copied without conflicts and passed destination-original hash, metadata
and delivery checks. Total currently proven runtime scope is 160 assets. A fresh
audit of 11 runtime-imported JSON files finds no remaining legacy delivery URLs
outside source/provenance fields. No newly necessary Tiger asset was identified.
This remains source-backed runtime scope, not a complete hidden/draft CMS inventory.

## Preview implementation

`data/media/cloudinary-account-migration-v1.json` records only public destination
IDs, versions, delivery URLs and non-secret original metadata for the copied assets.
Static delivery maps/fallbacks and reviewed import rows use actual destination
versions. The web catalog boundary bridges legacy database delivery URLs only for
those copied IDs, without writing back to the production database. Dynamic detail
URLs retain their transforms and receive the destination version. Unknown assets,
source provenance fields, PaddleBuddy, prices, availability and variant bindings
are preserved. Next image remote patterns add the destination and keep the old
cloud during overlap.

During preview preparation, no production env, code, database, DNS, Render deployment, checkout/webhook,
staff-auth or email behavior was changed. Upload credentials were used only by
the local copier, never supplied to the isolated preview or committed.

## Local checks

- Prisma generation, lint, monorepo typecheck and production build passed.
- All 234 unit tests passed, including five new scoped-mapping cases.
- Read-only Chromium preview: 44 route/viewport checks at 1280px and 390px,
  zero broken images, zero image HTTP failures, zero page exceptions and zero
  horizontal overflow. Six expected 404 checks correspond to three replacement
  products deliberately served through `/replacement-parts`, matching the existing
  `isReplacementPartsProduct` route guard; no unexpected HTTP failures.
- PaddleBuddy images/video continue using `svl1myo8`.
- Desktop/mobile screenshots captured for home, Expo, replacement parts and
  PaddleBuddy. Home desktop and Expo mobile were visually inspected.
- Tracked-source secret scan passed with zero findings.

Browser evidence is local under `exports/cloudinary-migration-preview/`.
Copy preflight/results, original backup and destination verification are preserved
in the calling task workspace, outside the application repository. At the end of preview preparation, this candidate
had not been pushed, merged or deployed. Full hosted CI, WebKit/tablet checks,
payment tests and production DB/env changes were not run; no payment tests are
needed to justify media-only preview.

## Rollback and go/no-go

Keep the previous production commit/Render release and old `djfcisldm` delivery
configuration available. This candidate performs no DB writes, so rejecting or
rolling back its web release restores existing media behavior. Do not remove old
Next allowlist patterns or revoke old access until the full media scope and PDFs
verify. Shawn explicitly approved production cutover with the five public PDF 401
failures accepted, saying he will fix them afterward. This authorizes the normal
task -> develop -> main promotion and deployment; it does not authorize account
security changes, database writes or deletion. Record deployed SHA/rollback evidence
and truthfully retain PDF delivery failures in the receipt. No deletion is included.
