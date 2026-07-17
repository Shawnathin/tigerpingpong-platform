import { describe, expect, it } from "vitest";

import {
  getCartShippingCents,
  getCartShippingCopy,
  FLAT_SHIPPING_CENTS
} from "../../apps/web/src/lib/cart";
import {
  getV1ShippingMessage,
  V1_FLAT_RATE_SHIPPING_COPY,
  V1_FREE_SHIPPING_COPY
} from "../../apps/web/src/lib/shipping";

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
