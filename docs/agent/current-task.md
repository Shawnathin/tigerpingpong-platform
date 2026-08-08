# Current Task

## Active task

Correct the PaddleBuddy privacy policy to use the registered Tiger PingPong spelling throughout.

## Stable task key

`TPP-PADDLEBUDDY-BRAND-SPELLING`

## Selected task card

Replace every spaced `Tiger Ping Pong` reference introduced in the published React policy with the owner-approved `Tiger PingPong` spelling and add regression proof.

## Boundaries

- Work only on `codex/fix/paddlebuddy-brand-spelling` and target its task pull request to `develop`.
- Preserve all policy wording except the explicit brand-spelling correction.
- Do not change layout, screenshots, legal meaning, effective date, checkout, payment, shipping, auth, API, database, DNS, or webhook behaviour.
- Production promotion is explicitly authorized by Shawn after the task PR passes required checks.

## Required proof

- `/paddlebuddy/privacy-policy` contains no `Tiger Ping Pong` text.
- The policy heading, body references, and contact block use `Tiger PingPong`.
- Focused route coverage, lint, typecheck, and the production build pass.

## Status

Local implementation and proof completed on 2026-08-08. The owner-supplied Markdown already uses `Tiger PingPong`; all thirteen incorrect spaced variants introduced in the published React page were corrected. Lint, Prisma generation, typecheck, the focused Chromium policy test, changed-file formatting, diff validation, and the production-style build pass. Layout, legal meaning, effective date, checkout, payment, shipping, auth, API, database, DNS, and webhook behaviour are unchanged.
