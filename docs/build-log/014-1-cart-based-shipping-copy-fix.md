# 014-1: Cart-Based Shipping Copy Fix

## Summary

Updated public shipping copy so product cards and product detail pages describe the V1 cart/order-based shipping rule without implying that shipping is charged per product.

This follow-up corrects Task 014 language for lower-priced products. A customer can add multiple items priced at or below $100 and still qualify for free shipping once the cart/order total is over $100.

## Cart/order-based shipping rule

- Free shipping across Canada on orders over $100.
- Flat rate shipping applies to orders under or equal to $100.
- All products, including tables, follow the same V1 cart/order-based rule.
- Exact cart shipping will be confirmed during checkout.
- Final policy wording should be reviewed before public launch.

## Product page and card copy rules

Public product cards and product detail pages derive copy from product `priceCents` only to choose safe, cart-aware messaging:

```text
priceCents > 10000: Free shipping across Canada.
priceCents <= 10000: Free shipping on orders over $100.
```

Lower-priced products no longer say "$15 flat rate shipping across Canada" on product cards or product detail pages because that sounds like a product-specific charge.

Shipping copy on `/catalog` and `/catalog/products/[slug]` continues to link to `/shipping` with:

```text
See shipping terms.
```

## Shipping page rule

The `/shipping` page explains the full V1 rule as an order/cart policy:

- Free shipping across Canada on orders over $100.
- Flat rate shipping applies to orders under or equal to $100.
- Exact cart shipping will be confirmed during checkout.
- Final policy wording should be reviewed before public launch.

## Intentionally excluded

- No Stripe implementation
- No checkout
- No cart
- No payment buttons
- No auth
- No admin screens
- No Prisma schema changes
- No migrations
- No database writes
- No Cloudinary uploads
- No Cloudinary workflow implementation
- No site redesign

## Local test steps

Run validation from the repository root:

```bash
pnpm lint
pnpm typecheck
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm build
git diff --check
git status
```

Run the web app against the deployed API:

```bash
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com pnpm --filter @tigerpingpong/web dev
```

Then test:

```text
http://localhost:3000/catalog
http://localhost:3000/catalog/products/tiger-vice-paddle
http://localhost:3000/catalog/products/tiger-whistler-indoor-table
http://localhost:3000/shipping
http://localhost:3000/catalog-preview
```

Expected public copy:

- Table/high-priced products: "Free shipping across Canada."
- Tiger Vice Paddle and other products priced at or below $100: "Free shipping on orders over $100."
- Product surfaces keep "See shipping terms."
- `/shipping` explains the cart/order threshold and flat-rate-under-or-equal-$100 rule.

## Next recommended task

Review and approve final public shipping policy wording before public launch, including the checkout confirmation language that will appear once checkout work begins.
