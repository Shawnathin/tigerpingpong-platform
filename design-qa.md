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

final result: passed
