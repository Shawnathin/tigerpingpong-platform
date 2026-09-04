# Tiger PingPong Automated Order Emails V1

## Scope

The API sends three transactional notifications through Resend:

1. `order_received` after the verified Stripe `checkout.session.completed` path has committed the backend order as `paid`.
2. `staff_new_order` to the configured staff inbox after that same verified paid transition.
3. `shipment` after protected staff save carrier, tracking number, shipped date, and the internal shipment note.

Email is never payment truth. A send failure cannot roll back or change the order's paid state.

## Reusable templates

All three messages use the shared, side-effect-free template module in
`apps/api/src/order-emails/order-email.templates.ts`. Delivery concerns stay in the email service;
the template functions only accept order data and return a subject, HTML body, and plain-text body.

- `renderOrderReceivedEmail`: customer payment-confirmation message.
- `renderShipmentEmail`: customer carrier and tracking message.
- `renderStaffNewOrderEmail`: internal new-paid-order alert.
- `renderTigerEmailLayout`: shared email-safe layout and responsive treatment.

The visual and copy system is derived from the approved About and Contact surfaces: Pacific navy,
restrained orange, misted background, direct human-support language, and the approved West Coast
story lines. Customer messages include `info@tigerpingpong.com` and `1-888-552-5259`; the staff
message uses an internal-only footer.

Run `pnpm email:previews` to build the API and render safe sample HTML into ignored
`var/email-previews/`. This command does not contact Resend or send email.

## Delivery and idempotency

- `order_email_deliveries` is the database outbox.
- `(order_id, kind)` is unique, so each order has at most one delivery record for each email type.
- Resend receives the stable idempotency key `tiger/<kind>/<delivery-id>`.
- The paid webhook persists the outbox row but does not wait for the Resend network request before acknowledging Stripe.
- Failed sends retain a safe status/error and use exponential backoff for at most five automatic attempts while the API service is running.
- Protected admin/internal order detail can deliberately retry an unsent message.
- Provider response bodies, API keys, customer addresses, and full order payloads are not logged.
- Row Level Security is enabled on the outbox with no anon/authenticated policies; only the existing privileged API database path may access it.

## Carrier links

The admin shipment form generates customer tracking links for:

- Canada Post
- Purolator
- UPS
- FedEx
- DHL Express

`Other carrier` requires staff to provide the carrier name and an HTTP(S) tracking URL. The backend generates preset links again from the stored tracking number and does not trust a browser-supplied preset URL.

## Required API configuration

- `RESEND_API_KEY`: secret Resend sending key.
- `EMAIL_FROM`: verified sender, currently `Tiger PingPong <info@tigerpingpong.com>`.
- `ORDER_EMAIL_REPLY_TO`: customer reply destination. Defaults to the currently approved `info@tigerpingpong.com` when omitted.
- `ORDER_NOTIFICATION_EMAIL`: staff inbox that receives one new-paid-order alert per order, currently `info@tigerpingpong.com`.

Do not place these on the browser/web service except where an internal deployment system mirrors configuration. Never commit real values.

## Deployment order

1. Add and verify a Resend sending domain. Resend recommends a sending subdomain to isolate sending reputation.
2. Add the four API environment variables without printing their values in logs or PRs.
3. Apply `20260823210000_order_email_outbox` to the target database.
4. Deploy the API, then the web app.
5. Place a Stripe test-mode order using a controlled customer inbox.
6. Confirm the backend order is paid before the customer order-received email and staff new-order alert appear.
7. Confirm a duplicate webhook does not send another staff alert.
8. In protected admin, select a carrier and save a test tracking number.
9. Confirm the generated carrier link, shipment email, protected delivery status, and no duplicate email on webhook/admin retry.
10. Open all three local previews and confirm desktop/mobile layout before the controlled inbox test.

## Failure handling

- `failed`: provider/configuration/request problem; it remains retryable.
- `pending`: queued but not yet claimed.
- `sending`: one API worker has claimed the delivery.
- `sent`: Resend accepted the message and returned an email ID.
- `skipped`: no usable customer email was stored, or the staff alert recipient was not configured.

If email is failed but the order says paid, the order is still paid. Fix provider/configuration issues and use the protected retry control. Do not replay or alter payment state to make email send.

## Explicitly unchanged

- Hosted Stripe Checkout.
- Stripe signature verification and paid-order authority.
- Stripe webhook endpoint.
- Canada-only shipping and all shipping prices/exceptions.
- Basic Auth and internal API token protection.
- DNS, Render configuration, live database state, and production deployment in the development task.
