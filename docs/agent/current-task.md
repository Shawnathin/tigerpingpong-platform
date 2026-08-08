# Current Task

## Active task

Publish the PaddleBuddy privacy policy on the Tiger PingPong storefront for TestFlight use.

## Stable task key

`TPP-PADDLEBUDDY-PRIVACY-POLICY`

## Selected task card

Add a stable public PaddleBuddy privacy-policy route using the owner-supplied policy, link it from the existing footer Legal section, and include it in the public sitemap.

## Boundaries

- Work only on `codex/feature/paddlebuddy-privacy-policy` and target its pull request to `develop`, never `main`.
- Preserve the supplied policy wording and effective date.
- Reuse the existing Tiger storefront navigation, footer, tokens, and legal-page patterns.
- Do not add an outdated app screenshot; media can be added later from a current approved capture.
- Do not change checkout, payment, shipping, auth, API, database, DNS, deployment, or production state.

## Required proof

- `/paddlebuddy/privacy-policy` renders publicly with canonical metadata and the complete supplied policy.
- The footer clearly distinguishes the PaddleBuddy policy from the website privacy policy.
- The public sitemap includes the PaddleBuddy route.
- The page has no horizontal overflow on mobile and passes focused route, lint, typecheck, and production-build checks.

## Status

Local implementation and proof completed on 2026-08-08. The stable public route renders the complete owner-supplied policy with canonical metadata, the footer Legal section distinguishes it from the website privacy policy, and the sitemap includes it. Focused formatting, lint, Prisma generation, typecheck, 11 sitemap unit tests, the production-style build, three focused Chromium tests, and visual review at `390`, `417`, `768`, `1280`, and `1440` pixels passed. No app screenshot, checkout/payment/shipping change, database write, deployment, or production mutation occurred.
