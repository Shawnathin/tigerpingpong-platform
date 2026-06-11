# 032 Cart Add To Cart Checkout V1 QA Checklist

## Cart UI

- [ ] Product page Add to cart opens modal
- [ ] Modal shows correct product
- [ ] Modal recommendations render from real catalog products
- [ ] Add-on can be added from modal
- [ ] Keep shopping works
- [ ] Checkout button works
- [ ] Cart count updates
- [ ] Cart persists after refresh
- [ ] Cart page loads
- [ ] Quantity increase/decrease works
- [ ] Remove item works
- [ ] Empty cart state works
- [ ] Mobile layout works

## Shipping

- [ ] Cart subtotal under $100 shows $15 shipping
- [ ] Cart subtotal exactly $100 shows $15 shipping
- [ ] Cart subtotal over $100 shows free shipping
- [ ] Cart subtotal with table shows free shipping if over $100
- [ ] Shipping copy matches V1 rule

## Checkout

- [ ] Single-item cart checkout opens Stripe Checkout
- [ ] Multi-item cart checkout opens Stripe Checkout
- [ ] Stripe line items match cart items
- [ ] Shipping line is correct
- [ ] Stripe test payment completes
- [ ] Success redirect works
- [ ] Success page reads backend-confirmed paid status
- [ ] Webhook marks order paid
- [ ] Supabase order row shows paid
- [ ] Supabase/order items show all cart items
- [ ] Internal orders list shows paid order
- [ ] Internal order detail shows all items/totals/shipping/customer/Stripe references

## Security

- [ ] Client does not submit trusted prices
- [ ] Server re-fetches product data
- [ ] Client does not mark payment paid
- [ ] Success redirect is not payment truth
- [ ] `/internal/orders` remains protected
- [ ] No public admin/internal/account links are exposed
- [ ] No internal API token is exposed client-side

## Regression

- [ ] Homepage loads
- [ ] Catalog loads
- [ ] Product pages load
- [ ] Shipping page loads
- [ ] Contact page loads
- [ ] Checkout success/cancel pages still render
- [ ] Existing images/fallback media still work
