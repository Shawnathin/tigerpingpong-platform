import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InternalOrdersService } from "../../apps/api/src/internal-orders/internal-orders.service";
import {
  ORDER_RECEIVED_EMAIL_KIND,
  OrderEmailService,
  SHIPMENT_EMAIL_KIND
} from "../../apps/api/src/order-emails/order-email.service";
import { StripeWebhookService } from "../../apps/api/src/webhooks/stripe-webhook.service";
import { buildCarrierTrackingUrl } from "../../packages/shared/src";

const orderRecord = {
  id: "order-1",
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
  shipmentTrackingUrl:
    "https://www.canadapost-postescanada.ca/track-reperage/en#/details/TRACK-001",
  shipmentShippedAt: new Date("2026-07-16T00:00:00.000Z"),
  shipmentInternalNote: "Manual shipment record.",
  paidAt: new Date("2026-07-15T18:00:00.000Z"),
  createdAt: new Date("2026-07-15T17:00:00.000Z"),
  updatedAt: new Date("2026-07-16T00:00:00.000Z"),
  emailDeliveries: [
    {
      attemptCount: 1,
      kind: ORDER_RECEIVED_EMAIL_KIND,
      lastError: null,
      sentAt: new Date("2026-07-15T18:01:00.000Z"),
      status: "sent"
    }
  ],
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

describe("carrier-aware protected shipment updates", () => {
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

  it("returns protected email delivery status with order detail", async () => {
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
      order: { emails: Array<Record<string, unknown>> };
    };

    expect(selectedFields).toHaveProperty("emailDeliveries");
    expect(selectedFields).not.toHaveProperty("shipmentNotificationSentAt");
    expect(result.order.emails).toEqual([
      expect.objectContaining({ kind: ORDER_RECEIVED_EMAIL_KIND, status: "sent" })
    ]);
  });

  it("builds the carrier link and queues shipment email after saving", async () => {
    let updateData: Record<string, unknown> | null = null;
    const queueShipmentByOrderId = vi.fn().mockResolvedValue({
      attemptCount: 1,
      kind: SHIPMENT_EMAIL_KIND,
      lastError: null,
      sentAt: "2026-07-16T00:01:00.000Z",
      status: "sent"
    });
    const service = new InternalOrdersService({
      queueShipmentByOrderId
    } as never);
    const fakePrisma = {
      order: {
        update: async (args: { data: Record<string, unknown> }) => {
          updateData = args.data;
          return orderRecord;
        }
      }
    };
    (service as unknown as { getPrisma: () => unknown }).getPrisma = () => fakePrisma;

    const result = (await service.updateShipment("local-test-token", orderRecord.publicReference, {
      carrierCode: "canada_post",
      trackingNumber: "TRACK 001",
      shippedDate: "2026-07-16",
      internalNote: "Packed and handed to carrier."
    })) as { emailDelivery: { status: string } };

    expect(updateData).toMatchObject({
      shipmentCarrier: "Canada Post",
      shipmentTrackingNumber: "TRACK 001",
      shipmentTrackingUrl:
        "https://www.canadapost-postescanada.ca/track-reperage/en#/details/TRACK%20001"
    });
    expect(queueShipmentByOrderId).toHaveBeenCalledWith("order-1");
    expect(result.emailDelivery.status).toBe("sent");
  });

  it("requires an explicit safe link for a custom carrier", () => {
    const service = new InternalOrdersService() as unknown as {
      normalizeShipmentInput(input: unknown): unknown;
    };

    expect(() =>
      service.normalizeShipmentInput({
        carrierCode: "other",
        customCarrier: "Local Freight",
        internalNote: "Freight handoff.",
        shippedDate: "2026-07-16",
        trackingNumber: "FREIGHT-1",
        trackingUrl: "javascript:alert(1)"
      })
    ).toThrow("tracking URL must use http or https");
  });
});

