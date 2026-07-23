import {
  AQUA_FOUR_PACK_VARIANT_KEY,
  AQUA_PADDLE_PRODUCT_KEY,
  AQUA_TWO_PACK_VARIANT_KEY,
  TABLE_COVER_PRODUCT_KEY,
  VICE_BUNDLE_VARIANT_KEY,
  VICE_PADDLE_PRODUCT_KEY
} from "../../packages/shared/src";
import { describe, expect, it } from "vitest";

import {
  getCartPricing,
  getCartPricingDelta,
  type CartItem,
  type CartProductInput
} from "../../apps/web/src/lib/cart";

const TABLE_PRODUCT_KEY = "tiger-expo-outdoor-table";

describe("storefront table accessory pricing", () => {
  it("derives play-set and compatible-cover savings from list-priced cart lines", () => {
    const pricing = getCartPricing([
      cartItem(TABLE_PRODUCT_KEY, "table", 130_000),
      cartItem(AQUA_PADDLE_PRODUCT_KEY, "paddle", 4_500, AQUA_TWO_PACK_VARIANT_KEY),
      cartItem(TABLE_COVER_PRODUCT_KEY, "cover", 5_500)
    ]);

    expect(pricing).toMatchObject({
      discountCents: 3_000,
      listSubtotalCents: 140_000,
      netSubtotalCents: 137_000
    });
    expect(pricing.allocations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          discountCents: 1_350,
          discountedQuantity: 1,
          lineId: `${AQUA_PADDLE_PRODUCT_KEY}:${AQUA_TWO_PACK_VARIANT_KEY}`,
          netLineTotalCents: 3_150
        }),
        expect.objectContaining({
          discountCents: 1_650,
          discountedQuantity: 1,
          lineId: `${TABLE_COVER_PRODUCT_KEY}:base`,
          netLineTotalCents: 3_850
        })
      ])
    );
  });

  it("restores regular accessory prices immediately when the qualifying table is removed", () => {
    const accessories = [
      cartItem(AQUA_PADDLE_PRODUCT_KEY, "paddle", 8_000, AQUA_FOUR_PACK_VARIANT_KEY),
      cartItem(TABLE_COVER_PRODUCT_KEY, "cover", 5_500)
    ];

    expect(
      getCartPricing([cartItem(TABLE_PRODUCT_KEY, "table", 130_000), ...accessories])
    ).toMatchObject({
      discountCents: 4_050,
      netSubtotalCents: 139_450
    });
    expect(getCartPricing(accessories)).toMatchObject({
      discountCents: 0,
      listSubtotalCents: 13_500,
      netSubtotalCents: 13_500
    });
  });

  it("does not promise 30% on a lower-priced selection when a higher-priced play set uses capacity", () => {
    const cart = [
      cartItem(TABLE_PRODUCT_KEY, "table", 130_000),
      cartItem(AQUA_PADDLE_PRODUCT_KEY, "paddle", 8_000, AQUA_FOUR_PACK_VARIANT_KEY)
    ];
    const lowerPricedAddition = cartProduct(
      AQUA_PADDLE_PRODUCT_KEY,
      "paddle",
      4_500,
      AQUA_TWO_PACK_VARIANT_KEY
    );

    expect(getCartPricingDelta(cart, [lowerPricedAddition])).toMatchObject({
      addedListSubtotalCents: 4_500,
      additionalDiscountCents: 0,
      additionalNetSubtotalCents: 4_500
    });
  });

  it("shows only the incremental savings when a higher-priced selection takes priority", () => {
    const cart = [
      cartItem(TABLE_PRODUCT_KEY, "table", 130_000),
      cartItem(AQUA_PADDLE_PRODUCT_KEY, "paddle", 4_500, AQUA_TWO_PACK_VARIANT_KEY)
    ];
    const higherPricedAddition = cartProduct(
      VICE_PADDLE_PRODUCT_KEY,
      "paddle",
      6_800,
      VICE_BUNDLE_VARIANT_KEY
    );

    expect(getCartPricingDelta(cart, [higherPricedAddition])).toMatchObject({
      addedListSubtotalCents: 6_800,
      additionalDiscountCents: 690,
      additionalNetSubtotalCents: 6_110
    });
  });

  it("uses the live offer price when an existing matching accessory line is stale", () => {
    const staleCover = {
      ...cartItem(TABLE_COVER_PRODUCT_KEY, "cover", 5_000),
      cartLineId: TABLE_COVER_PRODUCT_KEY
    };
    const liveCover = cartProduct(TABLE_COVER_PRODUCT_KEY, "cover", 5_500);
    const pricingDelta = getCartPricingDelta(
      [cartItem(TABLE_PRODUCT_KEY, "table", 130_000), staleCover],
      [liveCover]
    );

    expect(pricingDelta).toMatchObject({
      addedListSubtotalCents: 5_500,
      additionalDiscountCents: 150,
      additionalNetSubtotalCents: 5_850,
      projectedPricing: {
        discountCents: 1_650,
        listSubtotalCents: 141_000,
        netSubtotalCents: 139_350
      }
    });
    expect(
      pricingDelta.projectedPricing.allocations.find(
        (allocation) => allocation.lineId === TABLE_COVER_PRODUCT_KEY
      )
    ).toMatchObject({
      discountedQuantity: 1,
      fullPriceQuantity: 1,
      listUnitPriceCents: 5_500,
      netLineTotalCents: 9_350
    });
  });
});

function cartItem(
  productKey: string,
  productKind: string,
  unitPriceCents: number,
  selectedVariantKey?: string
): CartItem {
  return {
    cartLineId: `${productKey}:${selectedVariantKey ?? "base"}`,
    currency: "CAD",
    imageUrl: null,
    name: productKey,
    productKey,
    productKind,
    productSlug: productKey,
    quantity: 1,
    selectedOptions: [],
    selectedVariantKey,
    unitPriceCents
  };
}

function cartProduct(
  productKey: string,
  productKind: string,
  unitPriceCents: number,
  selectedVariantKey?: string
): CartProductInput {
  return {
    currency: "CAD",
    imageUrl: null,
    name: productKey,
    productKey,
    productKind,
    productSlug: productKey,
    selectedVariantKey,
    unitPriceCents
  };
}
