import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import {
  AQUA_FOUR_PACK_PRODUCT_SLUG,
  AQUA_FOUR_PACK_VARIANT_KEY,
  AQUA_PADDLE_PRODUCT_KEY,
  CURRENT_CANADA_SHIPPING_RULE,
  PREMIUM_WHITE_BALLS_SIX_PACK_PRODUCT_KEY,
  TABLE_ACCESSORIES_PRICING_RULE_VERSION,
  TABLE_ACCESSORIES_PROMOTION_KEY,
  VICE_BUNDLE_OPTION_VALUE,
  VICE_BUNDLE_PUBLIC_LABEL,
  VICE_BUNDLE_VARIANT_KEY,
  VICE_PACKAGE_OPTION_NAME,
  VICE_PADDLE_PRODUCT_KEY,
  VICE_SINGLE_OPTION_VALUE,
  VICE_SINGLE_PUBLIC_LABEL,
  VICE_SINGLE_VARIANT_KEY
} from "../../packages/shared/src";

import { CheckoutService } from "../../apps/api/src/checkout/checkout.service";
import { StripeWebhookService } from "../../apps/api/src/webhooks/stripe-webhook.service";

describe("server-authoritative checkout", () => {
  const checkoutProduct = {
    id: "product-1",
    key: "product-one",
    slug: "product-one",
    name: "Product One",
    sku: "SKU-1",
    productKind: "ball",
    status: "active",
    v1PublicNavigation: true,
    v1CheckoutScope: true,
    purchaseMode: "online_checkout",
    priceCents: 800,
    currency: "CAD",
    family: { isActive: true, isPublic: true },
    primaryCategory: {
      isActive: true,
      v1PublicNavigation: true,
      v1CheckoutScope: true
    },
    media: [],
    variants: []
  };
  it("uses expected prices for comparison only and enforces quantity limits", () => {
    const service = new CheckoutService() as unknown as {
      validateRequest(body: unknown): { items: Array<Record<string, unknown>> };
    };
    const result = service.validateRequest({
      discountCents: 99_999,
      pricingRuleVersion: TABLE_ACCESSORIES_PRICING_RULE_VERSION,
      items: [
        {
          discountUnitCents: 99_999,
          productSlug: "tiger-test-product",
          quantity: 1,
          selectedOptions: [],
          unitPriceCents: 1,
          expectedUnitPriceCents: 800
        }
      ]
    });

    expect(result.items[0]).not.toHaveProperty("unitPriceCents");
    expect(result.items[0]).not.toHaveProperty("discountUnitCents");
    expect(result).not.toHaveProperty("discountCents");
    expect(result.items[0]).toHaveProperty("expectedUnitPriceCents", 800);
    expect(result).toHaveProperty("pricingRuleVersion", TABLE_ACCESSORIES_PRICING_RULE_VERSION);
    expect(
      service.validateRequest({
        items: [{ productSlug: "tiger-test-product", quantity: 1, selectedOptions: [] }]
      })
    ).toHaveProperty("pricingRuleVersion", TABLE_ACCESSORIES_PRICING_RULE_VERSION);
    expect(() =>
      service.validateRequest({
        pricingRuleVersion: "some_other_rule",
        items: [{ productSlug: "tiger-test-product", quantity: 1, selectedOptions: [] }]
      })
    ).toThrow("requested pricing rule version is not supported");
    expect(() =>
      service.validateRequest({
        items: [{ productSlug: "tiger-test-product", quantity: 11, selectedOptions: [] }]
      })
    ).toThrow("quantity cannot be greater than 10");
  });

  it("accepts the canonical Vice bundle option value through request validation", () => {
    const service = new CheckoutService() as unknown as {
      validateRequest(body: unknown): { items: Array<Record<string, unknown>> };
    };

    const result = service.validateRequest({
      items: [
        {
          expectedUnitPriceCents: 6_800,
          productSlug: VICE_PADDLE_PRODUCT_KEY,
          quantity: 1,
          selectedOptions: [
            {
              name: VICE_PACKAGE_OPTION_NAME,
              value: VICE_BUNDLE_OPTION_VALUE
            }
          ],
          selectedVariantKey: VICE_BUNDLE_VARIANT_KEY
        }
      ]
    });

    expect(result.items[0]).toMatchObject({
      selectedOptions: [
        {
          name: VICE_PACKAGE_OPTION_NAME,
          value: VICE_BUNDLE_OPTION_VALUE
        }
      ],
      selectedVariantKey: VICE_BUNDLE_VARIANT_KEY
    });
  });

  it("calculates the approved shipping boundary on the server", () => {
    const service = new CheckoutService() as unknown as {
      calculateTotals(
        items: Array<{
          lineTotalCents: number;
          productSlug?: string;
          variantKey?: string | null;
        }>
      ): {
        shippingCents: number;
        totalCents: number;
      };
    };

    expect(service.calculateTotals([{ lineTotalCents: 10_000 }])).toMatchObject({
      shippingCents: 1_500,
      totalCents: 11_500
    });
    expect(service.calculateTotals([{ lineTotalCents: 10_001 }])).toMatchObject({
      shippingCents: 0,
      totalCents: 10_001
    });
    expect(
      service.calculateTotals([
        {
          lineTotalCents: 700,
          productSlug: "tiger-pingpong-replacement-part-40",
          variantKey: null
        }
      ])
    ).toMatchObject({
      shippingCents: 1_500,
      totalCents: 2_200
    });
    expect(
      service.calculateTotals([
        {
          lineTotalCents: 8_000,
          productSlug: AQUA_FOUR_PACK_PRODUCT_SLUG,
          variantKey: AQUA_FOUR_PACK_VARIANT_KEY
        }
      ])
    ).toMatchObject({
      shippingCents: 0,
      totalCents: 8_000
    });
    expect(
      service.calculateTotals([
        {
          lineTotalCents: 8_000,
          productSlug: AQUA_FOUR_PACK_PRODUCT_SLUG,
          variantKey: AQUA_FOUR_PACK_VARIANT_KEY
        },
        {
          lineTotalCents: 800,
          productSlug: "product-one",
          variantKey: null
        }
      ])
    ).toMatchObject({
      shippingCents: 1_500,
      totalCents: 10_300
    });
  });

  it("returns authoritative cart changes before creating an order or Stripe session", async () => {
    const service = new CheckoutService() as unknown as {
      createCheckoutSession(body: unknown): Promise<unknown>;
      readCheckoutConfig: () => unknown;
      getPrisma: () => unknown;
      loadCheckoutProducts: () => Promise<Map<string, unknown>>;
      createPendingOrder: ReturnType<typeof vi.fn>;
    };
    service.readCheckoutConfig = () => ({});
    service.getPrisma = () => ({});
    service.loadCheckoutProducts = async () => new Map([["product-one", checkoutProduct]]);
    service.createPendingOrder = vi.fn();

    await expect(
      service.createCheckoutSession({
        items: [
          {
            productSlug: "product-one",
            quantity: 1,
            selectedOptions: [],
            expectedUnitPriceCents: 700
          }
        ]
      })
    ).rejects.toMatchObject({ status: 409 });
    expect(service.createPendingOrder).not.toHaveBeenCalled();
  });

  it("allows an approved replacement part while keeping deferred parts unavailable", async () => {
    const service = new CheckoutService() as unknown as {
      createCheckoutSession(body: unknown): Promise<unknown>;
      createPendingOrder: ReturnType<typeof vi.fn>;
      isProductCheckoutable(product: unknown): boolean;
      loadCheckoutProducts: () => Promise<Map<string, unknown>>;
      readCheckoutConfig: () => unknown;
      getPrisma: () => unknown;
    };
    const part40 = {
      ...checkoutProduct,
      key: "tiger-pingpong-replacement-part-40",
      slug: "tiger-pingpong-replacement-part-40",
      name: "Tiger PingPong Part 40",
      sku: "8123",
      productKind: "replacement_part",
      priceCents: 700
    };
    const approvedStandardNet = {
      ...part40,
      key: "tiger-replacement-net",
      slug: "tiger-replacement-net",
      name: "Tiger PingPong Standard Replacement Net",
      priceCents: 2_000,
      sku: "8367"
    };
    const approvedUpgradeSystem = {
      ...part40,
      key: "tiger-table-net-replacement-set",
      slug: "tiger-table-net-replacement-set",
      name: "Tiger PingPong Expo & Portland Net Upgrade System",
      priceCents: 14_999,
      sku: "15875"
    };
    const deferredWhistlerSystem = {
      ...part40,
      key: "tiger-whistler-net-upgrade-system",
      slug: "tiger-whistler-net-upgrade-system",
      status: "draft",
      v1PublicNavigation: false,
      v1CheckoutScope: false,
      purchaseMode: "deferred_from_v1"
    };

    expect(service.isProductCheckoutable(part40)).toBe(true);
    expect(service.isProductCheckoutable(approvedStandardNet)).toBe(true);
    expect(service.isProductCheckoutable(approvedUpgradeSystem)).toBe(true);
    expect(service.isProductCheckoutable(deferredWhistlerSystem)).toBe(false);

    service.readCheckoutConfig = () => ({});
    service.getPrisma = () => ({});
    service.loadCheckoutProducts = async () => new Map([[part40.slug, part40]]);
    service.createPendingOrder = vi.fn();

    await expect(
      service.createCheckoutSession({
        items: [
          {
            productSlug: part40.slug,
            quantity: 1,
            selectedOptions: [],
            expectedUnitPriceCents: 1
          }
        ]
      })
    ).rejects.toMatchObject({ status: 409 });
    expect(service.createPendingOrder).not.toHaveBeenCalled();
  });

  it("requires Stripe Checkout to collect a customer phone number", async () => {
    const createSession = vi.fn().mockResolvedValue({
      id: "cs_test_phone",
      url: "https://checkout.stripe.com/test"
    });
    const service = new CheckoutService() as unknown as {
      createStripeSession(config: unknown, order: unknown): Promise<unknown>;
      getStripe: () => {
        checkout: {
          sessions: {
            create: typeof createSession;
          };
        };
      };
    };
    service.getStripe = () => ({
      checkout: {
        sessions: {
          create: createSession
        }
      }
    });

    await service.createStripeSession(
      {
        appEnv: "test",
        cancelUrl: "https://example.com/checkout/cancel",
        stripeSecretKey: "sk_test_local_only",
        stripeTaxEnabled: false,
        successUrl: "https://example.com/checkout/success"
      },
      {
        customerEmail: null,
        id: "order_phone",
        items: [
          {
            imageUrl: null,
            name: "Product One",
            quantity: 1,
            unitPriceCents: 800
          }
        ],
        publicReference: "order-phone-reference",
        shippingCents: 1_500,
        subtotalCents: 800,
        totalCents: 2_300
      }
    );

    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        allow_promotion_codes: false,
        mode: "payment",
        phone_number_collection: {
          enabled: true
        },
        shipping_address_collection: {
          allowed_countries: ["CA"]
        }
      }),
      {
        idempotencyKey: "checkout_session_create:order_phone"
      }
    );
  });

  it("splits a partial accessory quantity into persisted and Stripe net-price lines", async () => {
    const service = new CheckoutService() as unknown as {
      calculateTotals(items: unknown[]): Record<string, number | string>;
      createPendingOrder(
        prisma: unknown,
        items: unknown[],
        totals: unknown,
        customerEmail: string | undefined,
        pricingRuleVersion: string
      ): Promise<Record<string, unknown>>;
      createSnapshotItems(items: unknown[], products: Map<string, unknown>): unknown[];
      createStripeSession(config: unknown, order: unknown): Promise<unknown>;
      getStripe: () => {
        checkout: {
          sessions: {
            create: ReturnType<typeof vi.fn>;
          };
        };
      };
    };
    const table = {
      ...checkoutProduct,
      id: "expo-table",
      key: "tiger-expo-outdoor-table",
      slug: "tiger-expo-outdoor-table",
      name: "Expo Outdoor Table",
      sku: "EXPO",
      productKind: "table",
      priceCents: 100_000
    };
    const aqua = createAquaCheckoutProduct();
    const snapshotItems = service.createSnapshotItems(
      [
        {
          expectedUnitPriceCents: 100_000,
          productSlug: table.slug,
          quantity: 1,
          selectedVariantKey: null,
          selectedOptions: []
        },
        {
          expectedUnitPriceCents: 8_000,
          productSlug: aqua.slug,
          quantity: 2,
          selectedVariantKey: AQUA_FOUR_PACK_VARIANT_KEY,
          selectedOptions: [
            {
              name: "Package Options",
              value: "4-Pack w/ 3 Balls"
            }
          ]
        }
      ],
      new Map([
        [table.slug, table],
        [aqua.slug, aqua]
      ])
    );
    const aquaSnapshotItems = snapshotItems.filter(
      (item) => (item as { productKey?: string }).productKey === AQUA_PADDLE_PRODUCT_KEY
    ) as Array<Record<string, unknown>>;

    expect(aquaSnapshotItems).toEqual([
      expect.objectContaining({
        discountUnitCents: 2_400,
        listUnitPriceCents: 8_000,
        promotionKey: TABLE_ACCESSORIES_PROMOTION_KEY,
        quantity: 1,
        unitPriceCents: 5_600
      }),
      expect.objectContaining({
        discountUnitCents: 0,
        listUnitPriceCents: 8_000,
        promotionKey: null,
        quantity: 1,
        unitPriceCents: 8_000
      })
    ]);

    const totals = service.calculateTotals(snapshotItems);
    expect(totals).toMatchObject({
      discountCents: 2_400,
      listSubtotalCents: 116_000,
      shippingCents: 0,
      subtotalCents: 113_600,
      totalCents: 113_600
    });

    const createOrder = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      ...data,
      customerEmail: null,
      id: "order-partial-discount",
      items: snapshotItems,
      publicReference: "partial-discount-reference"
    }));
    const order = await service.createPendingOrder(
      {
        $transaction: (callback: (transaction: unknown) => unknown) =>
          callback({
            order: {
              create: createOrder
            }
          })
      },
      snapshotItems,
      totals,
      undefined,
      TABLE_ACCESSORIES_PRICING_RULE_VERSION
    );
    const persistedItems = (
      createOrder.mock.calls[0]?.[0] as {
        data: { items: { create: Array<Record<string, unknown>> } };
      }
    ).data.items.create.filter((item) => item.productKey === AQUA_PADDLE_PRODUCT_KEY);

    expect(persistedItems).toEqual([
      expect.objectContaining({
        discountUnitCents: 2_400,
        listUnitPriceCents: 8_000,
        promotionKey: TABLE_ACCESSORIES_PROMOTION_KEY,
        quantity: 1,
        unitPriceCents: 5_600
      }),
      expect.objectContaining({
        discountUnitCents: 0,
        listUnitPriceCents: 8_000,
        promotionKey: null,
        quantity: 1,
        unitPriceCents: 8_000
      })
    ]);

    const createSession = vi.fn().mockResolvedValue({
      id: "cs_test_partial_discount",
      url: "https://checkout.stripe.com/test"
    });
    service.getStripe = () => ({
      checkout: {
        sessions: {
          create: createSession
        }
      }
    });

    await service.createStripeSession(
      {
        appEnv: "test",
        cancelUrl: "https://example.com/checkout/cancel",
        stripeSecretKey: "sk_test_local_only",
        stripeTaxEnabled: true,
        successUrl: "https://example.com/checkout/success"
      },
      order
    );

    const stripeParams = createSession.mock.calls[0]?.[0] as {
      allow_promotion_codes: boolean;
      automatic_tax?: { enabled: boolean };
      discounts?: unknown;
      line_items: Array<{
        price_data: { tax_behavior?: string; unit_amount: number };
        quantity: number;
      }>;
    };
    expect(stripeParams.allow_promotion_codes).toBe(false);
    expect(stripeParams.automatic_tax).toEqual({ enabled: true });
    expect(stripeParams).not.toHaveProperty("discounts");
    expect(
      stripeParams.line_items.map((line) => ({
        quantity: line.quantity,
        taxBehavior: line.price_data.tax_behavior,
        unitAmount: line.price_data.unit_amount
      }))
    ).toEqual([
      { quantity: 1, taxBehavior: "exclusive", unitAmount: 100_000 },
      { quantity: 1, taxBehavior: "exclusive", unitAmount: 5_600 },
      { quantity: 1, taxBehavior: "exclusive", unitAmount: 8_000 }
    ]);
  });

  it("returns list subtotal and savings in checkout status responses", () => {
    const service = new CheckoutService() as unknown as {
      toCheckoutSessionStatusResponse(order: unknown): Record<string, unknown>;
    };

    expect(
      service.toCheckoutSessionStatusResponse({
        createdAt: new Date("2026-07-23T12:00:00.000Z"),
        currency: "CAD",
        customerEmail: null,
        discountCents: 2_400,
        listSubtotalCents: 116_000,
        paidAt: null,
        pricingRuleVersion: TABLE_ACCESSORIES_PRICING_RULE_VERSION,
        publicReference: "status-reference",
        shippingCents: 0,
        status: "checkout_pending",
        stripeAmountTaxCents: null,
        stripeAmountTotalCents: null,
        stripeAutomaticTaxStatus: null,
        subtotalCents: 113_600,
        taxAmountCents: null,
        totalCents: 113_600
      })
    ).toMatchObject({
      discountCents: 2_400,
      listSubtotalCents: 116_000,
      subtotalCents: 113_600
    });

    expect(
      service.toCheckoutSessionStatusResponse({
        createdAt: new Date("2026-07-23T12:00:00.000Z"),
        currency: "CAD",
        customerEmail: null,
        discountCents: 0,
        listSubtotalCents: 0,
        paidAt: null,
        pricingRuleVersion: null,
        publicReference: "legacy-status-reference",
        shippingCents: 1_500,
        status: "checkout_pending",
        stripeAmountTaxCents: null,
        stripeAmountTotalCents: null,
        stripeAutomaticTaxStatus: null,
        subtotalCents: 800,
        taxAmountCents: null,
        totalCents: 2_300
      })
    ).toMatchObject({
      discountCents: 0,
      listSubtotalCents: 800,
      subtotalCents: 800
    });
  });

  it("rejects missing and invalid required product options against catalog variants", () => {
    const service = new CheckoutService() as unknown as {
      validateLineItemOptions(item: unknown, product: unknown): unknown;
    };
    const option = { displayName: "Colour", name: "color", sortOrder: 0 };
    const variant = (key: string, value: string) => ({
      isActive: true,
      key,
      optionValues: [
        {
          productOptionValue: {
            label: value,
            option,
            sortOrder: 0,
            value
          }
        }
      ],
      priceCents: 120_000,
      purchaseMode: "online_checkout"
    });
    const product = {
      productKind: "table",
      variants: [variant("blue-table", "Blue"), variant("black-table", "Black")]
    };

    expect(() =>
      service.validateLineItemOptions({ selectedOptions: [], selectedVariantKey: null }, product)
    ).toThrow("A required product option is missing.");
    expect(() =>
      service.validateLineItemOptions(
        {
          selectedOptions: [{ name: "color", value: "Green" }],
          selectedVariantKey: null
        },
        product
      )
    ).toThrow("A selected product option value is invalid.");
  });

  it("defaults legacy optionless Vice requests to the Single variant", () => {
    const service = new CheckoutService() as unknown as {
      createSnapshotItems(
        items: unknown[],
        products: Map<string, unknown>
      ): Array<{
        sku: string | null;
        unitPriceCents: number;
        variantKey: string | null;
      }>;
    };
    const vice = createViceCheckoutProduct();

    expect(
      service.createSnapshotItems(
        [
          {
            expectedUnitPriceCents: 1_500,
            productSlug: VICE_PADDLE_PRODUCT_KEY,
            quantity: 1,
            selectedVariantKey: null,
            selectedOptions: []
          }
        ],
        new Map([[VICE_PADDLE_PRODUCT_KEY, vice]])
      )
    ).toEqual([
      expect.objectContaining({
        sku: "9174",
        unitPriceCents: 1_500,
        variantKey: VICE_SINGLE_VARIANT_KEY
      })
    ]);
  });

  it("keeps the Single Vice option required while the bundle remains inactive", () => {
    const service = new CheckoutService() as unknown as {
      createSnapshotItems(
        items: unknown[],
        products: Map<string, unknown>
      ): Array<{
        sku: string | null;
        unitPriceCents: number;
        variantKey: string | null;
      }>;
    };
    const vice = createViceCheckoutProduct();
    vice.variants = vice.variants.filter((variant) => variant.key === VICE_SINGLE_VARIANT_KEY);

    expect(
      service.createSnapshotItems(
        [
          {
            expectedUnitPriceCents: 1_500,
            productSlug: VICE_PADDLE_PRODUCT_KEY,
            quantity: 1,
            selectedVariantKey: null,
            selectedOptions: []
          }
        ],
        new Map([[VICE_PADDLE_PRODUCT_KEY, vice]])
      )
    ).toEqual([
      expect.objectContaining({
        sku: "9174",
        unitPriceCents: 1_500,
        variantKey: VICE_SINGLE_VARIANT_KEY
      })
    ]);
  });

  it("loads the white six-ball component alongside requested Vice lines", async () => {
    const vice = createViceCheckoutProduct();
    const whiteBalls = {
      ...checkoutProduct,
      id: "white-balls",
      key: PREMIUM_WHITE_BALLS_SIX_PACK_PRODUCT_KEY,
      slug: PREMIUM_WHITE_BALLS_SIX_PACK_PRODUCT_KEY
    };
    const findMany = vi.fn().mockResolvedValueOnce([vice]).mockResolvedValueOnce([whiteBalls]);
    const service = new CheckoutService() as unknown as {
      loadCheckoutProducts(prisma: unknown, items: unknown[]): Promise<Map<string, unknown>>;
    };

    await service.loadCheckoutProducts(
      {
        product: {
          findMany
        }
      },
      [
        {
          expectedUnitPriceCents: 1_500,
          productSlug: VICE_PADDLE_PRODUCT_KEY,
          quantity: 1,
          selectedVariantKey: VICE_SINGLE_VARIANT_KEY,
          selectedOptions: []
        }
      ]
    );

    expect(findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          slug: {
            in: [VICE_PADDLE_PRODUCT_KEY]
          }
        }
      })
    );
    expect(findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          key: {
            in: [PREMIUM_WHITE_BALLS_SIX_PACK_PRODUCT_KEY]
          }
        }
      })
    );
  });

  it("uses live components for the Vice bundle and refuses an unassigned bundle SKU", () => {
    const service = new CheckoutService() as unknown as {
      createSnapshotItems(
        items: unknown[],
        products: Map<string, unknown>
      ): Array<{
        sku: string | null;
        unitPriceCents: number;
        variantKey: string | null;
      }>;
    };
    const vice = createViceCheckoutProduct();
    const whiteBalls = {
      ...checkoutProduct,
      id: "white-balls",
      key: PREMIUM_WHITE_BALLS_SIX_PACK_PRODUCT_KEY,
      slug: PREMIUM_WHITE_BALLS_SIX_PACK_PRODUCT_KEY,
      priceCents: 800
    };
    const requestItem = {
      expectedUnitPriceCents: 6_800,
      productSlug: VICE_PADDLE_PRODUCT_KEY,
      quantity: 1,
      selectedVariantKey: VICE_BUNDLE_VARIANT_KEY,
      selectedOptions: [
        {
          name: VICE_PACKAGE_OPTION_NAME,
          value: VICE_BUNDLE_OPTION_VALUE
        }
      ]
    };
    const products = new Map<string, unknown>([
      [VICE_PADDLE_PRODUCT_KEY, vice],
      [PREMIUM_WHITE_BALLS_SIX_PACK_PRODUCT_KEY, whiteBalls]
    ]);

    expect(service.createSnapshotItems([requestItem], products)).toEqual([
      expect.objectContaining({
        sku: "VICE-BUNDLE-SKU",
        unitPriceCents: 6_800,
        variantKey: VICE_BUNDLE_VARIANT_KEY
      })
    ]);

    const bundle = vice.variants.find((variant) => variant.key === VICE_BUNDLE_VARIANT_KEY);
    if (bundle) {
      bundle.sku = null;
    }

    expect(() => service.createSnapshotItems([requestItem], products)).toThrow(
      "Your cart changed. Review the updated items before checking out."
    );
  });

  it("rejects duplicate canonical Single lines after legacy normalization", () => {
    const service = new CheckoutService() as unknown as {
      createSnapshotItems(items: unknown[], products: Map<string, unknown>): unknown[];
    };
    const vice = createViceCheckoutProduct();

    expect(() =>
      service.createSnapshotItems(
        [
          {
            expectedUnitPriceCents: 1_500,
            productSlug: VICE_PADDLE_PRODUCT_KEY,
            quantity: 10,
            selectedVariantKey: null,
            selectedOptions: []
          },
          {
            expectedUnitPriceCents: 1_500,
            productSlug: VICE_PADDLE_PRODUCT_KEY,
            quantity: 10,
            selectedVariantKey: VICE_SINGLE_VARIANT_KEY,
            selectedOptions: [
              {
                name: VICE_PACKAGE_OPTION_NAME,
                value: VICE_SINGLE_OPTION_VALUE
              }
            ]
          }
        ],
        new Map([[VICE_PADDLE_PRODUCT_KEY, vice]])
      )
    ).toThrow("Duplicate cart lines are not supported for V1 checkout.");
  });
});

