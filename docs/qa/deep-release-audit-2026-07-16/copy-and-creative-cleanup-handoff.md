# Storefront Copy and Creative Cleanup Handoff

Date: 2026-07-16
Status: removal-only public cleanup completed; product copy, policies, and media remain deferred

## Cleanup implementation status

Completed in the admin-recovery/removal-only cleanup:

- Removed active Make shipment-email runtime, API, UI, environment, and response-contract dependencies; manual shipment records remain.
- Removed modal add-on recommendations and the duplicate “Review cart” action.
- Removed the duplicate Shipping footer link while keeping `/shipping` reachable.
- Removed the internal “Customer copy” shipping block, duplicate purchase-panel availability/handling copy, inaccurate threshold wording, and unconfirmed handling-time claim.
- Removed the audited public marketing/platform filler outside product descriptions, policy drafts, resource article bodies, admin operations, and required error/recovery text.

Deferred deliberately:

- Product descriptions, product-story/detail sections, specifications, comparison data, warranties, catalog content, and product media remain for human review.
- Privacy, Terms, and Returns drafts remain unchanged until owner approval.
- Public checkout-status privacy, checkout abuse controls, webhook persistence, and all external Plan B gates remain separate tasks.
- The three dormant shipment-notification database columns remain until the database owner verifies migration state, creates a backup, and approves a new forward cleanup migration.

## Purpose

Use this file to run a focused human copy and creative pass before launch. The current storefront contains public owner-review markers, developer/architecture language, repetitive AI-sounding marketing phrases, duplicate promises, and source/fallback imagery that does not yet feel like a finished retail brand.

This is an inventory, not approved replacement copy. The follow-up task must preserve sourced product facts and the locked checkout/payment behavior. It must not invent warranties, availability, shipping speed, product performance, return rights, business history, certifications, or legal identity.

## Highest-priority public copy to remove or approve

| Priority    | Location                                                    | Current language or pattern                                                                                             | Why it needs attention                                                                       | Follow-up direction                                                                                                                           |
| ----------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Launch stop | `apps/web/src/app/privacy-policy/page.tsx:18,85`            | “Privacy policy — owner review draft”; “This draft must be approved by the business owner before launch.”               | Internal review instructions are visible to customers.                                       | Obtain owner/legal review, revise as needed, remove every draft marker, and record approval.                                                  |
| Launch stop | `apps/web/src/app/terms-and-conditions/page.tsx:18,86`      | “Terms & conditions — owner review draft”; “This draft must be approved by the business owner before launch.”           | Same public draft problem.                                                                   | Same approval and cleanup gate.                                                                                                               |
| Launch stop | `apps/web/src/app/returns-policy/page.tsx:18,83`            | “Returns policy — owner review draft”; “This draft must be approved by the business owner before launch.”               | Same public draft problem; returns decisions are still deliberately unresolved.              | Owner must decide the actual policy before this can read as final customer copy.                                                              |
| Launch stop | `apps/web/src/app/shipping/page.tsx:55-62`                  | “Customer copy”; “What shoppers see on product pages”; “this storefront pass”                                           | This is an internal QA/reference page written as if it were customer-facing.                 | Decide whether `/shipping` is public. If public, rewrite it entirely as a concise shipping policy; otherwise remove it from public discovery. |
| Must fix    | `apps/web/src/app/catalog/products/[slug]/page.tsx:640`     | “Free Canada-wide shipping over $100. $15 flat-rate below.”                                                             | “Below” is inaccurate: exactly $100 is also $15.                                             | Use the exact approved rule: over $100 is free; $100 or under is $15.                                                                         |
| Must fix    | `apps/web/src/app/catalog/products/[slug]/page.tsx:934-937` | “Contact support to confirm current availability,” followed by another handling/availability sentence for many products | Repeats itself and tells customers to confirm availability while leaving Add to Cart active. | First decide the availability promise. Then show one short, specific message aligned with whether checkout is actually allowed.               |
| Must fix    | `apps/web/src/app/page.tsx:83`                              | “Vancouver-based and serving players across Canada for nearly 20 years.”                                                | Material business-history claim requires a source/owner confirmation.                        | Verify and retain with approved wording, or remove.                                                                                           |
| Must fix    | `apps/web/src/app/page.tsx:90-93`                           | “Built to support play”; “Clear product pages, real support, and product-specific warranty details.”                    | Generic AI cadence; “real support” is awkward; warranty availability varies.                 | Replace with a concrete, verified differentiator or remove this promise tile.                                                                 |

