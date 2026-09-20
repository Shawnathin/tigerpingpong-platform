# Systems 4.1 local/GitHub review loop

This is the smallest public-safe collaboration contract for TigerPingPong
website work. It adopts the existing local workflow; it does not replace the
repository, release workflow, deployment model, databases, payments, admin, or
secrets handling.

## Boundaries

- The canonical local repository remains the existing TigerPingPong checkout.
- Start each selected task from current `origin/develop`; task PRs target
  `develop`, never `main`.
- `main` remains production-only and is updated only through the existing
  approved `develop` promotion.
- Keep secrets, local databases, raw media, credentials, machine paths, and
  private operational evidence local. Do not put them in commits, PRs, or
  review bodies.
- The first candidate can be documentation/tooling only. It does not authorize
  deployment or a production mutation.

## Phase 1: retain a local-only baseline

Before using this loop, record the following in the existing local Tiger
system, not in this public repository:

- canonical repository identifier or a redacted-safe local root;
- current branch, HEAD, and dirty/clean state;
- local worker or harness entrypoint;
- existing deployment and release path;
- validation commands;
- local-only secrets and state locations by role only; and
- any already-present local manifest, `AGENTS.md`, or operational document.

Never copy secret values, local database content, credentials, or machine state
into GitHub.

## Start a bounded work item

From the canonical local checkout, create one isolated worktree from the latest
shared integration branch:

```sh
git fetch origin develop
git worktree add -b codex/<type>/<work-item> ../tigerpingpong-<work-item> origin/develop
cd ../tigerpingpong-<work-item>
```

Use the repository's existing validation commands that apply to the work item.
Push only public-safe source and open a focused draft PR against `develop`.
Keep the PR body explicit about validation run, validation not run, production
risk, and that no deployment is authorized.

## Cloud review contract

A trusted cloud reviewer works directly from the GitHub PR and submits a formal
GitHub review. The repository owner is trusted by default. To trust another
Tiger reviewer, set the local-only comma-separated
`TIGER_SYSTEMS_TRUSTED_REVIEWERS` environment variable to their GitHub login.
The review body must include these exact lines, with the PR's current
40-character head SHA:

```text
TIGER_SYSTEMS_4_1_REVIEW=PASS|FIX_REQUIRED|DECISION_REQUIRED|BLOCKED
REVIEW_HEAD_SHA=<40-character-current-PR-head-SHA>
```

Use the current PR SHA in both the GitHub review and the declared
`REVIEW_HEAD_SHA`. The reviewer must not approve a different commit than the
one declared in the body.

## Local review readback

From the same worktree that owns the PR, run:

```sh
node scripts/systems/read-github-review.mjs <pull-request-number>
```

The wrapper reads the PR and formal reviews directly from GitHub using the
authenticated `gh` CLI. It trusts only submitted `APPROVED`,
`CHANGES_REQUESTED`, or `COMMENTED` reviews from the repository owner or an
explicitly trusted Tiger reviewer; it ignores untrusted, `PENDING`, and
`DISMISSED` reviews. It uses `gh api --paginate --slurp` and normalizes all
pages before choosing the latest eligible review. It compares:

1. the local `HEAD`;
2. the current PR head SHA;
3. the formal review's GitHub commit SHA; and
4. the review body's `REVIEW_HEAD_SHA`.

It returns `REVIEW_STALE` if any of those differ. No stale review may drive
implementation or release decisions.

- `FIX_REQUIRED`: continue the same work item on the same branch, make the
  narrow correction, validate, push, and ask for a new review.
- `PASS`: proceed only through the existing final review and release
  workflow. This command never deploys.
- `DECISION_REQUIRED` or `BLOCKED`: stop for the exact owner decision or
  blocker stated in the GitHub review.
- `REVIEW_PENDING`: stop for cloud review.

The manual collaboration vocabulary remains simple: cloud says `Review.`;
local says `Continue.` The wrapper eliminates copying a review between
people while preserving GitHub as the collaboration boundary.

## Candidate checklist

A first Systems 4.1 candidate is ready for cloud review when all are true:

- its branch and draft PR are visible in GitHub;
- the PR is based on `develop` and targets `develop`;
- only public-safe work is committed;
- local validation results are recorded honestly in the PR;
- the reviewer has this SHA-bound review contract; and
- no production deployment or release is implied.
