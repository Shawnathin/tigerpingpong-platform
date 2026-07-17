# Final Checkout and Webhook Evidence — Redacted Template

Date/time and timezone: [enter date/time]

Approved commit/deployment identifier: [enter identifier]

Test or live mode: [enter mode]

Operators and go/no-go owner: [enter names]

Never record secret values, environment values, full payloads, cookies, internal tokens, card data, or unredacted customer information.

| Gate                                                   | Redacted evidence reference                         | Result      |
| ------------------------------------------------------ | --------------------------------------------------- | ----------- |
| Web/API env validator with expected mode/origin        | command timestamp + pass counts only                | PASS / FAIL |
| Public route/mobile/security-header smoke              | report or sanitized screenshot                      | PASS / FAIL |
| Protected-route rejection                              | route/status only                                   | PASS / FAIL |
| Provinces: BC, AB, ON, QC, one additional HST province | tax totals reviewed by authorized owner             | PASS / FAIL |
| Shipping: `$99.99`, `$100.00`, `$100.01`               | displayed subtotal/shipping outcome only            | PASS / FAIL |
| Checkout cancel                                        | sanitized browser evidence                          | PASS / FAIL |
| Successful authorized payment                          | redacted Stripe test/live reference suffix only     | PASS / FAIL |
| Webhook signature and `2xx` delivery                   | event type, mode, endpoint label, status, timestamp | PASS / FAIL |
| Backend paid transition                                | public order reference or redacted identifier       | PASS / FAIL |
| Duplicate delivery                                     | outcome label without payload                       | PASS / FAIL |
| Manual-review exception                                | scenario/reason label without customer data         | PASS / FAIL |
| Success page backend-confirmed state                   | sanitized screenshot                                | PASS / FAIL |
| Staff visibility/auth                                  | status and redacted order reference                 | PASS / FAIL |
| Monitoring notifications                               | alert test timestamp/ticket reference               | PASS / FAIL |
| Backup/restore and rollback readiness                  | provider evidence/ticket reference                  | PASS / FAIL |

Open exceptions: [enter details]

Risk acceptances linked: [enter references]

Final decision: GO / NO-GO

Decision owner and timestamp: [enter owner/time]
