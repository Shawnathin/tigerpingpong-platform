import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  OnModuleDestroy,
  ServiceUnavailableException
} from "@nestjs/common";
import { createDatabaseConfig, Prisma, PrismaClient } from "@tigerpingpong/db";
import StripeConstructor from "stripe";

import { CheckoutConfig, getCheckoutConfig } from "../config";

const CHECKOUT_SOURCE = "tigerpingpong-web";
const FLAT_SHIPPING_CENTS = 1500;
const FREE_SHIPPING_THRESHOLD_CENTS = 10000;
const MAX_ITEMS = 20;
const MAX_QUANTITY_PER_LINE = 10;
const SHIPPING_RULE = "canada_free_over_100_flat_15";
const STRIPE_CHECKOUT_SOURCE = "stripe_checkout";
const V1_CURRENCY = "cad";

interface CheckoutRequestItem {
  productSlug: string;
  quantity: number;
}

interface ValidatedCheckoutRequest {
  customerEmail?: string;
  items: CheckoutRequestItem[];
}

interface SnapshotLineItem {
  currency: string;
  imageUrl: string | null;
  lineTotalCents: number;
  name: string;
  productId: string;
  productKey: string;
  productSlug: string;
  quantity: number;
  sku: string | null;
  unitPriceCents: number;
  variantId: string | null;
  variantKey: string | null;
}

interface CheckoutTotals {
  shippingCents: number;
  shippingLabel: string;
  subtotalCents: number;
  totalCents: number;
}

interface CheckoutSessionResponse {
  checkoutSessionId: string;
  checkoutUrl: string;
  currency: string;
  orderId: string;
  publicReference: string;
  shippingCents: number;
  shippingLabel: string;
  subtotalCents: number;
  totalCents: number;
}

type CreatedCheckoutOrder = Prisma.OrderGetPayload<{
  include: {
    items: true;
  };
}>;

const checkoutProductSelect = {
  id: true,
  key: true,
  slug: true,
  name: true,
  sku: true,
  productKind: true,
  status: true,
  v1PublicNavigation: true,
  v1CheckoutScope: true,
  purchaseMode: true,
  priceCents: true,
  currency: true,
  family: {
    select: {
      isActive: true,
      isPublic: true
    }
  },
  primaryCategory: {
    select: {
      isActive: true,
      v1PublicNavigation: true,
      v1CheckoutScope: true
    }
  },
  media: {
    where: {
      cloudinarySecureUrl: {
        not: null
      },
      isActive: true,
      isPublic: true
    },
    orderBy: [
      {
        isPrimary: "desc"
      },
      {
        sortOrder: "asc"
      }
    ],
    select: {
      cloudinarySecureUrl: true
    },
    take: 1
  }
} satisfies Prisma.ProductSelect;

type CheckoutProductRecord = Prisma.ProductGetPayload<{
  select: typeof checkoutProductSelect;
}>;

@Injectable()
export class CheckoutService implements OnModuleDestroy {
  private prisma: PrismaClient | null = null;
  private stripe: ReturnType<typeof StripeConstructor> | null = null;
  private stripeSecretKey: string | null = null;

  async onModuleDestroy(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }

