# PR 086: Full Website Code QA Audit

Date: 2026-06-16
Branch / PR: `codex/pr-086-full-website-code-qa-audit`
Status: Draft PR audit report
Baseline: `docs/planning/085-launch-readiness-audit-cutover-checklist.md`

## 1. Executive Summary

### Overall launch posture

TigerPingPong is close to launch from a code architecture perspective. The
public storefront, category pages, table PDPs, accessory PDPs, Aqua PDP,
cart, backend checkout session creation, webhook-confirmed payment truth,
resources, sitemap, robots, and protected admin/internal surfaces are all
present and mostly coherent.

The highest confidence area is payment ownership: the cart is only a client
preview, checkout prices are loaded from the backend catalog, shipping is
calculated server-side, Stripe Checkout is hosted by Stripe, and the success
page reads backend order status instead of marking payment itself.

The site is not launch-ready until the PR 085 blockers are closed. The audit
also found a few pre-launch risks that should be fixed or explicitly accepted,
especially around tax-total compatibility, public catalog debug query flags,
and final mobile/visual QA.

### Top 5 risks

1. Stripe Tax is still the launch blocker, and current webhook validation
   compares Stripe `amount_total` exactly to app `subtotal + shipping`.
   If Stripe Tax adds tax to `amount_total`, paid orders may go to manual
   review until the tax behavior is implemented and retested.
2. Public catalog endpoints accept `includeInternal=1` and
   `includeReplacementParts=1` without authentication. That exposes source
   fields and non-public replacement-part rows through the public API.
3. Final 390px mobile/browser visual QA remains incomplete in this audit
   because the in-app browser connection closed during the viewport pass.
   HTTP route checks passed, but visual overlap/interaction issues still need
   a deliberate browser sweep.
4. Import validator passes with 14 warnings, including table shipping policy,
   checkout policy, Cloudinary upload, Aqua source URL, and resource crawl
   review flags. Some are stale planning flags, but they should be reviewed
   before domain cutover.
5. Admin is no longer fully read-only: protected product media mapping has
   POST/PATCH/DELETE endpoints. That may be intentional from prior media work,
   but it should be treated as a real protected write surface during launch
   smoke testing.

### Launchability

Yes, the site looks launchable after known blockers are resolved, assuming:

- Stripe Tax setup and Canadian province retesting are completed.
- Tax-inclusive Stripe totals are reconciled with webhook/payment-truth logic.
- Render web/API env vars are verified immediately before cutover.
- Protected admin/internal smoke checks pass on the final deploy.
- A final browser-based mobile sweep passes or issues are accepted.

## 2. Critical Blockers

### 1. Stripe Tax and webhook total validation are not launch-safe yet

PR 085 already names Stripe Tax / Canadian province tax setup and retesting as
the biggest launch blocker. Code review confirms why this is a hard blocker:

- Checkout creates Stripe sessions from app-owned line items and shipping, but
  does not configure `automatic_tax` in the session creation code.
- The order total is currently `subtotalCents + shippingCents` in
  `apps/api/src/checkout/checkout.service.ts`.
- The webhook requires `session.amount_total === order.totalCents` in
  `apps/api/src/webhooks/stripe-webhook.service.ts`.

That preserves payment truth today, but it means tax cannot simply appear in
Stripe totals without a matching backend decision. If Stripe Tax adds tax to
Checkout, the current webhook will likely classify paid sessions as
`manual_review` because Stripe's total will exceed the app's stored total.

Required before launch:

- Configure Stripe Tax from the secure office environment.
- Decide how tax amounts are represented in backend orders.
- Retest BC, AB, ON, QC, and an HST province.
- Confirm webhook payment-truth behavior with tax-inclusive Stripe totals.

### 2. Render/env verification remains required before domain cutover

