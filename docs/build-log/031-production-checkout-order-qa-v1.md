# 031 Production Checkout Order QA V1

## Summary

Created and ran a production QA checklist for the current Render storefront,
checkout, and internal order review flow.

This was documentation and verification only.

## Branch

```text
docs/031-production-checkout-order-qa-v1
```

Started from latest `main` after confirming PR #35 was merged.

## Files Created

- `docs/qa/031-production-checkout-order-qa-v1.md`
- `docs/build-log/031-production-checkout-order-qa-v1.md`

## PR 35 Preflight

- PR #35: `https://github.com/Shawnathin/tigerpingpong-platform/pull/35`
- State: `MERGED`
- Merge commit: `fc6a2eba6b4d73de4bc50bca3fff6d83f1a8eecd`
- Local `main` after pull matched that commit before this branch was created.

## Production QA Summary

Checked the current Render storefront at:

```text
https://tigerpingpong-web.onrender.com
```

Checked the current Render API at:

```text
https://tigerpingpong-platform.onrender.com
```

The requested public routes all returned `200`, and `/internal/orders`
returned `401` without credentials.

The custom domains `https://www.tigerpingpong.com` and
`https://tigerpingpong.com` currently redirect to `https://tigerpingpong.ca/`,
which is the legacy storefront rather than the current Render app from this
repository.

## Checkout QA Summary

The production API successfully created a Stripe test Checkout Session for
`tiger-vice-paddle`:

- Response: `201 application/json`
- Session shape: `cs_test_...`
- Public reference: `cmqa22vtk0002rrj3wbkrwbgi`
- Total: `6500` cents CAD
- Status endpoint result: `checkout_pending`

The hosted Stripe Checkout URL loaded, confirming the session was usable in
Stripe test mode.

Full payment completion was blocked by the local browser environment. The
in-app browser could not navigate to the external Render URL, and downloaded
Chromium could not launch under the local macOS sandbox. No paid webhook,
Supabase paid row, or internal paid order detail was available from this run.

## Security Checks

- Public route HTML had no `/internal/orders` links.
- Public route HTML had no cart, account, or admin links.
- Public script scan found no `INTERNAL_ORDERS_API_TOKEN`,
  `x-internal-orders-token`, or `/internal/orders` strings.
- Success page for the created pending session showed pending backend state and
  did not treat the redirect as payment truth.
- API `/internal/orders` returned `401` for missing and wrong tokens.
- Web `/internal/orders` returned `401` without Basic Auth and with wrong Basic
  Auth.

## Environment Status

- `NEXT_PUBLIC_API_BASE_URL`: appears configured; storefront data loaded from
  the Render API.
- `DATABASE_URL`: appears configured; catalog reads, checkout creation, and
  status lookup worked.
- `STRIPE_SECRET_KEY`: appears configured; test Checkout Session creation
  worked.
- `STRIPE_WEBHOOK_SECRET`: appears configured; invalid signed webhook reached
  signature verification and returned signature failure.
- `INTERNAL_ORDERS_API_TOKEN`: needs valid-token confirmation.
- `INTERNAL_ORDERS_BASIC_AUTH_USER`: needs valid-credential confirmation.
- `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD`: needs valid-credential confirmation.

## Intentionally Not Changed

- No production code changed.
- No checkout code changed.
- No webhook code changed.
- No internal orders code changed.
- No Prisma schema changed.
- No migrations were created.
- No cart, admin, customer account, email, fulfillment, or refund work was
  added.

## Validation Results

- `pnpm db:generate`: passed.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tigerpingpong_validation pnpm db:validate`:
  passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`:
  passed.
- `git diff --check`: passed.
- `git status`: showed only the two expected documentation files before commit.

## Remaining Blockers

- Complete a Stripe test payment with an authorized browser or manual operator.
- Confirm Stripe emits the real `checkout.session.completed` webhook.
- Confirm the Supabase order row becomes `paid`.
- Confirm valid Basic Auth access to `/internal/orders`.
- Confirm the internal order detail page shows customer, shipping, totals,
  items, and Stripe references.
- Decide or complete public domain cutover from the legacy custom-domain
  storefront to the current Render storefront.

## Next Recommended Task

Run a human-assisted production order-ops verification pass on the intended
customer-facing launch domain, with valid internal credentials available, and
capture the final Stripe, Supabase, and internal-orders screenshots before
wider launch.
