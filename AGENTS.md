# AGENTS.md

Repository instructions for Codex and other coding agents working on the TigerPingPong custom ecommerce platform.

Keep this file short, current, and project-specific. If a rule becomes wrong, fix this file before relying on it. A short accurate file beats a giant stale one.

## Project snapshot

- **Project name:** TigerPingPong Platform
- **Project type:** Custom ecommerce web platform / monorepo
- **Package manager:** `pnpm@9.12.0`
- **Runtime:** Node `>=20.11.0`
- **Primary language:** TypeScript
- **Frontend:** Next.js 14 in `apps/web`
- **Backend/API:** NestJS in `apps/api`
- **Database:** Supabase Postgres through Prisma in `packages/db`
- **Payments:** Stripe Checkout and Stripe webhooks
- **Production targets:** Render web service and Render API/platform service
- **Current storefront:** `https://tigerpingpong-web.onrender.com`
- **Current API/webhook service:** `https://tigerpingpong-platform.onrender.com`
- **Current Stripe webhook endpoint:** `https://tigerpingpong-platform.onrender.com/webhooks/stripe`

## Product purpose

This repo powers the custom TigerPingPong ecommerce launch. It owns the public storefront, catalog/product pages, cart, Stripe Checkout creation, webhook-confirmed paid orders, protected internal order review, protected admin shell, and catalog/media import tooling.

The project is past the basic-feasibility stage. The current work is launch discipline: product-page polish, real product content, checkout trust, minimal staff fulfillment records, URL/SEO planning, category/home/footer polish, final QA, then domain cutover.

## Current priorities

1. Preserve the working checkout/payment/order foundation.
2. Improve product pages with real content, media galleries, and required product options.
3. Keep admin work minimal until launch-critical customer-facing and SEO work is handled.
4. Make URL/SEO decisions deliberately before redirects, canonicals, sitemap, robots, or DNS changes.
5. Keep raw media local; use Cloudinary as the asset store.

## Non-goals unless explicitly requested

- Do not rebuild this as Shopify, BigCommerce, or a theme shortcut.
- Do not replace hosted Stripe Checkout with a custom payment form.
- Do not build a full BigCommerce clone admin before launch.
- Do not build automated shipment emails before launch; manual tracking emails are acceptable for V1.
- Do not change DNS or perform domain cutover.
- Do not implement URL redirects, canonicals, sitemap, or robots before the URL structure is reviewed.
- Do not commit raw `images/` assets, secrets, `.env` files, or Cloudinary credentials.

## Repository map

```text
.
├── apps/
│   ├── api/                  # NestJS backend/API/webhook service
│   └── web/                  # Next.js storefront/admin/internal UI
├── packages/
│   ├── db/                   # Prisma schema/client/import scripts
│   └── shared/               # Shared TypeScript contracts/helpers
├── data/                     # Import-review/catalog data artifacts
├── docs/                     # Architecture docs, build logs, QA notes, prompts
├── scripts/                  # Operational scripts such as Cloudinary media upload
├── tools/                    # Scraper/import validation tooling
├── package.json              # Root pnpm scripts
├── pnpm-workspace.yaml       # Monorepo workspace definition
└── .env.example              # Environment variable template only
```

## Canonical commands

Run from the repository root unless a task explicitly says otherwise.

```bash
pnpm install
pnpm dev
pnpm dev:api
pnpm dev:web
pnpm build
pnpm typecheck
pnpm lint
pnpm format
pnpm format:write
pnpm db:generate
pnpm db:validate
pnpm import:tiger:dev
pnpm media:cloudinary:products
```

Useful production-style web build:

```bash
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build
```