describe("transactional email outbox", () => {
  it("automatically retries only deliveries with a scheduled retry time", async () => {
    let where: Record<string, unknown> | null = null;
    const service = new OrderEmailService() as unknown as {
      drainOutbox(): Promise<void>;
      getPrisma: () => unknown;
    };
    service.getPrisma = () => ({
      orderEmailDelivery: {
        findMany: async (args: { where: Record<string, unknown> }) => {
          where = args.where;
          return [];
        }
      }
    });

    await service.drainOutbox();

    expect(where).toMatchObject({
      nextAttemptAt: { lte: expect.any(Date) },
      status: { in: ["pending", "failed"] }
    });
    expect(where).not.toHaveProperty("OR");
  });

  it("uses one outbox row for repeated queue attempts", async () => {
    let existing: Record<string, unknown> | null = null;
    const create = vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      existing = {
        ...data,
        attemptCount: 0,
        id: "delivery-1",
        lastError: null,
        sentAt: null
      };
      return existing;
    });
    const service = new OrderEmailService() as unknown as {
      getPrisma: () => unknown;
      queueDelivery(orderId: string, kind: string, email: string): Promise<unknown>;
    };
    service.getPrisma = () => ({
      orderEmailDelivery: {
        create,
        findUnique: async () => existing
      }
    });

    await service.queueDelivery("order-1", ORDER_RECEIVED_EMAIL_KIND, "buyer@example.com");
    await service.queueDelivery("order-1", ORDER_RECEIVED_EMAIL_KIND, "buyer@example.com");

    expect(create).toHaveBeenCalledTimes(1);
  });

  it("sends through Resend with a stable idempotency key", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ id: "email-provider-1" }),
      ok: true
    });
    vi.stubGlobal("fetch", fetchMock);
    const service = new OrderEmailService() as unknown as {
      sendWithResend(
        config: unknown,
        delivery: unknown,
        rendered: unknown,
        recipient: string
      ): Promise<string>;
    };

    await expect(
      service.sendWithResend(
        {
          apiKey: "re_test_local_only",
          from: "Tiger PingPong <orders@example.com>",
          replyTo: "info@example.com"
        },
        { id: "delivery-1", kind: ORDER_RECEIVED_EMAIL_KIND },
        { html: "<p>Safe</p>", subject: "Order received", text: "Safe" },
        "buyer@example.com"
      )
    ).resolves.toBe("email-provider-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Idempotency-Key": "tiger/order_received/delivery-1"
        })
      })
    );
    vi.unstubAllGlobals();
  });

  it("escapes customer and item content in branded HTML", () => {
    const service = new OrderEmailService() as unknown as {
      renderOrderReceived(order: unknown): { html: string; subject: string; text: string };
    };
    const rendered = service.renderOrderReceived({
      ...orderRecord,
      customerName: "<script>alert(1)</script>",
      items: [{ name: "Aqua <Red>", quantity: 1, lineTotalCents: 800 }]
    });

    expect(rendered.html).toContain("Tiger PingPong");
    expect(rendered.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(rendered.html).not.toContain("<script>alert(1)</script>");
    expect(rendered.subject).toContain(orderRecord.publicReference);
  });
});

describe("paid webhook email trigger", () => {
  it("queues after paid and duplicate-processed webhook outcomes", async () => {
    const queueOrderReceivedByCheckoutSessionId = vi.fn().mockResolvedValue(null);
    const service = new StripeWebhookService({
      queueOrderReceivedByCheckoutSessionId
    } as never) as unknown as {
      queueOrderReceivedEmail(event: unknown, result: unknown): Promise<void>;
    };
    const event = {
      data: {
        object: {
          id: "cs_test_email",
          object: "checkout.session"
        }
      },
      id: "evt_test_email",
      livemode: false,
      type: "checkout.session.completed"
    };

    await service.queueOrderReceivedEmail(event, { status: "paid" });
    await service.queueOrderReceivedEmail(event, { status: "duplicate_processed" });
    await service.queueOrderReceivedEmail(event, { status: "manual_review" });

    expect(queueOrderReceivedByCheckoutSessionId).toHaveBeenCalledTimes(2);
    expect(queueOrderReceivedByCheckoutSessionId).toHaveBeenCalledWith("cs_test_email");
  });
});

describe("carrier links", () => {
  it("generates supported carrier destinations from the tracking number", () => {
    expect(buildCarrierTrackingUrl("purolator", "PIN 123")).toBe(
      "https://www.purolator.com/en/shipping/tracker?pin=PIN%20123"
    );
    expect(buildCarrierTrackingUrl("ups", "1Z999")).toContain("tracknum=1Z999");
    expect(buildCarrierTrackingUrl("fedex", "123456")).toContain("trknbr=123456");
    expect(buildCarrierTrackingUrl("dhl_express", "DHL-1")).toContain("tracking-id=DHL-1");
  });
});
