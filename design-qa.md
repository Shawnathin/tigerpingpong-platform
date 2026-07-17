# Homepage Promotion Design QA

## Evidence

- Source visual truth:
  - `/var/folders/t0/jhxslg8n76qb4vntjw805zz80000gn/T/TemporaryItems/NSIRD_screencaptureui_7FPJhn/Screenshot 2026-07-16 at 11.34.58 PM.png`
  - `/var/folders/t0/jhxslg8n76qb4vntjw805zz80000gn/T/TemporaryItems/NSIRD_screencaptureui_rnxFy1/Screenshot 2026-07-16 at 11.34.52 PM.png`
  - Supplied Portland, Table Cover, and Aqua transparent PNG artwork.
- Final implementation screenshots:
  - `docs/audit/homepage-promotion-qa/final-hierarchy-logo-desktop-1280x820.png`
  - `docs/audit/homepage-promotion-qa/final-hierarchy-logo-mobile-390x844.png`
- Viewports: desktop browser at 1280px effective width and mobile at 390 × 844.
- State: three static stacked panels in the final order Aqua, Portland, Table Cover.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: existing Tiger Ping Pong type and weight hierarchy are preserved; the short approved copy remains legible and balanced at both breakpoints.
- Spacing and layout rhythm: each panel keeps its artwork centered like the old homepage. On desktop, the bold headline has a generous separate gutter beside the image while the product name and CTA share a centered row below it. Mobile uses the sequence image, headline, product name, CTA. The panels are stacked with a consistent 28px desktop and 18px mobile gap.
- Colors and visual tokens: existing ink, orange, pale blue, white, radius, and elevation language are retained. Aqua receives a restrained blue CTA accent.
- Image quality and asset fidelity: all three supplied transparent PNGs are used without recolouring, destructive cropping, distortion, or CSS reconstruction. Explicit intrinsic dimensions prevent layout shift.
- Copy and content: Aqua appears first, followed by Portland and the Table Cover. Approved labels, headlines, and CTAs are installed exactly. The replacement Table Cover artwork removes the previous embedded “Just Released” wording.
- Accessibility and interaction: the three offers are permanently visible in document order, use one page-level `h1` followed by `h2` headings, and expose real product links with visible focus states. No carousel, hidden slide, auto-rotation, or selector control remains.
- Responsive behavior: the 390px viewport has no horizontal overflow and all three images preserve their proportions.
- Brand fidelity: the supplied official Tiger Ping Pong logo replaces the former CSS approximation in both the public header and footer. Its original proportions and transparent background are preserved at desktop and mobile sizes.
- Browser console: zero errors during the final stacked desktop and mobile checks.

## Focused Region Comparison

The Aqua-first mobile capture and the separate desktop Portland and Cover captures were inspected for typography wrapping, centered artwork, CTA size, transparent edges, sticky-navigation overlap, and inter-panel spacing. No focused-region correction was required.

## Comparison History

- Pass 1: the approved copy was first tested in a carousel treatment.
- User correction: the carousel was rejected in favour of three stacked panels with Aqua first.
- Pass 2: the carousel, selector controls, and rotation were removed. Final desktop/mobile captures confirmed the requested fixed order, centered composition, and zero mobile overflow with no remaining P0/P1/P2 mismatch.
- Pass 3: the Table Cover artwork was replaced with the new orange-glass version. Its asset filename was versioned to prevent the image optimizer from serving the prior cover graphic at cached responsive sizes; desktop and 390px captures confirmed the replacement.
- Pass 4: the product name and CTA moved below the centered image, the bold headline became the only side copy with a wider gutter, and the supplied official logo replaced the temporary header/footer mark. Desktop and 390px captures confirmed the final hierarchy and logo fit.

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

final result: passed
