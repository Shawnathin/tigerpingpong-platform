# Tiger Ping Pong Catalog Open Decisions V1

## Purpose

These are the business and implementation decisions Shawn should make before
the catalog schema is implemented. This file is planning only.

## Product And Category Decisions

1. Which categories launch in v1?

Decision: v1 public launch categories are:

- Tables
- Paddles
- Balls
- Nets
- Covers
- Accessories

Replacement Parts are deferred from v1 public navigation, public launch
categories, and checkout scope. They may still be scraped/preserved for future
review, redirects, and v1.5/v2 planning.

2. Does each product need one primary category only, or multiple categories?

Recommendation: start with one primary category in v1.

3. Which table products launch first?

Tables default to `online_checkout` in v1 and are purchasable unless a specific
table SKU is manually marked otherwise.

4. Which non-table products are checkout-eligible in v1?

Paddles, balls, nets, covers, and accessories can be checkout-eligible where
fulfillment is practical. Replacement Parts are excluded from v1 checkout scope.

## Purchase-Mode Decisions

5. Which table SKUs require manual purchase-mode overrides?

Decision: tables default to `online_checkout` in v1.

`quote_required` remains available for special cases, discontinued products,
uncertain fulfillment, or products needing manual review.

6. Should purchase mode be editable per product before an admin UI exists?

Recommendation: yes, even if maintained directly in seed/import data.

7. Can variants override product purchase mode?

Recommendation: yes, but only when a specific option changes availability or
fulfillment.

## Checkout Decisions

8. Is Stripe the intended checkout provider?

Needed before implementing payments or checkout UI.

9. Should `orders` and `order_items` be implemented with the catalog schema?

Decision: yes, include `orders` and `order_items` in v1 schema planning because
tables are purchasable in v1. Checkout implementation still belongs in a later
explicit checkout task.

10. Which shipping rules apply to purchasable products?

Needed before online checkout can be public. Table checkout specifically
requires confirmed freight, curbside delivery, tax, regional availability, and
shipping policy before public launch.

## Quote Request Decisions

11. What fields are required on quote/contact forms?

Recommended required fields:

- Name
- Email
- Product interest
- Postal code

Optional:

- Phone
- Preferred contact method
- Message

12. Where should quote requests go?

Options:

- Store in database only
- Send email only
- Store in database and send email

Recommendation: store in database and send email if notification tooling is
available.

13. Does v1 need spam protection?

Recommendation: yes before public launch.

## Content And Media Decisions

14. Where will product images and videos be stored?

Options:

- Supabase Storage
- External CDN/storage
- Existing hosted URLs during launch

15. Who writes and maintains product storytelling content?

Needed before deciding whether a lightweight admin or import process is
required.

16. Which products need comparison specs?

Tables likely need comparison specs first.

## SEO And Launch Decisions

17. Which legacy TigerPingPong.ca URLs need redirects?

Needed for a separate launch redirect task.

18. Are canonical URLs, noindex flags, or structured data overrides required in
v1?

Recommendation: defer unless launch SEO requirements demand them.

## Operations Decisions

19. How will product data be loaded before an admin UI exists?

Options:

- Manual database entry
- Scripted import
- CSV import
- Lightweight internal admin

20. Does v1 need inventory counts, availability flags, or both?

Recommendation: use availability/purchase mode first, then inventory counts for
simple shippable products if checkout launches.

## Decisions To Make Before Next Implementation Task

Minimum decisions needed:

- Launch categories
- Specific table SKUs that require `quote_required` override
- Freight, curbside delivery, tax, regional, and shipping policy for public
  table checkout
- Checkout eligibility for non-table products
- Quote request required fields and notification path
- Product media storage approach
- Product data maintenance approach
