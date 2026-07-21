# Current Task

## Active task

Enforce the post-launch feature promotion path.

## Selected task card

Require every feature, fix, documentation change, or chore to use its own branch created from `develop`; require task branches to merge into `develop`; and allow only approved `develop` pull requests to update production `main`.

## Boundaries

- Do not change storefront, API, database, payment, deployment, DNS, catalog, media, or production data.
- Do not commit directly to `develop` or `main`.
- Do not merge the enforcement change automatically.
- Avoid an approval-count rule that would lock a single-owner repository out of its own branches.

## Required proof

- This task is implemented on a dedicated branch created from current `develop`.
- Repository instructions define `task branch -> develop -> main` as the only promotion path.
- CI rejects pull requests to `main` unless the source is this repository's `develop` branch.
- CI rejects `main` or `develop` as a pull-request source for `develop`.
- GitHub rejects direct pushes and force pushes to both `develop` and `main` and requires pull requests.
- The local pre-push guard rejects every direct update to `main`.

## Status

Implementation is complete on `codex/enforce-development-branch-flow`. Promotion remains review-gated: this branch must merge into `develop`, and only a later approved `develop` pull request may promote the policy to `main`.
