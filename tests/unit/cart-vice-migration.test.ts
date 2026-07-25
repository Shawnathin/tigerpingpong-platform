import { afterEach, describe, expect, it, vi } from "vitest";

import { CART_STORAGE_KEY, getCartLineId, readCartItems } from "../../apps/web/src/lib/cart";
import {
  VICE_BUNDLE_OPTION_VALUE,
  VICE_BUNDLE_SHOPPER_LABEL,
  VICE_BUNDLE_VARIANT_KEY,
  VICE_PRODUCT_SLUG,
  VICE_SINGLE_OPTION_VALUE,
  VICE_SINGLE_VARIANT_KEY
} from "../../apps/web/src/lib/vice-package";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("legacy Vice cart compatibility", () => {
  it("normalizes an optionless Vice line to the single-package variant", () => {
    stubStoredCart([
      {
        cartLineId: VICE_PRODUCT_SLUG,
        categoryName: "Paddles",
        currency: "CAD",
        imageUrl: null,
        name: "Tiger PingPong Vice Ping Pong Paddle",
        productKind: "paddle",
        productSlug: VICE_PRODUCT_SLUG,
        quantity: 2,
        selectedOptions: [],
        unitPriceCents: 1500
      }
    ]);

    expect(readCartItems()).toEqual([
      expect.objectContaining({
        cartLineId: `${VICE_PRODUCT_SLUG}::package-options=single-vice-paddle`,
        productSlug: VICE_PRODUCT_SLUG,
        quantity: 2,
        selectedVariantKey: VICE_SINGLE_VARIANT_KEY,
        selectedOptions: [
          {
            displayName: "Package Options",
            label: "Single Vice Paddle",
            name: "Package Options",
            value: VICE_SINGLE_OPTION_VALUE
          }
        ]
      })
    ]);
  });

  it("preserves a current Vice bundle selection", () => {
    const selectedOptions = [
      {
        displayName: "Package Options",
        label: "4 Vice paddles + 6 white balls",
        name: "Package Options",
        value: VICE_BUNDLE_OPTION_VALUE
      }
    ];

    stubStoredCart([
      {
        currency: "CAD",
        imageUrl: null,
        name: "Tiger PingPong Vice Ping Pong Paddle",
        productKind: "paddle",
        productSlug: VICE_PRODUCT_SLUG,
        quantity: 1,
        selectedOptions,
        selectedVariantKey: VICE_BUNDLE_VARIANT_KEY,
        unitPriceCents: 6800
      }
    ]);

    expect(readCartItems()[0]).toMatchObject({
      cartLineId: getCartLineId(VICE_PRODUCT_SLUG, selectedOptions),
      selectedOptions,
      selectedVariantKey: VICE_BUNDLE_VARIANT_KEY
    });
  });

  it("canonicalizes the reviewed public bundle label without rewriting it to Single", () => {
    stubStoredCart([
      {
        currency: "CAD",
        imageUrl: null,
        name: "Tiger PingPong Vice Ping Pong Paddle",
        productKind: "paddle",
        productSlug: VICE_PRODUCT_SLUG,
        quantity: 1,
        selectedOptions: [
          {
            displayName: "Package Options",
            label: VICE_BUNDLE_SHOPPER_LABEL,
            name: "Package Options",
            value: VICE_BUNDLE_SHOPPER_LABEL
          }
        ],
        selectedVariantKey: VICE_BUNDLE_VARIANT_KEY,
        unitPriceCents: 6800
      }
    ]);

    expect(readCartItems()[0]).toMatchObject({
      selectedOptions: [
        expect.objectContaining({
          label: VICE_BUNDLE_SHOPPER_LABEL,
          value: VICE_BUNDLE_OPTION_VALUE
        })
      ],
      selectedVariantKey: VICE_BUNDLE_VARIANT_KEY,
      unitPriceCents: 6800
    });
  });

  it("merges a legacy line into an explicit Single line without losing quantity", () => {
    const currentSingleOptions = [
      {
        displayName: "Package Options",
        label: "Single Vice Paddle",
        name: "Package Options",
        value: VICE_SINGLE_OPTION_VALUE
      }
    ];

    stubStoredCart([
      {
        currency: "CAD",
        imageUrl: null,
        name: "Legacy Vice",
        productKind: "paddle",
        productSlug: VICE_PRODUCT_SLUG,
        quantity: 8,
        selectedOptions: [],
        unitPriceCents: 5000
      },
      {
        currency: "CAD",
        imageUrl: "/current-vice.jpg",
        name: "Tiger PingPong Vice Ping Pong Paddle",
        productKind: "paddle",
        productSlug: VICE_PRODUCT_SLUG,
        quantity: 7,
        selectedOptions: currentSingleOptions,
        selectedVariantKey: VICE_SINGLE_VARIANT_KEY,
        unitPriceCents: 1500
      }
    ]);

    expect(readCartItems()).toEqual([
      expect.objectContaining({
        imageUrl: "/current-vice.jpg",
        name: "Tiger PingPong Vice Ping Pong Paddle",
        quantity: 10,
        selectedVariantKey: VICE_SINGLE_VARIANT_KEY,
        unitPriceCents: 1500
      })
    ]);
  });

  it("does not add package data to another optionless product", () => {
    stubStoredCart([
      {
        currency: "CAD",
        imageUrl: null,
        name: "Tiger PingPong Table Cover",
        productKind: "cover",
        productSlug: "tiger-table-cover-black-polyester",
        quantity: 1,
        selectedOptions: [],
        unitPriceCents: 5500
      }
    ]);

    expect(readCartItems()[0]).toMatchObject({
      cartLineId: "tiger-table-cover-black-polyester",
      productSlug: "tiger-table-cover-black-polyester",
      selectedOptions: []
    });
    expect(readCartItems()[0]?.selectedVariantKey).toBeUndefined();
  });
});

function stubStoredCart(items: unknown[]): void {
  const storedCart = JSON.stringify({
    version: 1,
    items
  });

  vi.stubGlobal("window", {
    localStorage: {
      getItem(key: string) {
        return key === CART_STORAGE_KEY ? storedCart : null;
      }
    }
  });
}
