# Admin safety and usability

Date: 2026-09-04
Branch: `codex/fix/admin-safety-usability`
Status: all local checks passed; draft PR [#172](https://github.com/Shawnathin/tigerpingpong-platform/pull/172) targets `develop`. Hosted checks pending at handoff. Runtime proof is for commit `ae9d80b`; the follow-up commit only records the PR link.

## Result

Publication and stock are separate controls over existing catalog flags. Hiding or republishing preserves the whole-product stock setting. Whole-product out-of-stock blocks purchasing without clearing variant choices. A published/out-of-stock Whistler fixture remains published after unrelated edits. Invalid prices, incomplete variants, obsolete/mixed update payloads, and stale edits remain rejected.

The product list shows product/SKU, price, publication, stock, and Edit. Technical information is collapsed under Details. Narrow screens use stacked rows. Admin-wide introductory copy, repeated protection badges, and redundant explanations are removed; errors and email action consequences remain visible. Shipment defaults use America/Vancouver; already-saved date-only values retain their calendar date. Dashboard references open the selected order.

## Local proof

All screenshots use synthetic local catalog/order fixtures. No production data was copied, no production records were changed, and no shipment or email form was submitted. Existing servers on ports 3100/3101 were preserved; this worktree used 3200–3202. Fixture product mutations are separate from the existing catalog test's product and are reset after testing.

- Unit tests cover publication/stock transitions, retained variant selections, stale/invalid payload rejection, Whistler no-op stock preservation, catalog visibility, and real checkout-service rejection before pending-order creation.
- Date tests cover UTC midnight, summer/winter Vancouver midnight, year rollover, daylight-saving transitions, and existing UTC-midnight date storage.
- Browser tests cover 1440/1200/768/390px products, keyboard Details disclosure, single-line prices/Edit controls, selected dashboard order links, existing/default shipment dates, and fixture product saves.
- Dedicated storefront proof uses `MOCK_WHISTLER_OUT_OF_STOCK=1`: Whistler remains listed, shows Out of stock, exposes no Add to cart action, and the local mock checkout rejects it without a session. Real service rejection is separately unit-tested.

### Results

- `pnpm lint`: passed, zero warnings.
- `pnpm db:generate` and validation against the local placeholder URL: passed; no migration executed.
- `pnpm typecheck`: passed after final code changes.
- `pnpm test`: 215 tests passed across 28 files.
- Full browser suite: 98 passed, 12 gated skips (11 historical evidence captures plus the separately executed stock fixture).
- Dedicated out-of-stock storefront test: 1 passed.
- Production-style `pnpm build`: passed with the production API/site URLs.
- Tracked-secret scan: zero findings. High/critical dependency gate passed; five existing moderate advisories remain.
- `git diff --check`: passed.

Initial browser attempts found occupied standard ports and two over-specific test locators (implicit select labels and an assumed disabled stock button). Explicit select label associations were added, the storefront assertion was aligned with its existing Out of stock text/no Add to cart behavior, and all affected tests passed on rerun. No storefront behavior change was needed.

### Reproduce

```bash
pnpm lint
pnpm db:generate
pnpm typecheck
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate
pnpm test
E2E_BASE_PORT=3200 pnpm test:e2e
MOCK_WHISTLER_OUT_OF_STOCK=1 E2E_BASE_PORT=3200 pnpm exec playwright test tests/e2e/admin-stock-storefront.spec.ts
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com NEXT_PUBLIC_SITE_URL=https://tigerpingpong.ca pnpm build
pnpm security:secrets
pnpm security:audit
```

The standard browser run retains historical evidence gates. The dedicated stock-state test is gated out of that run because the broader table suite also exercises in-stock Whistler; it is run separately using the command above. Shipment/date browser checks are read-only. No live Stripe checkout or email-delivery smoke test is appropriate for this task.

## Screenshots

![Lean desktop product list](admin-safety/products-desktop.png)
![Stacked mobile product list](admin-safety/products-mobile.png)
![Independent publication and stock controls](admin-safety/editor-desktop.png)
![Mobile editor](admin-safety/editor-mobile.png)

Additional local evidence, including the dashboard, order detail, other widths, and Whistler storefront, is in `output/admin-safety/` and is not committed.

## Release considerations

- No schema migration, backfill, dependency change, or production stock mutation is needed. Checkout, webhook, auth, and email implementation files are unchanged.
- Product PATCH now requires `published` and `inStock` instead of `availableForSale`. Mixed web/API versions reject saves safely; release both services and reload any old editor before editing. A rollback likewise requires matching web/API versions and does not revert catalog records.
- Stock is a purchase-availability switch, not a quantity count. Product readiness restrictions still apply before enabling stock; draft/archived status is preserved on unchanged hidden products.
- Local browser proof uses Chromium viewport sizes, not physical-device or screen-reader certification. Local Node is 24.16.0; hosted release checks use the repository's Node 20.19.5 configuration.
- The separate release documentation PR #171 is preserved. Both PRs touch the current-task record; reconcile that documentation when integrating without losing either release history or this task.
- Searchable Orders, fulfillment/email filters, staff audit history, and media editing improvements remain separately selected follow-ups. No merge or deployment is authorized by this task.

## Local Orders walkthrough follow-up

Shawn requested an order workflow example in the local preview. Added the missing protected GET order-list fixture and made TPP-TEST-002 consistently unshipped (blank tracking fields, no shipment email). TPP-TEST-001 remains the already-shipped example. The dashboard, list, and detail now use the same two synthetic order records. Shipment/email mutation routes remain absent from the fixture server.

The two affected browser scenarios (dashboard/date and list-to-unshipped/shipped details) passed against the running preview; targeted ESLint and diff checks passed. No production application code changed, so the prior full suite/build proof remains applicable to that code; the full suite was not repeated for this fixture-only follow-up. Preview navigation was also verified in the in-app browser.

## Office order summary and tracking follow-up

Shawn authorized automatic tracking URL usability and an office-printable order summary during local review on 2026-09-04, then selected customer/address, items, prices, totals, and tracking. Missing tracking reads **Waiting for tracking**.

New shipments start with **Select carrier**. Existing supported-carrier URL generation remains unchanged: choose the carrier and enter a tracking number; only **Other carrier** requires a manual URL. Existing saved carrier choices remain intact.

The order detail now links to a protected `/admin/orders/{reference}/print` preview. **Print / Save PDF** opens the browser print dialog for paper or PDF output. The Letter layout uses saved order snapshots, retains the pre-tax fallback when the final charged total is missing, and never infers paid status from a checkout amount. It includes saved shipment tracking and excludes internal notes, email delivery errors, and Stripe identifiers. Browser headers/footers and printer settings remain controlled by the office's print dialog. No runtime dependencies were added.

Changed implementation: `ShipmentForm`, `StaffOrderDetailPage`, the new print route/document/button/stylesheet/total helper, and print-only admin shell styles. Tests cover carrier selection and URL changes, print authorization, pending tracking, saved tracking, no mutation, responsive widths, and confirmed versus pre-tax totals. A 25-row synthetic layout stress test renders four pages with repeated item headers and order references; it does not alter any order record.

Evidence: `docs/qa/admin-safety/order-summary.png` and `order-summary-mobile.png`; generated local PDF in `output/admin-safety/order-summary-TPP-TEST-002.pdf`. The PDF and all pagination pages were rendered and visually inspected. A physical printer was not used, and shipment/email forms were never submitted.

Follow-up verification: `pnpm test` passed 222 tests across 29 files; `pnpm test:e2e` passed 101 with the same 12 gated skips. Lint, typecheck, Prisma generation/validation, production build, and the tracked-secret scan passed. Build and full browser checks ran against an identical source snapshot in a temporary local directory on ports 3300-3302, preserving the office preview on 3200. Final print layout changes were rechecked in the preview before that complete build/test run. The earlier standalone stock proof and dependency audit remain applicable; neither area changed in this follow-up.
