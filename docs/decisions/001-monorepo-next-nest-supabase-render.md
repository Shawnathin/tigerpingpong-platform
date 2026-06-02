# 001: Monorepo With Next.js, NestJS, Supabase, Prisma, and Render

## Status

Accepted

## Date

2026-06-02

## Decision

Use a pnpm workspace monorepo with separate apps for the web frontend and API,
plus shared infrastructure packages.

- `apps/web` is a Next.js application.
- `apps/api` is a NestJS application.
- `packages/shared` holds cross-app TypeScript contracts and helpers.
- `packages/db` holds Prisma setup for Supabase Postgres.
- Supabase Postgres is the planned database platform.
- Prisma is the planned database modeling and migration tool.
- Render is the planned deployment platform for the web and API services.

The initial skeleton includes only launch infrastructure and a health-check
connection between the web app and API.

## Reason

Tiger PingPong Launch HQ needs a codebase that can support a web interface, an
API, shared contracts, and future database integration without forcing product
features into the first setup step.

Keeping the frontend and backend separate makes the ownership boundary clear:
the backend owns database access, and the frontend talks to the backend API.

## Tradeoffs

- The monorepo adds some workspace setup complexity.
- Shared package changes must be managed carefully so app boundaries stay clear.
- Running two services locally is slightly more involved than a single app.
- The separation should make deployment, API ownership, and future database
  work easier to reason about.

## What This Enables Later

- Render deployment as two services: `tigerpingpong-web` and
  `tigerpingpong-api`.
- Prisma migrations against Supabase Postgres.
- Typed API contracts and validation shared across app boundaries.
- Product, cart, checkout, auth, and admin workflows once separate product
  decisions define them.

## Out Of Scope For Now

- Product database tables
- Ecommerce application models
- Product pages
- Cart
- Checkout
- Admin dashboard
- Auth
- Stripe
- Supabase Auth
- Product import scripts
- Final visual design
- Render deployment itself
- Fake ecommerce functionality

## Consequences

- The frontend and backend can evolve independently while sharing typed
  contracts.
- Render services can be configured separately for the web and API.
- Prisma and Supabase-related code has a dedicated package before application
  features depend on it.
- Workspace packages should stay domain-neutral until product decisions are made.
