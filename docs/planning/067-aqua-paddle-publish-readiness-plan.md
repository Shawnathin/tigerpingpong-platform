# Aqua Paddle Publish Readiness Plan

Date: 2026-06-15
Branch: `codex/pr-067-aqua-paddle-publish-readiness-plan`
Status: Planning only. Do not publish Aqua products yet.

## Summary

PR 066 confirmed the Aqua paddle rows exist locally and in the live Render catalog database, but they are not public-ready. This plan narrows that investigation into the exact minimum data and media changes required before Aqua can safely appear in the storefront.

Do not publish these products until Shawn approves the catalog model, source URLs, public copy, and real mapped media. Do not loosen public or checkout eligibility rules globally.

## Evidence Checked

- Local import products: `data/import-review/tigerpingpong/v1/products_import_v1.csv`
- Local family/category rows: `product_families_import_v1.csv`, `categories_import_v1.csv`
- Local media rows: `product_media_import_v1.csv`
- Local review flags: `import_review_flags_v1.csv`
- Legacy normalized content: `data/product-content/tigerpingpong-product-content-normalized.json`
- Legacy scrape inventory: `data/legacy-website/tigerpingpong-legacy-inventory.json`
- Media review docs: `docs/media/043-cloudinary-upload-manifest-v1.json`, `docs/media/043-human-image-review-index-v1.md`
- Live Render public detail endpoints: `https://tigerpingpong-platform.onrender.com/catalog/products/<slug>`
- Live Render internal-including detail endpoints: `https://tigerpingpong-platform.onrender.com/catalog/products/<slug>?includeInternal=true&includeReplacementParts=true`
- Eligibility code: `apps/api/src/catalog/catalog.service.ts`, `apps/api/src/checkout/checkout.service.ts`, `apps/api/src/admin/admin.service.ts`

## Aqua Product Readiness Table

| Product | Current status flags | Category / family | Price | Current descriptions | Live media state | Readiness |
| --- | --- | --- | ---: | --- | --- | --- |
| `tiger-aqua-single-coral` | `status=draft`, `v1_public_navigation=true`, `v1_checkout_scope=false`, `purchase_mode=needs_manual_review`, `source_review_status=needs_review` | `paddles` / `aqua-paddles` | `$25.00 CAD`, SKU `15891` | Short: `Aqua single coral paddle candidate.` Description: `Aqua paddle product supplied by business catalog correction.` | Public detail 404. Internal detail returns `media: []`, `primaryMedia=null`, no variants, no content sections, no spec groups. | Not ready |
| `tiger-aqua-single-ocean-blue` | `status=draft`, `v1_public_navigation=true`, `v1_checkout_scope=false`, `purchase_mode=needs_manual_review`, `source_review_status=needs_review` | `paddles` / `aqua-paddles` | `$25.00 CAD`, SKU `15890` | Short: `Aqua single ocean blue paddle candidate.` Description: `Aqua paddle product supplied by business catalog correction.` | Public detail 404. Internal detail returns `media: []`, `primaryMedia=null`, no variants, no content sections, no spec groups. | Not ready |
| `tiger-aqua-outdoor-paddle-pack-4` | `status=draft`, `v1_public_navigation=true`, `v1_checkout_scope=false`, `purchase_mode=needs_manual_review`, `source_review_status=needs_review` | `paddles` / `aqua-paddles` | `$80.00 CAD`, SKU `15888` | Short: `Aqua outdoor paddle four-pack candidate.` Description: `Aqua paddle product supplied by business catalog correction.` | Public detail 404. Internal detail returns `media: []`, `primaryMedia=null`, no variants, no content sections, no spec groups. | Not ready |
| `tiger-aqua-outdoor-paddle-pack-2` | `status=draft`, `v1_public_navigation=true`, `v1_checkout_scope=false`, `purchase_mode=needs_manual_review`, `source_review_status=needs_review` | `paddles` / `aqua-paddles` | `$45.00 CAD`, SKU `15889` | Short: `Aqua outdoor paddle two-pack candidate.` Description: `Aqua paddle product supplied by business catalog correction.` | Public detail 404. Internal detail returns `media: []`, `primaryMedia=null`, no variants, no content sections, no spec groups. | Not ready |

Notes:

