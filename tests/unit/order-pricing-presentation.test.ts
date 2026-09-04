import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AdminService } from "../../apps/api/src/admin/admin.service";
import { InternalOrdersService } from "../../apps/api/src/internal-orders/internal-orders.service";
import { TABLE_ACCESSORIES_PRICING_RULE_VERSION } from "../../packages/shared/src";

function internalOrderRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "order-pricing-001",
    publicReference: "TPP-PRICING-001",
    status: "paid",
    currency: "CAD",
    listSubtotalCents: 10_000,
    discountCents: 2_000,
    subtotalCents: 8_000,
    shippingCents: 0,
    totalCents: 8_000,
    pricingRuleVersion: TABLE_ACCESSORIES_PRICING_RULE_VERSION,
    taxAmountCents: null,
    shippingRule: "test-shipping-rule",
    checkoutSource: "web",
    customerEmail: "customer@example.invalid",
    customerName: "Test Customer",
    customerPhone: null,
    shippingName: "Test Customer",
    shippingPhone: null,
    shippingAddressJson: null,
    stripeCheckoutSessionId: "cs_test_redacted",
    stripePaymentIntentId: "pi_redacted",
    stripeCustomerId: null,
    stripeAmountTotalCents: 8_000,
    stripeAmountTaxCents: 0,
    stripeAutomaticTaxStatus: "complete",
    shipmentCarrier: null,
    shipmentTrackingNumber: null,
    shipmentTrackingUrl: null,
    shipmentShippedAt: null,
    shipmentInternalNote: null,
    paidAt: new Date("2026-07-23T18:00:00.000Z"),
    createdAt: new Date("2026-07-23T17:00:00.000Z"),
    updatedAt: new Date("2026-07-23T18:00:00.000Z"),
    emailDeliveries: [],
    items: [
      {
        productKey: "discounted-accessory",
        productSlug: "discounted-accessory",
        variantKey: "discounted-accessory-variant",
        sku: "DISCOUNTED-001",
        name: "Discounted accessory",
        listUnitPriceCents: 5_000,
        discountUnitCents: 1_000,
        unitPriceCents: 4_000,
        quantity: 2,
        lineTotalCents: 8_000,
        promotionKey: TABLE_ACCESSORIES_PRICING_RULE_VERSION,
        currency: "CAD",
        createdAt: new Date("2026-07-23T17:00:00.000Z")
      }
    ],
    ...overrides
  };
}

function adminOrderRecord(overrides: Record<string, unknown> = {}) {
  const internal = internalOrderRecord();

  return {
    ...internal,
    id: "order-pricing-001",
    items: internal.items.map((item) => ({
      ...item,
      id: "order-item-pricing-001",
      imageUrl: null,
      product: null,
      variant: null
    })),
    ...overrides
  };
}

