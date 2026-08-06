# Current Task

## Active task

Remove the remaining runtime BigCommerce media dependencies before the final DNS-authority cutover to GoDaddy.

## Stable task key

`TPP-BC-RUNTIME-DECOUPLING`

## Selected task card

Replace every active storefront BigCommerce image reference with exact reviewed Cloudinary media. Where no verified current-model image exists, remove the legacy visual instead of substituting an uncertain product image.

## Boundaries

- Work only on `codex/fix/bigcommerce-runtime-media-cutover`, created from current `origin/develop`; target any pull request to `develop`, never `main`.
- Preserve checkout, Stripe, webhook payment truth, protected-route auth, shipping, catalog facts, prices, availability, database data/schema, and production configuration.
- Preserve historical source traceability in `data/` and `docs/`; the zero-dependency gate applies to active runtime source in `apps/web/src`.
- Use only owner-cleared exact current-model product media. Portland Outdoor V1 archive media is prohibited.
- Do not change DNS, nameservers, GoDaddy, BigCommerce account state, Render configuration, deployment state, or email sending in this task.

## Required proof

- `apps/web/src` contains zero `bigcommerce.com` references, protected by a regression test.
- Every replacement Cloudinary URL returns successfully.
- Affected catalog fallback and table detail experiences render without broken media at required responsive widths.
- Relevant unit/browser tests, lint, typecheck, and production-style build pass.
- Any promotion, deployment, provider action, or production cutover remains separately reviewed and explicitly approved.

## Status

Local implementation and proof completed 2026-08-06 after preserving and reapplying the unfinished automated-email and universal table-page work in named safety stashes. The clean task worktree is based on `origin/develop` commit `d4413cbbb92f59d39a260a12404ea5095a316b14`. All 22 active source occurrences representing 15 distinct BigCommerce asset URLs were removed. Eleven exact reviewed Cloudinary replacements returned HTTP 200, and unverified Portland detail visuals were removed. The regression test, all 134 unit tests, lint, typecheck, production-style build, and seven active table gallery browser tests passed across the approved responsive widths; one evidence-only screenshot test remained skipped by its existing opt-in gate. No provider, DNS, deploy, merge, push, email, database, payment, or production mutation occurred.
