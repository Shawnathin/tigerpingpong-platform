import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { createDatabaseConfig, Prisma, PrismaClient } from "@tigerpingpong/db";

import { getOrderEmailConfig, getStaffOrderEmailRecipient, type OrderEmailConfig } from "../config";

export const ORDER_RECEIVED_EMAIL_KIND = "order_received";
export const STAFF_NEW_ORDER_EMAIL_KIND = "staff_new_order";
export const SHIPMENT_EMAIL_KIND = "shipment";
export const ORDER_EMAIL_KINDS = [
  ORDER_RECEIVED_EMAIL_KIND,
  STAFF_NEW_ORDER_EMAIL_KIND,
  SHIPMENT_EMAIL_KIND
] as const;

export type OrderEmailKind = (typeof ORDER_EMAIL_KINDS)[number];

type OrderEmailStatus = "failed" | "pending" | "sending" | "sent" | "skipped";

export interface OrderEmailDeliverySummary {
  attemptCount: number;
  kind: OrderEmailKind;
  lastError: string | null;
  sentAt: string | null;
  status: OrderEmailStatus;
}

interface ResendMessage {
  from: string;
  html: string;
  reply_to: string;
  subject: string;
  text: string;
  to: string[];
}

interface RenderedMessage {
  html: string;
  subject: string;
  text: string;
}

const EMAIL_STATUS_PENDING: OrderEmailStatus = "pending";
const EMAIL_STATUS_SENDING: OrderEmailStatus = "sending";
const EMAIL_STATUS_SENT: OrderEmailStatus = "sent";
const EMAIL_STATUS_FAILED: OrderEmailStatus = "failed";
const EMAIL_STATUS_SKIPPED: OrderEmailStatus = "skipped";
const OUTBOX_INTERVAL_MS = 60_000;
const SENDING_STALE_AFTER_MS = 5 * 60_000;
const RESEND_TIMEOUT_MS = 12_000;
const MAX_AUTOMATIC_ATTEMPTS = 5;
const MAX_ERROR_LENGTH = 500;

const emailOrderSelect = {
  id: true,
  publicReference: true,
  status: true,
  currency: true,
  subtotalCents: true,
  shippingCents: true,
  totalCents: true,
  stripeAmountTotalCents: true,
  customerEmail: true,
  customerName: true,
  shippingName: true,
  shipmentCarrier: true,
  shipmentTrackingNumber: true,
  shipmentTrackingUrl: true,
  shipmentShippedAt: true,
  paidAt: true,
  items: {
    orderBy: {
      createdAt: "asc"
    },
    select: {
      name: true,
      quantity: true,
      lineTotalCents: true
    }
  }
} satisfies Prisma.OrderSelect;

type EmailOrder = Prisma.OrderGetPayload<{ select: typeof emailOrderSelect }>;

const emailDeliveryInclude = {
  order: {
    select: emailOrderSelect
  }
} satisfies Prisma.OrderEmailDeliveryInclude;

type EmailDeliveryWithOrder = Prisma.OrderEmailDeliveryGetPayload<{
  include: typeof emailDeliveryInclude;
}>;

