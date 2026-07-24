import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import {
  AQUA_FOUR_PACK_PRODUCT_SLUG,
  AQUA_FOUR_PACK_VARIANT_KEY,
  CURRENT_CANADA_SHIPPING_RULE,
  PREMIUM_WHITE_BALLS_SIX_PACK_PRODUCT_KEY,
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
      items: [
        {
          productSlug: "tiger-test-product",
          quantity: 1,
          selectedOptions: [],
          unitPriceCents: 1,
          expectedUnitPriceCents: 800
        }
      ]
    });

    expect(result.items[0]).not.toHaveProperty("unitPriceCents");
    expect(result.items[0]).toHaveProperty("expectedUnitPriceCents", 800);
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
    const deferredNet = {
      ...part40,
      key: "tiger-replacement-net",
      slug: "tiger-replacement-net",
      status: "draft",
      v1PublicNavigation: false,
      v1CheckoutScope: false,
      purchaseMode: "deferred_from_v1"
    };

    expect(service.isProductCheckoutable(part40)).toBe(true);
    expect(service.isProductCheckoutable(deferredNet)).toBe(false);

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

describe("Stripe webhook safety checks with local fakes", () => {
  const baseOrder = {
    id: "order_1",
    status: "checkout_pending",
    stripeCheckoutSessionId: "cs_test_1",
    stripePaymentIntentId: null,
    currency: "CAD",
    subtotalCents: 800,
    shippingCents: 1_500,
    totalCents: 2_300,
    shippingRule: "canada_free_over_100_flat_15",
    items: [
      {
        lineTotalCents: 800,
        currency: "CAD",
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
    orderOverrides: Record<string, unknown> = {}
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
      { expectedLivemode: false, stripeTaxEnabled: false, stripeWebhookSecret: "unused" }
    );
  }

  it("accepts matching paid Canadian totals", () => {
    expect(validate()).toBeNull();
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
      lineTotalCents: 8_000,
      productSlug: AQUA_FOUR_PACK_PRODUCT_SLUG,
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
              lineTotalCents: 8_000,
              productSlug: AQUA_FOUR_PACK_PRODUCT_SLUG,
              variantKey: AQUA_FOUR_PACK_VARIANT_KEY
            },
            {
              currency: "CAD",
              lineTotalCents: 800,
              productSlug: "product-one",
              variantKey: null
            }
          ],
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
