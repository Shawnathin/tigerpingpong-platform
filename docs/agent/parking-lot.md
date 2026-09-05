# Parking Lot

- Full SEO polish (title/description optimization, canonical redirect strategy refinement, richer page metadata).
- Optional security hardening pass (CSP and HSTS policy tuning).
- Accessibility remediation beyond current modal keyboard support baseline.
- Advanced admin product tooling and long-term inventory/audit workflow expansion.
- Any optional marketplace/marketing tasks after launch green-light.
- Canonical routing refinements for `tigerpingpong.ca`/`www`/`.com` remain outside this task; GoDaddy is now authoritative for the `.ca` zone.

- Automated order/shipment email production activation after the recovered code task is reviewed and merged:
  - Resend has a sending-only API key and a successful onboarding test send; the key value is not committed or stored in repository docs.
  - Set `ORDER_NOTIFICATION_EMAIL=info@tigerpingpong.com` on the API service before controlled testing.
  - Owner confirmed `tigerpingpong.com` and `info@tigerpingpong.com` are already configured in Resend; do not continue the abandoned `updates.tigerpingpong.ca` setup.
  - In a separately selected activation lane, verify the existing Resend domain status without changing DNS, set the approved server-only Render email environment, apply the outbox migration, deploy, and run a controlled order/staff/shipment inbox proof before production promotion.

- Optional target env warnings that remain for operator review:
  `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `CLOUDINARY_API_KEY`,
  `CLOUDINARY_API_SECRET`, `DIRECT_URL`, `NEXT_PUBLIC_API_URL`,
  `CLOUDINARY_CLOUD_NAME`, and `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.

- Live-mode or real paid checkout smoke execution on final domain remains parked
  until separately approved. The next recommended task is Stripe test-mode final
  checkout + webhook smoke on the final domain.

- Final checkout + webhook smoke execution remains held at the checkout step
  until fresh target Render API/web service-shell env validator output is
  confirmed in expected Stripe `test` mode. Public storefront/cart checks passed
  on `https://tigerpingpong-web.onrender.com`; Stripe webhook and paid-order
  admin proof remain pending.

- Post-launch replacement-parts experience:
  - Add any replacement part beyond Part 40, the Standard Replacement Net, and the Expo & Portland Net Upgrade System only after its catalog data, media, compatibility copy, availability, and curated rank are approved.
  - Add a Whistler-specific net system only after its SKU, price, included items, exact compatibility copy, media, availability, and curated rank are owner-approved. Do not imply that the Expo and Portland system fits Whistler.
  - Link manuals and setup videos from each applicable product page.
  - Add a general table/part finder plus a dedicated parts page for each table.
  - Put each table's five most-requested parts first instead of exposing one giant grid.
  - Explore interactive table diagrams that show where a selected part goes and link to installation guidance.
  - Add the Canada Post Part 40 story photo after Shawn captures the nearly four-foot opening rod outside a recognizable location; use the caption “This is why we stock the little part.”

## After admin safety/usability

Defer searchable Orders queue, fulfillment/email filters, staff audit history, and media-editor improvements to separately selected tasks. No quantity inventory or broad admin redesign in this first fix.