- The public API returning 404 is expected because public product filters require active storefront products. The local import rows are `draft`.
- The live API detail serializer does not expose `status`, so `status=draft` is from the local import source and PR 066 investigation, not from the public detail JSON.
- All four rows are assigned to the public/checkout-scoped `paddles` category, whose parent is `accessories`.

## Checkout Eligibility Blockers

Checkout eligibility is intentionally blocked by product data, not by missing global rules. The Aqua products currently fail these checks:

| Blocker | Current Aqua value | Required future value if checkout is approved |
| --- | --- | --- |
| Product active status | `draft` | `active` |
| Checkout scope | `v1_checkout_scope=false` | `v1_checkout_scope=true` |
| Purchase mode | `needs_manual_review` | `online_checkout_candidate` or `online_checkout` |
| Source review | `needs_review` | Approved/reviewed source status through the import path |
| Product media | no product media rows, no live media | At least one reviewed public Cloudinary media row per published product, with a primary image |
| Public copy | candidate placeholder copy | Human-approved public short description and description, or approved content sections |

The category and family are not current blockers: `paddles` is public and checkout-scoped, and `aqua-paddles` is active/public in the live internal detail response.

## Media Findings

Current reviewed import media CSV state:

- `product_media_import_v1.csv` has no rows for:
  - `tiger-aqua-single-coral`
  - `tiger-aqua-single-ocean-blue`
  - `tiger-aqua-outdoor-paddle-pack-4`
  - `tiger-aqua-outdoor-paddle-pack-2`

Possible source media evidence:

- Legacy normalized content says the old `Aqua Outdoor / Indoor Paddle` page had a 10-image gallery and main image alt text `Aqua Outdoor / Indoor Paddle`.
- `docs/media/043-cloudinary-upload-manifest-v1.json` lists `images/Paddles/141-Aqua Outdoor Indoor Paddle` with 10 images, `01-main.jpg`, product ID `141`, and SKU refs `141-SI`, `141-SI-1`, `141-2P`, `141-4P`.
- `docs/media/043-human-image-review-index-v1.md` marks that same folder as unmapped and not approved.
- Prototype Aqua images exist in the web app fallback/demo assets, but those are not reviewed product media and must not be used as publish evidence.

Cloudinary asset conclusion:

- Matching source assets likely exist as an unmapped Aqua source folder from PR 43 media work.
- No reviewed Cloudinary mapping currently exists for the four current Aqua product slugs.
- No committed Aqua product media row currently provides `cloudinary_secure_url` for any of the four products.
- A future publish PR must either map already-uploaded Cloudinary assets by exact public IDs/secure URLs or run an explicitly approved upload/mapping workflow. This PR must not run bulk media repair scripts.

## Minimum Required Changes Before Publishing

These are the minimum product data/media changes needed before any Aqua product should be public:

1. Approve the catalog model.
   - Either keep the four current standalone products, convert to one product with variants/options, or choose another explicit structure.
   - Do not publish until this is decided because the single legacy Aqua page does not map cleanly to the four current slugs.
2. Approve source URLs and legacy paths.
   - Current import rows use `/accessories/aqua-*` candidate paths.
   - Legacy source content uses `/paddles/aqua-outdoor-indoor-paddle`.
   - Redirect/canonical choices remain out of scope until URL structure is reviewed.
3. Approve public product copy.
   - Current import descriptions are placeholders and use `candidate` language.
   - Legacy content has usable-looking feature copy, but it is still flagged for human review and must not be blindly copied into four products.
4. Add reviewed media rows.
   - Add at least one primary media row per product that is being published.
   - Include a reviewed `cloudinary_public_id`, `cloudinary_secure_url`, alt text, title, role, sort order, and `is_primary=true`.
   - Verify that the selected image matches the exact product or option being sold.
5. Resolve review flags for the approved scope.
   - Source URL review for Aqua must move from open/needs review to approved/resolved through the import-review path.
   - Media review for Aqua must be resolved for the exact mapped assets.
6. Update product eligibility only after the above are true.
   - Set approved products to `status=active`.
   - Set `v1_checkout_scope=true` only if checkout is approved.
   - Set `purchase_mode=online_checkout_candidate` or `online_checkout`.
   - Keep unpublished Aqua products as draft/manual-review if only a subset is approved.
7. Re-import or apply data through the approved catalog path.
   - Do not add migrations for this data-only publish unless a separate schema change is explicitly approved.
   - Do not change checkout, payment, webhook, or order-truth code.

