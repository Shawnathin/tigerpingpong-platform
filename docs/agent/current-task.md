# Current Task

## Active task

Tiger PingPong Brand Operating System — “Lock the Brand.”

## Selected task card

Turn the owner discovery, implemented storefront story, visual system, product-story method, and market research into a repository-level contract that every future Tiger customer-facing task must follow.

## Deliverable

- A mandatory brand entrypoint in root `AGENTS.md`.
- A versioned `docs/brand/` operating system covering:
  - Tiger identity, positioning, origin, and story hierarchy.
  - Voice, copy mechanics, humour, Canadian/West Coast expression, and surface-specific tone.
  - Glassy visual system, photography, product fidelity, responsive behaviour, motion, and accessibility.
  - Locked, verified, provisional, time-sensitive, pending, and prohibited claims.
  - A fact-first individual product-story workflow and approval template.
  - Internal, public, historical, and official competitor research sources.
  - A required future-agent checklist and owner-controlled change process.
- A pointer from the existing storytelling map to the new governance source.

## Locked decisions

- The registered brand and public house spelling is **Tiger PingPong**; **PingPong** is one word even as a common noun.
- Internal north star: **Serious about the gear. Easygoing about the game.**
- Customer promise: **Good gear. Real help. No runaround.**
- Tiger is Vancouver-born, West Coast in outlook, Canadian in reach, and established across Canada for more than 15 years.
- The customer task remains primary. Story is ambient on shopping pages and complete on About.
- Current product, compatibility, origin, shipping, price, availability, warranty, history, event, and operational claims may never be invented.
- Only Shawn can lock a new brand fact, origin story, or product story.
- One additional owner story refinement is expected later and must not be guessed.

## Boundaries

- Documentation and governance only.
- Do not change runtime behaviour, storefront copy, layout, media, APIs, database, cart, checkout, payment truth, auth, redirects, canonicals, sitemap, robots, deployment, or DNS.
- Preserve the current typed story source as canonical implemented wording.
- Use official competitor sources only to define category context and differentiation; never copy their language or use them as proof of Tiger claims.
- Work in a clean focused branch from merged `main` and open a draft PR without deploying or merging.

## Required proof

- Every brand document is linked from `docs/brand/README.md`.
- Root `AGENTS.md` makes the reading path mandatory for customer-facing work.
- The facts register distinguishes owner-approved, verified, live-catalog, provisional, time-sensitive, pending, and prohibited statements.
- The product-story contract prevents specs or marketing inference from filling unknowns.
- The research register cites the current and legacy Tiger sites, authoritative Expo/Vancouver sources, and official competitor sources.
- All internal Markdown links resolve.
- Brand spelling and prohibited-phrase checks pass.
- Markdown formatting and `git diff --check` pass.
- No secrets, runtime code, or unrelated dirty files are included.

## Status

Implementation and validation are complete on `codex/tiger-brand-bible`.

- Root `AGENTS.md` now makes the brand reading path mandatory before customer-facing work.
- `docs/brand/` contains one routed entrypoint and eight supporting contracts for identity, voice, visuals, claims, product storytelling, research, execution, and change control.
- Owner-approved facts, time-sensitive operations, verified external facts, live-catalog ownership, provisional stories, pending decisions, and prohibited claims are separated explicitly.
- The expected future owner story refinement is recorded as pending and may not be guessed.
- Official market research defines Tiger's distinct lane without copying competitors or using them as product evidence.
- All supporting brand documents are routed from the README and all changed-file relative links resolve.
- Every cited external URL was reachable through research tooling; direct automated status checks returned `200` for the Tiger, Museum of Vancouver, SFU, Cornilleau, Butterfly, JOOLA, STIGA, and Killerspin sources. City of Vancouver and Ping Pong Depot restricted or failed the secondary automated request after their pages had been retrieved through research tooling.
- All changed Markdown passes Prettier and `git diff --check`.
- No runtime code, media, app behaviour, commerce logic, SEO routing, deployment, or infrastructure changed.
- Lint, typecheck, tests, and production build were not run because this is a documentation-only governance change.
