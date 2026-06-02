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

### `tigerpingpong-web`

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SITE_URL`

## Notes

- The API should own all database access.
- The web service should call the API, not Supabase directly.
- Render deployment is intentionally not part of the foundation task.
