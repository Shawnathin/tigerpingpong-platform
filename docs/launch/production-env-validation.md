# Production Env Validation for Launch

## Purpose

This validator is a **read-only, operator-facing proof command** used before cutover to confirm the production environment surface variables are present and shaped safely.

It is intentionally limited to:

- required/optional presence checks,
- HTTPS, PostgreSQL, public URL, boolean, and mode shape checks,
- Stripe and Resend key-prefix checks plus `STRIPE_EXPECTED_LIVEMODE` mode checks,
- optional final-origin consistency across site, CORS, and checkout return URLs,
- non-secret status reporting.

It is not a runtime healthcheck.

## What this validator checks

### Shared behavior

- No environment file is loaded.
- No writes are performed.
- No network calls are performed.
- No secret values are printed.

### Web surface checks

- `NEXT_PUBLIC_API_BASE_URL` required: valid HTTPS URL
- `NEXT_PUBLIC_SITE_URL` required: valid HTTPS URL and expected-origin match when requested
- `INTERNAL_ORDERS_API_TOKEN` required: present
- `RESEND_API_KEY` required: present and must start with `re_`
- `EMAIL_FROM` required: present; operators must separately confirm its domain is verified in Resend
- `ORDER_EMAIL_REPLY_TO` optional: present when set; otherwise the approved support address is used
- `ORDER_NOTIFICATION_EMAIL` required: valid monitored staff inbox
- `INTERNAL_ORDERS_BASIC_AUTH_USER` required: present
- `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD` required: present
- `CLOUDINARY_CLOUD_NAME` optional: present/checks format
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` optional: present/checks format

### API surface checks

- `DATABASE_URL` required: valid `postgres://` or `postgresql://` URL shape
- `SUPABASE_URL` optional: HTTPS URL shape if present
- `SUPABASE_SERVICE_ROLE_KEY` optional: present only
- `CORS_ORIGIN` required: HTTPS URL(s), comma-separated if multiple; includes expected origin when requested
- `PORT` required: positive integer
- `APP_ENV` optional: expected value in `local|staging|production|test|live`
- `STRIPE_SECRET_KEY` required: `sk_test_` or `sk_live_` must agree with requested mode; otherwise `sk_` shape
- `STRIPE_WEBHOOK_SECRET` required: present and must start with `whsec_`
- `STRIPE_EXPECTED_LIVEMODE`: boolean (`true`/`false`/`1`/`0`); required and consistent when `--expected-mode` is requested
- `STRIPE_TAX_ENABLED` optional: boolean (`true`/`false`/`1`/`0`)
- `CHECKOUT_SUCCESS_URL` required: valid HTTPS URL, includes `{CHECKOUT_SESSION_ID}`, and matches expected origin when requested
- `CHECKOUT_CANCEL_URL` required: valid HTTPS URL and matches expected origin when requested
- `INTERNAL_ORDERS_API_TOKEN` required: present
- `CLOUDINARY_API_KEY` optional: numeric shape if present
- `CLOUDINARY_API_SECRET` optional: present if set
- `DIRECT_URL` optional: URL shape if present, flagged for review by default
- `NEXT_PUBLIC_API_URL` optional: URL shape if present, flagged for review by default

## What this validator does not check

- No endpoint reachability checks
- No signature verification / webhook simulation
- No service-side auth verification
- No `.env` file loading, editing, or migration/import execution
- No deployment mutations
- No external API calls (Stripe, Resend, Supabase, and Cloudinary are untouched)

## How to run

Run in the shell that already has the intended runtime environment values loaded:

```bash
node scripts/launch/validate-production-env.mjs --help
```

### Web only

```bash
node scripts/launch/validate-production-env.mjs --surface web
```

### API only

```bash
node scripts/launch/validate-production-env.mjs --surface api
```

### All surfaces

```bash
node scripts/launch/validate-production-env.mjs --surface all
```

### Stripe test mode check

```bash
node scripts/launch/validate-production-env.mjs --surface api --expected-mode test
```

### Stripe live mode check

```bash
node scripts/launch/validate-production-env.mjs --surface api --expected-mode live
```

### Final-origin check

```bash
node scripts/launch/validate-production-env.mjs --surface all --expected-mode live --expected-origin https://tigerpingpong.ca
```

## Output meanings

- `present`: expected shape/presence check passed
- `missing`: required variable missing
- `invalid`: value present but fails shape/check constraints
- `needs review`: optional variable missing or unresolved by launch contract

## No-secrets rule

- Output intentionally excludes raw values for every variable, including secrets.
- Optional cloudinary/secret fields only output `present`, `needs review`, or `invalid`.

## Where to run during cutover

Run this command in the production context (or Render shell preview context) before final DNS/domain cutover and before confirming launch readiness:

- On API service side: `--surface api`
- On web service side: `--surface web`
- For a single proof record: `--surface all`

This is the first safety gate before final runbook handoff, and it should be done alongside route/auth/payment smoke checks in the cutover task.

## Relationship to production env contract

This validator is the operational companion to:

- `docs/launch/production-env-contract.md`

The contract is the human-facing source of required values; this script automates safe, repeatable local/operator verification from that contract.
