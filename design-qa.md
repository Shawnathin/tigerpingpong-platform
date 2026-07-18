# Product Imagery Design QA

Date: 2026-07-17

Scope: Exact-match product-detail imagery only

## Reference and implementation comparison

- Before: `docs/audit/product-imagery-2026-07-17/current/05-expo-features-desktop.png`
- After: `docs/audit/product-imagery-2026-07-17/after/01-expo-features-desktop.png`
- Side-by-side: `docs/audit/product-imagery-2026-07-17/after/00-expo-before-after-comparison.png`
- Mobile after: `docs/audit/product-imagery-2026-07-17/after/05-expo-features-mobile.png`

## Review results

- Existing type, spacing, card geometry, carousel behavior, and navigation remain unchanged.
- Exact photos replace generated placeholder shapes without adding new wrappers or product-specific CSS.
- Images use the existing contained slots; no legs, rails, nets, wheels, edges, or controls are cropped.
- Portrait, square, and landscape details remain centered without stretching.
- Card heights and carousel track dimensions remain stable while moving between images.
- Desktop carousel intentionally reveals the next card at the right edge; this matches the existing interaction pattern.
- Mobile keeps the full first card readable, shows the next-card affordance, and preserves the existing next button and progress dots.
- New non-decorative images have specific alt text.

## Representative pages checked

- Expo Outdoor feature carousel — desktop and mobile.
- Plaza Outdoor feature carousel — desktop.
- Portland Indoor feature carousel — desktop.
- Whistler feature carousel — desktop.
- Tables category — current live desktop structure.
- Accessories category — current live mixed-background structure.
- Expo product gallery — current live desktop structure.

## Open visual decisions

- Variant-specific table colour imagery is intentionally unchanged pending owner confirmation.
- Portland Outdoor technical details remain on the existing remote sources pending current-model confirmation and larger local masters.
- Aqua, Table Cover, White 6-Pack, Vice primary, and Net & Post primary remain owner/source decisions.

---

# Tables Category Hero QA

Date: 2026-07-17

Scope: Replace the `/tables` category hero product cutout with the owner-selected Expo Outdoor lifestyle photo.

## Comparison evidence

- Source visual truth: `/Users/shawncleve/Downloads/tiger - photos reorganized/Home Page/Hero/IMG_0539.jpg`
- Desktop implementation: `docs/audit/category-hero-qa/tables-hero-desktop.png`
- Mobile implementation: `docs/audit/category-hero-qa/tables-hero-mobile.png`
- Desktop viewport: 1280 × 720, `/tables`, default state.
- Mobile viewport: 390 × 844, `/tables`, default state.
- Full-view comparison: source photo, desktop capture, and mobile capture were opened together for direct visual comparison.
- Focused-region comparison was not needed because the hero image and its complete crop are clearly readable in both full-view captures.

## Findings

- No P0/P1/P2 findings remain.
- Fonts and typography: existing category hierarchy and weights are unchanged.
- Spacing and layout rhythm: the desktop image fills the existing visual column; mobile preserves the existing stacked layout without horizontal overflow.
- Colors and visual tokens: the source photo remains natural and does not alter the page's established orange, ink, and glass-panel tokens.
- Image quality and asset fidelity: the approved 4032 × 3024 source is delivered from Cloudinary with automatic format/quality at an appropriate width. The table remains visible in both crops without stretching.
- Copy and content: existing category text is unchanged; the new alt text identifies the table and setting.
- Browser console: no warning or error entries were present during the final mobile verification.

## Comparison history

- Initial implementation used a centered `cover` crop in the existing category hero slot.
- Desktop and mobile captures showed the full table remained identifiable, the horizon stayed level, and no controls or content were obscured.
- No P0/P1/P2 correction loop was required.

## Follow-up polish

- P3: An alternate wider source could preserve more of the original sky and foreground, but the selected photo is sharp and composes cleanly in the current hero.

---

# Homepage Promotion Design QA

## Evidence

- Source visual truth:
  - `/var/folders/t0/jhxslg8n76qb4vntjw805zz80000gn/T/TemporaryItems/NSIRD_screencaptureui_7FPJhn/Screenshot 2026-07-16 at 11.34.58 PM.png`
  - `/var/folders/t0/jhxslg8n76qb4vntjw805zz80000gn/T/TemporaryItems/NSIRD_screencaptureui_rnxFy1/Screenshot 2026-07-16 at 11.34.52 PM.png`
  - Supplied Portland, Table Cover, and Aqua transparent PNG artwork.