This audit cannot inspect Render secret values and should not print or rotate
secrets. PR 085 remains authoritative: verify `DATABASE_URL`,
`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, Stripe mode/secrets,
webhook secret, checkout success/cancel URLs, `CORS_ORIGIN`, Basic Auth envs,
and internal/admin API token envs before DNS/domain changes.

### 3. Final production smoke test remains required

This audit performed read-only route and API checks, but did not complete real
payments, production imports, DNS changes, credentialed admin reads, or the
full mobile browser flow. A final smoke test must still happen immediately
before cutover.

## 3. High Priority Pre-Launch Issues

### 1. Public catalog debug query flags expose internal/source fields

The public catalog controller accepts `includeInternal` and
`includeReplacementParts` query parameters on public endpoints:

- `apps/api/src/catalog/catalog.controller.ts`
- `apps/api/src/catalog/catalog.service.ts`

Observed deployed behavior:

- `/catalog/products/tiger-aqua-outdoor-indoor-paddle?includeInternal=1`
  returns fields such as `sourceUrl`, `legacyPath`, `sourceReviewStatus`,
  `importReviewStatus`, and variant source data.
- `/catalog/products?includeReplacementParts=1` returns replacement-part
  products that are otherwise not public navigation products.

This does not appear to expose secrets, credentials, or customer data. It does
expose internal source/review metadata through an unauthenticated public API.
For launch, either remove those flags from public endpoints or require the same
internal/admin token used elsewhere.

### 2. Admin media mapping is a protected write surface

The admin controller exposes protected product media write endpoints:

- `POST /api/admin/products/:id/media`
- `PATCH /api/admin/products/:id/media/:mediaId`
- `DELETE /api/admin/products/:id/media/:mediaId`

The web UI exposes corresponding server actions under protected `/admin`.
This is not public and uses the internal token path, but it means admin is not
strictly read-only anymore. Treat product media mapping as launch-relevant
admin write functionality: smoke test auth, write validation, and rollback
expectations if it remains available during launch.

### 3. Import validator warnings need human review

`pnpm validate:tiger-import` passed with 0 errors and 14 warnings. Warnings
include table shipping policy required, all V1 checkout candidates needing
checkout policy review, Cloudinary upload required, Aqua source URL review,
and resource article crawl review.

Some warnings may be historical planning residue because the live site already
has Cloudinary-backed media and resource pages, but the report should be
reviewed before cutover so unresolved business/content flags are not missed.

### 4. Final 390px mobile visual sweep is still open

Build and HTTP checks passed, and PR 085 already lists final mobile polish as
open. The in-app browser viewport check was attempted in this audit, but the
browser connection closed before results were returned. Run a dedicated mobile
visual pass for homepage, category pages, PDPs, cart, resources, and checkout
handoff.

### 5. Replacement Parts is publicly linked but intentionally absent from SEO

The public nav/footer link to `/replacement-parts/`, and the route returns a
storefront page. The sitemap intentionally excludes replacement parts. That may
be correct for V1, but the final URL/SEO pass should explicitly decide whether
Replacement Parts is a support page, a noindex-ish utility page, or a public
SEO target.

## 4. Medium Priority Cleanup

- Add explicit authenticated internal/admin versions of catalog debug reads if
  `includeInternal` is still useful.
- Consider moving magic commerce constants into one shared source of truth for
  shipping threshold, flat-rate shipping, currency, and checkout purchase
  modes. The current frontend/backend constants match, but duplicated constants
  are easy to drift.
- Add a small automated checkout contract test around exactly `$100 CAD`,
  over `$100 CAD`, required options, and variant-priced options if the repo
  later gets a real test harness.
- Review resource/article JSON-LD and article metadata after final domain
  cutover.
- Review unsupported product/package fallback behavior if the catalog API is
  temporarily unavailable. Current pages degrade to friendly errors, but launch
  smoke should confirm the deployed UX.

## 5. Post-Launch Polish/Debt

- PR #49 shipped-order admin can remain parked if manual tracking emails are
  operationally acceptable for V1.
- Inventory and audit log remain `not_configured` in admin, which is acceptable
  for V1 if no broader admin writes are introduced.
- Automated shipment emails remain deferred for V1.
- Legacy redirect map can follow after cutover if not required for launch.
- Vice Paddle media alignment, Aqua media quality, and final image/crop polish
  remain good post-launch or just-before-launch cleanup.

## 6. Security/Payment Findings

Be blunt: the payment architecture is conservative and mostly correct, but tax
is not launch-safe yet.

Confirmed positive findings:

- Stripe redirect is not payment truth.
- Client cart state never marks an order paid.
- Success page reads backend checkout/order status.
- Backend checkout reloads products from Prisma and calculates unit prices,
  variant prices, subtotal, shipping, and total server-side.
- Client-tampered cart prices do not become Checkout prices.
- Table top colour and price-distinct package options are revalidated by the
  backend against checkoutable variants.
- Stripe webhook signatures are verified from raw body.
- Webhook processing records Stripe event IDs and handles duplicate events.
- Webhook checks session id, client reference id, metadata order id, mode,
  session status, payment status, currency, subtotal, shipping, total, shipping
  country, order item totals, shipping rule, and optional livemode.
- Canada-only shipping collection is configured in Stripe Checkout with
  allowed country `CA`.
- Shipping rule matches V1: subtotal over `$100 CAD` ships free, `$100 CAD` or
  under gets `$15 CAD`.

Risks and watch items:

- Tax is not represented in backend order totals yet. Current webhook exact
  total validation is good for safety but incompatible with surprise tax lines.
- Public catalog internal query flags should be locked down before launch.
- Admin media mapping writes should be intentionally accepted and smoke-tested.
- Protected web routes fail closed when Basic Auth envs are missing.
- Protected API routes use `x-internal-orders-token` with timing-safe compare.
- Admin/internal responses include no-store and noindex headers.
- Public nav/footer did not expose `/admin` or `/internal/orders` in code or
  deployed route checks.

## 7. SEO Findings

Confirmed positive findings:

- `NEXT_PUBLIC_SITE_URL` feeds canonical URL generation, sitemap, robots, and
  metadata base.
- The default canonical site URL is `https://tigerpingpong.ca`.
- Render `.onrender.com` and localhost site URLs normalize back to the final
  `.ca` canonical in SEO helpers.
