# Tiger Ping Pong Catalog Model Proposal V1

## 1. Executive Summary

TigerPingPong.ca needs a practical catalog model that supports richer product
pages without becoming a generic ecommerce platform. The v1 catalog should let
the backend own product data, expose it through the API, and give the frontend
enough structured content for product detail pages, category browsing,
comparison, quote/contact flows, and simple online checkout products.

The recommended v1 model supports:

- Ping pong tables, paddles, balls, covers, nets, and accessories for the v1
  public launch.
- Product-level purchase behavior, not category-only behavior.
- Rich product pages with storytelling sections, media, specs, SEO, related
  products, variants/options, shipping notes, and quote/contact needs.
- A small set of operational entities for quote requests and checkout orders.
- Replacement parts preserved for future review, redirects, and v1.5/v2
  planning, but deferred from v1 public navigation and checkout scope.

This proposal is documentation only. It does not define Prisma schema, SQL,
migrations, API routes, frontend pages, seed data, auth, Stripe, or admin
screens.

## 2. Recommended V1 Entities

Recommended entities:

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

Optional follow-up launch entity:

- `redirects`

The catalog should stay single-store and single-language in v1. Multi-tenant,
multi-market, and full PIM workflows should be deferred.

## 3. Entity-By-Entity Field List

### `categories`

- `id`: stable primary key
- `slug`: public URL slug, unique
- `name`: display name
- `description`: optional summary
- `parent_id`: optional self-reference for nested categories
- `sort_order`: manual ordering
- `is_active`: whether the category is visible
- `seo_title`: optional SEO title
- `seo_description`: optional SEO description
- `created_at`
- `updated_at`

### `products`

- `id`: stable primary key
- `slug`: public URL slug, unique
- `sku`: optional base SKU for products with no variants
- `name`: product display name
- `short_description`: listing and page summary
- `description`: main product description
- `category_id`: primary category
- `status`: `draft`, `active`, `archived`
- `purchase_mode`: product-level purchase behavior
- `price_cents`: optional product-level price for simple products
- `compare_at_price_cents`: optional merchandising price
- `currency`: default `CAD`
- `inventory_tracking`: whether inventory is tracked
- `inventory_quantity`: optional simple product inventory
- `is_featured`: homepage/category merchandising flag
- `shipping_summary`: short shipping message
- `shipping_requires_quote`: whether shipping needs manual handling
- `lead_time_text`: customer-facing lead time
- `seo_title`
- `seo_description`
- `seo_image_id`: optional reference to media
- `created_at`
- `updated_at`

### `product_options`

- `id`
- `product_id`
- `name`: for example `Color`, `Size`, `Table Finish`
- `display_order`
- `created_at`
- `updated_at`

### `product_option_values`

- `id`
- `product_option_id`
- `value`: for example `Black`, `Blue`, `9 ft`
- `display_order`
- `created_at`
- `updated_at`

### `product_variants`

- `id`
- `product_id`
- `sku`
- `name`: optional display name
- `option_value_ids`: implementation can model this as a join table later
- `price_cents`
- `compare_at_price_cents`
- `currency`
- `inventory_quantity`
- `inventory_tracking`
- `is_active`
- `purchase_mode_override`: optional variant-level override
- `weight_grams`: optional shipping input
- `created_at`
- `updated_at`

### `product_media`

- `id`
- `product_id`
- `variant_id`: optional variant-specific media
- `media_type`: `image`, `video`, `external_video`
- `url`
- `alt_text`
- `title`
- `caption`
- `sort_order`
- `is_primary`
- `created_at`
- `updated_at`

### `product_content_sections`

- `id`
- `product_id`
- `section_type`: `hero`, `story`, `feature`, `callout`, `care`, `faq`,
  `quote_note`
- `heading`
- `body`
- `media_id`: optional media reference
- `sort_order`
- `is_active`
- `created_at`
- `updated_at`

### `product_spec_groups`

- `id`
- `product_id`
- `name`: for example `Dimensions`, `Performance`, `Shipping`
- `sort_order`
- `created_at`
- `updated_at`

### `product_specs`

- `id`
- `product_id`
- `spec_group_id`
- `name`
- `value`
- `unit`: optional
- `comparison_key`: optional normalized key for comparison tables
- `sort_order`
- `is_highlighted`
- `created_at`
- `updated_at`

### `product_relationships`

- `id`
- `source_product_id`
- `target_product_id`
- `relationship_type`: `upsell`, `cross_sell`, `accessory`,
  `replacement_part`, `similar`, `required_part`
- `sort_order`
- `created_at`
- `updated_at`

### `quote_requests`

- `id`
- `status`: `new`, `reviewing`, `contacted`, `closed`
- `customer_name`
- `customer_email`
- `customer_phone`
- `postal_code`
- `message`
- `preferred_contact_method`
- `source_page`
- `created_at`
- `updated_at`