- Final implementation screenshots:
  - `docs/audit/homepage-promotion-qa/final-hierarchy-logo-desktop-1280x820.png`
  - `docs/audit/homepage-promotion-qa/final-hierarchy-logo-mobile-390x844.png`
- Latest split-headline implementation screenshots:
  - `docs/audit/homepage-promotion-qa/balanced-desktop-1280x720.png`
  - `docs/audit/homepage-promotion-qa/balanced-mobile-390x844.png`
- Latest source visual truth: `/var/folders/t0/jhxslg8n76qb4vntjw805zz80000gn/T/codex-clipboard-0c17c978-fc5e-4537-8693-149ad2b77009.png`
- Viewports: desktop at 1280 × 720 and mobile at 390 × 844.
- State: three static stacked panels in the final order Aqua, Portland, Table Cover.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: existing Tiger Ping Pong type and weight hierarchy are preserved; the short approved copy remains legible and balanced at both breakpoints.
- Spacing and layout rhythm: each panel keeps its artwork centered like the old homepage. On desktop, each short bold headline is split evenly across the left and right gutters while the product name and CTA share a centered row below the image. The tightened 589px desktop panel fits in the tested 720px-high viewport, including its CTA. Mobile uses the sequence image, complete headline, product name, CTA. The panels are stacked with a consistent 28px desktop and 18px mobile gap.
- Colors and visual tokens: existing ink, orange, pale blue, white, radius, and elevation language are retained. Aqua receives a restrained blue CTA accent.
- Image quality and asset fidelity: all three transparent PNGs are delivered from versioned Cloudinary URLs without recolouring, destructive cropping, distortion, or CSS reconstruction. Explicit intrinsic dimensions prevent layout shift, and the prior local assets remain available as rollback fallbacks until deployed verification.
- Copy and content: Aqua appears first, followed by Portland and the Table Cover. The split desktop headlines read “Make a / Splash.”, “Take it / Outside.”, and “Ultra / Protection.”; assistive text preserves each phrase with normal word spacing. Approved product labels and CTAs remain below the image. The V4 white-logo Table Cover artwork replaces the prior title-card version and keeps the “Just Released” wording removed.
- Accessibility and interaction: the three offers are permanently visible in document order, use one page-level `h1` followed by `h2` headings, and expose real product links with visible focus states. No carousel, hidden slide, auto-rotation, or selector control remains.
- Responsive behavior: the 390 × 844 viewport has no horizontal overflow, recombines each split phrase into one centered headline with a consistent 10px word gap across the `h1` and both `h2` panels, and preserves all three image proportions.
- Brand fidelity: the supplied official Tiger Ping Pong logo replaces the former CSS approximation in both the public header and footer. Its original proportions and transparent background are preserved at desktop and mobile sizes.
- Browser console: zero errors or warnings during the latest mobile check.

## Focused Region Comparison

The Aqua-first mobile capture and the separate desktop Portland and Cover captures were inspected for typography wrapping, centered artwork, CTA size, transparent edges, sticky-navigation overlap, and inter-panel spacing. No focused-region correction was required.

## Comparison History

- Pass 1: the approved copy was first tested in a carousel treatment.
- User correction: the carousel was rejected in favour of three stacked panels with Aqua first.
- Pass 2: the carousel, selector controls, and rotation were removed. Final desktop/mobile captures confirmed the requested fixed order, centered composition, and zero mobile overflow with no remaining P0/P1/P2 mismatch.
- Pass 3: the Table Cover artwork was replaced with the new orange-glass version. Its asset filename was versioned to prevent the image optimizer from serving the prior cover graphic at cached responsive sizes; desktop and 390px captures confirmed the replacement.
- Pass 4: the product name and CTA moved below the centered image, the bold headline became the only side copy with a wider gutter, and the supplied official logo replaced the temporary header/footer mark. Desktop and 390px captures confirmed the final hierarchy and logo fit.
- Pass 5: the user requested bold text on both sides of every image and one complete panel per screen. Each headline was split across balanced desktop gutters, the panel/image height rules were tightened, and the mobile breakpoint recombines the phrase below the image. The 1280 × 720 capture includes the complete Aqua panel and CTA; the 390 × 844 capture has zero horizontal overflow. Direct comparison with the annotated source found no remaining P0/P1/P2 mismatch.

## Implementation Checklist

