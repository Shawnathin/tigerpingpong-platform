# Release check repair — 2026-09-13

Scope: PR #178 into `develop`, supporting the Expo gallery promotion #177.

The dashboard order test started its five-second heading assertion immediately
after clicking a client-side navigation link. It now explicitly waits for the
selected order URL before asserting the heading and Vancouver date. No assertions
are removed, and the suite still forbids shipment/email submission.

The speculative production API retry from the first version of #178 is removed;
this PR makes no net application runtime changes. Browser failure traces are
retained in GitHub Actions for three days to make future failures diagnosable.

Local proof:

- A temporary 6.5-second delay of the order navigation reproduced the old
  five-second heading failure. The explicit navigation wait passed with the same
  delay. The artificial delay is not included in the committed test.
- Original API loader: ten repeated targeted tests passed.
- Corrected test: full browser suite passed, 102 passed / 12 existing gated skips.
- Lint, type checking, 222 unit tests, and tracked-secret scan passed.
- Production dependency audit reported no known vulnerabilities.
- Live read-only smoke: all nine checks passed, including API/catalog health,
  public pages, unauthenticated staff-route rejection, and checkout CORS preflight.

This does not prove live payment processing or customer email delivery: no real
checkout, shipment submission, email, database change, or deployment was performed.
Hosted checks must pass before merging; production promotion remains Shawn's step.