## Developer and payment-system language leaking into customer copy

These phrases explain implementation details rather than helping a shopper complete a purchase. Keep the safety behavior; simplify the customer language.

| Location                                             | Current language                                                                                                     | Cleanup note                                                                                                                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/app/cart/CartPageClient.tsx:76-78`     | “then return here before Stripe Checkout”                                                                            | Say what the customer should do, not which vendor screen comes next.                                                                                                   |
| `apps/web/src/app/cart/CartPageClient.tsx:93-97`     | “Stripe Checkout handles payment after the backend re-checks products, totals, and shipping.”                        | Sounds like a technical test note. A short “Secure checkout” or totals-review statement is enough after factual approval.                                              |
| `apps/web/src/app/cart/CartPageClient.tsx:190`       | “Opening Stripe Checkout...”                                                                                         | Vendor naming is not necessarily wrong, but “Opening secure checkout…” is clearer and less implementation-heavy.                                                       |
| `apps/web/src/app/cart/CartPageClient.tsx:199-201`   | “Payment is confirmed only after the backend receives Stripe webhook confirmation.”                                  | Important invariant expressed as developer language. Replace with a customer status promise such as waiting for confirmed payment, while preserving the code behavior. |
| `apps/web/src/app/checkout/success/page.tsx:232-259` | “Checkout status”; “A Stripe success redirect is only a redirect”; “Redirect result”; “Payment truth”; “Status note” | This is operational/debug copy on a customer receipt/status page. Keep truthful pending/paid states, but remove architecture vocabulary.                               |
| `apps/web/src/app/checkout/success/page.tsx:293-297` | “Stripe session reference” plus full session ID                                                                      | Technical identifier and privacy minimization concern. Do not show it by default; the public order reference should be enough for support.                             |
| `apps/web/src/app/checkout/cancel/page.tsx:27-46`    | Repeated canceled/no-confirmation wording; “Redirect result”; “No payment confirmation happens on this page.”        | Too defensive and repetitive. One clear cancellation sentence plus recovery actions is sufficient.                                                                     |
| `apps/web/src/app/about/page.tsx:29-35`              | “Category pages use live catalog data…”; “Orders are confirmed through the backend after Stripe payment events.”     | Internal implementation description, not a brand story. Replace with verified business/customer value.                                                                 |
| `apps/web/src/app/catalog/page.tsx:341,347`          | “TigerPingPong.ca catalog”; “live product availability, shipping terms, and secure checkout”                         | “Live” may overstate inventory truth; “catalog” and “secure checkout” are generic system labels.                                                                       |
| `apps/web/src/app/privacy-policy/page.tsx:38-51`     | Repeated hosted Stripe/hosting/data/media provider explanation                                                       | Provider disclosure belongs in an approved policy, but current wording reads mechanically and needs legal/owner review.                                                |

The exact phrase “Stripe-ready payment” was not found in the tracked source during this sweep. The same tone is present in the Stripe/checkout/backend/webhook phrases listed above and may also originate in catalog/database content not stored as a literal in these components.

## Repetitive or AI-sounding storefront language

### Home

Review all customer-facing strings in `apps/web/src/app/page.tsx:8-147`, especially:

- “Tables, paddles, and game-night gear for the next rally.”
- “Shop the Tiger Ping Pong product lineup with clear product pages, secure checkout, and simple Canada-wide shipping.”
- “A serious indoor table with a tournament-spec playing surface.” Verify “tournament-spec.”
- “A net and post set for keeping the table ready to play.”
- “Featured setup.”
- “Built to support play.”
- “Shipping promise” repeated twice on the page.
- “Need a local hand?” and “Questions before the next match?”

The page also repeats “Free shipping over $100 across Canada” in the hero badge, promise row, and shipping band. Keep one prominent expression and one checkout/cart reminder at most.

### Category pages and empty states

Review the entire configuration block in `apps/web/src/app/category-pages.ts:55-202`. It contains repeated formulaic phrases and internal storefront language:

- “This page is being prepared.”
- “The storefront is ready for this category route.”
- “with secure checkout, product details, and Canada-wide shipping terms.”
- “built for patios, parks, and fresh-air rallies.”
- “with storefront checkout.”
- “Round out the table setup…”
- “quick matches and everyday rallies.”
- “home play and friendly table tennis.”
- “practice, games, and restocks.”
- “for protecting the next match.”
- “keep the table ready between games.”
- “for everyday setup.”
- “for keeping a Tiger Ping Pong table ready to play.”
- “replacement setup needs” and repeated “support confirmation.”

Also review `apps/web/src/app/CategoryLandingPage.tsx:370-399`: “Catalog connection issue” and the generic contact fallback are safe but system-like. The empty state must distinguish a genuinely empty category from a catalog/API failure.

### Product-detail marketing blocks

Treat `apps/web/src/app/catalog/products/[slug]/ProductDetailSections.tsx` as a full copy-review surface, not a source of approved facts. The file contains large hand-curated marketing maps and generated fallback headings. Review every literal in at least these ranges:

- Curated product feature copy and claims: lines `137-452`.
- Generic section headings and feature fallbacks: lines `634-710`.
- Generated marketing taglines: lines `940-1030`.
- Warranty/stat extraction and presentation: lines `1394-1428`.
- Comparison copy and values: lines `1480-1560`.

Examples that sound synthetic, vague, or potentially unsupported:

- “Weather-ready bounce.”
- “Ready when you open it.”
- “solid, confident outdoor feel.”
- “keeps the look clean and durable.”
- “Park-ready structure.”
- “Install and leave it ready.”
- “Made for Shared Spaces.”
- “confident indoor bounce.”
- “feels impressively close to a thick wood-top table.”
- “open, close, and store the table with confidence.”
- “All the good parts, close up.”
- “Highlights that matter.”
- “Built for outdoor rallies.”
- “Built for indoor play.”
- “Built for the next match.”
- “Built for everyday control.”
- “Ready for the next rally.”
- “Made for everyday play.”
- “Outdoor-ready details, focused on the things buyers ask about first.”

For each product, replace prose only from traceable manufacturer/source facts or owner-approved positioning. If a fact cannot be verified, remove it rather than smoothing it into generic marketing.

### Catalog, resources, about, contact, and footer

Review these additional surfaces:

- `apps/web/src/app/catalog/page.tsx:341-376`: “Product stories,” “Choose by style of play,” and “Ready for the next match.”
- `apps/web/src/app/resources/page.tsx:49-116`: “before the next rally,” “Choose, plan, compare, and play,” and “ask Tiger PingPong.”
- `apps/web/src/app/resources/[slug]/page.tsx:121-200`: generic “What this guide covers” and “Keep browsing” framing; review article data as well as the template.
- `apps/web/src/app/about/page.tsx:18-50`: the full page is generic platform copy rather than a credible business story.
- `apps/web/src/app/contact/page.tsx:50-114`: repeated “help” language, “Canada-wide support,” and “Serving homes, clubs, schools, and parks across Canada” need owner confirmation and tighter hierarchy.
- `apps/web/src/app/PublicStorefrontFooter.tsx:82-85`: “Canada-wide storefront support from Vancouver, BC” sounds like platform copy; replace with approved company/location language.
- `apps/web/src/app/shipping-returns/page.tsx:18-70`: repeats shipping rules heavily and uses procedural wording. Keep the exact threshold, then make the rest concise.
- Metadata descriptions in `apps/web/src/app/**/page.tsx`: many repeat “secure checkout,” “Canada-wide shipping,” “next match,” and “ready.” Review metadata in the same pass so search snippets do not preserve the removed tone.

## Duplicate actions and copy hierarchy

- `apps/web/src/app/catalog/products/[slug]/CheckoutButton.tsx:212-220` has both “View cart” and “Review cart,” and both go to `/cart`. Keep one cart action.
- `apps/web/src/app/cart/CartPageClient.tsx:176-180` displays a computed shipping sentence and then repeats both full shipping rules immediately below it. Keep the contextual result plus one short threshold explanation.
- Product availability/handling is repeated within the purchase panel. Keep one message.
- The home page repeats the shipping promise three times. Reduce it.
- Checkout success and cancel pages repeat status concepts in the heading, intro, panel heading, paragraph, and definition list. Make the outcome scannable in one statement.

## Policy language requiring an actual business decision

Do not merely polish these areas. An owner must decide and approve them:

- Return eligibility, timing, damaged-goods process, who pays return freight, and refund method/timing.
- Actual inventory/availability promise and whether customers may check out while told to contact support first.
- Warranty presentation and which sourced warranty applies to each SKU.
- Whether “nearly 20 years,” Vancouver-based service, and Canada-wide customer segments are accurate.
- Shipping/handling timing, including any “about 24 business hours” statement.
- Canadian tax wording after Stripe/accounting validation.
- Privacy roles, retention language, customer request handling, and every named/unnamed service provider.
- Whether the public status page should name Stripe at all beyond an approved policy/checkout disclosure.

Track final decisions in `docs/launch/customer-promise-review-matrix.md`; do not treat this copy inventory as approval.

## Photo and creative inventory

The following visual problems were observed or are apparent from source usage:

| Location                                                                                              | Problem                                                                                                                                                                                              | Smallest follow-up                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/web/src/app/page.tsx:15-20,70-76,97-115`                                                        | Homepage uses old BigCommerce CDN URLs directly and mixes a lifestyle/table image with a small transparent product cutout. The visual system feels inherited rather than intentionally merchandised. | Select owner-approved hero and feature imagery from the verified catalog/Cloudinary source; standardize crop, background, resolution, and art direction.                                               |
| `apps/web/src/app/CategoryLandingPage.tsx:322-325`                                                    | Category hero depends on the first matching catalog product image, so crop/composition can vary unpredictably and can fail when the category filter/fixture is wrong.                                | Assign reviewed category hero assets or documented crop rules with a stable fallback.                                                                                                                  |
| `apps/web/src/app/catalog/products/[slug]/page.tsx:914-920` and gallery helpers in the same directory | Product galleries inherit mixed Cloudinary and fallback/source media. Image quantity, crop, lighting, background, and alt text vary by product.                                                      | Make a per-SKU media checklist: primary hero, alternate angles, scale/context shot, detail shot, consistent aspect ratio, source, approved alt text. Preserve fallbacks until replacement is verified. |
| `apps/web/src/app/catalog/products/[slug]/CheckoutButton.tsx:162-205`                                 | Modal recommendations can repeat weak thumbnails and create a low-quality mini-marketplace effect.                                                                                                   | Keep recommendations only when each item has approved media and the recommendation is commercially intentional.                                                                                        |
| Policy and support pages                                                                              | Large text-only cards make draft/legal content feel like marketing panels and consume significant mobile space.                                                                                      | After copy approval, simplify visual hierarchy; policies should prioritize readable document structure over campaign-style cards.                                                                      |

