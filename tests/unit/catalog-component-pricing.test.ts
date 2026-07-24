import { describe, expect, it, vi } from "vitest";
import {
  calculateViceBundleRegularPrice,
  COMPONENT_DERIVED_PRICING_SOURCE,
  PREMIUM_WHITE_BALLS_SIX_PACK_PRODUCT_KEY,
  VICE_BUNDLE_PUBLIC_LABEL,
  VICE_BUNDLE_VARIANT_KEY,
  VICE_PADDLE_PRODUCT_KEY,
  VICE_SINGLE_VARIANT_KEY
} from "../../packages/shared/src";

import { CatalogService } from "../../apps/api/src/catalog/catalog.service";

interface TestVariant {
  key: string;
  sku: string | null;
  name: string | null;
  priceCents: number | null;
  currency: string;
  purchaseModeOverride: string | null;
  isActive: boolean;
  sourceUrl: string | null;
  optionValues: [];
}

function variant(key: string, overrides: Partial<Omit<TestVariant, "key">> = {}): TestVariant {
  return {
    key,
    sku: "TEST-SKU",
    name: key,
    priceCents: 1_500,
    currency: "CAD",
    purchaseModeOverride: null,
    isActive: true,
    sourceUrl: null,
    optionValues: [],
    ...overrides
  };
}

function viceProduct(variants: TestVariant[]) {
  return {
    key: VICE_PADDLE_PRODUCT_KEY,
    slug: VICE_PADDLE_PRODUCT_KEY,
    name: "Tiger PingPong Vice Ping Pong Paddle",
    productKind: "paddle",
    purchaseMode: "online_checkout",
    priceCents: 1_500,
    currency: "CAD",
    v1PublicNavigation: true,
    v1CheckoutScope: true,
    shippingReviewRequired: false,
    shortDescription: null,
    description: null,
    family: {
      key: "vice-paddle",
      slug: "vice-paddle",
      name: "Vice Paddle"
    },
    primaryCategory: {
      key: "paddles",
      slug: "paddles",
      name: "Paddles"
    },
    media: [],
    variants,
    contentSections: [],
    specGroups: [],
    sourceRelationships: [],
    targetRelationships: [],
    sku: null,
    sourceUrl: null,
    legacyPath: null,
    sourceReviewStatus: "approved",
    importReviewStatus: "approved"
  };
}

function catalogServiceWithProduct(
  product: ReturnType<typeof viceProduct>,
  whiteBalls: { priceCents: number | null; currency: string } = {
    priceCents: 800,
    currency: "CAD"
  }
) {
  const findFirst = vi.fn().mockResolvedValueOnce(product).mockResolvedValueOnce(whiteBalls);
  const service = new CatalogService();

  (service as unknown as { prisma: unknown }).prisma = {
    product: {
      findFirst
    }
  };

  return {
    findFirst,
    service
  };
}

async function readPublicVariants(service: CatalogService) {
  const response = (await service.getProductBySlug(VICE_PADDLE_PRODUCT_KEY, {
    includeInternal: false
  })) as {
    product: {
      variants: Array<Record<string, unknown>>;
    };
  };

  return response.product.variants;
}

describe("Vice component-derived regular price", () => {
  it("calculates from the preferred single variant and the white six-ball product", () => {
    expect(
      calculateViceBundleRegularPrice({
        viceSingle: {
          priceCents: 1_500,
          currency: "CAD"
        },
        legacyViceBase: {
          priceCents: 1_500,
          currency: "CAD"
        },
        whiteBallsSixPack: {
          priceCents: 800,
          currency: "CAD"
        }
      })
    ).toEqual({
      priceCents: 6_800,
      currency: "CAD",
      pricingSource: COMPONENT_DERIVED_PRICING_SOURCE
    });
  });

  it("falls back to the existing Vice base price and rejects incomplete component pricing", () => {
    expect(
      calculateViceBundleRegularPrice({
        legacyViceBase: {
          priceCents: 1_500,
          currency: "CAD"
        },
        whiteBallsSixPack: {
          priceCents: 800,
          currency: "CAD"
        }
      })
    ).toEqual({
      priceCents: 6_800,
      currency: "CAD",
      pricingSource: COMPONENT_DERIVED_PRICING_SOURCE
    });

    expect(
      calculateViceBundleRegularPrice({
        legacyViceBase: {
          priceCents: 1_500,
          currency: "CAD"
        },
        whiteBallsSixPack: {
          priceCents: null,
          currency: "CAD"
        }
      })
    ).toBeNull();

    expect(
      calculateViceBundleRegularPrice({
        viceSingle: {
          priceCents: null,
          currency: "CAD"
        },
        legacyViceBase: {
          priceCents: 1_500,
          currency: "CAD"
        },
        whiteBallsSixPack: {
          priceCents: 800,
          currency: "CAD"
        }
      })
    ).toBeNull();
  });
});