  async createCheckoutSession(body: unknown): Promise<CheckoutSessionResponse> {
    const request = this.validateRequest(body);
    const config = this.readCheckoutConfig();
    const prisma = this.getPrisma();
    const products = await this.loadCheckoutProducts(prisma, request.items);
    const snapshotItems = this.createSnapshotItems(request.items, products);
    const totals = this.calculateTotals(snapshotItems);
    const order = await this.createPendingOrder(
      prisma,
      snapshotItems,
      totals,
      request.customerEmail
    );

    try {
      const session = await this.createStripeSession(config, order);

      if (!session.url) {
        await this.markOrderCheckoutFailed(order.id);
        throw new InternalServerErrorException({
          message: "Checkout could not be started. Please try again."
        });
      }

      await prisma.order.update({
        where: {
          id: order.id
        },
        data: {
          stripeCheckoutSessionId: session.id
        }
      });

      return {
        orderId: order.id,
        publicReference: order.publicReference,
        checkoutSessionId: session.id,
        checkoutUrl: session.url,
        currency: V1_CURRENCY,
        subtotalCents: order.subtotalCents,
        shippingCents: order.shippingCents,
        totalCents: order.totalCents,
        shippingLabel: totals.shippingLabel
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      await this.markOrderCheckoutFailed(order.id);
      throw new ServiceUnavailableException({
        message: "Checkout could not be started. Please try again."
      });
    }
  }

  private validateRequest(body: unknown): ValidatedCheckoutRequest {
    if (!this.isRecord(body)) {
      throw new BadRequestException({
        message: "Request body is required."
      });
    }

    if (!Array.isArray(body.items)) {
      throw new BadRequestException({
        message: "items must be an array."
      });
    }

    if (body.items.length === 0) {
      throw new BadRequestException({
        message: "items must include at least one product."
      });
    }

    if (body.items.length > MAX_ITEMS) {
      throw new BadRequestException({
        message: `items cannot include more than ${MAX_ITEMS} products.`
      });
    }

    const seenSlugs = new Set<string>();
    const items: CheckoutRequestItem[] = body.items.map((item, index) => {
      if (!this.isRecord(item)) {
        throw new BadRequestException({
          message: `items[${index}] must be an object.`
        });
      }

      if (typeof item.productSlug !== "string") {
        throw new BadRequestException({
          message: `items[${index}].productSlug is required.`
        });
      }

      const productSlug = item.productSlug.trim().toLowerCase();

      if (!this.isValidSlug(productSlug)) {
        throw new BadRequestException({
          message: `items[${index}].productSlug is invalid.`
        });
      }

      if (seenSlugs.has(productSlug)) {
        throw new BadRequestException({
          message: "Duplicate product slugs are not supported for V1 checkout."
        });
      }

      seenSlugs.add(productSlug);

      const quantity = item.quantity;

      if (typeof quantity !== "number" || !Number.isInteger(quantity)) {
        throw new BadRequestException({
          message: `items[${index}].quantity must be an integer.`
        });
      }

      if (quantity < 1) {
        throw new BadRequestException({
          message: `items[${index}].quantity must be at least 1.`
        });
      }

      if (quantity > MAX_QUANTITY_PER_LINE) {
        throw new BadRequestException({
          message: `items[${index}].quantity cannot be greater than ${MAX_QUANTITY_PER_LINE}.`
        });
      }

      return {
        productSlug,
        quantity
      };
    });

    return {
      customerEmail: this.validateCustomerEmail(body.customerEmail),
      items
    };
  }

  private validateCustomerEmail(value: unknown): string | undefined {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    if (typeof value !== "string") {
      throw new BadRequestException({
        message: "customerEmail must be a string."
      });
    }

    const email = value.trim();

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException({
        message: "customerEmail is invalid."
      });
    }

    return email;
  }

  private async loadCheckoutProducts(
    prisma: PrismaClient,
    items: CheckoutRequestItem[]
  ): Promise<Map<string, CheckoutProductRecord>> {
    try {
      const products = await prisma.product.findMany({
        where: {
          slug: {
            in: items.map((item) => item.productSlug)
          }
        },
        select: checkoutProductSelect
      });

      return new Map(products.map((product) => [product.slug, product]));
    } catch {
      throw new ServiceUnavailableException({
        message: "Checkout catalog is unavailable."
      });
    }
  }

  private createSnapshotItems(
    requestItems: CheckoutRequestItem[],
    productsBySlug: Map<string, CheckoutProductRecord>
  ): SnapshotLineItem[] {
    return requestItems.map((item) => {
      const product = productsBySlug.get(item.productSlug);

      if (!product || !this.isProductCheckoutable(product)) {
        throw new BadRequestException({
          message: "One or more requested items are unavailable for checkout."
        });
      }

      const unitPriceCents = product.priceCents;

      if (
        typeof unitPriceCents !== "number" ||
        !Number.isInteger(unitPriceCents) ||
        unitPriceCents <= 0
      ) {
        throw new BadRequestException({
          message: "One or more requested items are unavailable for checkout."
        });
      }

      const lineTotalCents = unitPriceCents * item.quantity;

      return {
        productId: product.id,
        variantId: null,
        productKey: product.key,
        productSlug: product.slug,
        variantKey: null,
        sku: product.sku,
        name: product.name,
        imageUrl: this.getProductImageUrl(product),
        unitPriceCents,
        quantity: item.quantity,
        lineTotalCents,
        currency: "CAD"
      };
    });
  }

  private isProductCheckoutable(product: CheckoutProductRecord): boolean {
    const currency = product.currency.trim().toLowerCase();

    return (
      product.status === "active" &&
      product.v1PublicNavigation &&
      product.v1CheckoutScope &&
      product.productKind !== "replacement_part" &&
      (product.purchaseMode === "online_checkout" ||
        product.purchaseMode === "online_checkout_candidate") &&
      product.family.isActive &&
      product.family.isPublic &&
      product.primaryCategory.isActive &&
      product.primaryCategory.v1PublicNavigation &&
      product.primaryCategory.v1CheckoutScope &&
      currency === V1_CURRENCY
    );
  }

  private getProductImageUrl(product: CheckoutProductRecord): string | null {
    const imageUrl = product.media[0]?.cloudinarySecureUrl;

    if (!imageUrl || !this.isSafePublicUrl(imageUrl)) {
      return null;
    }

    return imageUrl;
  }

  private calculateTotals(items: SnapshotLineItem[]): CheckoutTotals {
    const subtotalCents = items.reduce((subtotal, item) => subtotal + item.lineTotalCents, 0);
    const shippingCents = subtotalCents > FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;

    return {
      subtotalCents,
      shippingCents,
      totalCents: subtotalCents + shippingCents,
      shippingLabel:
        shippingCents === 0 ? "Standard shipping \u2014 Free" : "Standard shipping \u2014 $15"
    };
  }

