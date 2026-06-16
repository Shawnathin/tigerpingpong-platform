# PR 070: Product Page Audit - Tables vs Accessories

Date: 2026-06-16
Branch: `codex/pr-070-product-page-audit-tables-vs-accessories`
Status: Draft PR planning report

## Executive Summary

The current product detail page system is in a strong place structurally. The polished table PDPs use the shared product route well: top purchase area, Cloudinary-first media gallery, table-specific short display titles, required table colour selection, sourced story copy, curated feature moments, specs, comparison, shipping reassurance, and add-to-cart flow all live in one consistent storefront shell.

Accessory PDPs already inherit the same shell, which is useful, but they should not receive the full table treatment. The safest next PR should be a focused accessory polish pass that reuses the table PDP's purchase-panel discipline, media/gallery behavior, trust language, section spacing, and sourced-content filtering, while avoiding table-only feature carousels, table comparison, oversized storytelling, and heavyweight spec density.

The biggest accessory issue is not layout foundation. It is content/data quality. Several accessory pages contain thin import-era descriptions, repeated ball copy, uncertain compatibility language, missing dimensions/warranty/SEO descriptions, weak alt text, or variant/data questions. Product data should be clarified before making pages feel more finished than the facts support.

Replacement net products are not public PDPs in the deployed catalog today. The deployed API returns 404 for `tiger-table-net-replacement-set` and `tiger-replacement-net`, matching the V1 deferral posture. They should remain deferred unless Shawn explicitly asks to publish replacement parts.

## Evidence Reviewed

- Shared PDP route and helpers:
  - `apps/web/src/app/catalog/products/[slug]/page.tsx`
  - `apps/web/src/app/catalog/products/[slug]/ProductDetailSections.tsx`
  - `apps/web/src/app/catalog/products/[slug]/ProductMediaGallery.tsx`
  - `apps/web/src/app/catalog/products/[slug]/page.module.css`
  - `apps/web/src/lib/product-content.ts`
  - `apps/web/src/lib/product-media.ts`
- Source/import artifacts:
  - `data/product-content/tigerpingpong-product-content-normalized.json`
  - `data/import-review/tigerpingpong/v1/products_import_v1.csv`
  - `data/import-review/tigerpingpong/v1/product_media_import_v1.csv`
  - `data/import-review/tigerpingpong/v1/product_variants_import_v1.csv`
  - `data/import-review/tigerpingpong/v1/import_review_flags_v1.csv`
- Deployed catalog API check:
  - `https://tigerpingpong-platform.onrender.com/catalog/products`
  - sampled product detail endpoints for public accessories and deferred replacement nets
- Visual/mobile spot check:
  - deployed web PDPs at desktop and 390px mobile width

## What Is Working Well on Polished Table PDPs

- The table PDPs feel like intentional buying pages rather than raw catalog records.
- The shared hero gives buyers the key information in one place: image/gallery, visible product title, price, shipping reassurance, required option selector, and add-to-cart CTA.
- Table visible titles are shortened for humans where needed, while full product names remain available through product data and metadata.
- Cloudinary media is prioritized, with fallback media only used when needed.
- Required table colour selection is handled before add-to-cart, reducing mistaken table orders.
- The page uses curated table sections only where tables justify them: feature moments, everyday details, full specs, and table comparison.
- The table comparison section helps shoppers choose between similar high-ticket items without opening every PDP.
- Mobile does not show obvious horizontal overflow in sampled table/accessory PDPs.
- The add-to-cart logic remains connected to backend/catalog eligibility and does not change payment truth.

## Table PDP Patterns Worth Reusing for Accessories

- Keep the same top purchase area structure:
  - gallery
  - visible product title
  - price
  - sourced short summary
  - shipping reassurance
  - add-to-cart CTA
- Keep the Cloudinary-first gallery with accessible alt text and thumbnail controls.
- Keep concise quick facts, but tune them for small products.
- Keep sourced story/description sections where the copy is real and useful.
- Keep simple highlights as chips for accessory features.
- Keep practical notes for included items and compatibility.
- Keep specs, but cap them tightly and show only buyer-useful facts.
- Keep shorter visible titles where product names are long, while preserving full names in metadata/JSON-LD.
- Keep conservative sourced-content filtering so review notes, SKU artifacts, and unsafe shipping/warranty claims do not leak into public copy.
- Keep the current checkout eligibility checks and shipping-rule copy.

