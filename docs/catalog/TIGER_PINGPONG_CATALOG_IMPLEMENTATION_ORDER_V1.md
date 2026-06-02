# Tiger Ping Pong Catalog Implementation Order V1

## Purpose

This document turns the catalog model proposal into a practical build sequence.
It is planning only. It does not implement Prisma schema, SQL, migrations, API
routes, frontend pages, checkout, auth, or admin screens.

## Recommended Build Order

### 1. Confirm Business Decisions

Before implementation, confirm:

- Launch categories
- Which specific SKUs require manual `quote_required` overrides
- Freight, curbside delivery, tax, regional availability, and shipping policy
  for purchasable tables
- Whether Stripe is the checkout provider for shippable products
- Quote request notification path
- Media storage approach
- Legacy URL redirect needs

Output: accepted decisions or a short decision record.

### 2. Define Prisma Catalog Schema

Implement only the approved v1 entities:

- `categories`
- `products`
- `product_options`
- `product_option_values`
- `product_variants`
- `product_media`
- `product_content_sections`
- `product_spec_groups`
- `product_specs`
- `product_relationships`
- `quote_requests`
- `quote_request_items`
- `orders`
- `order_items`

Because tables are purchasable in v1, `orders` and `order_items` should be
included in v1 schema planning. Checkout implementation still belongs in a later
explicit checkout task.

Output: Prisma schema and migration.

### 3. Add Backend Catalog Read APIs

Add API endpoints for:

- Category list/detail
- Product list/detail
- Product media/content/specs
- Related products

The API should own database access. The web app should not connect directly to
Supabase.

Output: backend read endpoints and response types.

### 4. Add Quote Request Persistence

Add quote request write endpoint and persistence for:

- Customer contact fields
- Requested product items
- Quantity
- Message and source page

Email notification can be added if approved. Spam protection should be decided
before public launch.

Output: quote request endpoint and storage.

### 5. Build Frontend Catalog Pages

Build:

- Category listing pages
- Product detail pages
- Product media gallery
- Specs/comparison display
- Content/storytelling sections
- Purchase-mode UI states
- Quote/contact form for quote products

Output: customer-facing catalog experience. Checkout UI is still a later
explicit checkout task.

### 6. Add Checkout In A Later Explicit Checkout Task

When checkout is explicitly approved, support purchasable v1 categories:

- Tables
- Accessories
- Paddles
- Balls
- Nets
- Covers

Replacement Parts are excluded from v1 public navigation and checkout scope.
They may still be scraped/preserved for future review, redirects, and v1.5/v2
planning.

Before public table checkout launches, confirm freight, curbside delivery, tax,
regional availability, and shipping policy. Specific table SKUs should be marked
`quote_required` if fulfillment needs manual review.

Output: checkout implementation task, likely involving Stripe.

### 7. Add Launch Redirects

If legacy TigerPingPong.ca URLs matter, add redirects as a launch task.

Output: redirect map and implementation.

### 8. Add Admin Or Content Maintenance Workflow

After product data is stable, decide whether v1 content is maintained through:

- Direct database edits
- Seed/import scripts
- A lightweight internal admin
- A third-party CMS

Output: content operations decision.

## Guardrails

- Do not hardcode purchase mode by category only.
- Do not add fake demo products.
- Do not build a full ecommerce platform before the launch catalog is proven.
- Do not let frontend bypass the API for catalog data.
- Do not include Replacement Parts in v1 public navigation or checkout scope.
- Do not launch table checkout before freight, curbside, tax, regional, and
  shipping policies are confirmed.
- Do not implement cart, checkout, auth, or admin unless the task explicitly
  includes them.

## Suggested Next Codex Task

Create the approved Prisma catalog schema and migration for the v1 catalog model
after the remaining open decisions are answered. Include `orders` and
`order_items` in schema planning, but keep checkout implementation in a separate
explicit task.
