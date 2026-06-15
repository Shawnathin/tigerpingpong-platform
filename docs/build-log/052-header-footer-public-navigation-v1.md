# Header, Footer, and Public Navigation V1

Date: 2026-06-15

Branch / PR: PR #52

Status: merged

## Decision made

The storefront now has the approved V1 public header, footer, and navigation
structure for launch preparation. Shawn visually approved the menu after the
dropdown hover bridge fix, and the footer is approved.

## What changed

- Header now uses a clean glass navigation style.
- Tables and Accessories use compact glass dropdown bars.
- Dropdown hover behavior was fixed with a safer hover bridge.
- View Cart is the orange pill CTA.
- Footer carries the heavier support, legal, resource, and shop structure.
- Basic category, resource, and support routes now exist so header and footer
  links are not dead.

## What did not change

- No redirects, sitemap, robots, or canonical behavior changed.
- No Stripe, webhook, checkout, order truth, database, or shipment admin
  behavior changed.
- Public navigation still does not expose admin or internal order routes.
- PR #49 remains draft and was not part of this milestone.

## Deferred follow-up

The Resources page layout and hero/content scale need later polish; it is
intentionally noted as follow-up work, not completed work in this milestone.

## Human notes

This milestone finishes the main public navigation shell for V1: the header is
lighter and more polished, the cart CTA is clearer, the dropdowns are stable on
hover, and the footer now carries the broader site structure without changing
payment, SEO, database, or fulfillment behavior.