## Table PDP Patterns Not Worth Reusing for Accessories

- Do not add table comparison to accessories.
- Do not create table-style feature carousels for every accessory. A paddle or ball pack does not need five large feature moments unless the media/content truly supports it.
- Do not force a large "premium table" story arc onto low-cost products.
- Do not create dense technical specs when the source data only supports two or three useful facts.
- Do not make accessory pages visually louder than the purchase decision warrants.
- Do not invent feature visuals, compatibility, dimensions, performance claims, warranty promises, or shipping promises.
- Do not implement accessory variant-priced options in this pass.
- Do not publish Aqua products or replacement parts as part of accessory PDP polish.

## Public Accessory PDP Inventory

The deployed catalog currently returns these public non-table products:

| Product | Slug | Kind | Price | Public checkout | Media count observed |
| --- | --- | --- | ---: | --- | ---: |
| Table Tennis Net & Post Set | `tiger-net-post-set` | net | $59 CAD | Yes | 2 |
| Tiger PingPong Vice Ping Pong Paddle | `tiger-vice-paddle` | paddle | $50 CAD | Yes | 14 |
| Tiger PingPong Premium 3-Star Ping Pong Balls 140 Pack | `tiger-premium-balls-140` | ball | $96 CAD | Yes | 10 |
| Tiger PingPong Premium 3-Star Ping Pong Balls 6 Pack Orange | `tiger-premium-balls-6-orange` | ball | $8 CAD | Yes | 6 |
| Tiger PingPong Premium 3-Star Ping Pong Balls 6 Pack White | `tiger-premium-balls-6-white` | ball | $8 CAD | Yes | 2 |
| Tiger PingPong Protective Ping Pong Table Cover Black Polyester | `tiger-table-cover-black-polyester` | cover | $55 CAD | Yes | 3 |

Deferred / not public through the deployed product endpoint:

| Product | Slug | Current status |
| --- | --- | --- |
| Tiger PingPong Table Net Replacement Set | `tiger-table-net-replacement-set` | 404 through public product endpoint; import marks replacement part deferred |
| Replacement Net | `tiger-replacement-net` | 404 through public product endpoint; import marks replacement part deferred |

## Per-Product Accessory Audit Notes

### Vice Paddle

What works:
- Strong media depth, with 14 media records.
- The page has a complete purchase area, price, add-to-cart, short story, highlights, practical notes, and specs.
- The sourced content gives a clear buyer angle: entry-level paddle, slimmer handle, kids/everyday control.

Gaps:
- Normalized source says the legacy price was a range, while current catalog imports a single $50 CAD price. This is acceptable if business-corrected, but the discrepancy should stay visible in planning.
- Missing dimensions and warranty notes.
- Needs confirmation of SKU, warranty/dimensions, and whether any pack/option pricing from legacy should remain irrelevant.
- Page may be over-gallery-heavy for a small product; 14 thumbnails make the mobile hero tall before the CTA.

Recommendation:
- Keep the page simple. Use a concise buyer-facing title, one short paragraph, 3-4 highlights, practical notes, and a compact specs block.

### Premium 3-Star Balls - 6 Pack White

What works:
- Price and checkout eligibility are clear.
- Page has Cloudinary media and enough basic content to sell the product.
- Specs include useful basics such as ball size and quantity.

Gaps:
- Only 2 media records.
- Normalized content flags missing SEO description and warranty notes.
- Copy includes awkward phrasing like "White title / color option includes Orange and White," which feels like data normalization rather than customer copy.
- Needs decision on whether orange/white six-packs should remain separate PDPs or eventually become variants.
- ITTF/material/current ball-standard claims need confirmation before polish.

Recommendation:
- Clean copy and structure, but do not introduce a variant selector or merge products in the next PR.

### Premium 3-Star Balls - 6 Pack Orange

What works:
- Price and checkout eligibility are clear.
- More media depth than the white six-pack.
- Product name makes pack size and colour obvious.

Gaps:
- Missing SEO description and warranty notes.
- Needs confirmation of ITTF/material claims.
- Copy is likely duplicative with the white six-pack.
- Needs decision later on separate pages versus variants.

