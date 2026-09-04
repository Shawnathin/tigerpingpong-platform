# Universal table pages recovery

Date: 2026-09-04
Branch: `codex/feature/recover-universal-table-pages`
Source: safety stash `ecd2dd5`, including its preserved untracked files.

## Recovered

All five table definitions, the shared story/feature/comparison/specification renderer, accessible horizontal feature carousel, reviewed-media mappings, local Portland patio composite, and unit/browser coverage applied cleanly to current `develop`. The original stash remains intact. No catalog write, stock change, payment/email change, or deployment occurred.

## Fresh proof

- Lint, typecheck, 189 unit tests, and production-style build passed.
- Tracked-secret scan passed with zero findings; high-severity dependency audit passed with five existing moderate advisories.
- Portland Outdoor screenshots at 390, 768, and 1440 pixels were captured in local, uncommitted `var/table-recovery/` and visually inspected at mobile and desktop widths. Story, horizontal feature cards, comparison cards, and responsive specifications are restored. No document overflow was measured at those three widths.
- Full browser run: 91 passed, 11 existing evidence-only skips, one five-route colour test timed out waiting for the final page's load event. The final test change only increases its budget to 60 seconds, matching the other five-route test; the original load wait and assertions remain. The colour test passed on rerun in 3.7 seconds. A trial DOM-ready wait was discarded after it clicked before hydration. Six other focused table tests also passed. Historical results in `design-qa.md` remain historical evidence only.

## Before production promotion

- The recovered Portland patio composite is labelled `local_preview_only`, has no Cloudinary URL, and is excluded from catalog application. Resolve production media approval/storage before releasing this draft. Its local rendition is preserved for review.
- Comparison requires all three configured models; Portland Indoor comparison therefore disappears while Whistler is absent from the public catalog. Decide whether to retain that behavior or support the remaining two models. Do not publish Whistler merely to complete a comparison.
- Recovered fact sheets cite a July 28 owner decision and current product records. Review the recovered specifications, warranty language, and media with the page preview before promotion; recovery is not a new confirmation of those claims.

Whistler remains out of stock per Shawn. Its definition is recovered, but its production publication and stock state are unchanged.
