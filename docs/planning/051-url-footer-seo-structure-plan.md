# 051 URL Structure + Footer SEO Plan

## Purpose

This planning document decides the future URL, header navigation, footer navigation, and SEO redirect direction before implementation. It is intended to give Shawn a clear review surface for canonical paths, header links, footer links, redirect strategy, and launch SEO sequencing before any app routes, redirects, sitemap, robots, or canonical tags are changed.

## Current state

The current new site uses routes like:

- `/catalog`
- `/catalog/products/<slug>`
- `/shipping`
- `/contact`
- `/cart`
- `/admin`

The current public TigerPingPong.ca site has SEO-value paths that should be preserved or one-hop redirected where practical. Those old paths likely carry search value, backlinks, user familiarity, and crawl history, so URL decisions should be made before custom-domain cutover and before footer navigation is finalized.

## Preserve-first recommendation

Preserve these paths where practical:

- `/`
- `/tables/`
- `/tables/indoor-tables/`
- `/tables/outdoor-tables/`
- `/accessories/`
- `/accessories/paddles/`
- `/accessories/ping-pong-balls/`
- `/accessories/covers/`
- `/accessories/nets/`
- `/resources/`
- `/resources/choose-a-ping-pong-table`
- `/resources/ping-pong-rules`
- `/resources/room-size`
- `/resources/indoor-vs-outdoor-ping-pong-tables`
- `/about`
- `/contact`
- `/shipping-returns`

Known product URL preservation recommendation:

- Keep current table product paths under `/tables/`.
- Keep current accessory product paths under `/accessories/`.
- Redirect `/paddles/aqua-outdoor-indoor-paddle` to `/accessories/aqua-outdoor-indoor-paddle` unless Shawn chooses exact preservation.
- Preserve `/replacement-parts/tiger-pingpong-replacement-part-40` and consider adding `/replacement-parts/`.

## Decision table

| Area | Current old URL | Proposed new canonical URL | Recommendation | Decision needed from Shawn | Notes |
| --- | --- | --- | --- | --- | --- |
| Home | `/` | `/` | Preserve directly. | Confirm canonical domain and trailing slash convention. | Home should remain the primary storefront entry point. |
| Tables category | `/tables/` | `/tables/` | Preserve directly where practical. | Confirm whether this becomes a category landing page. | Stronger than moving to `/catalog?category=tables` for SEO and footer clarity. |
| Indoor tables | `/tables/indoor-tables/` | `/tables/indoor-tables/` | Preserve directly where practical. | Confirm page content and product filtering behavior. | Useful landing page for high-intent shoppers. |
| Outdoor tables | `/tables/outdoor-tables/` | `/tables/outdoor-tables/` | Preserve directly where practical. | Confirm page content and product filtering behavior. | Keep separate from indoor tables for search and customer clarity. |
| Accessories category | `/accessories/` | `/accessories/` | Preserve directly where practical. | Confirm whether this becomes a category landing page. | Footer should link here if live and useful at launch. |
| Paddles category | `/accessories/paddles/` | `/accessories/paddles/` | Preserve directly where practical. | Confirm whether enough product/content exists for launch. | Avoid dead or thin footer links. |
| Balls category | `/accessories/ping-pong-balls/` | `/accessories/ping-pong-balls/` | Preserve directly where practical. | Confirm product availability and naming. | Footer label can be "Balls" while URL remains descriptive. |
| Covers category | `/accessories/covers/` | `/accessories/covers/` | Preserve directly where practical. | Confirm whether covers are launch-ready. | Keep out of footer if the page is not ready. |
| Nets category | `/accessories/nets/` | `/accessories/nets/` | Preserve directly where practical. | Confirm whether nets are launch-ready. | Keep out of footer if the page is not ready. |
| Table products | Current table product paths under `/tables/` | Current product paths under `/tables/` | Preserve old product paths where practical. | Decide whether product detail URLs stay category-based or move under `/catalog/products`. | Preserving reduces redirect risk and keeps legacy search equity closer to existing URLs. |
| Accessory products | Current accessory product paths under `/accessories/` | Current product paths under `/accessories/` | Preserve old product paths where practical. | Decide whether product detail URLs stay category-based or move under `/catalog/products`. | If the app keeps internal catalog routes, old public paths can become aliases or canonical product routes. |
| Aqua paddle | `/paddles/aqua-outdoor-indoor-paddle` | `/accessories/aqua-outdoor-indoor-paddle` | Redirect old paddle path unless exact preservation is preferred. | Choose exact preservation or accessory-path redirect. | A one-hop 301 is acceptable if the new accessory URL is preferred. |
| Replacement part product | `/replacement-parts/tiger-pingpong-replacement-part-40` | `/replacement-parts/tiger-pingpong-replacement-part-40` | Preserve directly. | Confirm whether replacement parts are public at launch. | Consider adding a replacement parts category page. |
| Replacement parts category | Not confirmed | `/replacement-parts/` | Add if replacement parts are public and useful. | Decide whether to add this category page. | Footer link should only appear if the page exists and is useful. |
| Resources hub | `/resources/` | `/resources/` | Preserve directly if resource content will be live. | Confirm launch resource scope. | Resources can support SEO and buyer education without crowding product pages. |
| Choose guide | `/resources/choose-a-ping-pong-table` | `/resources/choose-a-ping-pong-table` | Preserve directly. | Confirm content accuracy before launch. | Do not invent unsupported buying claims. |
| Rules guide | `/resources/ping-pong-rules` | `/resources/ping-pong-rules` | Preserve directly. | Confirm whether rules content is launch-ready. | Good resource footer candidate if content exists. |
| Room size guide | `/resources/room-size` | `/resources/room-size` | Preserve directly. | Confirm content accuracy before launch. | Useful for table buyers and pre-purchase confidence. |
| Indoor vs outdoor guide | `/resources/indoor-vs-outdoor-ping-pong-tables` | `/resources/indoor-vs-outdoor-ping-pong-tables` | Preserve directly. | Confirm content accuracy before launch. | Supports indoor/outdoor category decisions. |
| About | `/about` | `/about` | Preserve directly. | Confirm final about-page content. | Footer Company section can include this once live. |
| Contact | `/contact` | `/contact` | Preserve directly. | Confirm final support/contact copy. | Already exists on the new site. |
| Shipping and returns | `/shipping-returns` | `/shipping-returns` | Prefer this as the customer-facing canonical support URL. | Decide whether current `/shipping` redirects to `/shipping-returns` or remains separate. | Keep shipping copy aligned with the V1 Canada shipping rule. |
| Current new shipping page | `/shipping` | `/shipping-returns` or `/shipping` | Decide after support-page scope is clear. | Choose canonical support URL. | Do not implement until approved. |
| Brand page | `/tiger-pingpong/` | `/tiger-pingpong/` or `/brands/tiger-pingpong/` | Decide deliberately before routing. | Choose whether the brand path stays root-level or moves under `/brands/`. | If a brand page is thin, it may be deferred from footer. |
| Warranty | Not confirmed | `/warranty` | Add only if real policy content is ready. | Decide whether to create this page for launch. | Do not invent warranty terms. |
| Assembly instructions | Not confirmed | `/assembly-instructions` | Add only if real assembly content is ready. | Decide whether to create this page for launch. | Could become high-value support content. |
| FAQ | Not confirmed | `/faq` | Add only if real support answers are ready. | Decide whether to create this page for launch. | Avoid placeholder FAQ pages. |
| Privacy policy | Not confirmed | `/privacy-policy` | Add before launch if legally required/available. | Confirm final policy content and URL. | Legal footer should not link to placeholders. |
| Terms and conditions | Not confirmed | `/terms-and-conditions` | Add before launch if legally required/available. | Confirm final terms content and URL. | Legal footer should not link to placeholders. |
| Tracking parameters | URLs with `srsltid` or campaign parameters | Clean canonical URL without tracking parameters | Strip or ignore for canonicalization after canonical strategy is approved. | Decide query parameter policy. | Do not implement canonical handling yet. |