Do not use AI-generated product photos as evidence of the real product. New creative must not change product colour, included components, dimensions, finish, or configuration.

## Suggested follow-up task order

1. Obtain the unresolved business and policy decisions.
2. Remove all public `draft`, `owner review`, `V1`, `storefront pass`, `customer copy`, backend, webhook, payment-truth, and redirect-result language.
3. Rewrite the primary path in order: home → category → product → add-to-cart → cart → checkout status/cancel → contact/returns.
4. Replace or verify every product claim in `ProductDetailSections.tsx` against a traceable source.
5. Reduce repeated shipping, availability, support, and cart actions.
6. Review metadata, structured data, image alt text, and empty/error copy so old phrasing does not remain outside the visible page body.
7. Complete the per-SKU photo checklist and replace weak source/fallback media only after the replacement is verified.
8. Run desktop/mobile screenshots and a text search for the banned internal-language markers.

## Regression proof for the copy pass

- `rg -n -i "owner review draft|this draft must be approved|customer copy|storefront pass|payment truth|redirect result|backend receives Stripe webhook|backend re-checks|live catalog|current V1" apps/web/src/app` returns no unintended public matches.
- Shipping copy tests still prove `$99.99` and exactly `$100.00` receive `$15`, while `$100.01` is free.
- Playwright covers home → category → product → cart and approved policy routes on desktop and mobile.
- Screenshot review confirms one clear primary action, no duplicate availability/shipping paragraphs, no internal review language, and approved imagery/crops.
- Product-fact review records a source or owner decision for every retained warranty, performance, availability, history, and shipping-speed claim.
- Checkout/webhook tests remain unchanged and green; copy work must not alter payment truth or totals.

## Boundaries for the new task

- Do not change Stripe, checkout totals, webhook authority, payment status transitions, Prisma schema, production data, Render, DNS, or Cloudinary assets as part of the copy rewrite.
- Do not invent replacement promises.
- Do not delete fallback media until the selected replacements are verified in the catalog and UI.
- Keep public admin/internal links absent.
