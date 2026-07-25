import {
  AQUA_FOUR_PACK_VARIANT_KEY,
  AQUA_PADDLE_PRODUCT_KEY,
  AQUA_TWO_PACK_VARIANT_KEY,
  COMPONENT_DERIVED_PRICING_SOURCE,
  PLAZA_OUTDOOR_TABLE_PRODUCT_KEY,
  PREMIUM_WHITE_BALLS_SIX_PACK_PRODUCT_KEY,
  TABLE_ACCESSORIES_DISCOUNT_PERCENT,
  TABLE_ACCESSORIES_PRICING_RULE_VERSION,
  TABLE_ACCESSORY_ELIGIBLE_TABLE_PRODUCT_KEYS,
  TABLE_COVER_PRODUCT_KEY,
  VICE_BUNDLE_VARIANT_KEY,
  VICE_PADDLE_PRODUCT_KEY,
  VICE_SINGLE_VARIANT_KEY
} from "../../packages/shared/src";
import { describe, expect, it, vi } from "vitest";

import { CatalogService } from "../../apps/api/src/catalog/catalog.service";

interface TestVariant {
  currency: string;
  isActive: boolean;
  key: string;
  name: string;
  optionValues: Array<{
    productOptionValue: {
      label: string;
      option: {
        name: string;
        sortOrder: number;
      };
      sortOrder: number;
      value: string;
    };
  }>;
  priceCents: number | null;
  purchaseModeOverride: string | null;
  sku: string | null;
}

interface TestProduct {
  currency: string;
  family: {
    isActive: boolean;
    isPublic: boolean;
  };
  key: string;
  media: Array<{
    altText: string | null;
    cloudinarySecureUrl: string | null;
    variant: {
      key: string;
    } | null;
  }>;
  name: string;
  priceCents: number | null;
  primaryCategory: {
    isActive: boolean;
    v1CheckoutScope: boolean;
    v1PublicNavigation: boolean;
  };
  productKind: string;
  purchaseMode: string;
  sku: string | null;
  slug: string;
  status: string;
  v1CheckoutScope: boolean;
  v1PublicNavigation: boolean;
  variants: TestVariant[];
}

function variant(
  key: string,
  label: string,
  overrides: Partial<Omit<TestVariant, "key" | "name" | "optionValues">> = {}
): TestVariant {
  return {
    key,
    sku: `SKU-${key}`,
    name: label,
    priceCents: 1_500,
    currency: "CAD",
    purchaseModeOverride: null,
    isActive: true,
    optionValues: [
      {
        productOptionValue: {
          value: label.toLowerCase().replaceAll(" ", "-"),
          label,
          sortOrder: 1,
          option: {
            name: "Package Options",
            sortOrder: 1
          }
        }
      }
    ],
    ...overrides
  };
}

function product(
  key: string,
  overrides: Partial<Omit<TestProduct, "key" | "slug">> = {}
): TestProduct {
  return {
    key,
    slug: key,
    name: key,
    sku: `SKU-${key}`,
    productKind: "accessory",
    status: "active",
    v1PublicNavigation: true,
    v1CheckoutScope: true,
    purchaseMode: "online_checkout",
    priceCents: 1_000,
    currency: "CAD",
    family: {
      isActive: true,
      isPublic: true
    },
    primaryCategory: {
      isActive: true,
      v1PublicNavigation: true,
      v1CheckoutScope: true
    },
    media: [
      {
        cloudinarySecureUrl: `https://res.cloudinary.com/example/${key}.jpg`,
        altText: `${key} image`,
        variant: null
      }
    ],
    variants: [],
    ...overrides
  };
}

function eligibleTable(key = "tiger-portland-indoor-table"): TestProduct {
  return product(key, {
    name: "Eligible table",
    productKind: "table",
    priceCents: 100_000
  });
}

function availableOfferProducts(): TestProduct[] {
  return [
    product(AQUA_PADDLE_PRODUCT_KEY, {
      name: "Aqua Outdoor / Indoor Paddle",
      productKind: "paddle",
      priceCents: 2_500,
      media: [
        {
          cloudinarySecureUrl: "https://res.cloudinary.com/example/aqua-default.jpg",
          altText: "Aqua paddles",
          variant: null
        },
        {
          cloudinarySecureUrl: "https://res.cloudinary.com/example/aqua-two-pack.jpg",
          altText: "Aqua two-pack",
          variant: {
            key: AQUA_TWO_PACK_VARIANT_KEY
          }
        }
      ],
      variants: [
        variant(AQUA_TWO_PACK_VARIANT_KEY, "2-Pack w/ 3 Balls", {
          priceCents: 4_500
        }),
        variant(AQUA_FOUR_PACK_VARIANT_KEY, "4-Pack w/ 3 Balls", {
          priceCents: 8_000
        })
      ]
    }),
    product(VICE_PADDLE_PRODUCT_KEY, {
      name: "Tiger PingPong Vice Ping Pong Paddle",
      productKind: "paddle",
      priceCents: 1_500,
      variants: [
        variant(VICE_SINGLE_VARIANT_KEY, "Single Vice Paddle", {
          priceCents: 1_500
        }),
        variant(VICE_BUNDLE_VARIANT_KEY, "4 Vice paddles + 6 white balls", {
          priceCents: null,
          sku: "VICE-BUNDLE-OPERATIONS-SKU"
        })
      ]
    }),
    product(PREMIUM_WHITE_BALLS_SIX_PACK_PRODUCT_KEY, {
      name: "Tiger PingPong Premium 3-Star Ping Pong Balls 6 Pack White",
      productKind: "ball",
      priceCents: 800
    }),
    product(TABLE_COVER_PRODUCT_KEY, {
      name: "Tiger PingPong Protective Ping Pong Table Cover Black Polyester",
      productKind: "cover",
      priceCents: 5_500
    })
  ];
}