## Header navigation direction

Decision: header navigation should stay commercial and simple. It should prioritize traffic, SEO preservation, and sales clarity over Shawn's visual preference for filling space.

Logo:

- Logo links to homepage.

Main header links:

- Tables
- Paddles
- Balls
- Accessories
- Resources
- Contact
- Cart/icon as utility

Dropdowns:

- Tables may have a simple dropdown: All Tables, Indoor Tables, Outdoor Tables.
- Accessories may have a simple dropdown: All Accessories, Covers, Nets, Replacement Parts.

Rules:

- Do not put Shipping & Returns in the main header.
- Shipping & Returns belongs in the footer, product-page trust messaging, cart, and checkout support areas.
- Header links should stay customer-shopping oriented, not operational or legal.
- No admin/internal links.
- No dead placeholder links.
- Header links must match final URL decisions.

## Footer menu proposal

Decision: footer should contain the full support/legal/resource/shop structure. Footer links must only point to real launch pages or approved planned pages.

Shop:

- Tables
- Indoor Tables
- Outdoor Tables
- Paddles
- Balls
- Covers
- Nets
- Accessories
- Replacement Parts

Support:

- Shipping & Returns
- Contact
- Warranty
- Assembly Instructions
- FAQ

Resources:

- Choose a Ping Pong Table
- Ping Pong Rules
- Room Size Guide
- Indoor vs Outdoor Tables

Company:

- About
- Contact
- Dealer / Trade Support

Legal:

- Privacy Policy
- Terms & Conditions
- Refund / Returns Policy if separate

Rules:

- No admin/internal links.
- No dead placeholder links.
- Footer links must match final URL decisions.
- No SEO-spam link stuffing.
- Footer should contain the full support/legal/resource/shop structure.
- Footer links must only point to real launch pages or approved planned pages.

## Open decisions for Shawn

1. Canonical domain: `tigerpingpong.ca` vs `www.tigerpingpong.ca`.
2. Whether to preserve current category paths directly or redirect from old to new.
3. Whether product URLs should keep current old paths or move under `/catalog/products`.
4. Whether `/shipping` should become `/shipping-returns` or redirect to it.
5. Whether to keep `/tiger-pingpong/` or move to `/brands/tiger-pingpong/`.
6. Whether to add `/replacement-parts/`.
7. Whether to add `/warranty`, `/assembly-instructions`, `/faq`, `/privacy-policy`, `/terms-and-conditions`.
8. Trailing slash convention.
9. Query parameter policy for `srsltid` and tracking parameters.
10. What gets included in footer for launch.
11. Which approved planned pages can appear in footer before launch content is complete.

## Implementation phases after approval

Phase 1: decide canonical paths, header links, and footer links.

Phase 2: implement route aliases/category pages/resource pages as needed.

Phase 3: implement one-hop 301 redirect map.

Phase 4: implement sitemap/robots/canonical/schema.

Phase 5: crawl and smoke test before domain cutover.

## Explicit non-goals

- No implementation in this PR.
- No DNS cutover.
- No sitemap/robots/canonical changes yet.
- No payment/checkout changes.
- No database migration.
- No shipment automation.