- [x] Preserve the existing navigation, support band, footer, and page identity.
- [x] Stack three permanently visible promotional panels.
- [x] Put Aqua first, followed by Portland and the Table Cover.
- [x] Keep product artwork centered on desktop and mobile.
- [x] Install the approved copy and product destinations.
- [x] Remove all carousel controls, state, and rotation behavior.
- [x] Verify desktop and mobile rendering with no console errors or mobile overflow.
- [x] Keep only the bold headline beside the artwork on desktop.
- [x] Move the product name and CTA below the artwork.
- [x] Install the supplied official logo in the public header and footer.
- [x] Split the bold headline across both sides of all three centered desktop images.
- [x] Fit a complete promotional panel and CTA within a 1280 × 720 viewport.

final result: passed

---

# Indoor & Outdoor Table Chapters QA

Date: 2026-07-18

Scope: Translate the approved `/tables` glass system into dedicated Indoor and Outdoor category chapters while preserving the live catalog, compact product-stage treatment, and mobile shipping reassurance.

## Evidence

- Source visual truth: `exports/table-subcategories-qa/browser/source-tables-desktop-1440.png`
- Indoor browser capture: `exports/table-subcategories-qa/browser/indoor-desktop-1440.png`
- Indoor implementation: `exports/table-subcategories-qa/playwright/indoor-desktop-1440-viewport.png`
- Outdoor implementation: `exports/table-subcategories-qa/playwright/outdoor-desktop-1440-viewport.png`
- Desktop side-by-side comparisons: `exports/table-subcategories-qa/indoor-desktop-comparison.png` and `exports/table-subcategories-qa/outdoor-desktop-comparison.png`
- Mobile viewport comparison: `exports/table-subcategories-qa/mobile-viewport-comparison.png`
- Responsive viewport/full-page captures: `exports/table-subcategories-qa/playwright/`
- Viewports: 1440 × 1000, 768 × 1024, and 390 × 844.
- State: default category landing state with reduced motion for deterministic evidence.

The proof files remain under ignored `exports/` and are not committed as production media.

## Findings

- No actionable P0, P1, or P2 difference remains after viewing the source and each desktop implementation together and checking both full mobile page flows.
- Fonts and typography: the same Tiger display face, weights, eyebrow treatment, live price scale, and compact product-stage hierarchy from `/tables` carry through both category pages. Hero wrapping remains intentional at desktop and 390 pixels.
- Spacing and layout rhythm: the category switch and sticky shipping tab read as one glass assembly, remain clear of the floating navigation, and keep both shipping lines visible. At 390 pixels, each product image, story, live price, and CTA fits within one 844-pixel viewport.
- Colors and visual tokens: mist-white, pool-blue, navy, and restrained Tiger orange remain mapped to the approved table-page system. The indoor interlude uses orange once as an editorial pause; the outdoor education scene keeps the approved Pacific-navy treatment.
- Image quality and asset fidelity: Indoor uses the real Whistler lobby photograph without upscaling beyond its source. At the owner's direction, Outdoor deliberately reuses the stronger shaded Portland patio hero from `/tables` so direct search visitors receive the best first impression. Product cutouts and the real Tiger-branded ball image remain exact tracked Cloudinary media.
- Copy and content: category copy, table ordering, Tiger product stories, live catalog prices, and destinations match the approved content map. **PingPong** is one word throughout new customer-facing copy.
- Accessibility and responsiveness: both routes have one H1, logical H2 order, descriptive alternatives, visible keyboard focus, lazy-loaded below-fold media, a static reduced-motion mode, and no horizontal overflow at 390, 768, 1280, or 1440 pixels.
- Primary interaction: the All / Indoor / Outdoor switch was exercised from Indoor to Outdoor and updated the route and active state correctly.
- Browser console: zero application console errors or uncaught page errors during the final route-switch test.

## Focused Region Comparison

No separate product-stage crop was required. The product-stage component is now literally shared with the already approved `/tables` implementation, and the full mobile captures render every stage large enough to review its typography, image scale, story length, price, and CTA. The focused QA effort therefore stayed on the new category heroes, switch, shipping tab, and editorial interludes.

## Comparison History

