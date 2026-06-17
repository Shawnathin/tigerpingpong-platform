import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  ServiceUnavailableException,
  UnauthorizedException
} from "@nestjs/common";
import { createDatabaseConfig, Prisma, PrismaClient } from "@tigerpingpong/db";
import { timingSafeEqual } from "crypto";

import { getInternalOrdersApiConfig } from "../config";

type InternalOrderStatus =
  | "canceled"
  | "checkout_failed"
  | "checkout_pending"
  | "expired"
  | "paid"
  | "refunded";

interface InternalOrdersQuery {
  limit?: string;
  status?: string;
}

interface ShippingAddress {
  city?: string;
  country?: string;
  line1?: string;
  line2?: string;
  postalCode?: string;
  state?: string;
}

interface InternalOrderShipmentInput {
  carrier?: unknown;
  internalNote?: unknown;
  shippedDate?: unknown;
  trackingNumber?: unknown;
  trackingUrl?: unknown;
}

interface NormalizedInternalOrderShipmentInput {
  carrier: string;
  internalNote: string;
  shippedAt: Date;
  trackingNumber: string;
  trackingUrl: string;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_SHIPMENT_TEXT_LENGTH = 500;
const MAX_SHIPMENT_NOTE_LENGTH = 2000;
const MAX_NOTIFICATION_ERROR_LENGTH = 2000;
const SHIPMENT_NOTIFICATION_FAILED = "failed";
const SHIPMENT_NOTIFICATION_SENT = "sent";
const SHIPMENT_NOTIFICATION_SENDING = "sending";
const SUPPORT_EMAIL = "info@tigerpingpong.com";
const INTERNAL_ORDER_STATUSES: readonly InternalOrderStatus[] = [
  "checkout_pending",
  "checkout_failed",
  "paid",
  "canceled",
  "expired",
  "refunded"
];

const internalOrderListSelect = {
  publicReference: true,
  status: true,
  currency: true,
  subtotalCents: true,
  shippingCents: true,
  totalCents: true,
  taxAmountCents: true,
  customerEmail: true,
  customerName: true,
  customerPhone: true,
  stripeCheckoutSessionId: true,
  stripePaymentIntentId: true,
  stripeCustomerId: true,
  stripeAmountTotalCents: true,
  stripeAmountTaxCents: true,
  stripeAutomaticTaxStatus: true,
  paidAt: true,
  createdAt: true,
  _count: {
    select: {
      items: true
    }
  }
} satisfies Prisma.OrderSelect;

const internalOrderDetailSelect = {
  publicReference: true,
  status: true,
  currency: true,
  subtotalCents: true,
  shippingCents: true,
  totalCents: true,
  taxAmountCents: true,
  shippingRule: true,
  checkoutSource: true,
  customerEmail: true,
  customerName: true,
  customerPhone: true,
  shippingName: true,
  shippingPhone: true,
  shippingAddressJson: true,
  stripeCheckoutSessionId: true,
  stripePaymentIntentId: true,
  stripeCustomerId: true,
  stripeAmountTotalCents: true,
  stripeAmountTaxCents: true,
  stripeAutomaticTaxStatus: true,
  shipmentCarrier: true,
  shipmentTrackingNumber: true,
  shipmentTrackingUrl: true,
  shipmentShippedAt: true,
  shipmentInternalNote: true,
  shipmentNotificationSentAt: true,
  shipmentNotificationStatus: true,
  shipmentNotificationLastError: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
  items: {
    orderBy: {
      createdAt: "asc"
    },
    select: {
      productKey: true,
      productSlug: true,
      variantKey: true,
      sku: true,
      name: true,
      unitPriceCents: true,
      quantity: true,
      lineTotalCents: true,
      currency: true,
      createdAt: true
    }
  }
} satisfies Prisma.OrderSelect;

type InternalOrderListRecord = Prisma.OrderGetPayload<{
  select: typeof internalOrderListSelect;
}>;

type InternalOrderDetailRecord = Prisma.OrderGetPayload<{
  select: typeof internalOrderDetailSelect;
}>;

@Injectable()
export class InternalOrdersService implements OnModuleDestroy {
  private prisma: PrismaClient | null = null;

  async onModuleDestroy(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }

