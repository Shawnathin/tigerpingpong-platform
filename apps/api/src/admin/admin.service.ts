import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  ServiceUnavailableException
} from "@nestjs/common";
import { createDatabaseConfig, Prisma, PrismaClient } from "@tigerpingpong/db";

type AdminOrderStatus =
  | "canceled"
  | "checkout_failed"
  | "checkout_pending"
  | "expired"
  | "paid"
  | "refunded";

interface AdminListQuery {
  limit?: string;
  status?: string;
}

interface CustomerSummary {
  currency: string;
  customerName: string | null;
  customerPhone: string | null;
  email: string;
  lastOrderDate: string | null;
  orderCount: number;
  paidOrderCount: number;
  totalSpentCents: number;
}

interface ShippingAddress {
  city?: string;
  country?: string;
  line1?: string;
  line2?: string;
  postalCode?: string;
  state?: string;
}

const ADMIN_ORDER_STATUSES: readonly AdminOrderStatus[] = [
  "checkout_pending",
  "checkout_failed",
  "paid",
  "canceled",
  "expired",
  "refunded"
];
const CHECKOUT_PURCHASE_MODES = new Set(["online_checkout", "online_checkout_candidate"]);
const DEFAULT_LIMIT = 50;
const FLAT_SHIPPING_CENTS = 1500;
const FREE_SHIPPING_THRESHOLD_CENTS = 10000;
const MAX_LIMIT = 100;
const SUPPORT_EMAIL = "info@tigerpingpong.com";
const SUPPORT_PHONE = "1-888-552-5259";

const adminProductListSelect = {
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
  shippingReviewRequired: true,
  family: {
    select: {
      id: true,
      key: true,
      name: true,
      slug: true,
      isActive: true,
      isPublic: true,
      brand: {
        select: {
          key: true,
          name: true,
          slug: true
        }
      }
    }
  },
  primaryCategory: {
    select: {
      id: true,
      key: true,
      name: true,
      slug: true,
      isActive: true,
      v1CheckoutScope: true,
      v1PublicNavigation: true
    }
  },
  media: {
    orderBy: [
      {
        isPrimary: "desc"
      },
      {
        sortOrder: "asc"
      }
    ],
    select: {
      mediaKey: true,
      role: true,
      cloudinarySecureUrl: true,
      sourceUrl: true,
      isPrimary: true,
      isPublic: true,
      isActive: true,
      reviewStatus: true
    },
    take: 3
  },
  _count: {
    select: {
      media: true,
      variants: true
    }
  }
} satisfies Prisma.ProductSelect;

const adminProductDetailSelect = {
  ...adminProductListSelect,
  sourceUrl: true,
  legacyPath: true,
  shortDescription: true,
  description: true,
  sourceReviewStatus: true,
  importReviewStatus: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  variants: {
    orderBy: {
      createdAt: "asc"
    },
    select: {
      id: true,
      key: true,
      sku: true,
      name: true,
      priceCents: true,
      currency: true,
      purchaseModeOverride: true,
      isActive: true,
      sourceUrl: true,
      optionValues: {
        select: {
          productOptionValue: {
            select: {
              value: true,
              label: true,
              option: {
                select: {
                  name: true,
                  displayName: true
                }
              }
            }
          }
        }
      }
    }
  }
} satisfies Prisma.ProductSelect;

const adminOrderListSelect = {
  id: true,
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
  updatedAt: true,
  _count: {
    select: {
      items: true
    }
  }
} satisfies Prisma.OrderSelect;

const adminOrderDetailSelect = {
  id: true,
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
      id: true,
      productKey: true,
      productSlug: true,
      variantKey: true,
      sku: true,
      name: true,
      imageUrl: true,
      unitPriceCents: true,
      quantity: true,
      lineTotalCents: true,
      currency: true,
      createdAt: true,
      product: {
        select: {
          id: true,
          slug: true,
          name: true
        }
      },
      variant: {
        select: {
          id: true,
          key: true,
          sku: true,
          name: true
        }
      }
    }
  }
} satisfies Prisma.OrderSelect;