Recommendation:
- Use the same compact ball-page pattern as the white six-pack and keep the two pages consistent.

### Premium 3-Star Balls - 140 Pack

What works:
- Stronger media depth with 10 media records.
- Clear bulk-use product with $96 CAD price, under the free-shipping threshold.
- Product has active white/orange variant rows in data, though the PDP currently does not expose non-table checkout option selectors.

Gaps:
- Missing SEO description and warranty notes.
- Needs confirmation of SKU/material/ITTF claims.
- Option-level imagery/pricing remains unresolved. Do not implement variant-priced options yet.
- Current page can feel larger than the purchase decision because the shared hero plus 10 thumbnails creates a tall mobile intro.

Recommendation:
- Keep as a simple bulk ball PDP for now. If colour must be selected before purchase, that should be a separate future product-data/checkout-options task, not hidden inside visual polish.

### Table Cover

What works:
- Product purpose is clear.
- Price and checkout eligibility are clear.
- Media count is adequate for V1.
- Compatibility is the main buying question, and the current data already hints at it.

Gaps:
- Missing SEO description, dimensions, and warranty notes.
- Compatibility must be made precise before polish. Source/import notes say it is not compatible with the Tiger Plaza Table, while public copy also says it fits most ping pong tables.
- Material language needs confirmation: "black polyester," "Oxford outdoor fabric," and waterproof/moisture-resistant phrasing should be standardized.

Recommendation:
- Prioritize this page for copy/data cleanup because incorrect compatibility could cause returns. Use a compact compatibility block, not a table-style feature carousel.

### Net & Post Set

What works:
- Clear price and checkout eligibility.
- Product solves a concrete accessory need.
- Compatibility warning is important and already present in source-derived content.

Gaps:
- Missing SEO description, dimensions, and warranty notes.
- Needs brand/manufacturer confirmation.
- Needs clamp range or table-thickness compatibility if available.
- Current compatibility phrasing says it is not compatible with Tiger Expo, Portland, and Whistler tables. That is important enough to make prominent, but should be verified and written cleanly.

Recommendation:
- Prioritize compatibility clarity. This page should be short, practical, and warning-forward.

## Content and Media Gaps

- Missing accessory SEO descriptions:
  - `tiger-premium-balls-6-white`
  - `tiger-premium-balls-6-orange`
  - `tiger-premium-balls-140`
  - `tiger-table-cover-black-polyester`
  - `tiger-net-post-set`
- Missing dimensions:
  - `tiger-vice-paddle`
  - `tiger-table-cover-black-polyester`
  - `tiger-net-post-set`
  - deferred replacement nets if they are ever published
- Missing warranty notes:
  - all public accessory pages reviewed
- Compatibility needs review:
  - table cover
  - net/post set
  - deferred replacement nets if they are ever published
- Copy needs cleanup:
  - ball pages have repeated/performance copy and some normalization artifacts
  - net/post and cover pages need clearer compatibility language
  - Vice Paddle needs confirmation that current single-price catalog data is intentional
- Media quality/quantity:
  - 6-pack white balls and net/post set are media-light.
  - Vice Paddle and 140-pack balls may have more thumbnails than the mobile purchase flow needs.
  - Some observed alt text is weak, such as "Some orange balls."

## UX and Layout Risks

- On 390px mobile, sampled PDPs had no obvious horizontal overflow.
- The mobile hero stacks gallery before purchase panel. This makes the add-to-cart CTA fall below the first viewport for all sampled PDPs.
- Long accessory titles increase hero height and can make small products feel more cumbersome than necessary.
- Accessories inherit the same visual shell as table PDPs, which keeps consistency, but the page can feel too large when the product content is thin.
- Thumbnail-heavy accessories can create a long pre-purchase scroll on mobile.
- Table pages justify a large gallery and rich sections; lower-priced accessory pages generally need faster title-price-CTA access.
- The table comparison section correctly stays table-only.

## SEO and Title Handling Notes

