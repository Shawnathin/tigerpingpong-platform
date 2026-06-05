# 014: V1 Shipping Language and Commerce Rules

## Summary

Updated the public V1 catalog and product detail language to reflect the confirmed Tiger Ping Pong shipping rule:

- Free shipping across Canada on orders over $100.
- $15 flat rate shipping across Canada on orders under or equal to $100.
- All products, including tables, follow the same V1 shipping rule.

This is a public UI copy and business-rule cleanup only.

## Public UI language updated

Updated:

```text
/catalog
/catalog/products/[slug]
```

Public product cards and product detail pages now derive shipping copy from `priceCents`:

```text
priceCents > 10000: Free shipping across Canada.
priceCents <= 10000: $15 flat rate shipping across Canada.
```

This keeps the "$100.00 exactly" case in the $15 flat rate bucket unless the business rule later changes to "$100 and over."

## Tables included

Tables are no longer publicly treated as freight/manual-review items for V1. Table products use the same price-based public shipping copy as every other product.

## Shipping placeholder route added

Added:

```text
/shipping
```

The placeholder page includes:

- Free shipping across Canada on orders over $100.
- $15 flat rate shipping across Canada on orders under or equal to $100.
- Applies to Tiger Ping Pong V1 online orders.
- Additional terms and conditions may apply.
- Final wording should be reviewed before public launch.

This is not final legal policy copy.

## Shipping terms links

The `/catalog` product cards and `/catalog/products/[slug]` detail pages link shipping copy to:

```text
/shipping
```

The public-facing copy uses:

```text
See shipping terms.
```

## Stripe hosted checkout direction

Confirmed V1 commerce direction remains Stripe hosted checkout/payment pages.

The product detail page keeps a non-functional V1 checkout placeholder and now names that Stripe hosted checkout is planned for V1.

Custom checkout pages are deferred to a future release.

No Stripe implementation was added in this task.

## Internal field left untouched

The internal `shippingReviewRequired` field remains in frontend types and API behavior.

No backend code, database fields, Prisma schema, migrations, or database data were changed.

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
- No final legal shipping policy
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

## Render env var needed

The Render web service needs:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://tigerpingpong-platform.onrender.com
```

No Render settings were changed directly in this task.

## Next recommended task

Plan the V1 Stripe hosted checkout integration as a separate task. Keep it focused on hosted checkout/payment links and continue deferring custom checkout pages, cart, auth, admin, and schema changes until a later release decision.