- Pass 1: the inherited mobile image alignment collapsed the Indoor hero figure and the shipping tab sat too close to the compact header. The figure was allowed to stretch at the mobile breakpoint and the sticky offset was corrected.
- Pass 2: the category caption and floating switch competed at the bottom of the mobile hero. The caption received dedicated bottom clearance, while the shipping tab was tightened into the switch as a softer glass extension.
- Pass 3: the initial Outdoor-specific sunny patio image was visually sound, but the owner preferred the stronger `/tables` hero for search traffic. Outdoor now uses the same shaded Portland patio image, and the final desktop and mobile comparison shows the table remains dominant with readable copy.
- Post-fix evidence: the final desktop, tablet, and mobile captures show no navigation masking, caption collision, clipped copy, collapsed media, or horizontal overflow.

## Follow-up Polish

- P3: an equally strong future Outdoor-specific lifestyle photograph could restore hero variety without sacrificing the current product-first quality. The deliberate repetition is the approved launch choice.

final result: passed

---

# Find Your Table Page QA

Date: 2026-07-18

Scope: Owner-selected left-hand concept translated into the production `/tables` page, including subsequent desktop and mobile browser annotations.

## Evidence

- Selected concept: `exports/tables-category-qa/selected-reference.png`
- Side-by-side comparison: `exports/tables-category-qa/comparison.html`
- Desktop viewport/full page: `exports/tables-category-qa/playwright/desktop-1440-viewport.png` and `desktop-1440-full-page.png`
- Tablet viewport/full page: `exports/tables-category-qa/playwright/tablet-768-viewport.png` and `tablet-768-full-page.png`
- Mobile viewport/full page: `exports/tables-category-qa/playwright/mobile-390-viewport.png` and `mobile-390-full-page.png`

The proof files remain under ignored `exports/` and are not committed as production media.

## Resolved differences

- The first pass felt slower and more card-like than the selected concept. Product stages are now compact alternating glass compositions with clean transparent product cutouts and live catalog prices.
- Product-only chooser art felt less human than the concept. The Indoor and Outdoor choices now use real Whistler and Portland lifestyle photography. The final Indoor image centres the Whistler table beneath strong geometric lobby lighting, with a crop tuned specifically for the shallow chooser frame.
- One-line product labels did not answer “why this one?”. Every table now has a maximum two-sentence Tiger-voice explanation of why it exists and who it suits.
- The free-shipping message initially looked attached after the fact. It is now a softened sticky glass tab that shares the navigation treatment and keeps “Yes, even to cottage country.” visible as its byline on desktop and mobile.
- The education image originally used an unbranded ball. The final production image uses the owner-provided real ball as its print reference: black Tiger scratches and the black stacked wordmark, curved onto the ball with the `40` and three-star rating intentionally omitted. The net, lighting, table, and composition remain unchanged.
- The Portland patio hero is unique to `/tables`; the homepage and About retain their approved Vancouver mountain image.
- The education band remains between Portland Outdoor and Whistler Indoor and proceeds directly back into the product sequence without a second sales pitch.

## Final result

- No actionable P0, P1, or P2 visual difference remains at the reviewed 390, 768, 1280, and 1440-pixel widths.
- The page has one H1, logical H2/H3 hierarchy, descriptive alternatives, visible focus states, reduced-motion fallback, lazy loading below the fold, and no document-level horizontal overflow.

final result: passed

---

# Homepage — Summer in Canada QA

Date: 2026-07-18

Branch: `codex/homepage-summer-in-canada`

Scope: Full homepage rebuild from the owner-approved glassier summer mock, followed by desktop and mobile browser annotations.

## Evidence

- Approved reference: `exports/homepage-summer-qa/approved-mock.png`
- Desktop viewport/full page: `exports/homepage-summer-qa/playwright/desktop-1440-viewport.png` and `desktop-1440-full-page.png`
- Tablet viewport/full page: `exports/homepage-summer-qa/playwright/tablet-768-viewport.png` and `tablet-768-full-page.png`
- Mobile viewport/full page: `exports/homepage-summer-qa/playwright/mobile-390-viewport.png` and `mobile-390-full-page.png`

These visual proof files remain under ignored `exports/` and are not committed as production media.

## Findings