### `quote_request_items`

- `id`
- `quote_request_id`
- `product_id`
- `variant_id`: optional
- `quantity`
- `notes`
- `created_at`

### `orders`

- `id`
- `status`: planning field for v1 checkout-capable products
- `customer_email`
- `customer_name`
- `subtotal_cents`
- `shipping_cents`
- `tax_cents`
- `total_cents`
- `currency`
- `external_payment_reference`: deferred until checkout provider is selected
- `created_at`
- `updated_at`

### `order_items`

- `id`
- `order_id`
- `product_id`
- `variant_id`
- `sku_snapshot`
- `name_snapshot`
- `quantity`
- `unit_price_cents`
- `total_price_cents`
- `created_at`

## 4. Relationships Between Entities

- A category can have many child categories.
- A category can have many products.
- A product belongs to one primary category in v1.
- A product can have many options.
- An option can have many option values.
- A product can have many variants.
- A variant is defined by selected option values.
- A product can have many media items.
- A media item can optionally belong to one variant.
- A product can have many content sections.
- A product can have many spec groups.
- A product can have many specs.
- A spec can optionally belong to a spec group.
- A product can relate to many other products through typed relationships.
- A quote request can include many quote request items.
- A quote request item references a product and optionally a variant.
- An order can include many order items.
- An order item references product/variant records and stores display snapshots.

## 5. Product Purchase-Mode Strategy

Recommended purchase modes:

- `online_checkout`: customer can buy online.
- `quote_required`: customer must request a quote.
- `dealer_contact`: customer is directed to contact Tiger Ping Pong or a dealer.
- `coming_soon`: product can be shown but not purchased yet.
- `disabled`: product is visible only if needed, with purchase unavailable.

V1 recommendation:

- Tables default to `online_checkout` in v1.
- Tables are purchasable unless a specific table SKU is manually marked
  otherwise.
- Paddles, balls, nets, covers, and accessories can use `online_checkout` where
  fulfillment is practical.
- `quote_required` remains available for special cases, discontinued products,
  uncertain fulfillment, or products needing manual review.
- Replacement Parts are deferred from v1 public navigation, public launch
  categories, and checkout scope. Replacement part data may still be
  scraped/preserved for future review, redirects, and v1.5/v2 planning.
- Product-level override is required.
- Variant-level override should be available when a specific option changes
  fulfillment or availability.
- Do not hardcode purchase behavior only by category. Category can provide a
  default, but product configuration should decide the customer flow.

## 6. Category Model

Use a simple hierarchical category model in v1. Categories should support
navigation and merchandising, not complex marketplace taxonomy.

Recommended v1 public launch categories:

- Tables
- Paddles
- Balls
- Nets
- Covers
- Accessories

Replacement Parts should not appear in v1 public navigation, public launch
categories, or checkout scope. They may still be scraped and preserved for
future review, redirect mapping, and v1.5/v2 planning.

Each product should have one primary category in v1. Additional category
membership can be deferred unless merchandising requires it.

## 7. Product Model

`products` should represent the customer-facing product page. It should contain
the core identity, summary fields, purchase mode, simple price data, shipping
summary, and SEO fields.

For products with variants, the product can hold page-level content while
variants hold SKU, pricing, and inventory differences. For products without
variants, the product can use product-level SKU, price, and inventory fields.

## 8. Variant/Options Model

Use options and option values to describe choices, and variants to represent
sellable combinations. This supports purchasable table SKUs, simple shippable
goods, and manual overrides for products that need review.

Examples:

- Paddle color
- Cover size
- Net style
- Table finish
- Table size or shipping configuration, if needed

The implementation task should decide whether variant-to-option-value mapping
uses a join table or JSON. A relational join is cleaner for integrity and
filtering, but JSON can be acceptable if v1 variant rules stay simple.

## 9. Product Media Model

Product media should support:

- Primary listing image
- Gallery images
- Variant-specific images
- Videos or external video embeds
- Alt text for accessibility and SEO
- Captions for richer pages

Store media URLs and metadata in v1. Asset upload/storage workflow can be
implemented later.

## 10. Product Content/Storytelling Section Model

Product pages need richer content than a basic product table. Content sections
should support ordered blocks with section type, heading, body, and optional
media.

Recommended section types:

- `hero`
- `story`
- `feature`
- `callout`
- `care`
- `faq`
- `quote_note`

This gives tables room for showroom-style storytelling while keeping accessories
simple.

## 11. Specs/Comparison Model

Use spec groups and specs to support structured product facts and comparison
tables.

Examples:

- Dimensions
- Weight
- Playback type
- Indoor/outdoor use
- Foldability
- Included accessories
- Warranty
- Shipping package size

`comparison_key` should be optional and normalized for specs that participate in
comparison views. Not every spec needs to be comparable.

## 12. Related Products/Upsells Model

