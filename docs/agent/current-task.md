# Current Task

## Active task

Patch the newly disclosed high-severity `nanoid` advisory without changing application behaviour or production state.

## Stable task key

`TPP-NANOID-ZERO-SIZE-ADVISORY`

## Selected task card

Update the transitive lockfile resolution from vulnerable `nanoid@3.3.17` to patched `3.3.18`, which is already allowed by PostCSS's `^3.3.16` dependency range.

## Boundaries

- Work only on `codex/fix/nanoid-zero-size-advisory` and target its task pull request to `develop`.
- Keep the patch lockfile-only; do not upgrade PostCSS, Next.js, Sharp, or any other package.
- Do not change runtime logic, checkout, payment, shipping, auth, API, database, DNS, email configuration, deployment, or production state.
- Keep the automated-email implementation isolated on its existing branch until this hotfix is reviewed.

## Required proof

- A frozen `pnpm@9.12.0` install accepts the lockfile.
- The resolved PostCSS dependency is `nanoid@3.3.18`.
- `pnpm security:audit` passes the high-severity gate.
- Lint, typecheck, unit tests, production build, browser tests, and tracked-secret scanning pass.

## Status

Completed locally on 2026-08-23 after the repository audit and with Shawn's explicit approval. The patch changes only the transitive lockfile resolution from `nanoid@3.3.17` to `3.3.18`; PostCSS, Next.js, Sharp, and application code are unchanged. Frozen install and the complete `pnpm launch:preflight` pass, including lint, Prisma generation/validation, typecheck, 138 unit tests, the production build, 91 active browser tests, tracked-secret scanning, and the high-severity production audit gate. Eleven evidence-only browser tests remain skipped by their existing opt-in gates, and one existing moderate advisory remains below the configured gate. No production mutation occurred.
