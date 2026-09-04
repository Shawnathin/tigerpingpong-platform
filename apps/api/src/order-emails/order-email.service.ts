import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { createDatabaseConfig, Prisma, PrismaClient } from "@tigerpingpong/db";

import { getOrderEmailConfig, getStaffOrderEmailRecipient, type OrderEmailConfig } from "../config";
import {
  renderOrderReceivedEmail,
  renderShipmentEmail,
  renderStaffNewOrderEmail,
  type RenderedOrderEmail
} from "./order-email.templates";

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
    rendered: RenderedOrderEmail,
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

  private renderMessage(delivery: EmailDeliveryWithOrder): RenderedOrderEmail {
    if (delivery.kind === ORDER_RECEIVED_EMAIL_KIND) {
      return renderOrderReceivedEmail(delivery.order);
    }

    if (delivery.kind === STAFF_NEW_ORDER_EMAIL_KIND) {
      return renderStaffNewOrderEmail(delivery.order);
    }

    return renderShipmentEmail(delivery.order);
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
      /^(RESEND_API_KEY|EMAIL_FROM) is required\.$/.test(error.message)
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
