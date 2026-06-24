# Multi-Worker Worktrees

Use this when Shawn explicitly splits future work across workers. Keep workers isolated and boring.

## Rules

- One worker owns one selected task card.
- Use separate branches or worktrees per worker. Prefer branch names that describe the task, such as `codex/media-artifact-triage`.
- Before starting, each worker reads `AGENTS.md`, `goals.md`, `docs/agent/current-task.md`, and any task-specific docs.
- Avoid touching the same files across workers unless the master build-control chat approves the collision.
- Payment, webhook, schema, deployment, env, DNS, and raw media work must not be split casually.
- Each worker records proof and blockers in its own final report; the master chat decides what merges next.

## Collision checklist

- Check `git status --short` before editing.
- Check the lane board for ownership.
- Name expected files in the task card before work starts.
- If another worker changes the same file, stop and ask for the master chat decision instead of guessing.
