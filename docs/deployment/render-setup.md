# Render Setup Notes

Deploy this monorepo as two Render services later.

## Services

- `tigerpingpong-api`
- `tigerpingpong-web`

## Expected Root Directories

- API service root directory: `apps/api`
- Web service root directory: `apps/web`

## Expected Environment Variables

Do not commit real values.

### `tigerpingpong-api`

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGIN`
- `PORT`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_EXPECTED_LIVEMODE`
- `STRIPE_TAX_ENABLED`
- `CHECKOUT_SUCCESS_URL`
- `CHECKOUT_CANCEL_URL`
- `INTERNAL_ORDERS_API_TOKEN`
- `RESEND_API_KEY`
- `ORDER_EMAIL_FROM`
- `ORDER_EMAIL_REPLY_TO`

### `tigerpingpong-web`

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SITE_URL`

## Notes

- The API should own all database access.
- The web service should call the API, not Supabase directly.
- Apply pending Prisma migrations before deploying API code that reads `order_email_deliveries`.
- `ORDER_EMAIL_FROM` must use a sending domain that is verified in Resend. Keep the API key on the API service only.
- Render deployment is intentionally not part of the foundation task.