  async listOrders(
    requestToken: string | string[] | undefined,
    query: InternalOrdersQuery
  ): Promise<unknown> {
    this.assertAuthorized(requestToken);

    const status = this.parseStatus(query.status);
    const limit = this.parseLimit(query.limit);

    try {
      const orders = await this.getPrisma().order.findMany({
        where: {
          status
        },
        orderBy: [
          {
            paidAt: {
              sort: "desc",
              nulls: "last"
            }
          },
          {
            createdAt: "desc"
          }
        ],
        select: internalOrderListSelect,
        take: limit
      });

      return {
        orders: orders.map((order) => this.serializeListOrder(order)),
        status,
        limit
      };
    } catch {
      throw new ServiceUnavailableException({
        message: "Internal orders are unavailable."
      });
    }
  }

  async getOrder(
    requestToken: string | string[] | undefined,
    publicReferenceParam: string
  ): Promise<unknown> {
    this.assertAuthorized(requestToken);
    const publicReference = this.parsePublicReference(publicReferenceParam);

    let order: InternalOrderDetailRecord | null;

    try {
      order = await this.getPrisma().order.findUnique({
        where: {
          publicReference
        },
        select: internalOrderDetailSelect
      });
    } catch {
      throw new ServiceUnavailableException({
        message: "Internal order is unavailable."
      });
    }

    if (!order) {
      throw new NotFoundException({
        message: "Internal order was not found."
      });
    }

    return {
      order: this.serializeDetailOrder(order)
    };
  }

  async updateShipment(
    requestToken: string | string[] | undefined,
    publicReferenceParam: string,
    input: InternalOrderShipmentInput
  ): Promise<unknown> {
    this.assertAuthorized(requestToken);
    const publicReference = this.parsePublicReference(publicReferenceParam);
    const shipment = this.normalizeShipmentInput(input);

    let order: InternalOrderDetailRecord | null;

    try {
      order = await this.getPrisma().order.update({
        where: {
          publicReference
        },
        data: {
          shipmentCarrier: shipment.carrier,
          shipmentTrackingNumber: shipment.trackingNumber,
          shipmentTrackingUrl: shipment.trackingUrl,
          shipmentShippedAt: shipment.shippedAt,
          shipmentInternalNote: shipment.internalNote
        },
        select: internalOrderDetailSelect
      });
    } catch (error) {
      if (this.isPrismaRecordNotFound(error)) {
        throw new NotFoundException({
          message: "Internal order was not found."
        });
      }

      throw new ServiceUnavailableException({
        message: "Internal order shipment could not be saved."
      });
    }

    return {
      order: this.serializeDetailOrder(order)
    };
  }