const adminCustomerOrderSelect = {
  publicReference: true,
  status: true,
  customerEmail: true,
  customerName: true,
  customerPhone: true,
  currency: true,
  totalCents: true,
  paidAt: true,
  createdAt: true
} satisfies Prisma.OrderSelect;

type AdminProductListRecord = Prisma.ProductGetPayload<{
  select: typeof adminProductListSelect;
}>;

type AdminProductDetailRecord = Prisma.ProductGetPayload<{
  select: typeof adminProductDetailSelect;
}>;

type AdminOrderListRecord = Prisma.OrderGetPayload<{
  select: typeof adminOrderListSelect;
}>;

type AdminOrderDetailRecord = Prisma.OrderGetPayload<{
  select: typeof adminOrderDetailSelect;
}>;

type AdminCustomerOrderRecord = Prisma.OrderGetPayload<{
  select: typeof adminCustomerOrderSelect;
}>;

@Injectable()
export class AdminService implements OnModuleDestroy {
  private prisma: PrismaClient | null = null;

  async onModuleDestroy(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }

  async getDashboardSummary(): Promise<unknown> {
    try {
      const prisma = this.getPrisma();
      const [
        paidOrdersCount,
        pendingCheckoutOrdersCount,
        failedCheckoutOrdersCount,
        recentOrders,
        totalProductsCount,
        activeProductsCount,
        checkoutScopeProductsCount,
        missingCheckoutPriceCount,
        missingPublicImageCount,
        variantsCount,
        totalWebhookEventsCount,
        unprocessedWebhookEventsCount,
        latestProcessedWebhookEvent,
        recentWebhookEvents
      ] = await Promise.all([
        prisma.order.count({
          where: {
            status: "paid"
          }
        }),
        prisma.order.count({
          where: {
            status: "checkout_pending"
          }
        }),
        prisma.order.count({
          where: {
            status: "checkout_failed"
          }
        }),
        prisma.order.findMany({
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
          select: adminOrderListSelect,
          take: 5
        }),
        prisma.product.count(),
        prisma.product.count({
          where: {
            status: "active"
          }
        }),
        prisma.product.count({
          where: {
            v1CheckoutScope: true
          }
        }),
        prisma.product.count({
          where: {
            status: "active",
            v1CheckoutScope: true,
            purchaseMode: {
              in: ["online_checkout", "online_checkout_candidate"]
            },
            OR: [
              {
                priceCents: null
              },
              {
                priceCents: {
                  lte: 0
                }
              }
            ]
          }
        }),
        prisma.product.count({
          where: {
            status: "active",
            v1CheckoutScope: true,
            media: {
              none: {
                cloudinarySecureUrl: {
                  not: null
                },
                isActive: true,
                isPublic: true
              }
            }
          }
        }),
        prisma.productVariant.count(),
        prisma.stripeWebhookEvent.count(),
        prisma.stripeWebhookEvent.count({
          where: {
            processedAt: null
          }
        }),
        prisma.stripeWebhookEvent.findFirst({
          where: {
            processedAt: {
              not: null
            }
          },
          orderBy: {
            processedAt: "desc"
          },
          select: {
            stripeEventId: true,
            type: true,
            processedAt: true,
            createdAt: true
          }
        }),
        prisma.stripeWebhookEvent.findMany({
          orderBy: {
            createdAt: "desc"
          },
          select: {
            stripeEventId: true,
            type: true,
            processedAt: true,
            createdAt: true
          },
          take: 5
        })
      ]);

      return {
        orders: {
          paidCount: paidOrdersCount,
          pendingCheckoutCount: pendingCheckoutOrdersCount,
          failedCheckoutCount: failedCheckoutOrdersCount,
          recent: recentOrders.map((order) => this.serializeListOrder(order))
        },
        payments: {
          webhookEventsTracked: totalWebhookEventsCount > 0,
          status: this.getWebhookHealthStatus(totalWebhookEventsCount, latestProcessedWebhookEvent),
          totalWebhookEventsCount,
          unprocessedWebhookEventsCount,
          latestProcessedWebhookEvent: latestProcessedWebhookEvent
            ? this.serializeWebhookEvent(latestProcessedWebhookEvent)
            : null,
          recentWebhookEvents: recentWebhookEvents.map((event) => this.serializeWebhookEvent(event))
        },
        products: {
          totalCount: totalProductsCount,
          activeCount: activeProductsCount,
          checkoutScopeCount: checkoutScopeProductsCount,
          variantCount: variantsCount,
          warnings: {
            missingCheckoutPriceCount,
            missingPublicImageCount
          }
        },
        inventory: {
          status: "not_configured",
          warnings: [],
          message: "Inventory tables are not implemented yet."
        }
      };
    } catch {
      throw new ServiceUnavailableException({
        message: "Admin dashboard summary is unavailable."
      });
    }
  }