- `robots.txt` is reachable and disallows `/admin/`, `/internal/`, `/api/`,
  `/catalog-preview/`, and `/checkout/`.
- `sitemap.xml` is reachable and uses `https://tigerpingpong.ca` URLs, not the
  Render domain.
- Sitemap did not include `/admin`, `/internal`, `/checkout`,
  `/catalog-preview`, or old `tigerpingpong.com` URLs in deployed checks.
- All four resource article routes returned `200`.
- Aqua PDP appears in the sitemap and public product API.
- App-code search did not find old free-shipping-over-$50 copy in active
  storefront source. `$50` appears as a real product price and historical data,
  not as launch shipping policy.

Watch items:

- Final canonical behavior across apex/www `.ca` and `.com` remains a domain
  decision from PR 085.
- Search Console and Bing submission remain post-cutover tasks.
- Replacement Parts public link vs sitemap exclusion should be confirmed.
- Support email still uses `info@tigerpingpong.com`; this appears intentional
  contact information, not an old internal link, but final brand/domain review
  should approve it.

## 8. Mobile/UX Findings

Confirmed by code and HTTP checks:

- Public route coverage is broad and current Render routes returned `200`.
- PDPs include required option radio groups and block add-to-cart with a
  selection error when required options are missing.
- Cart has add/remove/quantity controls, disabled states for min/max quantity,
  checkout busy state, and a clear backend payment-truth message.
- Cart and PDP thumbnails have alt text or fallback initials.
- Empty cart state links back to shopping.
- Checkout failure has a customer-safe error message.

Remaining risk:

- Full mobile visual QA was not completed in this audit due to browser tool
  interruption. Do not treat this report as a replacement for a 390px mobile
  browser sweep.

## 9. Admin/Operations Findings

Confirmed positive findings:

- `/admin` and `/internal/orders` returned `401` without credentials on the
  deployed web service.
- `/internal/orders` and `/api/admin/dashboard/summary` returned `401` without
  token on the deployed API/platform service.
- Web middleware protects `/internal/:path*`, `/admin`, and `/admin/:path*`.
- API admin/internal routes require `x-internal-orders-token`.
- Admin/internal web and API responses set no-store and noindex-style headers.
- Dashboard degrades optional inventory/audit-log sections to
  `not_configured`.

Risks and deferred ops:

- Credentialed admin/internal smoke checks were not run in this audit because
  no secrets should be exposed or printed.
- Product media mapping writes exist and need protected smoke/rollback clarity.
- PR #49 shipment admin remains parked unless Shawn explicitly decides to
  merge it.
- Staff fulfillment process still needs final operational confirmation:
  where paid orders are reviewed and how manual tracking emails are sent.

## 10. Recommended Next PR Sequence

1. **Stripe Tax readiness PR / office test pass**
   Configure Stripe Tax, decide backend tax representation, and retest Canadian
   provinces without weakening webhook payment truth.
2. **Public catalog query hardening PR**
   Remove unauthenticated `includeInternal` and `includeReplacementParts` from
   public catalog endpoints, or move them behind protected admin/internal API.
3. **Final mobile and route QA PR**
   Run browser-based 390px and desktop smoke tests for public pages, cart,
   required options, sitemap, robots, and protected no-auth checks.
4. **Admin/media write acceptance or lockdown PR**
   Decide whether protected media mapping writes stay available through launch;
   document/smoke-test or temporarily hide/lock them.
