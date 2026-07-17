import { describe, expect, it } from "vitest";

import {
  getCartShippingCents,
  getCartShippingCopy,
  FLAT_SHIPPING_CENTS
} from "../../apps/web/src/lib/cart";
import {
  getV1ShippingMessage,
  V1_FLAT_RATE_SHIPPING_COPY,
  V1_FREE_SHIPPING_COPY,
  V1_IN_STOCK_HANDLING_COPY
} from "../../apps/web/src/lib/shipping";
import { TABLE_SHIPPING_MESSAGE } from "../../apps/web/src/lib/product-browsing";

describe("V1 Canada shipping boundary", () => {
  it.each([
    [9_999, FLAT_SHIPPING_CENTS, V1_FLAT_RATE_SHIPPING_COPY],
    [10_000, FLAT_SHIPPING_CENTS, V1_FLAT_RATE_SHIPPING_COPY],
    [10_001, 0, V1_FREE_SHIPPING_COPY]
  ])("uses the approved rule at %i cents", (subtotal, shipping, copy) => {
    expect(getCartShippingCents(subtotal)).toBe(shipping);
    expect(getCartShippingCopy(subtotal)).toBe(copy);
    expect(getV1ShippingMessage(subtotal)).toBe(copy);
  });
});

describe("storefront fulfillment promises", () => {
  it("uses the owner-approved availability and table-shipping wording", () => {
    expect(V1_IN_STOCK_HANDLING_COPY).toBe("In stock — ships within 24 business hours.");
    expect(TABLE_SHIPPING_MESSAGE).toBe("All Tables Ship Free — Canada-Wide!");
  });
});
