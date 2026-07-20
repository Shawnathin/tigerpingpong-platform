# Current Task

## Active task

Aqua 4-pack Canada-wide free-shipping exception mainline integration.

## Selected task card

Port the completed shipping exception onto current `origin/main` without regressing the newer Aqua V2, table gallery, replacement-parts, storefront, cart, checkout, or webhook work.

## Boundaries

- Match the exact product slug `tiger-aqua-outdoor-indoor-paddle` and exact variant key `tiger-aqua-package-4-pack-3-balls`.
- Grant free shipping only when every cart line is that exact Aqua variant; mixed under-threshold carts remain $15.
- Preserve the existing threshold: over $100 CAD is free and exactly $100 CAD remains $15 unless the cart is Aqua 4-pack-only.
- Keep pending orders created under `canada_free_over_100_flat_15` webhook-valid.
- Preserve Canada-only checkout, hosted Stripe Checkout, backend-authoritative totals, webhook-confirmed payment truth, and idempotency.
- Do not change schema, migrations, prices, catalog records, DNS, hosting, or external services.

## Required proof

- Unit coverage for exact match, mixed-cart denial, threshold boundary, and legacy-order compatibility.
- Browser proof for the selected Aqua 4-pack message, free cart estimate, and mixed-cart $15 estimate.
- Lint, typecheck, unit tests, focused Playwright, and launch preflight pass.

## Status

Implemented on `codex/aqua-shipping-mainline` from current `origin/main`. `pnpm launch:preflight` passed on July 20, 2026: lint, Prisma generation and validation, typecheck, 48 unit tests, production build, 62 active Chromium tests, tracked-secret scan, and the high-severity production dependency audit all passed. Eleven evidence-only browser tests were intentionally skipped; the production audit reported two moderate vulnerabilities below the configured blocking threshold.
