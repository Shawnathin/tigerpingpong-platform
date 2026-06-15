# PR 059 Admin Product Media Mapping Test Plan

Date: 2026-06-15
Branch / PR: `feature/minimal-admin-product-media-mapping-v1` / PR #59
Status: pre-merge safety plan

## Purpose

This tool only changes which existing Cloudinary image is assigned to a product media row. It does not upload files, delete Cloudinary assets, or change checkout, payment, webhook, order, shipment, or inventory behavior.

## Before changing anything

Do not test random writes against production. Intentionally choose the product and media row first.

Copy these fields from the current row before saving:

- product name, key, and slug
- media row id or media key
- Cloudinary public ID
- Cloudinary secure URL
- role
- sort order
- primary image setting
- title and alt text

Keep the copied values in the PR notes or a private scratch note until the test is verified.

## Low-risk test path

Prefer a local or disposable database. If production data must be used, choose a low-risk product or row that Shawn intentionally selects for the test.

1. Open protected admin at `/admin/products/media`.
2. Search for the chosen product by slug or SKU.
3. Confirm the selected product name and slug match the intended test target.
4. Record the existing row fields listed above.
5. Update one existing media row with a known existing Cloudinary public ID or secure URL.
6. Save the row.
7. Refresh the admin page and confirm the row persisted.
8. Refresh the storefront product page and confirm the expected image appears after any deploy/API cache refresh that applies.
9. Confirm unrelated products did not receive the image.

For the original QA case, `tiger-vice-paddle` should be fixable by assigning the correct Vice paddle Cloudinary media. The Aqua paddle image should not appear on Vice unless it is intentionally assigned.

## Reverting a bad mapping

Use the copied pre-change fields:

1. Reopen `/admin/products/media`.
2. Select the same product.
3. Paste the previous Cloudinary public ID or secure URL back into the same row.
4. Restore the previous role, sort order, primary setting, title, and alt text.
5. Save.
6. Refresh the storefront product page and confirm the previous image behavior is restored.

If the row should no longer be storefront-visible, use **Unassign**. Unassign only marks the media row inactive/not public/not primary; it does not delete the database row or any Cloudinary asset.

## Expected safety behavior

- Admin API calls require the existing `x-internal-orders-token`.
- Browser code does not receive the admin API token.
- Browser code does not receive Cloudinary API key or secret values.
- Writes require a Cloudinary public ID or secure URL that resolves to a Cloudinary delivery URL.
- Sort order must be an integer in the supported admin range.
- Setting a row as primary clears other primary flags for that product in the same transaction.
- Unassign does not delete Cloudinary assets.

## Not covered by this tool

- Raw image upload.
- Cloudinary asset deletion.
- Full media library search.
- Full product editing.
- Checkout, payment, webhook, order, shipment, inventory, DNS, or SEO behavior.
