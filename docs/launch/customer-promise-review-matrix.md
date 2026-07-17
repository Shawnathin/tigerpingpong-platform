# Customer Promise Review Matrix

Status: owner review required before deployment

| Promise area         | Public wording/source                                                                                                 | Evidence or constraint                                                | Owner decision          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------- |
| Shipping geography   | Canada-only online orders; serving customers across Canada                                                            | Locked V1 shipping rule                                               | Approve / edit / reject |
| Shipping threshold   | Over `$100 CAD` ships free; `$100 CAD` or under costs `$15 CAD`; exactly `$100.00` costs `$15 CAD`                    | Shared and server tests cover `$99.99`, `$100.00`, `$100.01`          | Approve / edit / reject |
| Shipping timing      | No product-specific timing is promised; contact support to confirm handling                                           | Timing is not represented by authoritative inventory/fulfillment data | Approve / edit / reject |
| Availability         | Catalog can change; support confirms current availability before ordering where shown                                 | Inventory is not reserved and can be `not_configured`                 | Approve / edit / reject |
| Pricing/currency     | CAD; final amount and taxes shown at hosted checkout                                                                  | Backend catalog price is authoritative                                | Approve / edit / reject |
| Taxes                | Taxes are determined and shown at checkout                                                                            | Stripe/tax configuration requires Plan B accounting validation        | Approve / edit / reject |
| Payment confirmation | Redirect does not prove payment; validated backend/webhook status does                                                | Locked payment-truth architecture                                     | Approve / edit / reject |
| Warranty             | Coverage varies by product; review product facts or contact support                                                   | Blanket “up to 10-year warranty” claim removed                        | Approve / edit / reject |
| Returns              | Contact support before returning; eligibility, instructions, freight, and resolution require confirmation             | No confirmed window, fee, or blanket guarantee                        | Approve / edit / reject |
| Damage               | Report promptly, preserve packaging, and provide requested evidence                                                   | Operational draft only                                                | Approve / edit / reject |
| Refunds              | An approved resolution determines method/timing; request alone is not approval                                        | Stripe and business rules require owner confirmation                  | Approve / edit / reject |
| Support              | Phone and `info@tigerpingpong.com`; product/order/shipping/setup help                                                 | Existing storefront contact identity                                  | Approve / edit / reject |
| Business identity    | Customer-facing identity is “Tiger Ping Pong”; Vancouver, BC is service location context                              | No unconfirmed legal entity or street address claimed                 | Approve / edit / reject |
| Privacy              | Cart local storage; order/contact processing; Stripe and service providers; limited retention principles and requests | Draft matches implemented architecture; not legal advice              | Approve / edit / reject |

## Sign-off

Reviewer name: [enter name]

Decision date/time: [enter date/time]

Approved rows or edits linked: [enter reference]

Unresolved promises: [enter details]

Any unresolved row is a launch stop unless the go/no-go owner records explicit, scoped risk acceptance.