describe("public Vice bundle variant serialization", () => {
  it("exposes the computed price, approved label, and narrow pricing marker", async () => {
    const { findFirst, service } = catalogServiceWithProduct(
      viceProduct([
        variant(VICE_SINGLE_VARIANT_KEY, {
          priceCents: 1_500
        }),
        variant(VICE_BUNDLE_VARIANT_KEY, {
          name: "Unpublished working name",
          priceCents: 1
        })
      ])
    );

    const variants = await readPublicVariants(service);
    const bundle = variants.find((item) => item.key === VICE_BUNDLE_VARIANT_KEY);

    expect(bundle).toMatchObject({
      key: VICE_BUNDLE_VARIANT_KEY,
      name: VICE_BUNDLE_PUBLIC_LABEL,
      priceCents: 6_800,
      currency: "CAD",
      pricingSource: COMPONENT_DERIVED_PRICING_SOURCE
    });
    expect(bundle).not.toHaveProperty("sku", expect.any(String));
    expect(findFirst).toHaveBeenCalledTimes(2);
    expect(findFirst.mock.calls[1]?.[0]).toMatchObject({
      where: {
        key: PREMIUM_WHITE_BALLS_SIX_PACK_PRODUCT_KEY,
        status: "active",
        v1PublicNavigation: true,
        v1CheckoutScope: true,
        purchaseMode: {
          in: ["online_checkout", "online_checkout_candidate"]
        },
        currency: "CAD",
        family: {
          is: {
            isActive: true,
            isPublic: true
          }
        },
        primaryCategory: {
          is: {
            isActive: true,
            v1PublicNavigation: true,
            v1CheckoutScope: true
          }
        }
      },
      select: {
        priceCents: true,
        currency: true
      }
    });
  });

  it("uses the existing Vice base price when the single variant has not been added", async () => {
    const { service } = catalogServiceWithProduct(
      viceProduct([
        variant(VICE_BUNDLE_VARIANT_KEY, {
          priceCents: null
        })
      ])
    );

    const variants = await readPublicVariants(service);

    expect(variants.find((item) => item.key === VICE_BUNDLE_VARIANT_KEY)).toMatchObject({
      priceCents: 6_800,
      pricingSource: COMPONENT_DERIVED_PRICING_SOURCE
    });
  });

  it("leaves ordinary variants unchanged and skips component loading until the bundle exists", async () => {
    const single = variant(VICE_SINGLE_VARIANT_KEY, {
      name: "Single Vice paddle",
      priceCents: 1_500
    });
    const { findFirst, service } = catalogServiceWithProduct(viceProduct([single]));

    const variants = await readPublicVariants(service);

    expect(variants[0]).toMatchObject({
      key: single.key,
      name: single.name,
      priceCents: single.priceCents,
      currency: single.currency
    });
    expect(variants[0]).not.toHaveProperty("pricingSource");
    expect(findFirst).toHaveBeenCalledTimes(1);
  });

  it("never falls back to a stored bundle price when live components cannot be reconciled", async () => {
    const bundle = variant(VICE_BUNDLE_VARIANT_KEY, {
      name: "Stored bundle name",
      priceCents: 12_345
    });
    const { service } = catalogServiceWithProduct(viceProduct([bundle]), {
      priceCents: 800,
      currency: "USD"
    });

    const variants = await readPublicVariants(service);
    const serializedBundle = variants.find((item) => item.key === VICE_BUNDLE_VARIANT_KEY);

    expect(serializedBundle).toMatchObject({
      name: bundle.name,
      priceCents: null,
      currency: bundle.currency
    });
    expect(serializedBundle).not.toHaveProperty("pricingSource");
  });
});
