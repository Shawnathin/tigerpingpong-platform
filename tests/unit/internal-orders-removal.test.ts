import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { InternalOrdersService } from "../../apps/api/src/internal-orders/internal-orders.service";

const orderRecord = {
  publicReference: "TPP-TEST-001",
  status: "paid",
  currency: "CAD",
  subtotalCents: 800,
  shippingCents: 1500,
  totalCents: 2300,
  taxAmountCents: null,
  shippingRule: "flat_rate",
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
  stripeAmountTotalCents: 2300,
  stripeAmountTaxCents: 0,
  stripeAutomaticTaxStatus: "complete",
  shipmentCarrier: "Canada Post",
  shipmentTrackingNumber: "TRACK-001",
  shipmentTrackingUrl: "https://example.invalid/track/TRACK-001",
  shipmentShippedAt: new Date("2026-07-16T00:00:00.000Z"),
  shipmentInternalNote: "Manual shipment record.",
  paidAt: new Date("2026-07-15T18:00:00.000Z"),
  createdAt: new Date("2026-07-15T17:00:00.000Z"),
  updatedAt: new Date("2026-07-16T00:00:00.000Z"),
  items: [
    {
      productKey: "test-product",
      productSlug: "test-product",
      variantKey: null,
      sku: "TEST-001",
      name: "Test Product",
      unitPriceCents: 800,
      quantity: 1,
      lineTotalCents: 800,
      currency: "CAD",
      createdAt: new Date("2026-07-15T17:00:00.000Z")
    }
  ]
};

describe("internal order access without shipment notification columns", () => {
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

  it("loads order detail without selecting or returning notification fields", async () => {
    let selectedFields: Record<string, unknown> | null = null;
    const service = new InternalOrdersService();
    const fakePrisma = {
      order: {
        findUnique: async (args: { select: Record<string, unknown> }) => {
          selectedFields = args.select;
          return orderRecord;
        }
      }
    };
    (service as unknown as { getPrisma: () => unknown }).getPrisma = () => fakePrisma;

    const result = (await service.getOrder("local-test-token", orderRecord.publicReference)) as {
      order: Record<string, unknown>;
    };

    expect(selectedFields).not.toHaveProperty("shipmentNotificationSentAt");
    expect(selectedFields).not.toHaveProperty("shipmentNotificationStatus");
    expect(selectedFields).not.toHaveProperty("shipmentNotificationLastError");
    expect(result.order).not.toHaveProperty("shipmentNotification");
    expect(result.order.shipment).toMatchObject({
      carrier: "Canada Post",
      trackingNumber: "TRACK-001"
    });
  });

  it("updates the manual shipment record without notification fields", async () => {
    let selectedFields: Record<string, unknown> | null = null;
    const service = new InternalOrdersService();
    const fakePrisma = {
      order: {
        update: async (args: { select: Record<string, unknown> }) => {
          selectedFields = args.select;
          return orderRecord;
        }
      }
    };
    (service as unknown as { getPrisma: () => unknown }).getPrisma = () => fakePrisma;

    const result = (await service.updateShipment("local-test-token", orderRecord.publicReference, {
      carrier: "Canada Post",
      trackingNumber: "TRACK-001",
      trackingUrl: "https://example.invalid/track/TRACK-001",
      shippedDate: "2026-07-16",
      internalNote: "Manual shipment record."
    })) as { order: Record<string, unknown> };

    expect(selectedFields).not.toHaveProperty("shipmentNotificationSentAt");
    expect(selectedFields).not.toHaveProperty("shipmentNotificationStatus");
    expect(selectedFields).not.toHaveProperty("shipmentNotificationLastError");
    expect(result.order).not.toHaveProperty("shipmentNotification");
  });
});
