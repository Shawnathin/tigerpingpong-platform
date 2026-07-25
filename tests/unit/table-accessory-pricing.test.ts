import { describe, expect, it } from "vitest";

import {
  AQUA_FOUR_PACK_VARIANT_KEY,
  AQUA_PADDLE_PRODUCT_KEY,
  AQUA_TWO_PACK_VARIANT_KEY,
  calculateTableAccessoryPricing,
  PLAZA_OUTDOOR_TABLE_PRODUCT_KEY,
  TABLE_ACCESSORIES_PRICING_RULE_VERSION,
  TABLE_ACCESSORIES_PROMOTION_KEY,
  TABLE_COVER_PRODUCT_KEY,
  VICE_BUNDLE_VARIANT_KEY,
  VICE_PADDLE_PRODUCT_KEY
} from "../../packages/shared/src";

describe("table accessory pricing", () => {
  it("allocates one play set and one compatible cover per qualifying table", () => {
    const result = calculateTableAccessoryPricing([
      item("table", "tiger-expo-outdoor-table", "table", 100_000, 1),
      item("aqua-two", AQUA_PADDLE_PRODUCT_KEY, "paddle", 4_500, 1, AQUA_TWO_PACK_VARIANT_KEY),
      item("aqua-four", AQUA_PADDLE_PRODUCT_KEY, "paddle", 8_000, 1, AQUA_FOUR_PACK_VARIANT_KEY),
      item("vice-bundle", VICE_PADDLE_PRODUCT_KEY, "paddle", 6_800, 1, VICE_BUNDLE_VARIANT_KEY),
      item("cover", TABLE_COVER_PRODUCT_KEY, "cover", 5_500, 1)
    ]);

    expect(result).toMatchObject({
      pricingRuleVersion: TABLE_ACCESSORIES_PRICING_RULE_VERSION,
      listSubtotalCents: 124_800,
      discountCents: 4_050,
      netSubtotalCents: 120_750
    });
    expect(allocation(result, "aqua-four")).toMatchObject({
      discountedQuantity: 1,
      discountedUnitPriceCents: 5_600,
      discountUnitCents: 2_400,
      promotionKey: TABLE_ACCESSORIES_PROMOTION_KEY
    });
    expect(allocation(result, "vice-bundle")).toMatchObject({
      discountedQuantity: 0,
      fullPriceQuantity: 1
    });
    expect(allocation(result, "cover")).toMatchObject({
      discountedQuantity: 1,
      discountedUnitPriceCents: 3_850,
      discountUnitCents: 1_650
    });
  });

  it("uses table quantity and highest-list-price-first allocation, leaving excess full price", () => {
    const result = calculateTableAccessoryPricing([
      item("tables", "tiger-portland-indoor-table", "table", 120_000, 2),
      item("aqua-four", AQUA_PADDLE_PRODUCT_KEY, "paddle", 8_000, 2, AQUA_FOUR_PACK_VARIANT_KEY),
      item("vice-bundle", VICE_PADDLE_PRODUCT_KEY, "paddle", 6_800, 2, VICE_BUNDLE_VARIANT_KEY)
    ]);

    expect(allocation(result, "aqua-four")).toMatchObject({
      discountedQuantity: 2,
      fullPriceQuantity: 0
    });
    expect(allocation(result, "vice-bundle")).toMatchObject({
      discountedQuantity: 0,
      fullPriceQuantity: 2
    });
    expect(result.discountCents).toBe(4_800);
  });

  it("breaks equal-price ties by commerce identity regardless of line IDs or input order", () => {
    const cartPricing = calculateTableAccessoryPricing([
      item("table-cart", "tiger-expo-outdoor-table", "stale-client-kind", 100_000, 1),
      item(
        "a-vice-cart-line",
        VICE_PADDLE_PRODUCT_KEY,
        "paddle",
        6_800,
        1,
        VICE_BUNDLE_VARIANT_KEY
      ),
      item(
        "z-aqua-cart-line",
        AQUA_PADDLE_PRODUCT_KEY,
        "paddle",
        6_800,
        1,
        AQUA_FOUR_PACK_VARIANT_KEY
      )
    ]);
    const apiPricing = calculateTableAccessoryPricing([
      item(
        "a-aqua-api-line",
        AQUA_PADDLE_PRODUCT_KEY,
        "paddle",
        6_800,
        1,
        AQUA_FOUR_PACK_VARIANT_KEY
      ),
      item("z-vice-api-line", VICE_PADDLE_PRODUCT_KEY, "paddle", 6_800, 1, VICE_BUNDLE_VARIANT_KEY),
      item("table-api", "tiger-expo-outdoor-table", "table", 100_000, 1)
    ]);

    expect(allocation(cartPricing, "z-aqua-cart-line").discountedQuantity).toBe(1);
    expect(allocation(cartPricing, "a-vice-cart-line").discountedQuantity).toBe(0);
    expect(allocation(apiPricing, "a-aqua-api-line").discountedQuantity).toBe(1);
    expect(allocation(apiPricing, "z-vice-api-line").discountedQuantity).toBe(0);
  });

  it("lets Plaza qualify play sets without unlocking a cover", () => {
    const result = calculateTableAccessoryPricing([
      item("plaza", PLAZA_OUTDOOR_TABLE_PRODUCT_KEY, "table", 260_000, 1),
      item("aqua-two", AQUA_PADDLE_PRODUCT_KEY, "paddle", 4_500, 1, AQUA_TWO_PACK_VARIANT_KEY),
      item("cover", TABLE_COVER_PRODUCT_KEY, "cover", 5_500, 1)
    ]);

    expect(allocation(result, "aqua-two").discountedQuantity).toBe(1);
    expect(allocation(result, "cover")).toMatchObject({
      discountedQuantity: 0,
      discountCents: 0
    });
  });

  it("uses only compatible-table quantity for cover capacity in a mixed table cart", () => {
    const result = calculateTableAccessoryPricing([
      item("plaza", PLAZA_OUTDOOR_TABLE_PRODUCT_KEY, "table", 260_000, 2),
      item("expo", "tiger-expo-outdoor-table", "table", 100_000, 1),
      item("cover", TABLE_COVER_PRODUCT_KEY, "cover", 5_500, 3)
    ]);

    expect(allocation(result, "cover")).toMatchObject({
      discountedQuantity: 1,
      fullPriceQuantity: 2,
      discountCents: 1_650
    });
  });

  it("reverses every accessory discount when qualifying tables are removed", () => {
    const cart = [
      item("table", "tiger-portland-outdoor-table", "table", 120_000, 1),
      item("aqua-two", AQUA_PADDLE_PRODUCT_KEY, "paddle", 4_500, 1, AQUA_TWO_PACK_VARIANT_KEY),
      item("cover", TABLE_COVER_PRODUCT_KEY, "cover", 5_500, 1)
    ];
    const withTable = calculateTableAccessoryPricing(cart);
    const withoutTable = calculateTableAccessoryPricing(
      cart.filter((line) => line.lineId !== "table")
    );

    expect(withTable.discountCents).toBe(3_000);
    expect(withoutTable.discountCents).toBe(0);
    expect(withoutTable.netSubtotalCents).toBe(withoutTable.listSubtotalCents);
  });

  it("does not qualify unknown tables, inexact variants, or already-promoted lines", () => {
    const result = calculateTableAccessoryPricing([
      item("eligible-table", "tiger-expo-outdoor-table", "table", 100_000, 1),
      item("unknown-table", "not-a-tiger-table", "table", 100_000, 1),
      item(
        "inexact-play-set",
        AQUA_PADDLE_PRODUCT_KEY,
        "paddle",
        8_000,
        1,
        "some-other-aqua-variant"
      ),
      {
        ...item(
          "stacked-play-set",
          AQUA_PADDLE_PRODUCT_KEY,
          "paddle",
          4_500,
          1,
          AQUA_TWO_PACK_VARIANT_KEY
        ),
        existingPromotionKey: "another-price-promotion"
      }
    ]);

    expect(result.discountCents).toBe(0);
    expect(result.allocations.every((line) => line.promotionKey === null)).toBe(true);
  });

  it("rounds each eligible net unit with Math.round(list * 0.70)", () => {
    const result = calculateTableAccessoryPricing([
      item("table", "tiger-whistler-indoor-table", "table", 100_000, 1),
      item("aqua-two", AQUA_PADDLE_PRODUCT_KEY, "paddle", 1_001, 1, AQUA_TWO_PACK_VARIANT_KEY)
    ]);

    expect(allocation(result, "aqua-two")).toMatchObject({
      discountedUnitPriceCents: 701,
      discountUnitCents: 300,
      netLineTotalCents: 701
    });
  });

  it("does not mark a rounded zero-savings unit as promoted", () => {
    const result = calculateTableAccessoryPricing([
      item("table", "tiger-whistler-indoor-table", "table", 100_000, 1),
      item("aqua-two", AQUA_PADDLE_PRODUCT_KEY, "paddle", 1, 1, AQUA_TWO_PACK_VARIANT_KEY)
    ]);

    expect(allocation(result, "aqua-two")).toMatchObject({
      discountedQuantity: 0,
      discountedUnitPriceCents: 1,
      discountUnitCents: 0,
      fullPriceQuantity: 1,
      netLineTotalCents: 1,
      promotionKey: null
    });
    expect(result.discountCents).toBe(0);
  });
});

function item(
  lineId: string,
  productKey: string,
  productKind: string,
  listUnitPriceCents: number,
  quantity: number,
  variantKey: string | null = null
) {
  return {
    lineId,
    listUnitPriceCents,
    productKey,
    productKind,
    quantity,
    variantKey
  };
}

function allocation(result: ReturnType<typeof calculateTableAccessoryPricing>, lineId: string) {
  const match = result.allocations.find((line) => line.lineId === lineId);

  if (!match) {
    throw new Error(`Missing allocation for ${lineId}`);
  }

  return match;
}