  async listProducts(query: AdminListQuery): Promise<unknown> {
    const limit = this.parseLimit(query.limit);

    try {
      const products = await this.getPrisma().product.findMany({
        orderBy: [
          {
            updatedAt: "desc"
          },
          {
            name: "asc"
          }
        ],
        select: adminProductListSelect,
        take: limit
      });

      return {
        count: products.length,
        items: products.map((product) => this.serializeProductListItem(product))
      };
    } catch {
      throw new ServiceUnavailableException({
        message: "Admin products are unavailable."
      });
    }
  }

  async getProduct(idParam: string): Promise<unknown> {
    const id = this.parseRouteIdentifier(idParam, "Product");

    let product: AdminProductDetailRecord | null;

    try {
      product = await this.getPrisma().product.findUnique({
        where: {
          id
        },
        select: adminProductDetailSelect
      });
    } catch {
      throw new ServiceUnavailableException({
        message: "Admin product is unavailable."
      });
    }

    if (!product) {
      throw new NotFoundException({
        message: "Admin product was not found."
      });
    }

    return {
      product: this.serializeProductDetail(product)
    };
  }

  async listOrders(query: AdminListQuery): Promise<unknown> {
    const status = this.parseOptionalStatus(query.status);
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
        select: adminOrderListSelect,
        take: limit
      });

      return {
        count: orders.length,
        status: status ?? "all",
        items: orders.map((order) => this.serializeListOrder(order))
      };
    } catch {
      throw new ServiceUnavailableException({
        message: "Admin orders are unavailable."
      });
    }
  }

  async getOrder(idParam: string): Promise<unknown> {
    const id = this.parseRouteIdentifier(idParam, "Order");

    let order: AdminOrderDetailRecord | null;

    try {
      order = await this.getPrisma().order.findFirst({
        where: {
          OR: [
            {
              id
            },
            {
              publicReference: id
            }
          ]
        },
        select: adminOrderDetailSelect
      });
    } catch {
      throw new ServiceUnavailableException({
        message: "Admin order is unavailable."
      });
    }

    if (!order) {
      throw new NotFoundException({
        message: "Admin order was not found."
      });
    }

    return {
      order: this.serializeDetailOrder(order)
    };
  }

  async listCustomers(): Promise<unknown> {
    try {
      const orders = await this.getPrisma().order.findMany({
        where: {
          customerEmail: {
            not: null
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        select: adminCustomerOrderSelect,
        take: 1000
      });

      const customers = this.createCustomerSummaries(orders);

      return {
        count: customers.length,
        derivation: "orders",
        items: customers
      };
    } catch {
      throw new ServiceUnavailableException({
        message: "Admin customers are unavailable."
      });
    }
  }

  async getSettings(): Promise<unknown> {
    return {
      settings: {
        storeName: "Tiger Ping Pong",
        supportEmail: SUPPORT_EMAIL,
        supportPhone: SUPPORT_PHONE,
        currency: "CAD",
        freeShippingThresholdCents: FREE_SHIPPING_THRESHOLD_CENTS,
        flatRateShippingCents: FLAT_SHIPPING_CENTS,
        checkoutEnabled: this.isCheckoutConfigured(process.env),
        stripeMode: this.getStripeModeIndicator(process.env.STRIPE_SECRET_KEY)
      },
      secretsExposed: false
    };
  }

  async getInventory(): Promise<unknown> {
    return {
      items: [],
      status: "not_configured",
      message: "Inventory tables are not implemented yet.",
      futureSmallestNextStep:
        "Add a simple inventory_items table with product/variant link, on-hand count, reserved count, and updated timestamp before adding adjustment writes."
    };
  }

  async getAuditLog(): Promise<unknown> {
    return {
      items: [],
      status: "not_configured",
      message: "Audit log table not implemented yet."
    };
  }

  private serializeProductListItem(product: AdminProductListRecord) {
    const checkoutEligibility = this.getCheckoutEligibility(product);
    const imageStatus = this.getImageStatus(product);

    return {
      id: product.id,
      key: product.key,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      category: {
        id: product.primaryCategory.id,
        key: product.primaryCategory.key,
        slug: product.primaryCategory.slug,
        name: product.primaryCategory.name
      },
      type: product.productKind,
      priceCents: product.priceCents,
      currency: this.normalizeCurrency(product.currency),
      status: product.status,
      visible: product.v1PublicNavigation,
      v1CheckoutScope: product.v1CheckoutScope,
      purchaseMode: product.purchaseMode,
      checkoutEligible: checkoutEligibility.eligible,
      checkoutEligibilityReasons: checkoutEligibility.reasons,
      imageStatus,
      primaryImageUrl: imageStatus.primaryImageUrl,
      variantCount: product._count.variants,
      mediaCount: product._count.media
    };
  }

  private serializeProductDetail(product: AdminProductDetailRecord) {
    return {
      ...this.serializeProductListItem(product),
      sourceUrl: product.sourceUrl,
      legacyPath: product.legacyPath,
      shortDescription: product.shortDescription,
      description: product.description,
      sourceReviewStatus: product.sourceReviewStatus,
      importReviewStatus: product.importReviewStatus,
      notes: product.notes,
      brand: product.family.brand,
      family: {
        id: product.family.id,
        key: product.family.key,
        slug: product.family.slug,
        name: product.family.name,
        isPublic: product.family.isPublic,
        isActive: product.family.isActive
      },
      shippingReviewRequired: product.shippingReviewRequired,
      media: product.media.map((media) => ({
        mediaKey: media.mediaKey,
        role: media.role,
        cloudinarySecureUrl: media.cloudinarySecureUrl,
        sourceUrl: media.sourceUrl,
        isPrimary: media.isPrimary,
        isPublic: media.isPublic,
        isActive: media.isActive,
        reviewStatus: media.reviewStatus
      })),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        key: variant.key,
        sku: variant.sku,
        name: variant.name,
        priceCents: variant.priceCents,
        currency: this.normalizeCurrency(variant.currency),
        purchaseModeOverride: variant.purchaseModeOverride,
        isActive: variant.isActive,
        sourceUrl: variant.sourceUrl,
        options: variant.optionValues.map((optionValue) => ({
          optionName: optionValue.productOptionValue.option.name,
          optionDisplayName: optionValue.productOptionValue.option.displayName,
          value: optionValue.productOptionValue.value,
          label: optionValue.productOptionValue.label
        }))
      })),
      createdAt: this.serializeDate(product.createdAt),
      updatedAt: this.serializeDate(product.updatedAt)
    };
  }

  private serializeListOrder(order: AdminOrderListRecord) {
    return {
      id: order.id,
      orderReference: order.publicReference,
      customer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone
      },
      currency: this.normalizeCurrency(order.currency),
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      totalCents: order.totalCents,
      orderStatus: order.status,
      paymentStatus: this.getPaymentStatus(order.status),
      itemCount: order._count.items,
      stripe: {
        checkoutSessionId: order.stripeCheckoutSessionId,
        paymentIntentId: order.stripePaymentIntentId,
        customerId: order.stripeCustomerId
      },
      paidAt: this.serializeDate(order.paidAt),
      createdAt: this.serializeDate(order.createdAt),
      updatedAt: this.serializeDate(order.updatedAt)
    };
  }

  private serializeDetailOrder(order: AdminOrderDetailRecord) {
    return {
      id: order.id,
      orderReference: order.publicReference,
      customer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone
      },
      shipping: {
        name: order.shippingName,
        phone: order.shippingPhone,
        address: this.serializeShippingAddress(order.shippingAddressJson)
      },
      totals: {
        currency: this.normalizeCurrency(order.currency),
        subtotalCents: order.subtotalCents,
        shippingCents: order.shippingCents,
        totalCents: order.totalCents,
        shippingRule: order.shippingRule
      },
      orderStatus: order.status,
      paymentStatus: this.getPaymentStatus(order.status),
      checkoutSource: order.checkoutSource,
      stripe: {
        checkoutSessionId: order.stripeCheckoutSessionId,
        paymentIntentId: order.stripePaymentIntentId,
        customerId: order.stripeCustomerId
      },
      paidAt: this.serializeDate(order.paidAt),
      createdAt: this.serializeDate(order.createdAt),
      updatedAt: this.serializeDate(order.updatedAt),
      items: order.items.map((item) => ({
        id: item.id,
        productKey: item.productKey,
        productSlug: item.productSlug,
        variantKey: item.variantKey,
        sku: item.sku,
        name: item.name,
        imageUrl: item.imageUrl,
        currency: this.normalizeCurrency(item.currency),
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
        lineTotalCents: item.lineTotalCents,
        createdAt: this.serializeDate(item.createdAt),
        product: item.product
          ? {
              id: item.product.id,
              slug: item.product.slug,
              name: item.product.name
            }
          : null,
        variant: item.variant
          ? {
              id: item.variant.id,
              key: item.variant.key,
              sku: item.variant.sku,
              name: item.variant.name
            }
          : null
      }))
    };
  }

  private createCustomerSummaries(orders: AdminCustomerOrderRecord[]): CustomerSummary[] {
    const customersByEmail = new Map<string, CustomerSummary>();

    for (const order of orders) {
      const email = order.customerEmail?.trim();

      if (!email) {
        continue;
      }

      const key = email.toLowerCase();
      let customer = customersByEmail.get(key);

      if (!customer) {
        customer = {
          currency: this.normalizeCurrency(order.currency),
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          email,
          lastOrderDate: this.serializeDate(order.createdAt),
          orderCount: 0,
          paidOrderCount: 0,
          totalSpentCents: 0
        };
        customersByEmail.set(key, customer);
      }

      customer.orderCount += 1;

      if (order.status === "paid") {
        customer.paidOrderCount += 1;
        customer.totalSpentCents += order.totalCents;
      }

      if (!customer.customerName && order.customerName) {
        customer.customerName = order.customerName;
      }

      if (!customer.customerPhone && order.customerPhone) {
        customer.customerPhone = order.customerPhone;
      }
    }

    return Array.from(customersByEmail.values()).sort((left, right) =>
      (right.lastOrderDate ?? "").localeCompare(left.lastOrderDate ?? "")
    );
  }

  private getCheckoutEligibility(product: AdminProductListRecord) {
    const reasons: string[] = [];
    const currency = product.currency.trim().toLowerCase();

    if (product.status !== "active") {
      reasons.push("product_not_active");
    }

    if (!product.v1PublicNavigation) {
      reasons.push("not_public_navigation");
    }

    if (!product.v1CheckoutScope) {
      reasons.push("not_checkout_scope");
    }

    if (product.productKind === "replacement_part") {
      reasons.push("replacement_part_deferred");
    }

    if (!CHECKOUT_PURCHASE_MODES.has(product.purchaseMode)) {
      reasons.push("purchase_mode_not_checkoutable");
    }

    if (!product.family.isActive) {
      reasons.push("family_not_active");
    }

    if (!product.family.isPublic) {
      reasons.push("family_not_public");
    }

    if (!product.primaryCategory.isActive) {
      reasons.push("category_not_active");
    }

    if (!product.primaryCategory.v1PublicNavigation) {
      reasons.push("category_not_public_navigation");
    }

    if (!product.primaryCategory.v1CheckoutScope) {
      reasons.push("category_not_checkout_scope");
    }

    if (currency !== "cad") {
      reasons.push("currency_not_cad");
    }

    if (
      typeof product.priceCents !== "number" ||
      !Number.isInteger(product.priceCents) ||
      product.priceCents <= 0
    ) {
      reasons.push("missing_or_invalid_price");
    }

    return {
      eligible: reasons.length === 0,
      reasons
    };
  }

  private getImageStatus(product: AdminProductListRecord) {
    const primaryImage = product.media.find(
      (media) => media.isActive && media.isPublic && media.cloudinarySecureUrl
    );

    if (primaryImage) {
      return {
        status: "public_image_available",
        primaryImageUrl: primaryImage.cloudinarySecureUrl
      };
    }

    return {
      status:
        product._count.media > 0 ? "media_not_public_or_missing_cloudinary_url" : "missing_media",
      primaryImageUrl: null
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

  private getPaymentStatus(status: string): string {
    switch (status) {
      case "paid":
        return "paid";
      case "checkout_pending":
        return "pending";
      case "checkout_failed":
        return "failed";
      case "refunded":
        return "refunded";
      case "canceled":
      case "expired":
        return "not_paid";
      default:
        return "unknown";
    }
  }

  private getWebhookHealthStatus(
    totalWebhookEventsCount: number,
    latestProcessedWebhookEvent: { processedAt: Date | null } | null
  ): string {
    if (latestProcessedWebhookEvent?.processedAt) {
      return "tracked";
    }

    if (totalWebhookEventsCount > 0) {
      return "events_unprocessed";
    }

    return "no_events";
  }

  private serializeWebhookEvent(event: {
    createdAt: Date;
    processedAt: Date | null;
    stripeEventId: string;
    type: string;
  }) {
    return {
      stripeEventId: event.stripeEventId,
      type: event.type,
      processedAt: this.serializeDate(event.processedAt),
      createdAt: this.serializeDate(event.createdAt)
    };
  }

  private parseOptionalStatus(value: string | undefined): AdminOrderStatus | undefined {
    if (!value?.trim()) {
      return undefined;
    }

    const normalized = value.trim();

    if (this.isAdminOrderStatus(normalized)) {
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

  private parseRouteIdentifier(value: string, label: string): string {
    const id = value.trim();

    if (!/^[A-Za-z0-9_-]{3,128}$/.test(id)) {
      throw new NotFoundException({
        message: `${label} was not found.`
      });
    }

    return id;
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
          message: "Admin database is not configured."
        });
      }
    }

    return this.prisma;
  }

  private isCheckoutConfigured(env: NodeJS.ProcessEnv): boolean {
    return Boolean(
      env.STRIPE_SECRET_KEY?.trim() &&
        env.CHECKOUT_SUCCESS_URL?.trim() &&
        env.CHECKOUT_CANCEL_URL?.trim()
    );
  }

  private getStripeModeIndicator(value: string | undefined): string {
    const normalized = value?.trim();

    if (!normalized) {
      return "not_configured";
    }

    if (normalized.startsWith("sk_test_")) {
      return "test";
    }

    if (normalized.startsWith("sk_live_")) {
      return "live";
    }

    return "unknown";
  }

  private isAdminOrderStatus(value: string): value is AdminOrderStatus {
    return ADMIN_ORDER_STATUSES.includes(value as AdminOrderStatus);
  }

  private normalizeCurrency(value: string): string {
    return value.trim().toUpperCase();
  }

  private serializeDate(value: Date | null): string | null {
    return value?.toISOString() ?? null;
  }

  private normalizeOptionalString(value: unknown): string | null {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();

    return normalized || null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private getString(record: Record<string, unknown>, key: string): string | null {
    return this.normalizeOptionalString(record[key]);
  }
}
