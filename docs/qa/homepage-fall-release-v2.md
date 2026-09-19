# Homepage fall refresh release v2

Status: packaged for review; no merge or deployment performed.
Branch: `codex/feature/homepage-fall-refresh-v2`, based on `origin/main` at `b81ba8f`.

## Scope

The existing homepage is refreshed in place with game-night copy and the existing
sections, components, navigation, responsive layout, routes, and shopping behaviour
preserved. Summer copy and decorative seasonal backgrounds are removed. Aqua retains the
existing original public product photo.

## Durable hero media

The hero uses `NIT-034` from `data/media/about-story-image-map-v1.json`:

- Cloudinary public ID: `tigerpingpong/storefront/about/04-game-night-connection`
- Delivery URL: `https://res.cloudinary.com/djfcisldm/image/upload/f_auto,q_auto,w_750/v1784354159/tigerpingpong/storefront/about/04-game-night-connection.jpg`
- Status: existing owner-cleared, implemented media

No ignored or machine-local preview asset is referenced.

## Validation

- Focused Prettier on the original bounded homepage release files: passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed after the standard local Prisma client generation.
- `NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build`: passed.
- `pnpm test:e2e tests/e2e/homepage-summer.spec.ts`: 3 passed; 1 intentional evidence-capture skip.\n- Hosted full E2E exposed one stale cross-page assertion that still expected the old homepage mountain hero; the assertion is updated to the approved NIT-034 Club Night hero and will be reverified by hosted CI.
- Tracked-secret scan: 0 findings. The NIT-034 Cloudinary delivery URL returned HTTP 200; code/docs contain no local-preview dependency.
- Repository-wide formatting remains out of scope because its existing failures are unrelated to this bounded change.

## Boundaries

No catalog, price, inventory, cart, checkout, payment, auth, API, email, SEO/domain,
deployment, or branch-reconciliation behaviour changed. PR review and any merge remain
separate owner-controlled steps.
