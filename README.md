# TigerPingPong Platform

Technical foundation for rebuilding TigerPingPong.ca as a custom ecommerce
platform powered by our own backend and database.

This repository currently contains foundation code only. Product pages, cart,
checkout, auth, admin tools, and other ecommerce features are intentionally not
included yet.

## Structure

- `apps/web`: Next.js storefront foundation with an API health status card
- `apps/api`: NestJS backend API with a `/health` endpoint
- `packages/shared`: shared TypeScript contracts and helpers
- `packages/db`: Prisma and Supabase Postgres foundation
- `docs`: decisions, build logs, deployment notes, and prompts

## Local setup

Install dependencies with pnpm:

```sh
pnpm install
```

Copy the sample environment file:

```sh
cp .env.example .env
```

Run both apps:

```sh
pnpm dev
```

Useful commands:

```sh
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm format
pnpm db:generate
pnpm db:validate
```

The web app runs at `http://localhost:3000`.
The API health route runs at `http://localhost:3001/health`.

## Environment

Use `.env.example` as the starting point for local environment variables. Do
not commit real secrets.
