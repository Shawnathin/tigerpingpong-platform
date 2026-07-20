# Table Gallery Restoration Media Audit V1

Date: 2026-07-19

Branch: `codex/table-gallery-variant-restoration`

Status: Local implementation verified; production catalog apply intentionally pending owner approval.

## Scope

The tracked manifest at `data/media/table-product-gallery-manifest-v1.json` is the source of truth for 21 approved gallery assignments across Expo Outdoor, Portland Indoor, Portland Outdoor, Whistler Indoor, and Plaza Outdoor.

| Product          | Assets | Initial lead | Public choices |
| ---------------- | -----: | ------------ | -------------- |
| Expo Outdoor     |      3 | Blue         | Blue, Grey     |
| Portland Indoor  |      3 | Green        | Green, Grey    |
| Portland Outdoor |      9 | Blue         | Blue, Grey     |
| Whistler Indoor  |      3 | Blue         | Blue, Green    |
| Plaza Outdoor    |      3 | Grey         | Grey           |

## Source and quality findings

- Expo, Portland Indoor, Whistler, and Plaza use recovered 1600–5000-pixel sources for their product and supporting views.
- Obsolete Expo Green/Black media and exact/near duplicates were excluded.
- Portland Outdoor preserves the current approved V2 model and gallery order. No asset from the obsolete local `Portland Outdoor v1` folder is present.
- Three exact current-model Portland supporting images remain at their best available 800–1000-pixel source resolution. They are recorded as explicit quality exceptions and are never upscaled or substituted with the wrong model.
- Ten genuinely missing assets were uploaded under deterministic IDs. Existing Cloudinary assets were reused rather than duplicated.
- All 21 delivery URLs returned successfully during verification.

## Safety controls

- Upload is dry-run by default, hash-verifies sources, refuses public-ID collisions, and requires `--commit`.
- Catalog repair is dry-run by default, resolves only existing products and variants, snapshots the current table media, and requires explicit `--apply` plus database credentials.
- Apply is transactional. Rollback restores the snapshot and retires newly created mapping rows without deleting database history or Cloudinary assets.
- No production catalog write has been performed.

## Delivery contract

- Responsive Cloudinary URLs use `f_auto`, `q_auto`, `c_limit`, and 480/800/1200/1600-pixel widths.
- Gallery canvases are white and use contained product imagery.
- Before colour selection, the full curated gallery is shown in manifest order.
- After selection, the matching colour media and shared media remain; exclusive media for another colour leaves the gallery.
- A missing colour image falls back to shared media without breaking the page.

## Verification

- Manifest validation: 5 products, 21 assets, zero errors.
- Cloudinary delivery verification: 21 of 21 URLs successful.
- Visual evidence: ignored `exports/table-gallery-qa/playwright/` desktop and mobile viewport/full-page captures.
- Regression evidence: 41 unit tests and 60 active browser tests pass in the full launch preflight; 11 screenshot-only jobs are intentionally skipped after separate evidence capture.
- Production state: unchanged pending owner approval and an explicit catalog apply.
