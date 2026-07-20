# Current Task

## Active task

TigerPingPong.ca final SEO cutover readiness and same-day launch gates.

## Selected task card

Finish the reviewed URL migration contract on current main, prove the public crawl/indexing behavior locally and on the Render origin, then hold DNS until checkout, webhook, TLS, CORS, and staff-order gates pass.

## Boundaries

- Canonical public origin is `https://tigerpingpong.ca`.
- Legacy paths redirect with direct server-side `301` responses to absolute `.ca` destinations before host normalization.
- `.com`, `www.tigerpingpong.com`, and `www.tigerpingpong.ca` are redirect-only hosts.
- Preserve the 17 old sitemap paths whose content URLs remain valid; keep `/shop-all/-1` as `404`.
- Keep the Stripe webhook at `https://tigerpingpong-platform.onrender.com/webhooks/stripe`.
- Preserve hosted Stripe Checkout, server-calculated totals, webhook payment truth, staff protection, schema, and API response contracts.
- Do not change DNS until the Render-origin crawl, full Stripe test-mode checkout, and configuration evidence pass.
- Freeze unrelated merges and deployments during final origin preflight and cutover validation.

## Required proof

- Exact status and `Location` assertions for every approved legacy path and redirect host.
- Valid 34-URL canonical sitemap; catalog failure returns `503` with `Retry-After`.
- Self-canonicals, utility-page noindex metadata, and readable robots directives.
- All 17 preserved paths remain live and `/shop-all/-1` remains `404`.
- Every sitemap page and its public internal links avoid unintended errors.
- Restored buyer, room-size, and rules topics render at their existing URLs with original publication dates.
- `pnpm launch:preflight` passes on the frozen branch.
- Render-origin crawl, protected-route/media/mobile checks, and a complete Stripe test-mode paid-order loop pass before DNS.

## Status

Implementation is complete locally on `codex/final-seo-cutover-readiness`, based on the green Aqua shipping commit `ad45991`. The final `pnpm launch:preflight` passes lint, Prisma generation/validation, typecheck, 59 unit tests, production build, 69 active Chromium tests, tracked-secret scanning, and the high-severity production audit gate; 11 evidence-only tests skip and two moderate advisories remain below the gate. External Render-origin, Stripe, configuration, TLS, DNS, and controlled-live-order gates remain pending.