function createViceCheckoutProduct() {
  const option = {
    displayName: VICE_PACKAGE_OPTION_NAME,
    name: VICE_PACKAGE_OPTION_NAME,
    sortOrder: 0
  };
  const variant = (
    key: string,
    optionValue: string,
    label: string,
    priceCents: number | null,
    sku: string | null
  ) => ({
    id: key,
    isActive: true,
    key,
    sku,
    name: label,
    priceCents,
    currency: "CAD",
    purchaseModeOverride: null,
    optionValues: [
      {
        productOptionValue: {
          label,
          option,
          sortOrder: 0,
          value: optionValue
        }
      }
    ]
  });

  return {
    id: "vice-product",
    key: VICE_PADDLE_PRODUCT_KEY,
    slug: VICE_PADDLE_PRODUCT_KEY,
    name: "Tiger PingPong Vice Ping Pong Paddle",
    sku: null,
    productKind: "paddle",
    status: "active",
    v1PublicNavigation: true,
    v1CheckoutScope: true,
    purchaseMode: "online_checkout",
    priceCents: 1_500,
    currency: "CAD",
    family: { isActive: true, isPublic: true },
    primaryCategory: {
      isActive: true,
      v1PublicNavigation: true,
      v1CheckoutScope: true
    },
    media: [],
    variants: [
      variant(
        VICE_SINGLE_VARIANT_KEY,
        VICE_SINGLE_OPTION_VALUE,
        VICE_SINGLE_PUBLIC_LABEL,
        1_500,
        "9174"
      ),
      variant(
        VICE_BUNDLE_VARIANT_KEY,
        VICE_BUNDLE_OPTION_VALUE,
        VICE_BUNDLE_PUBLIC_LABEL,
        null,
        "VICE-BUNDLE-SKU"
      )
    ]
  };
}