  private async createPendingOrder(
    prisma: PrismaClient,
    items: SnapshotLineItem[],
    totals: CheckoutTotals,
    customerEmail: string | undefined
  ): Promise<CreatedCheckoutOrder> {
    try {
      return await prisma.$transaction((transaction) =>
        transaction.order.create({
          data: {
            status: "checkout_pending",
            currency: "CAD",
            subtotalCents: totals.subtotalCents,
            shippingCents: totals.shippingCents,
            totalCents: totals.totalCents,
            shippingRule: SHIPPING_RULE,
            checkoutSource: STRIPE_CHECKOUT_SOURCE,
            customerEmail,
            items: {
              create: items.map((item) => ({
                product: {
                  connect: {
                    id: item.productId
                  }
                },
                productKey: item.productKey,
                productSlug: item.productSlug,
                variantKey: item.variantKey,
                sku: item.sku,
                name: item.name,
                imageUrl: item.imageUrl,
                unitPriceCents: item.unitPriceCents,
                quantity: item.quantity,
                lineTotalCents: item.lineTotalCents,
                currency: item.currency
              }))
            }
          },
          include: {
            items: true
          }
        })
      );
    } catch {
      throw new ServiceUnavailableException({
        message: "Checkout order could not be created."
      });
    }
  }

  private async createStripeSession(config: CheckoutConfig, order: CreatedCheckoutOrder) {
    const stripe = this.getStripe(config.stripeSecretKey);
    const metadata = this.createOrderMetadata(config, order);

    return stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: order.items.map((item) => this.createStripeLineItem(item)),
        shipping_address_collection: {
          allowed_countries: ["CA"]
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: {
                amount: order.shippingCents,
                currency: V1_CURRENCY
              },
              display_name:
                order.shippingCents === 0
                  ? "Standard shipping \u2014 Free"
                  : "Standard shipping \u2014 $15"
            }
          }
        ],
        success_url: config.successUrl,
        cancel_url: config.cancelUrl,
        client_reference_id: order.id,
        metadata,
        payment_intent_data: {
          metadata: {
            orderId: order.id,
            publicReference: order.publicReference,
            source: CHECKOUT_SOURCE,
            environment: config.appEnv
          }
        },
        customer_email: order.customerEmail ?? undefined
      },
      {
        idempotencyKey: `checkout_session_create:${order.id}`
      }
    );
  }

  private createStripeLineItem(item: CreatedCheckoutOrder["items"][number]) {
    const productData: { images?: string[]; name: string } = {
      name: item.name
    };

    if (item.imageUrl) {
      productData.images = [item.imageUrl];
    }

    return {
      price_data: {
        currency: V1_CURRENCY,
        unit_amount: item.unitPriceCents,
        product_data: productData
      },
      quantity: item.quantity
    };
  }

  private createOrderMetadata(
    config: CheckoutConfig,
    order: CreatedCheckoutOrder
  ): Record<string, string> {
    return {
      orderId: order.id,
      publicReference: order.publicReference,
      source: CHECKOUT_SOURCE,
      environment: config.appEnv,
      shippingRuleVersion: "v1",
      subtotalCents: String(order.subtotalCents),
      shippingCents: String(order.shippingCents),
      totalCents: String(order.totalCents)
    };
  }

  private async markOrderCheckoutFailed(orderId: string): Promise<void> {
    try {
      await this.getPrisma().order.update({
        where: {
          id: orderId
        },
        data: {
          status: "checkout_failed"
        }
      });
    } catch {
      // Keep the public response safe even if the failure marker cannot be written.
    }
  }

  private readCheckoutConfig(): CheckoutConfig {
    try {
      const config = getCheckoutConfig();

      this.assertHttpUrl(config.successUrl, "CHECKOUT_SUCCESS_URL");
      this.assertHttpUrl(config.cancelUrl, "CHECKOUT_CANCEL_URL");

      return config;
    } catch {
      throw new ServiceUnavailableException({
        message: "Checkout is not configured."
      });
    }
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
          message: "Checkout database is not configured."
        });
      }
    }

    return this.prisma;
  }

  private getStripe(secretKey: string): ReturnType<typeof StripeConstructor> {
    if (!this.stripe || this.stripeSecretKey !== secretKey) {
      this.stripe = new StripeConstructor(secretKey, {
        appInfo: {
          name: "Tiger Ping Pong Checkout",
          version: "1.0.0"
        }
      });
      this.stripeSecretKey = secretKey;
    }

    return this.stripe;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private isValidSlug(value: string): boolean {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  }

  private isSafePublicUrl(value: string): boolean {
    try {
      const url = new URL(value);

      return url.protocol === "https:";
    } catch {
      return false;
    }
  }

  private assertHttpUrl(value: string, name: string): void {
    try {
      const url = new URL(value);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error(`${name} must be an HTTP URL.`);
      }
    } catch {
      throw new Error(`${name} must be an HTTP URL.`);
    }
  }
}
