# 044 - Product Media Gallery Options V1 QA

## Media

- [ ] Cloudinary URLs are present in product data after the PR 43 media import
      data is available to the target API/database.
- [ ] Catalog cards show the primary Cloudinary image when available.
- [ ] Catalog cards do not show all gallery images.
- [ ] Product detail page shows all available gallery images as thumbnails.
- [ ] Thumbnail switching changes the main product image.
- [ ] Fallback media still works when mapped media is missing.
- [ ] Failed image loads show the existing placeholder instead of broken image
      icons.
- [ ] Mobile gallery remains usable.
- [ ] Mobile thumbnail row does not create horizontal page overflow.

## Options

- [ ] Required top colour selector appears for `tiger-expo-outdoor-table`.
- [ ] Required top colour selector appears for `tiger-portland-outdoor-table`.
- [ ] Required top colour selector appears for `tiger-portland-indoor-table`.
- [ ] Required top colour selector appears for `tiger-whistler-indoor-table`.
- [ ] No top colour selector appears for `tiger-plaza-outdoor-table-grey`
      because it has only one active colour value.
- [ ] Add to cart is blocked until a required top colour is selected.
- [ ] Selected option appears in the add-to-cart modal.
- [ ] Selected option appears in the cart.
- [ ] Different selected options create separate cart lines.
- [ ] Quantity updates apply to the correct option-specific cart line.
- [ ] Remove applies to the correct option-specific cart line.
- [ ] Stripe Checkout identifies selected colour in the line item name.
- [ ] Internal order detail identifies selected colour through the item name,
      variant key, and SKU.
- [ ] Arbitrary client option values are rejected by the checkout API.

## Regression

- [ ] Cart count still works.
- [ ] Add-on modal still works.
- [ ] Checkout still opens Stripe.
- [ ] Checkout still uses server-trusted product prices.
- [ ] Client checkout request sends only product slug, quantity, and selected
      option key/value pairs.
- [ ] Success page still reads backend-confirmed paid status.
- [ ] Stripe webhook paid-transition behavior is unchanged.
- [ ] Admin/internal protections are unchanged.
- [ ] Public nav is unchanged.

## Current Data Note

Production API data checked on 2026-06-12 did not yet expose the PR 43
Cloudinary secure URLs or multiple media rows. Run the media checks again after
the PR 43 media import data is present in the target database/API.
