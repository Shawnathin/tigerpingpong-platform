# Safari table-gallery sizing

Date: 2026-09-13
Branch: `codex/fix/safari-table-gallery-sizing`

## Root cause

The table gallery is a grid without an explicit column definition. WebKit uses
the image's intrinsic size for that implicit track. At a 1440px viewport, the live
Expo gallery was 814px wide but its figure was 1267px wide, extending underneath
the purchase rail. Chromium constrained it already, and the existing tests only
checked document overflow rather than the gallery's own bounds.

Removing the sunset asset in #175 did not solve this separate layout bug.

## Repair

Define `grid-template-columns: minmax(0, 1fr)` on table galleries only. The existing
contained-image rendering and responsive layout remain intact. No source images,
colours, copy, prices, cart logic, payment, API, or authentication are changed.

## Regression evidence

- New WebKit test fails before the CSS change: frame right edge 1367px exceeds
  gallery right edge 914px.
- After the change: figure width 814px, image width 812px, no rail overlap.
- All 20 new cases pass in Chromium and WebKit: Expo at 390, 417, 768, 1280, 1440,
  and 1920px, before/after Grey selection, plus the other four table models.
- WebKit runs these targeted geometry cases in CI; the existing Chromium suite
  remains enabled. Both browser engines are installed by release readiness.
- Lint and typecheck passed locally. Full suite/build and hosted checks must pass
  before release approval; their final results belong in the PR record.

Visual checks compare the real live image before/after the same CSS rule in
WebKit. Safari itself and the eventual production deployment still require final
confirmation; passing WebKit tests is not a claim that production has changed.

## Deterministic geometry fixture

Promotion run `34808195071` passed all Expo checks but timed out waiting for a
decoded Whistler image in Linux WebKit. The trace shows an HTTP 200 response with
`Content-Type: image/jxl`, while `naturalWidth` remained zero. This is not evidence
of a failed gallery-width assertion.

The dedicated geometry spec now intercepts only its browser image requests and
uses a 1600x900 SVG fixture. This preserves the large intrinsic size required to
reproduce the bug without depending on CDN format negotiation or decoding.
Real-product gallery tests and screenshots continue using actual photography;
no production media or CSS changes are part of this test-only follow-up.
All 20 fixture-backed Chromium/WebKit cases pass locally.