@Injectable()
export class OrderEmailService implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(OrderEmailService.name);
  private outboxTimer: ReturnType<typeof setInterval> | null = null;
  private prisma: PrismaClient | null = null;

  onModuleInit(): void {
    this.outboxTimer = setInterval(() => {
      void this.drainOutbox().catch(() => {
        this.logger.warn("Order email outbox retry pass failed.");
      });
    }, OUTBOX_INTERVAL_MS);
    this.outboxTimer.unref();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.outboxTimer) {
      clearInterval(this.outboxTimer);
    }

    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }

  async queueOrderReceivedByCheckoutSessionId(
    stripeCheckoutSessionId: string
  ): Promise<OrderEmailDeliverySummary | null> {
    let order: { customerEmail: string | null; id: string; status: string } | null;

    try {
      order = await this.getPrisma().order.findUnique({
        where: {
          stripeCheckoutSessionId
        },
        select: {
          customerEmail: true,
          id: true,
          status: true
        }
      });
    } catch {
      this.logger.warn("Order-received email could not be queued because the order lookup failed.");
      return null;
    }

    if (!order || order.status !== "paid") {
      return null;
    }

    const [customerResult, staffResult] = await Promise.allSettled([
      this.queueDelivery(order.id, ORDER_RECEIVED_EMAIL_KIND, order.customerEmail),
      this.queueDelivery(order.id, STAFF_NEW_ORDER_EMAIL_KIND, getStaffOrderEmailRecipient())
    ]);

    if (customerResult.status === "rejected") {
      this.logger.warn("Customer order-received email could not be queued.");
    }

    if (staffResult.status === "rejected") {
      this.logger.warn("Staff new-order email could not be queued.");
    }

    return customerResult.status === "fulfilled"
      ? this.serializeDelivery(customerResult.value)
      : null;
  }

  async queueShipmentByOrderId(orderId: string): Promise<OrderEmailDeliverySummary> {
    const order = await this.getPrisma().order.findUnique({
      where: {
        id: orderId
      },
      select: {
        customerEmail: true
      }
    });

    const delivery = await this.queueDelivery(orderId, SHIPMENT_EMAIL_KIND, order?.customerEmail);

    return this.dispatchDelivery(delivery.id, true);
  }

  async retryDelivery(
    publicReference: string,
    kind: OrderEmailKind
  ): Promise<OrderEmailDeliverySummary> {
    const order = await this.getPrisma().order.findUnique({
      where: {
        publicReference
      },
      select: {
        customerEmail: true,
        id: true
      }
    });

    if (!order) {
      throw new Error("Order email delivery was not found.");
    }

    const recipient =
      kind === STAFF_NEW_ORDER_EMAIL_KIND ? getStaffOrderEmailRecipient() : order.customerEmail;
    const delivery = await this.queueDelivery(order.id, kind, recipient);

    return this.dispatchDelivery(delivery.id, true);
  }

  isOrderEmailKind(value: string): value is OrderEmailKind {
    return ORDER_EMAIL_KINDS.includes(value as OrderEmailKind);
  }

  private async queueDelivery(
    orderId: string,
    kind: OrderEmailKind,
    recipientEmail: string | null | undefined
  ) {
    const recipient = this.normalizeEmail(recipientEmail);
    const existing = await this.getPrisma().orderEmailDelivery.findUnique({
      where: {
        orderId_kind: {
          kind,
          orderId
        }
      }
    });

    if (existing) {
      if (existing.status === EMAIL_STATUS_SKIPPED && recipient) {
        return this.getPrisma().orderEmailDelivery.update({
          where: {
            id: existing.id
          },
          data: {
            lastError: null,
            nextAttemptAt: new Date(),
            recipientEmail: recipient,
            status: EMAIL_STATUS_PENDING
          }
        });
      }

      return existing;
    }

    try {
      return await this.getPrisma().orderEmailDelivery.create({
        data: {
          kind,
          lastError: recipient ? null : this.getMissingRecipientError(kind),
          nextAttemptAt: recipient ? new Date() : null,
          orderId,
          recipientEmail: recipient,
          status: recipient ? EMAIL_STATUS_PENDING : EMAIL_STATUS_SKIPPED
        }
      });
    } catch (error) {
      if (!this.isUniqueConstraintError(error)) {
        throw error;
      }

      const concurrent = await this.getPrisma().orderEmailDelivery.findUnique({
        where: {
          orderId_kind: {
            kind,
            orderId
          }
        }
      });

      if (!concurrent) {
        throw error;
      }

      return concurrent;
    }
  }

  private async drainOutbox(): Promise<void> {
    let deliveries: Array<{ id: string }>;

    try {
      deliveries = await this.getPrisma().orderEmailDelivery.findMany({
        where: {
          status: {
            in: [EMAIL_STATUS_PENDING, EMAIL_STATUS_FAILED]
          },
          nextAttemptAt: {
            lte: new Date()
          }
        },
        orderBy: {
          createdAt: "asc"
        },
        select: {
          id: true
        },
        take: 10
      });
    } catch {
      return;
    }

    for (const delivery of deliveries) {
      try {
        await this.dispatchDelivery(delivery.id, false);
      } catch {
        this.logger.warn("Queued order email could not be retried.");
      }
    }
  }

  private async dispatchDelivery(
    deliveryId: string,
    force: boolean
  ): Promise<OrderEmailDeliverySummary> {
    const existing = await this.getPrisma().orderEmailDelivery.findUnique({
      where: {
        id: deliveryId
      },
      include: emailDeliveryInclude
    });

    if (!existing) {
      throw new Error("Order email delivery was not found.");
    }

    if (existing.status === EMAIL_STATUS_SENT || existing.status === EMAIL_STATUS_SKIPPED) {
      return this.serializeDelivery(existing);
    }

    const now = new Date();
    const staleBefore = new Date(now.getTime() - SENDING_STALE_AFTER_MS);
    const claimed = await this.getPrisma().orderEmailDelivery.updateMany({
      where: {
        id: deliveryId,
        OR: [
          {
            status: {
              in: [EMAIL_STATUS_PENDING, EMAIL_STATUS_FAILED]
            },
            ...(force
              ? {}
              : {
                  OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }]
                })
          },
          {
            lastAttemptAt: {
              lt: staleBefore
            },
            status: EMAIL_STATUS_SENDING
          }
        ]
      },
      data: {
        attemptCount: {
          increment: 1
        },
        lastAttemptAt: now,
        nextAttemptAt: null,
        status: EMAIL_STATUS_SENDING
      }
    });

    if (claimed.count === 0) {
      const current = await this.getPrisma().orderEmailDelivery.findUniqueOrThrow({
        where: {
          id: deliveryId
        }
      });

      return this.serializeDelivery(current);
    }

    const delivery = await this.getPrisma().orderEmailDelivery.findUniqueOrThrow({
      where: {
        id: deliveryId
      },
      include: emailDeliveryInclude
    });

    const readinessError = this.getReadinessError(delivery);

    if (readinessError) {
      return this.recordFailure(delivery, readinessError, false);
    }

    try {
      const config = getOrderEmailConfig();
      const rendered = this.renderMessage(delivery);
      const providerMessageId = await this.sendWithResend(
        config,
        delivery,
        rendered,
        delivery.recipientEmail as string
      );
      const sentAt = new Date();
      const sent = await this.getPrisma().orderEmailDelivery.update({
        where: {
          id: delivery.id
        },
        data: {
          lastError: null,
          nextAttemptAt: null,
          providerMessageId,
          sentAt,
          status: EMAIL_STATUS_SENT
        }
      });

      this.logger.log(`Order email sent (${delivery.kind}).`);
      return this.serializeDelivery(sent);
    } catch (error) {
      const message = this.sanitizeDeliveryError(error);
      this.logger.warn(`Order email failed (${delivery.kind}): ${message}`);
      return this.recordFailure(delivery, message, true);
    }
  }

  private getReadinessError(delivery: EmailDeliveryWithOrder): string | null {
    if (delivery.order.status !== "paid") {
      return "The order is not in paid status.";
    }

    if (!this.normalizeEmail(delivery.recipientEmail)) {
      return this.getMissingRecipientError(delivery.kind as OrderEmailKind);
    }

    if (delivery.kind === SHIPMENT_EMAIL_KIND) {
      if (!delivery.order.shipmentCarrier?.trim()) {
        return "Shipment carrier is unavailable.";
      }

      if (!delivery.order.shipmentTrackingNumber?.trim()) {
        return "Shipment tracking number is unavailable.";
      }

      if (!delivery.order.shipmentTrackingUrl?.trim()) {
        return "Shipment tracking link is unavailable.";
      }

      if (!delivery.order.shipmentShippedAt) {
        return "Shipment date is unavailable.";
      }
    }

    return null;
  }

  private async sendWithResend(
    config: OrderEmailConfig,
    delivery: EmailDeliveryWithOrder,
    rendered: RenderedMessage,
    recipientEmail: string
  ): Promise<string> {
    const message: ResendMessage = {
      from: config.from,
      html: rendered.html,
      reply_to: config.replyTo,
      subject: rendered.subject,
      text: rendered.text,
      to: [recipientEmail]
    };
    const response = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify(message),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `tiger/${delivery.kind}/${delivery.id}`
      },
      method: "POST",
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS)
    });

    if (!response.ok) {
      throw new Error(`Resend returned HTTP ${response.status}.`);
    }

    const body = (await response.json()) as { id?: unknown };

    if (typeof body.id !== "string" || !body.id.trim()) {
      throw new Error("Resend returned an invalid response.");
    }

    return body.id.trim();
  }

  private renderMessage(delivery: EmailDeliveryWithOrder): RenderedMessage {
    if (delivery.kind === ORDER_RECEIVED_EMAIL_KIND) {
      return this.renderOrderReceived(delivery.order);
    }

    if (delivery.kind === STAFF_NEW_ORDER_EMAIL_KIND) {
      return this.renderStaffNewOrder(delivery.order);
    }

    return this.renderShipment(delivery.order);
  }

  private renderOrderReceived(order: EmailOrder): RenderedMessage {
    const reference = order.publicReference;
    const hasStripeTotal = order.stripeAmountTotalCents !== null;
    const displayedTotal = this.formatMoney(
      order.stripeAmountTotalCents ?? order.totalCents,
      order.currency
    );
    const greeting = this.createGreeting(order);
    const subject = `We’ve got your Tiger PingPong order ${reference}`;
    const detailRows = [
      this.renderDetailRow("Order reference", reference),
      this.renderDetailRow(hasStripeTotal ? "Total paid" : "Order total before tax", displayedTotal)
    ].join("");
    const html = this.renderLayout({
      eyebrow: "Payment confirmed",
      headline: "We’ve got your order.",
      intro: `${greeting} Your payment is confirmed. We’ll review the details and get everything ready. We’ll send another email with tracking once it ships.`,
      main: `${this.renderItems(order)}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-collapse:collapse">${detailRows}</table>`,
      preheader: `Payment confirmed for Tiger PingPong order ${reference}.`,
      reference
    });
    const text = [
      "Payment confirmed",
      "",
      "We’ve got your order.",
      "",
      `${greeting} Your payment is confirmed. We’ll review the details and get everything ready. We’ll send another email with tracking once it ships.`,
      "",
      this.renderItemsText(order),
      `Order reference: ${reference}`,
      `${hasStripeTotal ? "Total paid" : "Order total before tax"}: ${displayedTotal}`,
      "",
      "Questions? Reply to this email and a real Tiger person will help."
    ].join("\n");

    return { html, subject, text };
  }

  private renderShipment(order: EmailOrder): RenderedMessage {
    const reference = order.publicReference;
    const carrier = order.shipmentCarrier?.trim() ?? "your carrier";
    const trackingNumber = order.shipmentTrackingNumber?.trim() ?? "";
    const trackingUrl = order.shipmentTrackingUrl?.trim() ?? "";
    const shippedDate = this.formatDate(order.shipmentShippedAt);
    const greeting = this.createGreeting(order);
    const subject = `Your Tiger PingPong order is on the way — ${reference}`;
    const detailRows = [
      this.renderDetailRow("Carrier", carrier),
      this.renderDetailRow("Tracking number", trackingNumber),
      this.renderDetailRow("Shipped", shippedDate),
      this.renderDetailRow("Order reference", reference)
    ].join("");
    const safeUrl = this.escapeHtmlAttribute(trackingUrl);
    const html = this.renderLayout({
      eyebrow: "Shipment update",
      headline: "Your order is on the way.",
      intro: `${greeting} Your order has shipped with ${carrier}. Use the link below for the latest tracking details from the carrier.`,
      main: `<div style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;border-radius:999px;background:#f28a2e;color:#171b2e;font-size:16px;font-weight:800;line-height:20px;padding:15px 24px;text-decoration:none">Track your order</a></div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${detailRows}</table>`,
      preheader: `Tracking is ready for Tiger PingPong order ${reference}.`,
      reference
    });
    const text = [
      "Shipment update",
      "",
      "Your order is on the way.",
      "",
      `${greeting} Your order has shipped with ${carrier}. Use the link below for the latest tracking details from the carrier.`,
      "",
      `Track your order: ${trackingUrl}`,
      `Carrier: ${carrier}`,
      `Tracking number: ${trackingNumber}`,
      `Shipped: ${shippedDate}`,
      `Order reference: ${reference}`,
      "",
      "Questions? Reply to this email and a real Tiger person will help."
    ].join("\n");

    return { html, subject, text };
  }

  private renderStaffNewOrder(order: EmailOrder): RenderedMessage {
    const reference = order.publicReference;
    const hasStripeTotal = order.stripeAmountTotalCents !== null;
    const displayedTotal = this.formatMoney(
      order.stripeAmountTotalCents ?? order.totalCents,
      order.currency
    );
    const customerName = order.customerName?.trim() || order.shippingName?.trim() || "Not set";
    const customerEmail = order.customerEmail?.trim() || "Not set";
    const paidAt = this.formatDateTime(order.paidAt);
    const subject = `New paid order ${reference} — ${displayedTotal}`;
    const detailRows = [
      this.renderDetailRow("Order reference", reference),
      this.renderDetailRow("Customer", customerName),
      this.renderDetailRow("Customer email", customerEmail),
      this.renderDetailRow(
        hasStripeTotal ? "Total paid" : "Order total before tax",
        displayedTotal
      ),
      this.renderDetailRow("Paid", paidAt)
    ].join("");
    const html = this.renderLayout({
      eyebrow: "Staff order alert",
      headline: "A new paid order is ready.",
      intro: "Stripe payment is confirmed and the order is ready for staff review and fulfillment.",
      main: `${this.renderItems(order, "Order items")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-collapse:collapse">${detailRows}</table>`,
      preheader: `New paid Tiger PingPong order ${reference} for ${displayedTotal}.`,
      reference,
      staff: true
    });
    const text = [
      "Staff order alert",
      "",
      "A new paid order is ready.",
      "",
      "Stripe payment is confirmed and the order is ready for staff review and fulfillment.",
      "",
      this.renderItemsText(order, "Order items"),
      `Order reference: ${reference}`,
      `Customer: ${customerName}`,
      `Customer email: ${customerEmail}`,
      `${hasStripeTotal ? "Total paid" : "Order total before tax"}: ${displayedTotal}`,
      `Paid: ${paidAt}`,
      "",
      "Open the protected Tiger PingPong admin to review the complete order."
    ].join("\n");

    return { html, subject, text };
  }

  private renderLayout(input: {
    eyebrow: string;
    headline: string;
    intro: string;
    main: string;
    preheader: string;
    reference: string;
    staff?: boolean;
  }): string {
    const footer = input.staff
      ? '<strong style="color:#171b2e">Staff notification.</strong><br>Open the protected Tiger PingPong admin to review the complete order.'
      : '<strong style="color:#171b2e">Good gear. Real help. No runaround.</strong><br>Questions? Reply to this email and a real Tiger person will help.';

    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#edf9fc;color:#171b2e;font-family:Inter,Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${this.escapeHtml(input.preheader)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fffaf5,#edf9fc);border-collapse:collapse"><tr><td align="center" style="padding:32px 14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;border-collapse:separate;border-spacing:0;border-radius:32px;background:#ffffff;box-shadow:0 22px 70px rgba(27,36,65,.14);overflow:hidden"><tr><td style="background:#102947;padding:34px 38px"><div style="color:#74c8f2;font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">Tiger PingPong</div><div style="margin-top:22px;color:#f28a2e;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">${this.escapeHtml(input.eyebrow)}</div><h1 style="margin:8px 0 0;color:#ffffff;font-size:34px;line-height:1.12;letter-spacing:-.03em">${this.escapeHtml(input.headline)}</h1></td></tr><tr><td style="padding:34px 38px"><p style="margin:0;color:#394258;font-size:17px;line-height:1.65">${this.escapeHtml(input.intro)}</p><div style="margin-top:28px">${input.main}</div><div style="margin-top:32px;border-top:1px solid #dce8ef;padding-top:24px;color:#5d6678;font-size:14px;line-height:1.6">${footer}<br><span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${this.escapeHtml(input.reference)}</span></div></td></tr></table></td></tr></table></body></html>`;
  }

  private renderItems(order: EmailOrder, heading = "Your order"): string {
    const rows = order.items
      .map(
        (item) =>
          `<tr><td style="border-bottom:1px solid #e7eef2;padding:14px 0;color:#171b2e;font-size:15px"><strong>${this.escapeHtml(item.name)}</strong><br><span style="color:#5d6678">Qty ${item.quantity}</span></td><td align="right" style="border-bottom:1px solid #e7eef2;padding:14px 0;color:#171b2e;font-size:15px;font-weight:700">${this.escapeHtml(this.formatMoney(item.lineTotalCents, order.currency))}</td></tr>`
      )
      .join("");

    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr><td colspan="2" style="padding-bottom:4px;color:#5d6678;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase">${this.escapeHtml(heading)}</td></tr>${rows}</table>`;
  }

  private renderItemsText(order: EmailOrder, heading = "Your order"): string {
    const lines = order.items.map(
      (item) =>
        `- ${item.name} × ${item.quantity}: ${this.formatMoney(item.lineTotalCents, order.currency)}`
    );

    return [heading, ...lines, ""].join("\n");
  }

  private renderDetailRow(label: string, value: string): string {
    return `<tr><td style="border-bottom:1px solid #e7eef2;padding:12px 0;color:#5d6678;font-size:14px">${this.escapeHtml(label)}</td><td align="right" style="border-bottom:1px solid #e7eef2;padding:12px 0;color:#171b2e;font-size:14px;font-weight:700">${this.escapeHtml(value)}</td></tr>`;
  }

  private createGreeting(order: EmailOrder): string {
    const name = order.customerName?.trim() || order.shippingName?.trim();
    return name ? `Hi ${name}.` : "Hi there.";
  }

  private formatMoney(cents: number, currency: string): string {
    return new Intl.NumberFormat("en-CA", {
      currency: currency.trim().toUpperCase(),
      style: "currency"
    }).format(cents / 100);
  }

  private formatDate(value: Date | null): string {
    if (!value) {
      return "Not set";
    }

    return new Intl.DateTimeFormat("en-CA", {
      dateStyle: "long",
      timeZone: "UTC"
    }).format(value);
  }

  private formatDateTime(value: Date | null): string {
    if (!value) {
      return "Not set";
    }

    return new Intl.DateTimeFormat("en-CA", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "America/Vancouver"
    }).format(value);
  }

  private getMissingRecipientError(kind: OrderEmailKind): string {
    return kind === STAFF_NEW_ORDER_EMAIL_KIND
      ? "Staff order notification email is not configured."
      : "Customer email is unavailable.";
  }

  private async recordFailure(
    delivery: EmailDeliveryWithOrder,
    message: string,
    retryable: boolean
  ): Promise<OrderEmailDeliverySummary> {
    const retryDelaySeconds = Math.min(60 * 2 ** Math.max(delivery.attemptCount - 1, 0), 3600);
    const shouldRetry = retryable && delivery.attemptCount < MAX_AUTOMATIC_ATTEMPTS;
    const failed = await this.getPrisma().orderEmailDelivery.update({
      where: {
        id: delivery.id
      },
      data: {
        lastError: message.slice(0, MAX_ERROR_LENGTH),
        nextAttemptAt: shouldRetry ? new Date(Date.now() + retryDelaySeconds * 1000) : null,
        status: EMAIL_STATUS_FAILED
      }
    });

    return this.serializeDelivery(failed);
  }

  private sanitizeDeliveryError(error: unknown): string {
    if (error instanceof Error && error.name === "TimeoutError") {
      return "Resend request timed out.";
    }

    if (error instanceof Error && /^Resend returned HTTP \d+\.$/.test(error.message)) {
      return error.message;
    }

    if (error instanceof Error && error.message === "Resend returned an invalid response.") {
      return error.message;
    }

    if (
      error instanceof Error &&
      /^(RESEND_API_KEY|ORDER_EMAIL_FROM) is required\.$/.test(error.message)
    ) {
      return "Transactional email is not configured.";
    }

    return "Transactional email request failed.";
  }

  private serializeDelivery(delivery: {
    attemptCount: number;
    kind: string;
    lastError: string | null;
    sentAt: Date | null;
    status: string;
  }): OrderEmailDeliverySummary {
    return {
      attemptCount: delivery.attemptCount,
      kind: delivery.kind as OrderEmailKind,
      lastError: delivery.lastError,
      sentAt: delivery.sentAt?.toISOString() ?? null,
      status: delivery.status as OrderEmailStatus
    };
  }

  private normalizeEmail(value: string | null | undefined): string | null {
    const email = value?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return null;
    }

    return email;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  private escapeHtmlAttribute(value: string): string {
    return this.escapeHtml(value);
  }

  private getPrisma(): PrismaClient {
    if (!this.prisma) {
      const config = createDatabaseConfig(process.env);
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: config.databaseUrl
          }
        }
      });
    }

    return this.prisma;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
  }
}
