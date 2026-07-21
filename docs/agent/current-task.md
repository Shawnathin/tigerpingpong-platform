# Current Task

## Active task

Post-launch repository cleanup and branch safety.

## Selected task card

Consolidate the local repository into one clean checkout, preserve unique unfinished work without promoting it, create a shared `develop` branch from live `origin/main`, and prevent accidental direct pushes to production `main`.

## Boundaries

- Do not change application behavior, deployment configuration, DNS, schema, production data, Stripe, Render, Supabase, or Cloudinary.
- Preserve uncommitted and unmerged work unless it is proven equivalent to `origin/main`.
- Keep production `main` exactly aligned with `origin/main`.
- Use `develop` or a focused feature/fix branch for future work.
- Promote reviewed changes to `main` through pull requests.

## Required proof

- One registered local worktree remains.
- The remaining checkout is clean and tracks `origin/develop`.
- Local `main`, `develop`, `origin/main`, and the initial `origin/develop` all identify the same live commit at cleanup time.
- Safety stashes preserve both previously dirty worktrees.
- Branches with unique patches remain available; merged or patch-equivalent local branches may be removed.
- The local pre-push hook rejects pushes to `refs/heads/main` and permits pushes to `refs/heads/develop`.

## Status

Complete on 2026-07-21. No runtime or external production service was changed. The new `develop` branch was pushed to GitHub; the direct-`main` guard is local to this repository clone.
