# Paddle Buddy community review — issue #189

Shawn selected packaging the existing community work for cloud review, including a public Reddit link. Branch: `codex/issue-189-paddlebuddy-community-rollout`; PR targets `develop`. Review the protected intake queue/API/migration, the public community link, approved final Reddit exports, and `docs/launch/paddlebuddy-community-rollout-package.md` for live configuration and handoff details. Use the SHA-bound formal review contract in `docs/agent/systems-4.1.md`. No deployment or production migration is authorized by this handoff. Earlier task records below are retained as history.

---

# Systems 4.1 canary handoff

## Selected: local/GitHub collaboration loop adoption

Issue [#187](https://github.com/Shawnathin/tigerpingpong-platform/issues/187)
selects a wrapper adoption task, not a production rebuild. Candidate branch:
`codex/docs/systems-4-1-review-loop-canary`, based on `develop`, with a draft
PR targeting `develop`. It adds only a public-safe local/GitHub review contract
and a local SHA-bound GitHub review-readback wrapper.

No production deployment, runtime, architecture, database, payment, admin,
secret, or release behavior change is authorized. Keep the existing canonical
local Tiger system in place. The local Phase 1 baseline must remain local-only
and must not include secret values, machine paths, local database data, or
private operational evidence in GitHub.

Status: candidate prepared for cloud review. Local validation is not claimed in
this candidate because the current session has no usable local terminal. Cloud
review must use the exact review contract in `docs/agent/systems-4.1.md`.
After a SHA-bound `FIX_REQUIRED` review, continue the same branch and run the
existing relevant local checks before requesting another review. Do not merge or
deploy this canary as part of Systems 4.1 adoption.

---

# Current Task

## Selected: homepage fall refresh release packaging

Shawn authorized the bounded fall-refresh release from a fresh branch based on current
`origin/main`: `codex/feature/homepage-fall-refresh-v2`. Preserve the approved local
homepage direction in place—no redesign, architecture work, dependency changes, branch
reconciliation, or changes outside the homepage and directly required proof. The seasonal
refresh replaces summer emphasis with game-night copy, retains the existing sections and
customer journeys, and uses the already approved Cloudinary `NIT-034` Tiger Club Night
image rather than a machine-local preview asset. The PR targets `main`; no merge or deploy
is authorized.

## Selected: Safari table-gallery sizing regression

Shawn reported on 2026-09-13 that the Expo photo remains oversized beneath the
purchase rail after release #177. The fresh screenshot confirms a layout issue,
not a request to remove another image. Branch:
`codex/fix/safari-table-gallery-sizing`, based on current `develop`.

WebKit reproduces the live failure: an 814px gallery contains a 1267px figure.
Constrain the table gallery's grid column with `minmax(0, 1fr)`; preserve all
product images, copy, commerce, and the existing visual design. Add dedicated
WebKit/Chromium geometry tests and WebKit installation to CI. Local red/green
proof and checks are recorded in `docs/qa/safari-table-gallery-sizing.md`.
Task PR targets `develop`; production promotion remains Shawn's merge step.

## Selected: admin safety and usability

Task key: `TPP-ADMIN-SAFETY-USABILITY`. Shawn approved the jointly refined plan on 2026-09-04. Implement independent publication/stock, Vancouver shipment-date defaults, direct dashboard order links, a responsive lean product table, and copy reduction across admin.

Branch: `codex/fix/admin-safety-usability`, isolated from current `develop`. PR targets `develop`. Shawn approved the verified local result on 2026-09-04 ("perfect - approved"), authorizing the task PR merge into `develop` after hosted checks pass. Production promotion to `main` and deployment remain separately unapproved. Preserve Whistler as published/out of stock, existing variant choices, auth, checkout/payment/webhooks, and email behavior. All mutation proof uses local fixtures; never submit shipment/email forms or change production records.

Required proof: unit/browser regression coverage, desktop/mobile screenshots, lint, typecheck, Prisma generation/validation, and production build. Status: implemented and locally verified. All 222 unit tests and 102 standard browser tests pass, plus the dedicated out-of-stock storefront test; lint, typecheck, Prisma generation/validation, production build, and security gates pass. Twelve gated browser cases are excluded from the standard run, including the separately exercised stock fixture. Evidence and release considerations: `docs/qa/admin-safety-usability.md`. PR [#172](https://github.com/Shawnathin/tigerpingpong-platform/pull/172) targets `develop`. Shawn review is complete. Hosted checks and the approved merge commit into `develop` are pending; production promotion remains a separate approval.

Shawn extended this task during local order review: clarify automatic carrier tracking links and add an office-printable order summary containing customer/address, items, prices, totals, and tracking. Missing tracking reads **Waiting for tracking**. Use the browser print dialog for paper or Save as PDF; no shipment/email submissions are authorized. Shawn then requested a cleaner print button and ACE/Day & Ross plus Freightcom LTL carrier choices; these are also authorized in this task.

Deferred: searchable Orders queue, fulfillment/email filters, audit history, media-editor improvements, quantity inventory, and broad redesign.

## Historical completed task: universal table-page recovery

Shawn selected recovery on 2026-09-04. Restore safety stash `ecd2dd5` onto current `develop` on `codex/feature/recover-universal-table-pages`, validate the horizontal feature cards and model-specific stories for all five models, and prepare a draft PR into `develop`.

PR #169 merged into develop and the separately approved promotion #170 released the table pages on 2026-09-04. Whistler is published with checkout disabled. The detailed production release record remains in the separate draft documentation PR #171; this admin task does not alter that PR or repeat its production actions.

## Historical completed task: automated emails

The following task card is retained as the previous email milestone, not the scope of the current admin task.

Recover, review, activate, and prove automated customer order, staff new-order, and shipment emails.

## Stable task key

`TPP-AUTOMATED-ORDER-EMAILS-RECOVERY`

## Selected task card

Reconcile the preserved Resend-backed implementation with current commerce, shipping, promotion, admin, and deployment code. Add the owner-approved staff new-paid-order alert. Prepare a focused task branch and pull request to `develop`; keep provider DNS, Render environment changes, migration execution, deployment, and live inbox proof as a separately controlled activation lane.

## Boundaries

- Work only on `codex/feature/automated-order-shipment-emails` and target its task pull request to `develop`, never `main`.
- Preserve hosted Stripe Checkout, webhook-confirmed payment truth, webhook idempotency, Canada-only shipping, Stripe Tax behaviour, and all current pricing/shipping rules.
- Send the order-received email only after the backend has accepted the verified paid webhook transition.
- Send one staff new-order alert from that same verified paid transition; duplicate webhooks must not duplicate it.
- Send the shipment email only from the protected shipment workflow; saving or sending email must never mutate payment truth.
- Keep Resend credentials and sender configuration server-only. Do not commit secrets, change DNS, apply the migration, deploy, or send production email in this code-recovery task.
- Preserve current protected admin/internal routes and the latest table-accessory pricing/order presentation.
- Use an idempotent database outbox and stable provider idempotency keys so failures remain visible and retryable.

## Required proof

- The recovered branch is based on current `origin/develop` and contains only the focused email feature.
- A verified paid transition queues exactly one order-received email for the customer email stored from Stripe.
- The same transition queues exactly one staff alert to the server-only configured inbox.
- Duplicate Stripe deliveries do not create duplicate customer emails.
- Saving a supported carrier and tracking number generates the carrier link and queues exactly one shipment email.
- Custom carriers require a safe HTTP(S) tracking link.
- Email failures leave payment and shipment records intact, record a safe error, and remain retryable.
- Protected admin detail shows delivery status and supports a deliberate retry.
- Prisma generation/validation, unit tests, lint, typecheck, production build, focused browser proof, tracked-secret scanning, and the high-severity dependency audit pass on current `develop`.

## Status

Reactivated on 2026-08-23 after a project audit found the complete July implementation uncommitted on a branch 58 commits behind `origin/develop`. The preserved implementation passed its historical baseline locally, was checkpointed without unrelated `output/` artifacts, and is now reconciled onto current `origin/develop` as one focused commit.

The recovered implementation preserves the current table-accessory pricing and shipping code. Its migration is ordered after the already-shipped July pricing migration and enables RLS with no public policies. The paid webhook only persists the idempotent customer and staff outbox rows and never waits for the Resend request. The retry worker excludes permanently blocked deliveries and stops after five automatic attempts. Prisma generation/validation, lint, typecheck, all 154 unit tests, the production build, all 92 active browser tests, tracked-secret scanning, and the high-severity production dependency audit pass. Eleven evidence-only browser tests remain skipped by their existing gates, and five existing moderate advisories remain below the configured gate.

PR #166 merged the separate `nanoid@3.3.18` security hotfix into `develop` after complete local and hosted release-readiness proof. The email branch is rebased onto that patched baseline, and the complete local `pnpm launch:preflight` passes.

The owner confirmed on 2026-09-04 that `tigerpingpong.com` and `info@tigerpingpong.com` are configured in Resend, replacing the abandoned `updates.tigerpingpong.ca` plan. PR #165 merged the reviewed implementation into `develop`, and production PR #167 passed the complete hosted gate before merging `develop` into `main` as `79d7f7c`. Render applied `20260823210000_order_email_outbox`, initialized `OrderEmailModule`, and deployed that exact commit to both API and web services. API health, catalog health, and the storefront returned HTTP 200 after release.

The first protected staff-only production proof used an existing paid order without contacting its customer or changing payment/shipment state. The API returned HTTP 201 with `staff_new_order` in `sent` status and a provider acceptance timestamp, and the owner confirmed receipt in `info@tigerpingpong.com`. The first controlled customer order-received and shipment inbox proofs remain operational follow-up rather than code/deployment blockers.

Before activation, the three messages were moved into a reusable, side-effect-free template module with one shared Tiger email layout. The design and language follow the approved About/Contact treatment, customer messages expose the current support email and phone, and a local preview command renders representative HTML without contacting Resend. Template-focused tests cover shared branding, customer/staff separation, responsive markup, escaping, tracking links, and the pre-tax fallback label.
