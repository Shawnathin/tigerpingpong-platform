# Production Env Validation for Launch

## Purpose

This validator is a **read-only, operator-facing proof command** used before cutover to confirm the production environment surface variables are present and shaped safely.

It is intentionally limited to:

- presence checks (required vs optional),
- safe shape checks for public URLs and booleans/modes,
- `STRIPE_EXPECTED_LIVEMODE` mode checks,
- non-secret status reporting.

It is not a runtime healthcheck.

## What this validator checks

### Shared behavior

- No environment file is loaded.
- No writes are performed.
- No network calls are performed.
- No secret values are printed.

### Web surface checks

- `NEXT_PUBLIC_API_BASE_URL` required: valid HTTP(S) URL
- `NEXT_PUBLIC_SITE_URL` required: valid HTTP(S) URL
- `INTERNAL_ORDERS_API_TOKEN` required: present
- `INTERNAL_ORDERS_BASIC_AUTH_USER` required: present
- `INTERNAL_ORDERS_BASIC_AUTH_PASSWORD` required: present
- `CLOUDINARY_CLOUD_NAME` optional: present/checks format
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` optional: present/checks format

### API surface checks

- `DATABASE_URL` required: present (non-empty, connection-style value expected)
- `SUPABASE_URL` optional: URL shape if present
- `SUPABASE_SERVICE_ROLE_KEY` optional: present only
- `CORS_ORIGIN` required: HTTP(S) URL(s), comma-separated if multiple
- `PORT` required: positive integer
- `APP_ENV` optional: expected value in `local|staging|production|test|live`
- `STRIPE_SECRET_KEY` required: present and must start with `sk_`
- `STRIPE_WEBHOOK_SECRET` required: present and must start with `whsec_`
- `STRIPE_EXPECTED_LIVEMODE` optional: boolean (`true`/`false`/`1`/`0`), and optional `--expected-mode` consistency check
- `STRIPE_TAX_ENABLED` optional: boolean (`true`/`false`/`1`/`0`)
- `CHECKOUT_SUCCESS_URL` required: valid HTTP(S) URL and includes `{CHECKOUT_SESSION_ID}`
- `CHECKOUT_CANCEL_URL` required: valid HTTP(S) URL
- `INTERNAL_ORDERS_API_TOKEN` required: present
- `SHIPMENT_EMAIL_WEBHOOK_URL` optional: HTTP(S) URL shape if present
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
- No external API calls (Stripe/Supabase/Cloudinary/Supabase are untouched)

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
