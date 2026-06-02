# 001: Codex Platform Foundation Prompt

Work on branch `feature/monorepo-foundation-v1`.

Create the initial TigerPingPong.ca ecommerce platform foundation as a monorepo
with separate frontend and backend apps. This is the foundation for a custom
ecommerce website powered by our own database, not a generic theme project.

## Architecture

- One GitHub repo
- pnpm workspaces
- TypeScript
- Next.js frontend in `apps/web`
- NestJS backend API in `apps/api`
- Supabase Postgres database
- Prisma in `packages/db`
- Shared TypeScript package in `packages/shared`
- Backend owns database access
- Frontend talks to backend API
- Render deployment later as two services

## Build

- Monorepo foundation
- Basic web homepage
- API health endpoint
- Web API health status card
- Prisma PostgreSQL schema foundation with no ecommerce models
- Documentation for decisions, build log, prompt, and Render setup

## Do Not Build Yet

- Product database tables
- Product pages
- Cart
- Checkout
- Admin dashboard
- Auth
- Stripe
- Supabase Auth
- Product import scripts
- Final visual design
- Render deployment
- Fake ecommerce functionality

## Validate

- `pnpm install`
- `pnpm build`
- API can run locally
- Web can run locally
- `GET /health` works
- Web displays backend health using `NEXT_PUBLIC_API_URL`
- No real secrets are committed
