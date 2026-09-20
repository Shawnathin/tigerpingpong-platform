#!/usr/bin/env node
/**
 * Read the latest SHA-bound Systems 4.1 review for the current worktree.
 *
 * Requires: git and authenticated GitHub CLI (gh).
 * Usage: node scripts/systems/read-github-review.mjs <pull-request-number>
 */

import { execFileSync } from 'node:child_process';

const OUTCOMES = new Set([
  'PASS',
  'FIX_REQUIRED',
  'DECISION_REQUIRED',
  'BLOCKED',
]);

function fail(message, exitCode = 2) {
  process.stderr.write(`SYSTEMS_4_1_ERROR=${message}\n`);
  process.exit(exitCode);
}

function run(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message;
    fail(`${command} failed: ${detail}`);
  }
}

function parseReview(body) {
  const outcome = body.match(
    /^TIGER_SYSTEMS_4_1_REVIEW=(PASS|FIX_REQUIRED|DECISION_REQUIRED|BLOCKED)$/m,
  )?.[1];
  const declaredHead = body.match(/^REVIEW_HEAD_SHA=([0-9a-f]{40})$/m)?.[1];

  if (!outcome || !declaredHead || !OUTCOMES.has(outcome)) {
    return null;
  }

  return { declaredHead, outcome };
}

function output(lines) {
  process.stdout.write(`${lines.join('\n')}\n`);
}

const [pullRequest] = process.argv.slice(2);

if (pullRequest === '--help' || pullRequest === '-h') {
  output(['Usage: node scripts/systems/read-github-review.mjs <pull-request-number>']);
  process.exit(0);
}

if (!/^\d+$/.test(pullRequest ?? '')) {
  fail('pull request number is required');
}

const repository = run('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']);
const localHead = run('git', ['rev-parse', 'HEAD']);
const pull = JSON.parse(
  run('gh', [
    'pr',
    'view',
    pullRequest,
    '--repo',
    repository,
    '--json',
    'number,url,headRefOid',
  ]),
);
const reviews = JSON.parse(
  run('gh', [
    'api',
    '--paginate',
    `repos/${repository}/pulls/${pull.number}/reviews?per_page=100`,
  ]),
);

const latest = reviews
  .map((review) => ({ ...review, contract: parseReview(review.body ?? '') }))
  .filter((review) => review.contract)
  .sort(
    (left, right) =>
      new Date(right.submitted_at ?? 0).getTime() -
      new Date(left.submitted_at ?? 0).getTime(),
  )[0];

if (!latest) {
  output([
    'TIGER_SYSTEMS_4_1=REVIEW_PENDING',
    `PR=${pull.url}`,
    `LOCAL_HEAD=${localHead}`,
    `PR_HEAD=${pull.headRefOid}`,
    'NEXT_ACTION=Cloud reviewer: submit a formal GitHub review using the Systems 4.1 review contract.',
  ]);
  process.exit(0);
}

const reviewHead = latest.commit_id;
const declaredHead = latest.contract.declaredHead;
const isCurrent =
  localHead === pull.headRefOid &&
  localHead === reviewHead &&
  localHead === declaredHead;

if (!isCurrent) {
  output([
    'TIGER_SYSTEMS_4_1=REVIEW_STALE',
    `PR=${pull.url}`,
    `LOCAL_HEAD=${localHead}`,
    `PR_HEAD=${pull.headRefOid}`,
    `REVIEW_COMMIT=${reviewHead}`,
    `REVIEW_HEAD_SHA=${declaredHead}`,
    'NEXT_ACTION=Read the current PR head, then request a new SHA-bound GitHub review.',
  ]);
  process.exit(3);
}

const nextAction =
  latest.contract.outcome === 'FIX_REQUIRED'
    ? 'Continue the same work item on the current branch.'
    : latest.contract.outcome === 'PASS'
      ? 'Use the existing final review and release workflow; do not deploy from this command.'
      : 'Owner action is required; follow the latest GitHub review.';

output([
  `TIGER_SYSTEMS_4_1=${latest.contract.outcome}`,
  `PR=${pull.url}`,
  `LOCAL_HEAD=${localHead}`,
  `REVIEW_HEAD_SHA=${declaredHead}`,
  `REVIEW_URL=${latest.html_url}`,
  `NEXT_ACTION=${nextAction}`,
]);