function serviceWithCatalog(table: TestProduct | null, offerProducts: TestProduct[]) {
  const findFirst = vi.fn().mockResolvedValue(table);
  const findMany = vi.fn().mockResolvedValue(offerProducts);
  const service = new CatalogService();

  (service as unknown as { prisma: unknown }).prisma = {
    product: {
      findFirst,
      findMany
    }
  };

  return {
    findFirst,
    findMany,
    service
  };
}

describe("table accessory offer catalog response", () => {
  it("returns exact live play sets and a compatible cover with auditable pricing sources", async () => {
    const table = eligibleTable();
    const { findFirst, service } = serviceWithCatalog(table, availableOfferProducts());
    const response = (await service.getTableAccessoryOffer(table.slug)) as {
      offer: {
        coverCompatibility: {
          isCompatible: boolean;
          reason: string | null;
        };
        discountPercent: number;
        pricingRuleVersion: string;
        selectableItems: Array<Record<string, unknown>>;
        tableProductKey: string;
        tableSlug: string;
      };
    };

    expect(response.offer).toMatchObject({
      tableSlug: table.slug,
      tableProductKey: table.key,
      discountPercent: TABLE_ACCESSORIES_DISCOUNT_PERCENT,
      pricingRuleVersion: TABLE_ACCESSORIES_PRICING_RULE_VERSION,
      coverCompatibility: {
        isCompatible: true,
        reason: null
      }
    });
    expect(response.offer.selectableItems).toHaveLength(4);
    expect(response.offer.selectableItems.map((item) => item.variantKey)).toEqual([
      AQUA_TWO_PACK_VARIANT_KEY,
      AQUA_FOUR_PACK_VARIANT_KEY,
      VICE_BUNDLE_VARIANT_KEY,
      null
    ]);
    expect(response.offer.selectableItems[0]).toMatchObject({
      role: "play_set",
      productKey: AQUA_PADDLE_PRODUCT_KEY,
      priceCents: 4_500,
      currency: "CAD",
      pricingSource: "catalog_variant",
      selectedOptions: [
        {
          name: "Package Options",
          value: "2-pack-w/-3-balls",
          label: "2-Pack w/ 3 Balls"
        }
      ],
      image: {
        url: "https://res.cloudinary.com/example/aqua-two-pack.jpg",
        alt: "Aqua two-pack"
      }
    });
    expect(response.offer.selectableItems[2]).toMatchObject({
      role: "play_set",
      productKey: VICE_PADDLE_PRODUCT_KEY,
      variantKey: VICE_BUNDLE_VARIANT_KEY,
      priceCents: 6_800,
      currency: "CAD",
      pricingSource: COMPONENT_DERIVED_PRICING_SOURCE
    });
    expect(response.offer.selectableItems[3]).toMatchObject({
      role: "cover",
      productKey: TABLE_COVER_PRODUCT_KEY,
      variantKey: null,
      priceCents: 5_500,
      currency: "CAD",
      pricingSource: "catalog_product",
      selectedOptions: []
    });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          key: {
            in: [...TABLE_ACCESSORY_ELIGIBLE_TABLE_PRODUCT_KEYS]
          },
          productKind: "table",
          slug: table.slug
        })
      })
    );
  });

  it("makes Plaza cover incompatibility explicit and never returns the cover item", async () => {
    const table = eligibleTable(PLAZA_OUTDOOR_TABLE_PRODUCT_KEY);
    const { service } = serviceWithCatalog(table, availableOfferProducts());
    const response = (await service.getTableAccessoryOffer(table.slug)) as {
      offer: {
        coverCompatibility: {
          isCompatible: boolean;
          reason: string | null;
        };
        selectableItems: Array<{ role: string }>;
      };
    };

    expect(response.offer.coverCompatibility).toEqual({
      isCompatible: false,
      reason: "not_compatible_with_plaza"
    });
    expect(response.offer.selectableItems).toHaveLength(3);
    expect(response.offer.selectableItems.some((item) => item.role === "cover")).toBe(false);
  });

  it("omits unavailable choices and rejects tables outside the exact eligible set", async () => {
    const unavailableProducts = availableOfferProducts();
    const aqua = unavailableProducts.find((item) => item.key === AQUA_PADDLE_PRODUCT_KEY);
    const vice = unavailableProducts.find((item) => item.key === VICE_PADDLE_PRODUCT_KEY);
    const cover = unavailableProducts.find((item) => item.key === TABLE_COVER_PRODUCT_KEY);

    if (!aqua || !vice || !cover) {
      throw new Error("Offer fixture is incomplete.");
    }

    aqua.variants[0].priceCents = null;
    aqua.variants[1].purchaseModeOverride = "disabled";
    vice.variants.find((item) => item.key === VICE_BUNDLE_VARIANT_KEY)!.sku = " ";
    cover.status = "draft";

    const eligible = eligibleTable();
    const { service } = serviceWithCatalog(eligible, unavailableProducts);
    const response = (await service.getTableAccessoryOffer(eligible.slug)) as {
      offer: {
        selectableItems: unknown[];
      };
    };

    expect(response.offer.selectableItems).toEqual([]);

    const arbitraryTable = eligibleTable("future-unapproved-table");
    const { service: arbitraryService } = serviceWithCatalog(
      arbitraryTable,
      availableOfferProducts()
    );

    await expect(arbitraryService.getTableAccessoryOffer(arbitraryTable.slug)).rejects.toThrow(
      `Table accessory offer not found: ${arbitraryTable.slug}`
    );
  });
});
