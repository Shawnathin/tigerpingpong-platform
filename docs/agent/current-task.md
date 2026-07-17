# Current Task

## Active task

Product imagery audit and exact-match technical-detail refresh.

## Selected task card

Audit the full local product-image library against the public catalog, preserve the current design and product behavior, and connect only exact, uncontested product-detail photos to existing feature cards. Add the owner-selected lifestyle image to the PingPong Tables category hero. Record all mappings, unresolved products, unused sources, Cloudinary results, and visual proof.

## Boundaries

- Do not change product names, descriptions, prices, inventory, variants, category assignments, routes, menus, checkout, payment truth, webhook authority, Prisma schema, or migrations.
- Do not redesign cards, galleries, or carousels.
- Do not apply ambiguous colour, model-revision, primary, or gallery mappings.
- Keep raw source media local and outside Git.
- Cloudinary uploads must use deterministic IDs, refuse collisions, and never expose credentials.
- Do not mutate production catalog records or product-media rows.

## Required proof

- Machine-readable exact-match manifest and unused-source inventory are committed.
- Every implemented delivery URL returns `200`.
- Desktop and mobile screenshots show no crop, stretch, layout shift, or carousel regression.
- Lint, typecheck, tests, production build, secret scan, and production dependency audit pass.
- Ambiguous products and variant-colour decisions remain unchanged and documented.

## Status

Audit and exact-match implementation are complete on `codex/product-imagery-audit-refresh`. Twenty-five presentation-only detail assets were uploaded under new deterministic Cloudinary IDs and wired into four table PDP feature sections. The owner-selected Expo Outdoor lifestyle photo is now the responsive `PingPong Tables` category hero. All 26 delivery URLs return `200`; desktop/mobile visual QA passes; `pnpm launch:preflight` passes with 25 unit tests, 8 browser workflow tests, a clean tracked-secret scan, and zero high/critical production advisories. No catalog or database records changed.