- Metadata currently uses the full catalog product name as the page title, which preserves SEO/product specificity.
- JSON-LD uses the full product name, category, sourced short description when safe, images, brand, and offer price where available.
- Visible table titles use shorter human-facing labels through table-specific mapping.
- Accessory visible titles currently use full product names. Some are long but acceptable; future polish could add an accessory display-title map while leaving metadata and JSON-LD full names intact.
- Several accessory normalized content records lack SEO descriptions. The current metadata fallback can still produce descriptions from product data, but product-specific sourced meta descriptions would be better.
- Do not implement sitemap, robots, canonicals, redirects, or domain decisions in the accessory polish PR.

## Recommended Accessory PDP Design Direction

Use a "compact accessory PDP" direction:

- Keep the shared PDP route.
- Preserve full metadata/JSON-LD product names.
- Add optional human-facing display labels for public accessory titles where names are long.
- Keep the hero and glass/card language visually consistent with table pages, but reduce perceived weight for accessories.
- Keep gallery, but consider a smaller mobile media footprint for non-table products in a future code PR.
- Use 3-4 quick facts per accessory:
  - product type
  - use case
  - quantity/colour where relevant
  - included item or compatibility warning
- Use one short product story paragraph.
- Use simple highlight chips, capped at 4.
- Use practical notes for included items and compatibility.
- Use specs only when facts are sourced and useful.
- Make compatibility warnings more prominent for cover and net/post set.
- Do not add new checkout behavior beyond safe presentation improvements.
- Do not publish deferred replacement parts.
- Do not implement accessory variants or variant-priced options without a separate data/checkout decision.

## Safest Future Implementation Approach

Recommended next PR scope:

1. Make accessory PDP polish data-driven and conservative.
2. Add accessory-specific display title/heading helpers if needed.
3. Clean public-facing accessory copy using existing sourced normalized content only.
4. Improve section headings and filtering for accessories so import/review artifacts do not leak.
5. Add compatibility-focused presentation for cover and net/post set.
6. Keep current checkout eligibility, totals, shipping copy, cart behavior, Stripe behavior, product data, migrations, and media mappings unchanged.
7. Run `pnpm lint`, `pnpm typecheck`, and a production-style web build if code changes are made.

## Exact Future Codex Implementation Prompt

```text
Create PR 071: Accessory PDP Polish V1

Context:
PR 070 audited the current product page system and found that the shared PDP route is strong, but accessory PDPs need a compact, content-safe polish rather than the full table PDP treatment.

Goal:
Polish the public accessory product detail pages while preserving checkout/payment/order truth and without changing product data, media mappings, database schema, or SEO infrastructure.

Public accessory PDPs to polish:
- /catalog/products/tiger-vice-paddle
- /catalog/products/tiger-premium-balls-6-white
- /catalog/products/tiger-premium-balls-6-orange
- /catalog/products/tiger-premium-balls-140
- /catalog/products/tiger-table-cover-black-polyester
- /catalog/products/tiger-net-post-set

Do not publish or expose:
- Aqua products
- tiger-table-net-replacement-set
- tiger-replacement-net
- replacement parts

Implementation direction:
- Reuse the shared PDP route and existing design language.
- Keep full product names in metadata and JSON-LD.
- Add optional shorter human-facing visible titles for accessories only where useful.
- Keep accessory PDPs compact: gallery, title, price, short sourced summary, shipping reassurance, add-to-cart, quick facts, one story block, highlight chips, practical notes, and compact specs.
- Do not add table comparison or table-style feature carousels to accessories.
- Do not invent descriptions, dimensions, materials, compatibility, warranty, shipping, ITTF, or performance claims.
- Filter or rewrite only from existing sourced facts so import/review artifacts do not appear as customer-facing copy.
- Make table cover compatibility and net/post compatibility clearer and more prominent, using only existing sourced facts.
- Keep current checkout eligibility checks and cart behavior.
- Do not implement variant-priced options or new option selectors for accessories in this PR.
- Do not alter cart totals, checkout/session/webhook/order truth, Stripe behavior, database/migrations, Cloudinary mappings, sitemap, robots, canonicals, redirects, DNS, or analytics.

Validation:
- pnpm lint
- pnpm typecheck
- NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build
- Browser check desktop and 390px mobile for the six accessory PDPs.

Open as draft PR.

Suggested branch:
codex/pr-071-accessory-pdp-polish-v1

Suggested PR title:
feat: polish accessory product detail pages
```