function createAquaCheckoutProduct() {
  const option = {
    displayName: "Package Options",
    name: "Package Options",
    sortOrder: 0
  };
  const variant = (key: string, value: string, priceCents: number) => ({
    currency: "CAD",
    id: key,
    isActive: true,
    key,
    name: value,
    optionValues: [
      {
        productOptionValue: {
          label: value,
          option,
          sortOrder: 0,
          value
        }
      }
    ],
    priceCents,
    purchaseModeOverride: null,
    sku: key
  });

  return {
    currency: "CAD",
    family: { isActive: true, isPublic: true },
    id: "aqua-product",
    key: AQUA_PADDLE_PRODUCT_KEY,
    media: [],
    name: "Aqua Outdoor / Indoor Paddle",
    priceCents: 2_500,
    primaryCategory: {
      isActive: true,
      v1CheckoutScope: true,
      v1PublicNavigation: true
    },
    productKind: "paddle",
    purchaseMode: "online_checkout",
    sku: null,
    slug: AQUA_PADDLE_PRODUCT_KEY,
    status: "active",
    v1CheckoutScope: true,
    v1PublicNavigation: true,
    variants: [
      variant("tiger-aqua-package-2-pack-3-balls", "2-Pack w/ 3 Balls", 4_500),
      variant(AQUA_FOUR_PACK_VARIANT_KEY, "4-Pack w/ 3 Balls", 8_000)
    ]
  };
}

