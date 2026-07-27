import { describe, expect, it } from "vitest";
import {
  AQUA_FOUR_PACK_PRODUCT_SLUG,
  AQUA_FOUR_PACK_VARIANT_KEY,
  calculateCanadaShippingCents,
  CURRENT_CANADA_SHIPPING_RULE,
  LEGACY_CANADA_SHIPPING_RULE
} from "../../packages/shared/src";

import {
  getCartShippingCents,
  getCartShippingCopy,
  FLAT_SHIPPING_CENTS,
  type CartItem
} from "../../apps/web/src/lib/cart";
import {
  AQUA_FOUR_PACK_FREE_SHIPPING_COPY,
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

  it("charges the standard flat rate for one Part 40", () => {
    const part40 = {
      cartLineId: "tiger-pingpong-replacement-part-40",
      categoryName: "Replacement Parts",
      currency: "CAD",
      imageUrl: null,
      name: "Tiger PingPong Part 40",
      productKind: "replacement_part",
      productSlug: "tiger-pingpong-replacement-part-40",
      quantity: 1,
      selectedOptions: [],
      unitPriceCents: 700
    } satisfies CartItem;

    expect(getCartShippingCents(700, [part40])).toBe(1_500);
    expect(700 + getCartShippingCents(700, [part40])).toBe(2_200);
    expect(getCartShippingCopy(700, [part40])).toBe(V1_FLAT_RATE_SHIPPING_COPY);
  });

  it("applies the same Canada-wide rule to both approved replacement-net products", () => {
    const standardNet = {
      cartLineId: "tiger-replacement-net",
      categoryName: "Replacement Parts",
      currency: "CAD",
      imageUrl: null,
      name: "Tiger PingPong Standard Replacement Net",
      productKind: "replacement_part",
      productSlug: "tiger-replacement-net",
      quantity: 1,
      selectedOptions: [],
      unitPriceCents: 2_000
    } satisfies CartItem;
    const upgradeSystem = {
      ...standardNet,
      cartLineId: "tiger-table-net-replacement-set",
      name: "Tiger PingPong Expo & Portland Net Upgrade System",
      productSlug: "tiger-table-net-replacement-set",
      unitPriceCents: 14_999
    } satisfies CartItem;

    expect(getCartShippingCents(2_000, [standardNet])).toBe(1_500);
    expect(2_000 + getCartShippingCents(2_000, [standardNet])).toBe(3_500);
    expect(getCartShippingCopy(2_000, [standardNet])).toBe(V1_FLAT_RATE_SHIPPING_COPY);

    expect(getCartShippingCents(14_999, [upgradeSystem])).toBe(0);
    expect(getCartShippingCopy(14_999, [upgradeSystem])).toBe(V1_FREE_SHIPPING_COPY);
  });
});

describe("Aqua 4-pack Canada-wide free shipping", () => {
  const aquaFourPack = {
    cartLineId: `${AQUA_FOUR_PACK_PRODUCT_SLUG}::package-options=4-pack-w/-3-balls`,
    currency: "CAD",
    imageUrl: null,
    name: "Aqua Outdoor / Indoor Paddle",
    productSlug: AQUA_FOUR_PACK_PRODUCT_SLUG,
    quantity: 1,
    selectedVariantKey: AQUA_FOUR_PACK_VARIANT_KEY,
    selectedOptions: [
      {
        displayName: "Package Options",
        label: "4-Pack w/ 3 Balls",
        name: "Package Options",
        value: "4-Pack w/ 3 Balls"
      }
    ],
    unitPriceCents: 8_000
  } satisfies CartItem;
  const otherItem = {
    ...aquaFourPack,
    cartLineId: "tiger-premium-balls-6-orange::package=single-pack",
    name: "6-Pack Orange Balls",
    productSlug: "tiger-premium-balls-6-orange",
    selectedVariantKey: "single-pack",
    unitPriceCents: 800
  } satisfies CartItem;

  it("makes the exact Aqua 4-pack free in cart and product messaging", () => {
    expect(getCartShippingCents(8_000, [aquaFourPack])).toBe(0);
    expect(getCartShippingCopy(8_000, [aquaFourPack])).toBe(AQUA_FOUR_PACK_FREE_SHIPPING_COPY);
    expect(
      getV1ShippingMessage(8_000, {
        productSlug: aquaFourPack.productSlug,
        variantKey: aquaFourPack.selectedVariantKey
      })
    ).toBe(AQUA_FOUR_PACK_FREE_SHIPPING_COPY);
  });

  it("does not extend the exception to another item in a mixed under-threshold cart", () => {
    expect(getCartShippingCents(8_800, [aquaFourPack, otherItem])).toBe(FLAT_SHIPPING_CENTS);
    expect(getCartShippingCopy(8_800, [aquaFourPack, otherItem])).toBe(V1_FLAT_RATE_SHIPPING_COPY);
  });

  it("does not grant the exception to a matching variant key on another product", () => {
    expect(
      calculateCanadaShippingCents(8_000, [
        {
          productSlug: "another-product",
          variantKey: AQUA_FOUR_PACK_VARIANT_KEY
        }
      ])
    ).toBe(FLAT_SHIPPING_CENTS);
    expect(
      calculateCanadaShippingCents(4_500, [
        {
          productSlug: AQUA_FOUR_PACK_PRODUCT_SLUG,
          variantKey: "tiger-aqua-package-2-pack-3-balls"
        }
      ])
    ).toBe(FLAT_SHIPPING_CENTS);
  });

  it("preserves the old threshold-only rule for pending legacy orders", () => {
    const item = {
      productSlug: AQUA_FOUR_PACK_PRODUCT_SLUG,
      variantKey: AQUA_FOUR_PACK_VARIANT_KEY
    };

    expect(calculateCanadaShippingCents(8_000, [item], CURRENT_CANADA_SHIPPING_RULE)).toBe(0);
    expect(calculateCanadaShippingCents(8_000, [item], LEGACY_CANADA_SHIPPING_RULE)).toBe(
      FLAT_SHIPPING_CENTS
    );
  });
});

describe("storefront fulfillment promises", () => {
  it("uses the owner-approved availability and table-shipping wording", () => {
    expect(V1_IN_STOCK_HANDLING_COPY).toBe("In stock — ships within 24 business hours.");
    expect(TABLE_SHIPPING_MESSAGE).toBe("All Tables Ship Free — Canada-Wide!");
  });
});