- No actionable P0, P1, or P2 visual difference remains after comparing the approved reference and implementation at matching viewports.
- The exact `MAY-011` Vancouver photo leads the page; the questionable first table remains confined to the About story.
- The frosted shopping shelf preserves a fast shopping path without becoming a second hero.
- Aqua is the strongest seasonal moment and says **Summer in Canada** rather than narrowing the campaign to the West Coast.
- Portland keeps the exact product cutout in sharp focus while a softly defocused summer patio background makes the section feel real and lived-in.
- The final owner-directed order is Shop → Aqua → Portland → Vancouver → Cover. Moving the community proof below Portland brings both summer products forward and lets the story section explain the product point of view afterward.
- The Vancouver proof uses real event photography and names community centres instead of breweries.
- Desktop, tablet, and mobile compositions have no document-level horizontal overflow; mobile uses deliberate vertical layouts rather than compressed desktop collages.
- Hero actions remain in the initial mobile viewport. Keyboard focus, reduced-motion, semantic headings, image alternatives, and real link destinations are preserved.
- No rejected bottom support/reach cards, “Our Story” hero action, or “now heading across Canada” language appears.
- Full launch preflight passes: 26 unit tests and 22 browser tests pass, five screenshot-only jobs are intentionally skipped, tracked-secret scan reports zero findings, and the production audit has no high or critical advisories (two moderate advisories remain).
- Aqua pool, Portland cutout, and Portland lifestyle deliveries each return `200` at their recorded `1672 × 941`, `1280 × 853`, and `1672 × 941` dimensions.

final result: passed

---

# Tablet Product Header and Purchase Panel QA

Date: 2026-07-17

Scope: The annotated public-header cart action and Expo Outdoor purchase panel at the 1020 × 801 mid-size viewport.

## Findings

- At 1020 × 801, the public header now uses the existing compact hamburger, centered logo, and compact Cart control instead of the former three-row navigation with a full-width cart button.
- The menu opens and closes through the existing real button, keeps its accessible name and expanded state in sync, and retains all public destinations.
- The product hero remains a two-column layout at 1020px: the gallery uses the available left column and the purchase panel remains a 400px side panel.
- The Add to cart action is 353px wide inside that panel instead of stretching across the page.
- Recognized tabletop-colour options now use light, translucent frosted-glass surfaces tinted to the option itself: cool blue for Blue and graphite for Grey.
- Blue and Grey use one centered white label rather than a separate colour swatch and text treatment. The controls are 64px high at tablet and desktop sizes, then tighten to a side-by-side 50px pair on mobile.
- When a tabletop colour is selected, the remaining colour option gently fades and scales back so the active choice reads more clearly without changing the option layout.
- Hover, keyboard focus, and selected states retain the same option tint instead of switching to the unrelated orange selection border; the underlying native radio inputs and labels remain intact.
- The single-column product stack now begins at 900px, before either column becomes cramped.
- At 390 × 844, the compact header and single-column product layout are preserved while the Blue and Grey controls remain side by side at 156px each, with zero horizontal overflow.
- At 1280 × 720, the full desktop navigation and 400px purchase-panel layout are unchanged.
- Browser console checks at 1020 × 801, 390 × 844, and 1280 × 720 found zero application errors; only the expected development Fast Refresh warning appeared while editing styles.
- No product copy, price, availability, shipping language, option behavior, destinations, or checkout behavior changed.

final result: passed

---

# Cart Summary Copy QA

Date: 2026-07-17

Scope: The annotated cart header and order-summary copy at the 390 × 844 mobile viewport.

## Findings

- The redundant `TigerPingPong.ca cart` eyebrow is removed from both populated and empty-cart headers.
- The cart summary now places a subdued `Taxes — Calculated at checkout` row directly below Shipping without changing the displayed subtotal, shipping amount, or total.
- The repeated free-shipping sentence is replaced with the owner-selected, centered checkout encouragement directly above Checkout: “You’re so close to the next rally!” followed by “One more step and we’ll take it from there.”
- Shipping calculation, Canada-only shipping rules, totals, checkout flow, and payment authority remain unchanged.

final result: passed

---

# Mobile Product Specifications and Comparison QA

Date: 2026-07-17

Scope: Mobile-only disclosure treatment for product specifications and table comparisons, with desktop presentation preserved.

## Findings

- At 390 × 844 and 420 × 801, Specifications is closed by default and opens through a native keyboard-accessible disclosure.
- Open mobile specifications use compact label/value rows while preserving every sourced specification and its original order.
- Mobile table Comparison is open by default, remains collapsible, and presents each table as a complete snap-aligned card instead of clipping the 1,040px desktop table.
- The current table is identified visually, every comparison product link remains accessible, and the horizontal card region can receive keyboard focus.
- The shared mobile treatment has zero document-level horizontal overflow and no browser console errors.
- At 1280 × 720, the original specifications grid and full comparison table retain their previous dimensions and styling; mobile disclosure markup is hidden.
- No product facts, specifications, comparison values, prices, availability, shipping promises, or destinations changed.

final result: passed
