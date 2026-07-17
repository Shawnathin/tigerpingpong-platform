# Customer Promise Review Matrix

Status: policy wording approved by Shawn; tax configuration proof remains a separate launch gate

| Promise area         | Public wording/source                                                                                                 | Evidence or constraint                                                      | Owner decision                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------- |
| Shipping geography   | Canada-only online orders; serving customers across Canada                                                            | Locked V1 shipping rule                                                     | Approved by Shawn, 2026-07-17 |
| Shipping threshold   | Over `$100 CAD` ships free; `$100 CAD` or under costs `$15 CAD`; exactly `$100.00` costs `$15 CAD`                    | Shared and server tests cover `$99.99`, `$100.00`, `$100.01`                | Approved by Shawn, 2026-07-17 |
| Shipping timing      | “In stock — ships within 24 business hours.”                                                                          | Owner-confirmed launch promise; fulfillment timing is not system-tracked    | Approved by Shawn, 2026-07-17 |
| Availability         | “In stock — ships within 24 business hours.”                                                                          | Product and variant availability remain controlled in the protected admin   | Approved by Shawn, 2026-07-17 |
| Pricing/currency     | CAD; final amount and taxes shown at hosted checkout                                                                  | Backend catalog price is authoritative                                      | Approved by Shawn, 2026-07-17 |
| Taxes                | Applicable taxes are calculated and displayed by Stripe Checkout before payment                                       | Stripe configuration and province testing remain required operational proof | Approved by Shawn, 2026-07-17 |
| Payment confirmation | Redirect does not prove payment; validated backend/webhook status does                                                | Locked payment-truth architecture                                           | Approved by Shawn, 2026-07-17 |
| Warranty             | Manufacturer warranty terms vary; labour is excluded unless stated otherwise                                          | Adapted from owner-supplied Home Billiards terms                            | Approved by Shawn, 2026-07-17 |
| Returns              | Contact support before returning; package goods properly; return shipping may apply to tables                         | Adapted from the existing TigerPingPong shipping and returns page           | Approved by Shawn, 2026-07-17 |
| Damage               | Inspect on delivery, note carrier damage, and notify Tiger Ping Pong within five days                                 | Adapted from the existing TigerPingPong shipping and returns page           | Approved by Shawn, 2026-07-17 |
| Refunds              | No general refund timing or outcome is promised; support confirms the return process                                  | Source policy does not define an automatic refund entitlement               | Approved by Shawn, 2026-07-17 |
| Support              | `1-888-552-5259`, Monday–Friday 9–5 Pacific, and `info@tigerpingpong.com`                                             | Existing TigerPingPong contact and returns wording                          | Approved by Shawn, 2026-07-17 |
| Business identity    | Customer-facing identity is “Tiger Ping Pong”; 1644 S.E. Marine Drive, Vancouver, BC                                  | Existing TigerPingPong and Home Billiards public contact information        | Approved by Shawn, 2026-07-17 |
| Privacy              | Order/support and technical data; hosted Stripe payments; service providers; no sale or third-party marketing sharing | Adapted from Home Billiards and aligned to the implemented storefront       | Approved by Shawn, 2026-07-17 |

## Sign-off

Reviewer name: Shawn

Decision date/time: 2026-07-17 11:47 PDT

Approved rows or edits linked: availability and shipping-timing approval in PR #108; revised policy approval recorded in the launch operator task on 2026-07-17

Unresolved promises: none; Canadian tax configuration and province testing remain required operational proof

Any unresolved row is a launch stop unless the go/no-go owner records explicit, scoped risk acceptance.