5. **Launch cutover runbook execution**
   Verify Render envs, DNS/SSL, canonical domain, Stripe return URLs, webhook
   endpoint, protected routes, and rollback plan.
6. **Post-cutover search and polish**
   Submit sitemap, inspect key URLs, handle legacy redirects if approved, and
   finish media/mobile polish.

## 11. Suggested Codex Prompts

### Highest priority blocker fix

```text
Use the PR 085 launch-readiness checklist and PR 086 audit report as context.
Create a focused Stripe Tax readiness PR for TigerPingPong. Do not weaken
payment truth. Review checkout session creation and Stripe webhook validation,
then implement the minimal code/docs changes needed so Canadian province tax
can be represented and verified safely after Stripe Tax is configured from the
office. Do not complete real payments, change DNS, run imports, or expose
secrets. Include validation steps and a province retest checklist.
```

### Next QA/fix PR

```text
Use docs/planning/086-full-website-code-qa-audit.md as the source of truth.
Create a focused pre-launch hardening PR for public catalog API query flags.
Remove or protect unauthenticated includeInternal/includeReplacementParts
behavior on public catalog endpoints without changing public storefront routes,
checkout, webhook, tax, database migrations, imports, or product data. Add or
update docs/tests/checks as appropriate, then run lint/typecheck/build and
route/API no-auth checks.
```

### Admin/shipment readiness

```text
Use PR 085 and PR 086 as context. Review the current protected admin/internal
operations surface and PR #49 shipped-order admin status. Produce a focused
recommendation for whether PR #49 must merge before launch or can remain
parked. Do not change checkout/payment/webhook truth, do not add automated
emails, do not expose secrets, and do not make broad admin changes unless Shawn
explicitly approves them.
```

### Final launch smoke test

```text
Run the final TigerPingPong launch smoke test on the current Render web/API
URLs using docs/planning/085-launch-readiness-audit-cutover-checklist.md and
docs/planning/086-full-website-code-qa-audit.md as the baseline. Check public
routes, product pages, Aqua package options, cart behavior, Stripe Checkout
handoff without completing payment, success/cancel status behavior, robots,
sitemap, protected web routes, protected API routes, and 390px mobile layout.
Do not run imports, change DNS, rotate secrets, modify Stripe/Supabase/Render
configuration, or complete real payments.
```

## Validation Performed

Safe local commands:

- `pnpm validate:tiger-import` - pass, 0 errors and 14 warnings.
- `pnpm exec eslint apps/web/src --max-warnings=0` - pass.
- `pnpm exec tsc --noEmit -p apps/web/tsconfig.json` - pass.
- `pnpm --filter @tigerpingpong/api lint` - pass.
- `pnpm --filter @tigerpingpong/api typecheck` - pass.
- `pnpm --filter @tigerpingpong/db typecheck` - pass.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm --filter @tigerpingpong/web build` - pass.

Read-only deployed route/API checks:

- Public web routes returned `200`: `/`, `/tables/`,
  `/tables/indoor-tables/`, `/tables/outdoor-tables/`, `/accessories/`,
  `/accessories/paddles/`, `/resources/`, all four resource article URLs,
  representative table PDP, representative accessory PDP, Aqua PDP, `/cart`,
  `/robots.txt`, and `/sitemap.xml`.
- Protected web routes returned `401` without credentials: `/admin`,
  `/internal/orders`.
- Public API endpoints returned `200`: `/catalog/health`,
  `/catalog/categories`, `/catalog/products`, representative table/accessory
  product endpoints, and Aqua product endpoint.
- Protected API routes returned `401` without token: `/internal/orders`,
  `/api/admin/dashboard/summary`.
- Public catalog product list returned 12 products; Aqua parent product was
  present; archived/deferred/replacement products were not present by default.
- `includeReplacementParts=1` returned replacement-part rows, confirming the
  public query-flag finding.
- `includeInternal=1` returned internal/source fields, confirming the public
  query-flag finding.

Not run:

- Real payments or completed Stripe Checkout.
- Production imports.
- Database migrations.
- DNS/domain changes.
- Credentialed admin/internal checks.
- Secret/env value inspection.
- Full 390px browser visual pass, because the browser connection closed during
  the attempted viewport sweep.

## Explicit Non-Changes In This PR

- No app code changed.
- No checkout/payment/webhook/order-truth changes.
- No tax implementation changes.
- No database migrations.
- No imports run.
- No product/media/catalog data changed.
- No products published or unpublished.
- PR #49 was not altered.
- No DNS/domain changes were made.