Common database validation command:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate
```

The repo currently has lint/typecheck/build scripts. Do not invent missing test scripts; inspect package scripts first.

## Workspace commands

```bash
pnpm --filter @tigerpingpong/api dev
pnpm --filter @tigerpingpong/api build
pnpm --filter @tigerpingpong/api typecheck
pnpm --filter @tigerpingpong/web dev
pnpm --filter @tigerpingpong/web build
pnpm --filter @tigerpingpong/web typecheck
pnpm --filter @tigerpingpong/db prisma:generate
pnpm --filter @tigerpingpong/db prisma:validate
pnpm --filter @tigerpingpong/db import:tiger:dev
pnpm --filter @tigerpingpong/shared build
```

## Core launch guardrails

These are locked unless Shawn explicitly approves a change:

- Stripe redirect is not payment truth.
- Client code never marks an order paid.
- Backend order status is payment truth.
- Stripe webhook-confirmed paid transition remains authoritative.
- Success page reads backend-confirmed status.
- Internal/admin routes stay protected.
- Current webhook endpoint stays on the platform service.
- Public storefront navigation must not expose `/admin` or `/internal/orders`.
- Do not move checkout/session/webhook logic casually. Payment code is the loaded bear trap in the room.

## Shipping rule

V1 shipping rule:

- Canada only.
- Orders over `$100 CAD` ship free across Canada.
- Orders `$100 CAD` or under get `$15 CAD` flat-rate shipping.
- Exactly `$100.00 CAD` still gets `$15 CAD` flat-rate shipping.

Do not invent product-specific shipping promises. Table checkout/free shipping needs explicit business sign-off before custom-domain launch.

## Product/content rules

- Do not invent product descriptions, dimensions, colours, prices, warranties, availability, or shipping claims.
- Preserve sourced facts from current TigerPingPong data/content.
- If product information is missing or unclear, mark it for human review.
- Required options, such as table top colour, must be selected before add-to-cart where applicable.
- Different required option choices should remain separate cart/order lines where supported.
- Cloudinary media takes priority over fallback media.
- Preserve fallback media until Cloudinary media is verified through the deployed API/UI.

## Admin/operations scope

Current V1 admin is intentionally simple:

- Protected `/admin` UI exists.
- Admin API/UI is currently read-oriented unless a task explicitly adds a minimal write.
- Inventory and audit log can remain `not_configured` until their turn.
- Minimal shipped-record work should only capture carrier, tracking number, tracking URL, shipped date, internal note, and staff/timestamp if implemented.
- No automated customer shipment email is required for V1.

## SEO/domain rules

- Do not change DNS.
- Do not decide canonical domain in code without human review.
- Do not add or alter redirects, canonicals, sitemap, or robots until URL structure is approved.
- Preserve or one-hop 301 important legacy URLs only after the redirect map is reviewed.
- Footer links must match final URL decisions; no dead placeholders and no admin/internal links.

## Security and privacy

- Never commit `.env`, API keys, tokens, private keys, credentials, session cookies, production data, or Cloudinary secrets.
- Do not print secrets in logs, screenshots, build logs, PR comments, or summaries.
- Treat order/customer data as sensitive by default.
- Admin/internal data must be protected server-side; hidden links or frontend checks are not enough.
- Preserve Basic Auth protection for web `/admin` and `/internal/*` routes unless a task explicitly changes auth.
- Preserve `x-internal-orders-token` protection on protected API routes.
- Use `server-only` patterns for backend tokens in the web app.

## Payment and webhook rules

Payment code is high risk. Be conservative.

- Verify Stripe webhook signatures.
- Treat webhook payloads as untrusted input.
- Keep webhook handling idempotent.
- Never trust client-provided prices, totals, product names, shipping, payment status, or order status.
- Backend checkout must calculate totals from database/catalog data.
- Do not duplicate charges.
- Do not mark orders paid from the success page, cart page, product page, or client storage.
- Do not log full Stripe payloads or sensitive customer/payment details.

## Database and migrations

- Prisma schema lives in `packages/db/prisma/schema.prisma`.
- Do not edit applied production migrations unless explicitly instructed.
- Create new migrations for schema changes.
- Be careful with RLS. Current architecture is frontend -> NestJS API -> Prisma -> Supabase Postgres.
- Do not add broad Supabase `anon` or `authenticated` policies unless the architecture is explicitly changed.
- Do not run destructive migrations without explicit human approval.
- Update generated Prisma client/types when schema changes require it.

## Frontend rules

- Follow the existing Next.js App Router structure in `apps/web/src/app`.
- Preserve public nav safety: no public admin/internal links.
- Handle loading, empty, error, and success states deliberately.
- Keep product/cart controls accessible: real buttons, labels, keyboard-friendly controls, useful alt text.
- Keep mobile layout in mind for storefront, cart, gallery, admin, and internal pages.
- Do not add a new UI library or state-management library unless explicitly approved.
- Existing cart state is anonymous/localStorage-based; do not treat it as payment truth.

## Backend/API rules

- Follow existing NestJS module/controller/service patterns.
- Validate all untrusted input at API boundaries.
- Keep response shapes consistent with existing contracts.
- Return safe errors; do not leak internal stack traces or secret/config details.
- Keep protected routes protected on the server/API layer.
- Avoid concurrent DB query spikes in admin/dashboard paths; production has previously hit connection pressure.
- Prefer graceful section-level degradation for optional admin dashboard sections.

## Media/import rules

- Raw root `images/` must stay local and out of GitHub.
- Cloudinary secure URLs and mappings can be committed when they do not include credentials.
- Cloudinary credentials must only come from env/secret manager.
- Upload scripts should default to safe/dry-run behavior unless the command clearly requires a real upload.
- Preserve source URL/traceability fields in media manifests where practical.
- Do not remove fallback media until live/deployed catalog media is verified.

## Git and PR workflow

- Work on a branch, not directly on `main`.
- Keep PRs focused and boring.
- Do not mix feature work with broad cleanup.
- Do not merge unrelated launch steps into the same PR.
- Use descriptive branch names such as:
  - `feature/044-product-media-gallery-options-v1`
  - `docs/047-url-structure-footer-planning`
  - `fix/admin-dashboard-summary-production-503`
- PR descriptions should include summary, validation, risks, and screenshots/recordings for UI changes when useful.
- Prefer draft PRs for agent work until reviewed.

## Human-facing changelog protocol

Human-facing changelogs are for project memory, not git history, commit logs, or exhaustive file-change dumps. Do not create one for every small task.

Create or update a changelog only at meaningful milestones, such as a major PR merge, major branch parked, launch-critical decision, payment/shipping/admin/SEO behavior change, product-page/content architecture decision, important deferral, or human follow-up needed later.

- Prefer `Change Logs/` when that folder already exists in the repo or workspace.
- If no human-readable changelog folder exists, ask before creating one unless Shawn explicitly says to create it.
- Keep entries short, practical, and written for Shawn/future project review.
- Include key decisions, why they were made, what changed, what stayed unchanged, deferred work, risks, and follow-up items.
- Do not include secrets, env values, tokens, customer data, or private payment data.
- Do not paste long diffs, duplicate the PR body, or list every touched file.
- Include only what a human needs to find later.

Recommended structure:

```md
# <Milestone Name>

Date:
Branch / PR:
Status:

## Decision made
What changed or what was decided.

## Why
Why this decision was made.

## What changed
Human-readable summary.

## What did not change
Important boundaries / safety rules.

## Deferred
What we intentionally did not do yet.

## Follow-up
What Shawn or a future Codex session needs to do later.

## Human notes
Anything Shawn needs to remember.
```

If a user says "note this," "remember this for later," "parking this," or "this is a milestone," consider whether it belongs in a human-facing changelog or project note. If unsure whether a changelog is warranted, ask instead of creating clutter.

## Definition of done

A task is done only when the requested change is implemented and reasonably verified.

Before finalizing, report:

1. What changed.
2. Files touched.
3. Commands/checks run and results.
4. Anything not run and why.
5. Assumptions, risks, and follow-up work.

At minimum for most code changes, run relevant checks such as:

```bash
pnpm lint
pnpm typecheck
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build
```

Also run `pnpm db:generate` / `pnpm db:validate` when Prisma or database-facing code changes.

## Things agents must not do without explicit permission

- Change DNS or perform domain cutover.
- Move the Stripe webhook endpoint.
- Change payment truth logic.
- Replace hosted Stripe Checkout.
- Add real email/text sending.
- Add analytics/tracking.
- Add a new paid service.
- Disable auth, authorization, validation, CSRF/CORS protections, or RLS protections.
- Drop columns/tables or delete production data.
- Commit secrets, private data, raw media, or env files.
- Upgrade major framework/runtime versions.
- Rewrite large parts of the app.
- Replace the styling system.

## Maintenance loop

Update this file when setup commands, project structure, launch guardrails, test/build commands, or high-risk workflows change. If an agent makes the same mistake twice, add a clear rule here.
