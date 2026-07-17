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
- Image quality and asset fidelity: all three supplied transparent PNGs are used without recolouring, destructive cropping, distortion, or CSS reconstruction. Explicit intrinsic dimensions prevent layout shift.
- Copy and content: Aqua appears first, followed by Portland and the Table Cover. The split desktop headlines read “Make a / splash.”, “Take it / outside.”, and “Ultra / durable.”; assistive text preserves each phrase with normal word spacing. Approved product labels and CTAs remain below the image. The replacement Table Cover artwork removes the previous embedded “Just Released” wording.
- Accessibility and interaction: the three offers are permanently visible in document order, use one page-level `h1` followed by `h2` headings, and expose real product links with visible focus states. No carousel, hidden slide, auto-rotation, or selector control remains.
- Responsive behavior: the 390 × 844 viewport has no horizontal overflow, recombines each split phrase into one centered headline, and preserves all three image proportions.
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
