# Current Task

## Active task

Permanent protected-lane merge-history guard and release #143 reconciliation.

## Selected task card

Prevent recurring false conflicts between `develop` and `main`, repair the current ancestry split without hand-merging overlapping application files, and make the safe merge method the only available GitHub choice.

## Boundaries

- Work only on `codex/fix/protected-merge-history`, created from current `origin/develop`; target its pull request to `develop`, never `main`.
- Do not push directly to `develop` or `main`, merge PR #143, enable auto-merge, deploy, or promote production.
- Keep the active GitHub ruleset scoped to `refs/heads/develop` and `refs/heads/main`, allow only merge commits, and grant no bypass actors.
- Preserve the repair branch's first-parent tree when adding current `main` as the history merge's second parent.
- Do not hand-resolve the five overlapping application/test/workflow files shown by PR #143; they are artifacts of the discarded squash ancestry, not competing desired content.

## Required proof

- GitHub reports active ruleset `Protected lane merge commits only` on both protected branches with `allowed_merge_methods: ["merge"]` and no bypass actors.
- Existing branch protection still requires pull requests, the `validate-promotion-path` status check, current-base strictness, admin enforcement, and blocks force pushes/deletions.
- Branch policy runs from trusted base code even when a PR conflicts, rejects non-`develop` promotion heads, rejects missing main ancestry, and rejects removal of the merge-only rule.
- The history reconciliation commit has both current `develop` and current `main` as parents, changes no files relative to its first parent, and makes both protected branch heads ancestors of the repair branch.
- Changed-file formatting, workflow syntax review, branch-policy simulations, diff validation, and hosted checks pass.

## Status

The recurring conflict is confirmed as a history split: PR #139 copied the correct `develop` tree into `main` as a single-parent squash commit, then PR #142 advanced `develop`. Current `main` and pre-PR-142 `develop` are byte-for-byte identical, while the five conflicts GitHub reports are overlapping paths caused by the missing ancestry.

Repository ruleset `Protected lane merge commits only` is active and verified on `develop` and `main`. It allows only merge commits and has no bypass actors; the existing protected-branch checks and force-push safeguards remain layered in place.

The dedicated repair branch is active. Branch-policy hardening, repository guidance, workflow records, history-only reconciliation, validation, and the task pull request remain in progress. No direct protected-branch push, PR #143 merge, deployment, or production promotion has occurred.