Use typed product relationships rather than hardcoded related-product widgets.

Recommended relationship types:

- `upsell`
- `cross_sell`
- `accessory`
- `replacement_part`
- `similar`
- `required_part`

This supports table-to-cover relationships and paddle-to-balls suggestions
without adding a large recommendation engine. Replacement part relationships can
be preserved internally for future review, redirects, and v1.5/v2 planning, but
should not drive v1 public navigation or checkout.

## 13. SEO Metadata Approach

Keep SEO fields directly on categories and products in v1:

- `seo_title`
- `seo_description`
- `seo_image_id`
- `slug`

Optional future fields:

- Canonical URL
- Structured data override
- Noindex flag
- Redirects from legacy URLs

Redirects should be handled as a separate launch task if TigerPingPong.ca has
important legacy URLs.

## 14. Shipping/Purchase-Flow Fields

Shipping and purchase flow should be explicit enough to prevent checkout from
being offered for products that need manual handling.

Recommended product fields:

- `purchase_mode`
- `shipping_summary`
- `shipping_requires_quote`
- `lead_time_text`

Recommended variant fields:

- `purchase_mode_override`
- `weight_grams`
- `inventory_tracking`
- `inventory_quantity`

Because tables are purchasable in v1, public table checkout must not launch
until freight, curbside delivery, tax, regional availability, and shipping
policy are confirmed. A table SKU should be manually switched to
`quote_required` when fulfillment, freight, regional availability, or delivery
terms are uncertain.

## 15. Quote/Contact Request Data Needs

Quote requests should collect enough context for Tiger Ping Pong to follow up:

- Customer name
- Email
- Phone
- Postal code
- Preferred contact method
- Message
- Product and variant interest
- Quantity
- Source page

Quote requests should not require auth in v1. Spam protection, CRM integration,
and email automation can be separate implementation decisions.

## 16. Fields Intentionally Deferred From V1

Defer:

- Multi-store or multi-tenant fields
- Multi-currency pricing
- Multi-language content
- Full warehouse inventory
- Complex shipping-rate tables
- Promotions and discount rules
- Subscriptions
- Product reviews
- Customer accounts
- Full PIM workflow states
- Supplier/vendor management
- Admin approval workflows
- Advanced search indexing tables
- Automated recommendation engine
- Replacement Parts as public launch navigation or checkout categories

## 17. Open Decisions

Key open decisions:

- Which product categories launch first?
- Which specific table SKUs need manual `quote_required` overrides?
- What freight, curbside delivery, tax, regional availability, and shipping
  policy is required before public table checkout?
- Is Stripe the intended checkout provider for purchasable products?
- Should quote requests send email only, store in database only, or both?
- What media storage approach should be used?
- Which legacy TigerPingPong.ca URLs need redirects?
- Does v1 need variant inventory tracking, or only availability flags?
- Who will maintain product content before an admin UI exists?

See `TIGER_PINGPONG_CATALOG_OPEN_DECISIONS_V1.md` for the working list.

## 18. Proposed Implementation Order

1. Confirm open decisions.
2. Implement Prisma catalog schema and migration, including `orders` and
   `order_items` for v1 schema planning.
3. Add backend read models and catalog API endpoints.
4. Add quote request persistence and notification path.
5. Add product/category frontend pages.
6. Add checkout implementation only in a later explicit checkout task after
   freight, curbside, tax, regional, and shipping policies are confirmed.
7. Add redirects and launch content import planning.

See `TIGER_PINGPONG_CATALOG_IMPLEMENTATION_ORDER_V1.md` for details.

## 19. Risks / Things Not To Overbuild

- Do not create a generic Shopify clone.
- Do not make table shipping look checkout-ready before fulfillment rules are
  clear.
- Do not launch public table checkout before freight, curbside delivery, tax,
  regional availability, and shipping policy are confirmed.
- Do not add multi-tenant abstractions.
- Do not build a full admin dashboard before the catalog data shape is proven.
- Do not model every possible ecommerce feature before launch.
- Do not let category defaults replace product-level purchase mode controls.
- Do not rely on fake demo products to validate the model.

## 20. Acceptance Criteria For Future Implementation Task

A future implementation task should be considered complete when:

- Prisma schema defines approved v1 catalog entities.
- Migration applies cleanly against Supabase Postgres.
- No fake product data is committed.
- Backend owns catalog data access.
- Frontend reads catalog data through API routes only.
- Product purchase modes are enforced by backend responses.
- Tables default to `online_checkout`, while specific table SKUs can be manually
  marked `quote_required` for exceptions.
- Replacement Parts are excluded from v1 public navigation and checkout scope.
- Quote request data can be stored safely.
- Required SEO and media fields exist.
- Tests or validation cover key purchase-mode behavior.
- No admin, auth, Stripe, or checkout code is added unless that task explicitly
  includes it.