  async sendShipmentEmail(
    requestToken: string | string[] | undefined,
    publicReferenceParam: string
  ): Promise<unknown> {
    this.assertAuthorized(requestToken);
    const publicReference = this.parsePublicReference(publicReferenceParam);
    const config = getInternalOrdersApiConfig();

    if (!config.shipmentEmailWebhookUrl) {
      throw new ServiceUnavailableException({
        message: "Shipment email webhook is not configured."
      });
    }

    let order: InternalOrderDetailRecord | null;

    try {
      order = await this.getPrisma().order.findUnique({
        where: {
          publicReference
        },
        select: internalOrderDetailSelect
      });
    } catch {
      throw new ServiceUnavailableException({
        message: "Internal order is unavailable."
      });
    }

    if (!order) {
      throw new NotFoundException({
        message: "Internal order was not found."
      });
    }

    this.assertShipmentNotificationReady(order);

    try {
      const reserved = await this.getPrisma().order.updateMany({
        where: {
          publicReference,
          shipmentNotificationSentAt: null,
          OR: [
            {
              shipmentNotificationStatus: null
            },
            {
              shipmentNotificationStatus: {
                not: SHIPMENT_NOTIFICATION_SENDING
              }
            }
          ]
        },
        data: {
          shipmentNotificationStatus: SHIPMENT_NOTIFICATION_SENDING,
          shipmentNotificationLastError: null
        }
      });

      if (reserved.count !== 1) {
        throw new BadRequestException({
          message: "Shipment email is already being sent or was already sent."
        });
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new ServiceUnavailableException({
        message: "Shipment email send could not be prepared."
      });
    }

    const sentAt = new Date();
    const payload = this.createShipmentEmailPayload(order, sentAt);

    try {
      await this.postShipmentEmailWebhook(config.shipmentEmailWebhookUrl, payload);
    } catch (error) {
      const message = this.sanitizeWebhookError(error);

      await this.recordShipmentNotificationFailure(publicReference, message);

      throw new ServiceUnavailableException({
        message: "Shipment email webhook failed. Make was not able to accept the handoff."
      });
    }

    let updatedOrder: InternalOrderDetailRecord | null;

    try {
      updatedOrder = await this.getPrisma().order.update({
        where: {
          publicReference
        },
        data: {
          shipmentNotificationSentAt: sentAt,
          shipmentNotificationStatus: SHIPMENT_NOTIFICATION_SENT,
          shipmentNotificationLastError: null
        },
        select: internalOrderDetailSelect
      });
    } catch {
      throw new ServiceUnavailableException({
        message: "Shipment email was handed off, but notification tracking could not be saved."
      });
    }

    return {
      order: this.serializeDetailOrder(updatedOrder)
    };
  }

  private assertAuthorized(requestTokenValue: string | string[] | undefined): void {
    const requestToken = this.normalizeHeaderValue(requestTokenValue);

    try {
      const config = getInternalOrdersApiConfig();

      if (requestToken && this.isSameToken(config.apiToken, requestToken)) {
        return;
      }
    } catch {
      // Missing server-side token fails closed with the same response as a bad token.
    }

    throw new UnauthorizedException({
      message: "Unauthorized."
    });
  }

  private parseStatus(value: string | undefined): InternalOrderStatus {
    const normalized = value?.trim() || "paid";

    if (this.isInternalOrderStatus(normalized)) {
      return normalized;
    }

    throw new BadRequestException({
      message: "status is invalid."
    });
  }

  private parseLimit(value: string | undefined): number {
    if (!value?.trim()) {
      return DEFAULT_LIMIT;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException({
        message: "limit must be a positive integer."
      });
    }

    return Math.min(parsed, MAX_LIMIT);
  }

  private parsePublicReference(value: string): string {
    const publicReference = value.trim();

    if (!/^[A-Za-z0-9_-]{3,128}$/.test(publicReference)) {
      throw new NotFoundException({
        message: "Internal order was not found."
      });
    }

    return publicReference;
  }

  private normalizeShipmentInput(
    input: InternalOrderShipmentInput
  ): NormalizedInternalOrderShipmentInput {
    if (!this.isRecord(input)) {
      throw new BadRequestException({
        message: "Shipment input is required."
      });
    }

    return {
      carrier: this.readRequiredShipmentString(input, "carrier", "carrier"),
      trackingNumber: this.readRequiredShipmentString(
        input,
        "trackingNumber",
        "tracking number"
      ),
      trackingUrl: this.normalizeShipmentTrackingUrl(input.trackingUrl),
      shippedAt: this.normalizeShipmentDate(input.shippedDate),
      internalNote: this.readRequiredShipmentString(input, "internalNote", "internal note", {
        maxLength: MAX_SHIPMENT_NOTE_LENGTH
      })
    };
  }

  private readRequiredShipmentString(
    input: Record<string, unknown>,
    key: string,
    label: string,
    options: { maxLength?: number } = {}
  ): string {
    const value = this.normalizeOptionalString(input[key]);
    const maxLength = options.maxLength ?? MAX_SHIPMENT_TEXT_LENGTH;

    if (!value) {
      throw new BadRequestException({
        message: `${label} is required.`
      });
    }

    if (value.length > maxLength) {
      throw new BadRequestException({
        message: `${label} is too long.`
      });
    }

    return value;
  }

  private normalizeShipmentTrackingUrl(value: unknown): string {
    const trackingUrl = this.readRequiredShipmentString(
      { trackingUrl: value },
      "trackingUrl",
      "tracking URL",
      {
        maxLength: 1000
      }
    );

    let url: URL;

    try {
      url = new URL(trackingUrl);
    } catch {
      throw new BadRequestException({
        message: "tracking URL must be a valid URL."
      });
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new BadRequestException({
        message: "tracking URL must use http or https."
      });
    }

    return trackingUrl;
  }

  private normalizeShipmentDate(value: unknown): Date {
    const shippedDate = this.readRequiredShipmentString(
      { shippedDate: value },
      "shippedDate",
      "shipped date"
    );

    if (!/^\d{4}-\d{2}-\d{2}$/.test(shippedDate)) {
      throw new BadRequestException({
        message: "shipped date must use YYYY-MM-DD."
      });
    }

    const date = new Date(`${shippedDate}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== shippedDate) {
      throw new BadRequestException({
        message: "shipped date is invalid."
      });
    }

    return date;
  }

  private assertShipmentNotificationReady(order: InternalOrderDetailRecord): void {
    if (order.shipmentNotificationSentAt) {
      throw new BadRequestException({
        message: "Shipment email was already sent for this order."
      });
    }

    if (order.shipmentNotificationStatus === SHIPMENT_NOTIFICATION_SENDING) {
      throw new BadRequestException({
        message: "Shipment email is already being sent for this order."
      });
    }

    if (!this.normalizeOptionalString(order.customerEmail)) {
      throw new BadRequestException({
        message: "Customer email is required before sending a shipment email."
      });
    }

    if (!this.normalizeOptionalString(order.shipmentCarrier)) {
      throw new BadRequestException({
        message: "Carrier is required before sending a shipment email."
      });
    }

    if (
      !this.normalizeOptionalString(order.shipmentTrackingNumber) &&
      !this.normalizeOptionalString(order.shipmentTrackingUrl)
    ) {
      throw new BadRequestException({
        message: "Tracking number or tracking URL is required before sending a shipment email."
      });
    }
  }

  private createShipmentEmailPayload(order: InternalOrderDetailRecord, sentAt: Date) {
    return {
      event: "shipment_ready",
      orderReference: order.publicReference,
      customerName: order.customerName ?? order.shippingName ?? "",
      customerEmail: order.customerEmail ?? "",
      carrier: order.shipmentCarrier ?? "",
      trackingNumber: order.shipmentTrackingNumber ?? "",
      trackingUrl: order.shipmentTrackingUrl ?? "",
      shippedDate: this.serializeDate(order.shipmentShippedAt),
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        selectedOption: item.variantKey ?? ""
      })),
      supportEmail: SUPPORT_EMAIL,
      sentAt: sentAt.toISOString()
    };
  }

  private async postShipmentEmailWebhook(
    webhookUrl: string,
    payload: ReturnType<InternalOrdersService["createShipmentEmailPayload"]>
  ): Promise<void> {
    const response = await fetch(webhookUrl, {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`Make webhook returned HTTP ${response.status}.`);
    }
  }

  private async recordShipmentNotificationFailure(
    publicReference: string,
    message: string
  ): Promise<void> {
    try {
      await this.getPrisma().order.update({
        where: {
          publicReference
        },
        data: {
          shipmentNotificationStatus: SHIPMENT_NOTIFICATION_FAILED,
          shipmentNotificationLastError: message.slice(0, MAX_NOTIFICATION_ERROR_LENGTH)
        }
      });
    } catch {
      // Keep the outward response focused on the webhook failure.
    }
  }

  private sanitizeWebhookError(error: unknown): string {
    if (error instanceof Error && error.name === "TimeoutError") {
      return "Shipment email webhook timed out.";
    }

    if (error instanceof Error && /^Make webhook returned HTTP \d+\.$/.test(error.message)) {
      return error.message;
    }

    return "Shipment email webhook request failed.";
  }

  private serializeListOrder(order: InternalOrderListRecord) {
    return {
      publicReference: order.publicReference,
      status: order.status,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      currency: this.normalizeCurrency(order.currency),
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      totalCents: order.totalCents,
      taxAmountCents: order.taxAmountCents,
      itemCount: order._count.items,
      stripeCheckoutSessionId: order.stripeCheckoutSessionId,
      stripePaymentIntentId: order.stripePaymentIntentId,
      stripeCustomerId: order.stripeCustomerId,
      stripeAmountTotalCents: order.stripeAmountTotalCents,
      stripeAmountTaxCents: order.stripeAmountTaxCents,
      stripeAutomaticTaxStatus: order.stripeAutomaticTaxStatus,
      paidAt: this.serializeDate(order.paidAt),
      createdAt: this.serializeDate(order.createdAt)
    };
  }

  private serializeDetailOrder(order: InternalOrderDetailRecord) {
    return {
      publicReference: order.publicReference,
      status: order.status,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingName: order.shippingName,
      shippingPhone: order.shippingPhone,
      shippingAddress: this.serializeShippingAddress(order.shippingAddressJson),
      currency: this.normalizeCurrency(order.currency),
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      totalCents: order.totalCents,
      taxAmountCents: order.taxAmountCents,
      shippingRule: order.shippingRule,
      checkoutSource: order.checkoutSource,
      stripeCheckoutSessionId: order.stripeCheckoutSessionId,
      stripePaymentIntentId: order.stripePaymentIntentId,
      stripeCustomerId: order.stripeCustomerId,
      stripeAmountTotalCents: order.stripeAmountTotalCents,
      stripeAmountTaxCents: order.stripeAmountTaxCents,
      stripeAutomaticTaxStatus: order.stripeAutomaticTaxStatus,
      shipment: {
        carrier: order.shipmentCarrier,
        trackingNumber: order.shipmentTrackingNumber,
        trackingUrl: order.shipmentTrackingUrl,
        shippedAt: this.serializeDate(order.shipmentShippedAt),
        internalNote: order.shipmentInternalNote
      },
      shipmentNotification: {
        sentAt: this.serializeDate(order.shipmentNotificationSentAt),
        status: order.shipmentNotificationStatus,
        lastError: order.shipmentNotificationLastError
      },
      paidAt: this.serializeDate(order.paidAt),
      createdAt: this.serializeDate(order.createdAt),
      updatedAt: this.serializeDate(order.updatedAt),
      items: order.items.map((item) => ({
        productKey: item.productKey,
        productSlug: item.productSlug,
        variantKey: item.variantKey,
        sku: item.sku,
        name: item.name,
        currency: this.normalizeCurrency(item.currency),
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
        lineTotalCents: item.lineTotalCents,
        createdAt: this.serializeDate(item.createdAt)
      }))
    };
  }

  private serializeShippingAddress(value: Prisma.JsonValue | null): ShippingAddress | null {
    if (!this.isRecord(value)) {
      return null;
    }

    const address: ShippingAddress = {};
    const line1 = this.getString(value, "line1");
    const line2 = this.getString(value, "line2");
    const city = this.getString(value, "city");
    const state = this.getString(value, "state");
    const postalCode = this.getString(value, "postal_code");
    const country = this.getString(value, "country");

    if (line1) {
      address.line1 = line1;
    }

    if (line2) {
      address.line2 = line2;
    }

    if (city) {
      address.city = city;
    }

    if (state) {
      address.state = state;
    }

    if (postalCode) {
      address.postalCode = postalCode;
    }

    if (country) {
      address.country = country;
    }

    return Object.keys(address).length > 0 ? address : null;
  }

  private getPrisma(): PrismaClient {
    if (!this.prisma) {
      try {
        const config = createDatabaseConfig(process.env);

        this.prisma = new PrismaClient({
          datasources: {
            db: {
              url: config.databaseUrl
            }
          }
        });
      } catch {
        throw new ServiceUnavailableException({
          message: "Internal orders database is not configured."
        });
      }
    }

    return this.prisma;
  }

  private isInternalOrderStatus(value: string): value is InternalOrderStatus {
    return INTERNAL_ORDER_STATUSES.includes(value as InternalOrderStatus);
  }

  private normalizeHeaderValue(value: string | string[] | undefined): string | null {
    if (Array.isArray(value)) {
      if (value.length !== 1) {
        return null;
      }

      return this.normalizeOptionalString(value[0]);
    }

    return this.normalizeOptionalString(value);
  }

  private normalizeOptionalString(value: unknown): string | null {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();

    return normalized || null;
  }

  private normalizeCurrency(value: string): string {
    return value.trim().toUpperCase();
  }

  private serializeDate(value: Date | null): string | null {
    return value?.toISOString() ?? null;
  }

  private isSameToken(expectedToken: string, requestToken: string): boolean {
    const expected = Buffer.from(expectedToken);
    const actual = Buffer.from(requestToken);

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private isPrismaRecordNotFound(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
  }

  private getString(record: Record<string, unknown>, key: string): string | null {
    return this.normalizeOptionalString(record[key]);
  }
}
