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

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
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
  customerEmail: true,
  customerName: true,
  customerPhone: true,
  stripeCheckoutSessionId: true,
  stripePaymentIntentId: true,
  stripeCustomerId: true,
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
      itemCount: order._count.items,
      stripeCheckoutSessionId: order.stripeCheckoutSessionId,
      stripePaymentIntentId: order.stripePaymentIntentId,
      stripeCustomerId: order.stripeCustomerId,
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
      shippingRule: order.shippingRule,
      checkoutSource: order.checkoutSource,
      stripeCheckoutSessionId: order.stripeCheckoutSessionId,
      stripePaymentIntentId: order.stripePaymentIntentId,
      stripeCustomerId: order.stripeCustomerId,
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

  private getString(record: Record<string, unknown>, key: string): string | null {
    return this.normalizeOptionalString(record[key]);
  }
}
