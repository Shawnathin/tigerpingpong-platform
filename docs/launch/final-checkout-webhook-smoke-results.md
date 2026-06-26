# Final Checkout + Webhook Smoke Results

## 1. Executive summary

Status: **Hold - operator confirmations required before smoke execution.**

The final checkout + webhook smoke has not been run yet. The selected task is
ready to execute in Stripe test mode after Shawn/operator confirmation, but the
runbook requires written confirmation before starting any checkout/payment path
or collecting Stripe/webhook/order proof.

No app code, env vars, Render/DNS/Stripe/Supabase/Cloudinary configuration,
migrations, imports, uploads, or payment flows were changed or executed in this
pass.

## 2. Domain tested

Not tested yet.

Pending confirmation of the final smoke domain:

- `tigerpingpong.ca`
- `www.tigerpingpong.ca`
- Render web URL
- other

## 3. Stripe mode used

Not executed yet.

Required mode for this task remains: `test`.

Live mode is out of scope unless Shawn explicitly approves live mode in writing.

## 4. Operator confirmations

Pending written answers:

1. Final smoke domain.
2. Stripe mode, expected to be `test`.
3. Who has Stripe Dashboard access.
4. Who has Render logs access.
5. Who can view the order/admin result.
6. Whether it is okay to create one Stripe test checkout/order record.
7. Whether the smoke may use a small test cart item.

## 5. Env validation recap

Already recorded in `docs/launch/production-env-validation-results.md`:

- Target API env validation: PASS for required vars.
- Target web env validation: PASS for required vars.
- Expected Stripe mode: `test`.
- Required failures: `0`.
- Invalid required vars: `0`.
- Secret values printed: no.

The runbook still asks operators to confirm or rerun the target Render API/web
validation immediately before smoke if needed:

- API: `pnpm launch:env:validate --surface api --expected-mode test`
- Web: `node scripts/launch/validate-production-env.mjs --surface web --expected-mode test`

## 6. Customer path results

Not run yet.

## 7. Checkout cancel path result

Not run yet.

## 8. Checkout success path result

Not run yet.

## 9. Stripe event/webhook proof

Not run yet.

## 10. Paid-order/admin visibility proof

Not run yet.

## 11. Shipping/tax sanity result

Not run yet.

Expected launch shipping rule to verify:

- Canada only.
- Orders over `$100 CAD` ship free across Canada.
- Orders `$100 CAD` or under get `$15 CAD` flat-rate shipping.
- Exactly `$100.00 CAD` still gets `$15 CAD` flat-rate shipping.

## 12. Mobile smoke result

Not run yet.

## 13. Issues found

- Final checkout + webhook smoke is blocked until operator confirmations are
  recorded.
- No runtime defect has been identified in this pass because the customer path
  smoke was intentionally not started.

## 14. Go/no-go recommendation

Recommendation: **Hold launch GO/no-GO.**

Reason: checkout, webhook, and paid-order/admin proof have not yet been
collected. The env gate is clear, but the final smoke evidence is still pending.

## 15. Required follow-up tasks

1. Record the required operator confirmations without secrets.
2. Run the final checkout + webhook smoke in Stripe test mode on the confirmed
   domain.
3. Update this result file with redacted evidence and a pass/fail decision.

## 16. Next recommended task

`Run final checkout + webhook smoke on final domain`