describe("Stripe webhook safety checks with local fakes", () => {
  const baseOrder = {
    id: "order_1",
    status: "checkout_pending",
    stripeCheckoutSessionId: "cs_test_1",
    stripePaymentIntentId: null,
    currency: "CAD",
    listSubtotalCents: 800,
    discountCents: 0,
    subtotalCents: 800,
    shippingCents: 1_500,
    totalCents: 2_300,
    shippingRule: "canada_free_over_100_flat_15",
    pricingRuleVersion: null,
    items: [
      {
        listUnitPriceCents: 800,
        discountUnitCents: 0,
        unitPriceCents: 800,
        quantity: 1,
        lineTotalCents: 800,
        promotionKey: null,
        currency: "CAD",
        productKey: "product-one",
        productSlug: "product-one",
        variantKey: null
      }
    ]
  };
  const baseSession = {
    object: "checkout.session",
    id: "cs_test_1",
    client_reference_id: "order_1",
    metadata: { orderId: "order_1" },
    mode: "payment",
    status: "complete",
    payment_status: "paid",
    currency: "cad",
    livemode: false,
    amount_subtotal: 800,
    amount_total: 2_300,
    shipping_cost: { amount_total: 1_500 },
    total_details: { amount_discount: 0, amount_shipping: 1_500, amount_tax: 0 },
    collected_information: {
      shipping_details: { name: "Test Customer", address: { country: "CA" } }
    },
    customer: null,
    payment_intent: "pi_test_1"
  };
  const baseEvent = {
    id: "evt_test_1",
    type: "checkout.session.completed",
    livemode: false,
    data: { object: baseSession }
  };

  function validate(
    overrides: Record<string, unknown> = {},
    eventLivemode = false,
    orderOverrides: Record<string, unknown> = {},
    stripeTaxEnabled = false
  ) {
    const service = new StripeWebhookService() as unknown as {
      validateSessionForOrder(
        event: unknown,
        session: unknown,
        order: unknown,
        config: unknown
      ): string | null;
    };
    const session = { ...baseSession, ...overrides };
    return service.validateSessionForOrder(
      { ...baseEvent, livemode: eventLivemode, data: { object: session } },
      session,
      { ...baseOrder, ...orderOverrides },
      { expectedLivemode: false, stripeTaxEnabled, stripeWebhookSecret: "unused" }
    );
  }

  it("accepts matching paid Canadian totals for a backfilled legacy null-rule order", () => {
    expect(validate()).toBeNull();
  });

  it("accepts only null-rule, no-discount legacy orders with all-zero new snapshots", () => {
    const zeroSnapshotItem = {
      ...baseOrder.items[0],
      listUnitPriceCents: 0
    };

    expect(
      validate({}, false, {
        items: [zeroSnapshotItem],
        listSubtotalCents: 0
      })
    ).toBeNull();
    expect(
      validate({}, false, {
        items: [zeroSnapshotItem],
        listSubtotalCents: 0,
        pricingRuleVersion: TABLE_ACCESSORIES_PRICING_RULE_VERSION
      })
    ).toBe("order_pricing_total_mismatch");
  });

  it("accepts internally discounted net totals with no Stripe coupon discount", () => {
    expect(
      validate(
        {
          amount_subtotal: 105_600,
          amount_total: 105_600,
          shipping_cost: { amount_total: 0 },
          total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 }
        },
        false,
        {
          discountCents: 2_400,
          items: [
            {
              currency: "CAD",
              discountUnitCents: 0,
              lineTotalCents: 100_000,
              listUnitPriceCents: 100_000,
              productKey: "tiger-expo-outdoor-table",
              productSlug: "tiger-expo-outdoor-table",
              promotionKey: null,
              quantity: 1,
              unitPriceCents: 100_000,
              variantKey: null
            },
            {
              currency: "CAD",
              discountUnitCents: 2_400,
              lineTotalCents: 5_600,
              listUnitPriceCents: 8_000,
              productKey: AQUA_PADDLE_PRODUCT_KEY,
              productSlug: AQUA_FOUR_PACK_PRODUCT_SLUG,
              promotionKey: TABLE_ACCESSORIES_PROMOTION_KEY,
              quantity: 1,
              unitPriceCents: 5_600,
              variantKey: AQUA_FOUR_PACK_VARIANT_KEY
            }
          ],
          listSubtotalCents: 108_000,
          pricingRuleVersion: TABLE_ACCESSORIES_PRICING_RULE_VERSION,
          shippingCents: 0,
          shippingRule: CURRENT_CANADA_SHIPPING_RULE,
          subtotalCents: 105_600,
          totalCents: 105_600
        }
      )
    ).toBeNull();
  });

  it("accepts Stripe automatic tax calculated on discounted net line prices", () => {
    expect(
      validate(
        {
          amount_subtotal: 105_600,
          amount_total: 118_272,
          automatic_tax: { status: "complete" },
          shipping_cost: { amount_total: 0 },
          total_details: {
            amount_discount: 0,
            amount_shipping: 0,
            amount_tax: 12_672
          }
        },
        false,
        {
          discountCents: 2_400,
          items: [
            {
              currency: "CAD",
              discountUnitCents: 0,
              lineTotalCents: 100_000,
              listUnitPriceCents: 100_000,
              productKey: "tiger-expo-outdoor-table",
              productSlug: "tiger-expo-outdoor-table",
              promotionKey: null,
              quantity: 1,
              unitPriceCents: 100_000,
              variantKey: null
            },
            {
              currency: "CAD",
              discountUnitCents: 2_400,
              lineTotalCents: 5_600,
              listUnitPriceCents: 8_000,
              productKey: AQUA_PADDLE_PRODUCT_KEY,
              productSlug: AQUA_FOUR_PACK_PRODUCT_SLUG,
              promotionKey: TABLE_ACCESSORIES_PROMOTION_KEY,
              quantity: 1,
              unitPriceCents: 5_600,
              variantKey: AQUA_FOUR_PACK_VARIANT_KEY
            }
          ],
          listSubtotalCents: 108_000,
          pricingRuleVersion: TABLE_ACCESSORIES_PRICING_RULE_VERSION,
          shippingCents: 0,
          shippingRule: CURRENT_CANADA_SHIPPING_RULE,
          subtotalCents: 105_600,
          totalCents: 105_600
        },
        true
      )
    ).toBeNull();
  });

  it("rejects a valid-total discount allocated to the wrong equal-price play set", () => {
    expect(
      validate(
        {
          amount_subtotal: 111_560,
          amount_total: 111_560,
          shipping_cost: { amount_total: 0 },
          total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 }
        },
        false,
        {
          discountCents: 2_040,
          items: [
            {
              currency: "CAD",
              discountUnitCents: 0,
              lineTotalCents: 100_000,
              listUnitPriceCents: 100_000,
              productKey: "tiger-expo-outdoor-table",
              productSlug: "tiger-expo-outdoor-table",
              promotionKey: null,
              quantity: 1,
              unitPriceCents: 100_000,
              variantKey: null
            },
            {
              currency: "CAD",
              discountUnitCents: 0,
              lineTotalCents: 6_800,
              listUnitPriceCents: 6_800,
              productKey: AQUA_PADDLE_PRODUCT_KEY,
              productSlug: AQUA_FOUR_PACK_PRODUCT_SLUG,
              promotionKey: null,
              quantity: 1,
              unitPriceCents: 6_800,
              variantKey: AQUA_FOUR_PACK_VARIANT_KEY
            },
            {
              currency: "CAD",
              discountUnitCents: 2_040,
              lineTotalCents: 4_760,
              listUnitPriceCents: 6_800,
              productKey: VICE_PADDLE_PRODUCT_KEY,
              productSlug: VICE_PADDLE_PRODUCT_KEY,
              promotionKey: TABLE_ACCESSORIES_PROMOTION_KEY,
              quantity: 1,
              unitPriceCents: 4_760,
              variantKey: VICE_BUNDLE_VARIANT_KEY
            }
          ],
          listSubtotalCents: 113_600,
          pricingRuleVersion: TABLE_ACCESSORIES_PRICING_RULE_VERSION,
          shippingCents: 0,
          shippingRule: CURRENT_CANADA_SHIPPING_RULE,
          subtotalCents: 111_560,
          totalCents: 111_560
        }
      )
    ).toBe("order_promotion_allocation_mismatch");
  });

  it("stores the phone number collected by Stripe on the paid order", () => {
    const service = new StripeWebhookService() as unknown as {
      createPaidOrderUpdate(
        session: unknown,
        paymentIntentId: string | null,
        paidAt: Date
      ): Record<string, unknown>;
    };
    const paidAt = new Date("2026-07-22T12:00:00.000Z");

    expect(
      service.createPaidOrderUpdate(
        {
          ...baseSession,
          customer_details: {
            email: "customer@example.com",
            name: "Test Customer",
            phone: "+16045550123"
          }
        },
        "pi_test_1",
        paidAt
      )
    ).toMatchObject({
      customerPhone: "+16045550123",
      shippingPhone: "+16045550123",
      status: "paid"
    });
  });

  it("accepts the exact Aqua 4-pack exception and still validates legacy pending orders", () => {
    const aquaItem = {
      currency: "CAD",
      discountUnitCents: 0,
      lineTotalCents: 8_000,
      listUnitPriceCents: 8_000,
      productSlug: AQUA_FOUR_PACK_PRODUCT_SLUG,
      promotionKey: null,
      quantity: 1,
      unitPriceCents: 8_000,
      variantKey: AQUA_FOUR_PACK_VARIANT_KEY
    };

    expect(
      validate(
        {
          amount_subtotal: 8_000,
          amount_total: 8_000,
          shipping_cost: { amount_total: 0 },
          total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 }
        },
        false,
        {
          items: [aquaItem],
          listSubtotalCents: 8_000,
          discountCents: 0,
          shippingCents: 0,
          shippingRule: CURRENT_CANADA_SHIPPING_RULE,
          subtotalCents: 8_000,
          totalCents: 8_000
        }
      )
    ).toBeNull();

    expect(
      validate(
        {
          amount_subtotal: 8_000,
          amount_total: 9_500,
          shipping_cost: { amount_total: 1_500 },
          total_details: { amount_discount: 0, amount_shipping: 1_500, amount_tax: 0 }
        },
        false,
        {
          items: [aquaItem],
          listSubtotalCents: 8_000,
          discountCents: 0,
          shippingCents: 1_500,
          subtotalCents: 8_000,
          totalCents: 9_500
        }
      )
    ).toBeNull();
  });

  it("rejects free shipping on a mixed under-threshold cart", () => {
    expect(
      validate(
        {
          amount_subtotal: 8_800,
          amount_total: 8_800,
          shipping_cost: { amount_total: 0 },
          total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 }
        },
        false,
        {
          items: [
            {
              currency: "CAD",
              discountUnitCents: 0,
              lineTotalCents: 8_000,
              listUnitPriceCents: 8_000,
              productSlug: AQUA_FOUR_PACK_PRODUCT_SLUG,
              promotionKey: null,
              quantity: 1,
              unitPriceCents: 8_000,
              variantKey: AQUA_FOUR_PACK_VARIANT_KEY
            },
            {
              currency: "CAD",
              discountUnitCents: 0,
              lineTotalCents: 800,
              listUnitPriceCents: 800,
              productSlug: "product-one",
              promotionKey: null,
              quantity: 1,
              unitPriceCents: 800,
              variantKey: null
            }
          ],
          listSubtotalCents: 8_800,
          discountCents: 0,
          shippingCents: 0,
          shippingRule: CURRENT_CANADA_SHIPPING_RULE,
          subtotalCents: 8_800,
          totalCents: 8_800
        }
      )
    ).toBe("order_shipping_rule_total_mismatch");
  });

  it("routes amount, country, and livemode mismatches to manual review reasons", () => {
    expect(validate({ amount_total: 2_299 })).toBe("checkout_session_total_mismatch");
    expect(
      validate({
        total_details: {
          amount_discount: 1,
          amount_shipping: 1_500,
          amount_tax: 0
        }
      })
    ).toBe("checkout_session_discount_not_supported");
    expect(
      validate({
        collected_information: {
          shipping_details: { name: "Test Customer", address: { country: "US" } }
        }
      })
    ).toBe("checkout_session_shipping_country_mismatch");
    expect(validate({}, true)).toBe("stripe_event_livemode_mismatch");
  });

  it("verifies Stripe signatures without contacting Stripe", () => {
    const service = new StripeWebhookService() as unknown as {
      verifyWebhookEvent(rawBody: Buffer, signature: string, secret: string): unknown;
    };
    const secret = "whsec_test_local_only";
    const payload = JSON.stringify(baseEvent);
    const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret });

    expect(service.verifyWebhookEvent(Buffer.from(payload), signature, secret)).toMatchObject({
      id: "evt_test_1"
    });
    expect(() =>
      service.verifyWebhookEvent(Buffer.from(payload), signature, "whsec_wrong")
    ).toThrow("signature verification failed");
  });

  it("classifies duplicate webhook deliveries without reprocessing them", async () => {
    const service = new StripeWebhookService() as unknown as {
      prisma: unknown;
      resolveDuplicateWebhookEvent(stripeEventId: string): Promise<{ status: string }>;
    };
    service.prisma = {
      stripeWebhookEvent: {
        findUnique: async () => ({ processedAt: new Date("2026-01-01T00:00:00Z") })
      }
    };

    await expect(service.resolveDuplicateWebhookEvent("evt_duplicate")).resolves.toEqual({
      status: "duplicate_processed"
    });
  });
});