## Human Decisions Needed

| Decision | Why it matters | Current recommendation |
| --- | --- | --- |
| Four products vs one configurable Aqua product | Affects URLs, cart lines, media mapping, and future redirects. | Prefer four standalone products only if Shawn wants each SKU to have its own public page. Otherwise consider one Aqua product with options before publishing. |
| Approved public URLs | Current four `/accessories/aqua-*` paths are inferred candidates; the legacy content uses one `/paddles/aqua-outdoor-indoor-paddle` path. | Decide before any SEO, canonical, sitemap, robots, or redirect work. |
| Which media belongs to each SKU | The old folder has one 10-image gallery and old SKU refs, but the current catalog has four split products. | Human review should assign exact images to Coral single, Ocean Blue single, 2-pack, and 4-pack. |
| Public copy and claims | Existing import copy is placeholder/candidate; legacy copy includes claims and package details. | Approve copy product by product. Do not invent dimensions, warranty, durability, or shipping claims. |
| Checkout eligibility | Setting `v1_checkout_scope=true` and purchase mode to checkoutable makes the products sellable. | Approve only after real media and copy are in place. |
| Pack contents | Legacy specs mention 2-pack and 4-pack options with 3 balls, while single paddle rows do not include balls. | Confirm exact included items per SKU before public copy or media alt text references them. |

## Recommended Publish Sequence

1. Human review pass:
   - approve catalog model,
   - approve public URLs,
   - approve public copy,
   - assign exact media to each product or variant.
2. Media mapping PR:
   - add reviewed Aqua media rows only,
   - use real Cloudinary secure URLs,
   - keep products unpublished if copy/model is not approved yet.
3. Product data publish PR:
   - update only approved Aqua product rows,
   - resolve relevant review flags,
   - import/update live database through the existing approved path,
   - verify public API detail responses and storefront pages.
4. SEO/redirect PR:
   - only after URL structure is approved,
   - add redirects/canonicals/sitemap/robots changes if still needed.

## Future Publish PR Prompt

Use this prompt only after Shawn has approved the decisions above:

```text
Create PR 068: Publish Approved Aqua Paddle Products

Context:
PR 067 documented that Aqua products are present but unpublished because they are draft/manual-review, checkout-disabled, and have no reviewed public media. Shawn has now approved the Aqua catalog model, public URLs, public copy, and exact media assignments.

Goal:
Publish only the approved Aqua products without changing checkout/payment/webhook/order truth.

Approved products:
- <list exact approved slugs>

Approved model:
- <four standalone products OR one product with variants/options OR other approved structure>

Approved public URLs:
- <exact URL/slug decisions>

Approved media:
- <for each product/variant, exact Cloudinary public_id, secure_url, alt text, title, role, sort_order, is_primary>

Approved copy:
- <for each product, exact short_description, description, and any content sections/specs>

Required work:
1. Update only the approved Aqua import-review rows.
2. Add reviewed `product_media_import_v1.csv` rows for each approved published product/variant.
3. Resolve only the relevant Aqua source/media review flags.
4. Set publish/checkout fields only after media and copy are present:
   - `status=active`
   - `v1_checkout_scope=true`
   - `purchase_mode=online_checkout_candidate` or `online_checkout`
5. Re-run the existing import or approved data update path only as explicitly authorized.
6. Verify:
   - public API returns each published Aqua product,
   - unpublished Aqua products still 404,
   - product/category pages show real Cloudinary media,
   - add-to-cart works only for approved checkout-eligible Aqua products,
   - no fallback/prototype Aqua media is used as product truth.

Rules:
- Do not invent product facts.
- Do not publish products without real reviewed media.
- Do not loosen eligibility rules globally.
- Do not touch Stripe checkout/session/webhook/order truth.
- Do not add database migrations unless explicitly approved.
- Do not run bulk media repair scripts unless explicitly approved.
- Do not change unrelated product/category styling.

Validation:
- `git diff --check`
- relevant import validator command if import files change
- relevant API/web checks if live data is updated
- no full app build required for data/docs-only changes unless code changes are made
```

## Decision For PR 067

Do not publish Aqua in this PR. This PR only records the minimum readiness requirements and leaves storefront code, checkout/payment/webhook/order truth, database migrations, media scripts, product data, and live catalog state unchanged.
