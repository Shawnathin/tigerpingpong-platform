# Current Task

## Active task

Aqua Product Page + Tiger Purchasing Rail V2.

## Selected task card

Replace the rejected long Aqua page with a shorter, conversion-first product experience and use Aqua as the isolated pilot for Tiger’s future universal purchasing rail.

## Deliverable

- Exact eight-image Aqua gallery with package-aware featured media.
- Aqua-only `tiger-v2` purchasing presentation with four live-priced package choices.
- Short approved story sequence: product proof, why Aqua exists, first custom-mould and recyclable-packaging proof, and purchase return.
- Original Aqua packaging photograph plus extracted Aqua packaging wordmark and halftone used as supporting identity.
- Collision-safe, hash-verified media manifests and upload scripts.
- Typed canonical copy, claim records, focused tests, screenshots, and local review at port `3120`.

## Locked decisions

- Aqua is the pilot; all non-Aqua products retain the legacy purchase presentation.
- **Canada Red** is the public label. Existing internal `coral` keys, option values, SKUs, and checkout mappings remain unchanged.
- Approved claims are **weather-resistant** and **ultra-durable**. Do not strengthen them to weatherproof or permanent outdoor storage.
- Multi-packs contain three balls. Prices and availability remain live catalog data.
- Aqua was designed in Vancouver using a Tiger-owned custom mould produced by specialist partners.
- Aqua was Tiger's first custom injection-moulded paddle; its packaging is 100% recyclable.
- No AI-generated product pixels, unsupported legacy claims, vendor material, quotes, or manufacturing drama enter the page.

## Boundaries

- No backend, public API, database schema, payment, checkout, URL, canonical, redirect, sitemap, robots, deployment, or DNS changes.
- Preserve cart payloads, gallery mapping, focus management, added-to-cart dialog, and hosted Stripe Checkout.
- Raw photographs, source packaging, emails, and video remain local and uncommitted.
- Do not migrate another product to Purchasing Rail V2 before owner review.

## Required proof

- All four live option prices and exact selected packages reach cart and checkout.
- Public UI says Canada Red while the internal coral compatibility key survives.
- Story order, headings, metadata, anchors, images, and alternatives are correct.
- One table and one non-Aqua accessory retain the legacy rail.
- No overflow at 390, 417, 768, 1280, or 1440 pixels.
- Formatting, lint, typecheck, unit tests, focused Playwright, production build, secret scan, and launch preflight are recorded.
- Desktop, tablet, mobile, and full-page evidence is captured before push.

## Status

Implementation and validation are complete on `codex/aqua-product-page-tiger-v2`; PR #119 is pushed and awaiting merge.

- Rejected work was checkpointed separately before selective recovery.
- Exact Aqua gallery and media manifests are in place.
- Aqua Purchasing Rail V2, Canada Red presentation mapping, story sections, and local mock catalog are implemented.
- Owner review replaced the blue scenic purchase imagery with exact Aqua cutouts on plain white in both the gallery and package selector.
- Desktop, tablet, and mobile visual QA is complete with no open P0–P2 differences.
- Full launch preflight passes: production build, 33 unit tests, 53 active Playwright tests, tracked-secret scan, and the high-severity production audit gate. Nine screenshot-only Playwright jobs are intentionally skipped; two moderate dependency advisories remain.
- The branch now includes current `main` so PR #119 can merge cleanly; no deployment or automatic merge was performed.
