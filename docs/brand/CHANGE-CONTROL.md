# Tiger Brand Change Control

Version: 2.2
Effective: 2026-07-23
Approver: Shawn Cleve

The brand system should evolve when Tiger learns something—not every time a contributor finds a different adjective.

## What requires owner approval

Only Shawn may lock or materially change:

- Brand purpose, positioning, promise, personality, or founding story.
- Product-name origins.
- Historical, event, client, partnership, manufacturing, or geographic claims.
- A product's reason to exist or approved story.
- Compatibility, warranty, origin, performance, durability, shipping, or service promises.
- A recurring signature line.
- Core colour, type, logo, photography, glass, or responsive design principles.
- Promotion of a story from `provisional` to `approved`.

Contributors may make small clarity corrections that do not change meaning, but must update the canonical source instead of creating a second version.

## Required change record

For every material brand decision, add an entry below and update the affected canonical files.

```md
## YYYY-MM-DD — <decision title>

Owner decision:
Reason:
Evidence or source:
Files updated:
Copy or claim replaced:
Follow-up:
```

Do not record speculative ideas as decisions. Put unresolved work under **Pending owner decisions**.

## Versioning

- Patch (`1.0.1`): clarification, typo, source refresh, no change of meaning.
- Minor (`1.1`): new approved product story, campaign territory, or reusable pattern within the existing brand.
- Major (`2.0`): changed positioning, origin narrative, brand promise, spelling, or visual identity.

Update version headers in every materially affected brand file. `docs/brand/README.md` carries the system-level version.

## Pending owner decisions

### Product discovery

Deeper individual product stories remain to be completed. Vice and ball stories are provisional. Aqua and Portland Outdoor still have factual questions listed in `docs/brand/FACTS-AND-CLAIMS.md` and `docs/planning/tiger-storytelling-content-map-v1.md`.

## Decision history

## 2026-07-23 — Clarify table contents and approve the accessory offer

Owner decision: Current Tiger PingPong tables do not include paddles or balls. When a table is added to the cart, offer one of three play sets—Aqua two paddles with three balls, Aqua four paddles with three balls, or four Vice paddles with six white balls—plus an independently optional compatible Tiger Table Cover. Each table quantity unlocks one play set and one compatible cover at 30% off; excess quantities remain at regular live price. Plaza Outdoor does not receive the cover offer.

Reason: A customer could not tell whether a table included paddles or balls. The purchase rail now needs to answer that question before add-to-cart, while the follow-up offer makes the missing gear easy to add without implying it is included.

Evidence or source: Shawn's explicit written direction and implementation approval on 2026-07-23. Existing owner-confirmed Aqua package contents and the sourced Plaza cover incompatibility remain controlling facts. Live catalog data remains price and availability truth.

Implementation footprint: Brand facts register, brand system version, Vice catalog package records, table purchasing rail and add-to-cart dialog, cart pricing, checkout/order snapshots, protected order presentation, and focused commerce tests across two sequential PRs.

Copy or claim replaced: The storefront previously left table package contents implicit. The new approved purchase-critical line is “Paddles and balls are sold separately.” The existing provisional Vice product story remains provisional.

Follow-up: Operations must provide the exact new Vice bundle SKU before its catalog record can be completed or written. Apply the reviewed catalog update and database migration in staging before any production promotion.

## 2026-07-21 — Approve Part 40 as Tiger's first online replacement part

Owner decision: Sell Tiger PingPong Part 40 from the dedicated Replacement Parts support hub. Customers use the approved selected Expo Indoor, Expo Outdoor, Portland Indoor, and Portland Outdoor compatibility list; anyone unsure sends photos before ordering. The current catalog seed is `$7 CAD`, with no fit selector or quantity discount. Future parts require their own approved catalog data, media, compatibility copy, and curated rank.

Reason: Part 40 is Tiger's most-requested quick fix. Selling the small clip directly is more useful than treating every part as an email-only request, while the support path remains available for uncertain fit and every unapproved part.

Evidence or source: Shawn's explicit written approval and corrections on 2026-07-21; reviewed legacy record for SKU `8123`, price, and selected-table compatibility; verified owner-provided Part 40 image. Live catalog remains price and availability truth.

Files updated: Facts register, brand system version, reviewed catalog CSVs, importer validation, dedicated Replacement Parts page, and focused commerce tests.

Copy or claim replaced: “Service path only. No public part catalog, inventory, price, or availability promise.” The new rule permits individually approved common parts on the dedicated hub; it does not publish the deferred replacement nets or a general parts catalogue.

Follow-up: Complete separately approved data and media review before adding another part. Keep table-first finding, diagrams, per-table pages, product-page manual links, and install guidance parked.

## 2026-07-20 — Correct the pre-Expo and first Expo chronology

Owner decision: The green skinny-leg table was Tiger's first table and came before Expo. The orange-legged table was the first Expo iteration—the point when the product began getting better. The early crew hauled bins of paddles and balls around Vancouver on the Expo Line; the first Expo then travelled to Chinatown nights, rainy street festivals, driveways, and packed rooms.

Reason: The version 1.0 narrative accidentally combined two different tables and compressed a meaningful part of Tiger's persistence into one chapter.

Evidence or source: Shawn's explicit correction on 2026-07-20 and owner-cleared photographs of the green table, early crew, orange first Expo, and rainy event setup.

Files updated: Facts register, Brand Bible, typed Tiger story, About page, About media manifest, and storytelling content map.

Copy or claim replaced: “Good energy. Questionable table.” as the complete origin chapter. It is replaced by distinct pre-Expo and first Expo chapters.

Follow-up: Preserve this two-step chronology in all future About excerpts and product-name stories.

## 2026-07-18 — Brand operating system version 1.0

Owner decision: Create a repository-level contract so every future Tiger task uses the established personality, story, visual system, product-story method, and factual boundaries.

Reason: The About, Contact, Homepage, Tables, table categories, and gear categories established a coherent identity that should not be rediscovered or redesigned route by route.

Evidence or source: Owner discovery and page-review decisions; merged storefront implementation; typed Tiger story source; official market and history research listed in `docs/brand/RESEARCH-SOURCES.md`.

Files updated: `AGENTS.md` and `docs/brand/`.

Copy or claim replaced: None. Version 1.0 consolidates and governs existing approved work.

Follow-up: Complete the individual product-story discovery passes.