describe("protected order pricing presentation", () => {
  const previousToken = process.env.INTERNAL_ORDERS_API_TOKEN;

  beforeEach(() => {
    process.env.INTERNAL_ORDERS_API_TOKEN = "local-test-token";
  });

  afterEach(() => {
    if (previousToken === undefined) {
      delete process.env.INTERNAL_ORDERS_API_TOKEN;
    } else {
      process.env.INTERNAL_ORDERS_API_TOKEN = previousToken;
    }
  });

  it("serializes list, savings, net, rule, and per-item promotion snapshots", async () => {
    let selectedFields: Record<string, unknown> | null = null;
    const service = new InternalOrdersService();
    const fakePrisma = {
      order: {
        findUnique: async (args: { select: Record<string, unknown> }) => {
          selectedFields = args.select;
          return internalOrderRecord();
        }
      }
    };
    (service as unknown as { getPrisma: () => unknown }).getPrisma = () => fakePrisma;

    const response = (await service.getOrder("local-test-token", "TPP-PRICING-001")) as {
      order: {
        discountCents: number;
        items: Array<Record<string, unknown>>;
        listSubtotalCents: number;
        pricingRuleVersion: string | null;
        subtotalCents: number;
      };
    };

    expect(selectedFields).toMatchObject({
      listSubtotalCents: true,
      discountCents: true,
      pricingRuleVersion: true,
      items: {
        select: {
          listUnitPriceCents: true,
          discountUnitCents: true,
          promotionKey: true
        }
      }
    });
    expect(response.order).toMatchObject({
      listSubtotalCents: 10_000,
      discountCents: 2_000,
      subtotalCents: 8_000,
      pricingRuleVersion: TABLE_ACCESSORIES_PRICING_RULE_VERSION
    });
    expect(response.order.items[0]).toMatchObject({
      listUnitPriceCents: 5_000,
      discountUnitCents: 1_000,
      unitPriceCents: 4_000,
      quantity: 2,
      listLineTotalCents: 10_000,
      discountCents: 2_000,
      lineTotalCents: 8_000,
      promotionKey: TABLE_ACCESSORIES_PRICING_RULE_VERSION
    });
  });

  it("uses charged prices only for a null-rule, zero-snapshot legacy rollout edge", async () => {
    const service = new InternalOrdersService();
    const legacyRecord = internalOrderRecord({
      listSubtotalCents: 0,
      discountCents: 0,
      subtotalCents: 8_000,
      pricingRuleVersion: null,
      items: [
        {
          ...internalOrderRecord().items[0],
          listUnitPriceCents: 0,
          discountUnitCents: 0,
          unitPriceCents: 4_000,
          quantity: 2,
          lineTotalCents: 8_000,
          promotionKey: null
        }
      ]
    });
    (service as unknown as { getPrisma: () => unknown }).getPrisma = () => ({
      order: {
        findUnique: async () => legacyRecord
      }
    });

    const response = (await service.getOrder("local-test-token", "TPP-PRICING-001")) as {
      order: {
        discountCents: number;
        items: Array<Record<string, unknown>>;
        listSubtotalCents: number;
      };
    };

    expect(response.order.listSubtotalCents).toBe(8_000);
    expect(response.order.discountCents).toBe(0);
    expect(response.order.items[0]).toMatchObject({
      listUnitPriceCents: 4_000,
      discountUnitCents: 0,
      listLineTotalCents: 8_000,
      discountCents: 0,
      promotionKey: null
    });
  });

  it("never applies the legacy fallback to a versioned admin order", async () => {
    const service = new AdminService();
    const versionedZeroSnapshot = adminOrderRecord({
      listSubtotalCents: 0,
      discountCents: 0,
      pricingRuleVersion: TABLE_ACCESSORIES_PRICING_RULE_VERSION,
      items: [
        {
          ...adminOrderRecord().items[0],
          listUnitPriceCents: 0,
          discountUnitCents: 0,
          promotionKey: null
        }
      ]
    });
    (service as unknown as { getPrisma: () => unknown }).getPrisma = () => ({
      order: {
        findFirst: async () => versionedZeroSnapshot
      }
    });

    const response = (await service.getOrder("TPP-PRICING-001")) as {
      order: {
        items: Array<Record<string, unknown>>;
        totals: {
          discountCents: number;
          listSubtotalCents: number;
          pricingRuleVersion: string | null;
        };
      };
    };

    expect(response.order.totals).toMatchObject({
      listSubtotalCents: 0,
      discountCents: 0,
      pricingRuleVersion: TABLE_ACCESSORIES_PRICING_RULE_VERSION
    });
    expect(response.order.items[0]).toMatchObject({
      listUnitPriceCents: 0,
      discountUnitCents: 0,
      listLineTotalCents: 0
    });
  });

  it("applies the same legacy fallback to admin list and detail responses", async () => {
    const listRecord = {
      ...adminOrderRecord({
        listSubtotalCents: 0,
        discountCents: 0,
        pricingRuleVersion: null
      }),
      _count: {
        items: 1
      }
    };
    const detailRecord = adminOrderRecord({
      listSubtotalCents: 0,
      discountCents: 0,
      pricingRuleVersion: null,
      items: [
        {
          ...adminOrderRecord().items[0],
          listUnitPriceCents: 0,
          discountUnitCents: 0,
          promotionKey: null
        }
      ]
    });
    const service = new AdminService();
    (service as unknown as { getPrisma: () => unknown }).getPrisma = () => ({
      order: {
        findMany: async () => [listRecord],
        findFirst: async () => detailRecord
      }
    });

    const listResponse = (await service.listOrders({ limit: "1" })) as {
      items: Array<Record<string, unknown>>;
    };
    const detailResponse = (await service.getOrder("TPP-PRICING-001")) as {
      order: {
        items: Array<Record<string, unknown>>;
        totals: Record<string, unknown>;
      };
    };

    expect(listResponse.items[0]).toMatchObject({
      listSubtotalCents: 8_000,
      discountCents: 0,
      pricingRuleVersion: null
    });
    expect(detailResponse.order.totals).toMatchObject({
      listSubtotalCents: 8_000,
      discountCents: 0,
      pricingRuleVersion: null
    });
    expect(detailResponse.order.items[0]).toMatchObject({
      listUnitPriceCents: 4_000,
      discountUnitCents: 0,
      promotionKey: null
    });
  });
});
