import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  ServiceUnavailableException
} from "@nestjs/common";
import { createDatabaseConfig, Prisma, PrismaClient } from "@tigerpingpong/db";
import {
  AQUA_FOUR_PACK_PRODUCT_SLUG,
  AQUA_FOUR_PACK_VARIANT_KEY,
  CANADA_FLAT_RATE_SHIPPING_CENTS,
  CANADA_FREE_SHIPPING_THRESHOLD_CENTS
} from "@tigerpingpong/shared";

type AdminOrderStatus =
  | "canceled"
  | "checkout_failed"
  | "checkout_pending"
  | "expired"
  | "paid"
  | "refunded";

type AdminMediaRole =
  | "primary"
  | "gallery"
  | "detail"
  | "lifestyle"
  | "variant"
  | "source_reference";

interface AdminListQuery {
  limit?: string;
  status?: string;
}

interface AdminProductMediaInput {
  altText?: unknown;
  caption?: unknown;
  cloudinaryPublicId?: unknown;
  cloudinarySecureUrl?: unknown;
  isPrimary?: unknown;
  role?: unknown;
  sortOrder?: unknown;
  title?: unknown;
}

interface NormalizedProductMediaInput {
  altText: string | null;
  caption: string | null;
  cloudinaryFormat: string | null;
  cloudinaryPublicId: string | null;
  cloudinaryResourceType: string | null;
  cloudinarySecureUrl: string | null;
  cloudinaryVersion: string | null;
  isPrimary: boolean;
  role: AdminMediaRole;
  sortOrder: number;
  title: string | null;
}

interface AdminProductUpdateInput {
  availableForSale?: unknown;
  expectedUpdatedAt?: unknown;
  name?: unknown;
  priceCents?: unknown;
  variants?: unknown;
}

interface NormalizedProductVariantUpdate {
  id: string;
  isActive: boolean;
  priceCents: number | null;
}

interface NormalizedProductUpdate {
  availableForSale: boolean;
  expectedUpdatedAt: Date;
  name: string;
  priceCents: number | null;
  variants: NormalizedProductVariantUpdate[];
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

type DashboardSectionStatus = "not_configured" | "ok" | "unavailable";

interface DashboardWebhookEvent {
  createdAt: string | null;
  processedAt: string | null;
  stripeEventId: string;
  type: string;
}

interface DashboardWebhookHealth {
  eventStatus: string;
  items: DashboardWebhookEvent[];
  latestProcessedWebhookEvent: DashboardWebhookEvent | null;
  message?: string;
  recentWebhookEvents: DashboardWebhookEvent[];
  status: DashboardSectionStatus;
  totalWebhookEventsCount: number;
  unprocessedWebhookEventsCount: number;
  webhookEventsTracked: boolean;
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
const MAX_LIMIT = 100;
const MAX_MEDIA_SORT_ORDER = 999;
const MIN_MEDIA_SORT_ORDER = 0;
const MAX_PRODUCT_PRICE_CENTS = 99_999_999;
const MAX_PRODUCT_NAME_LENGTH = 160;
const SUPPORT_EMAIL = "info@tigerpingpong.com";
const SUPPORT_PHONE = "1-888-552-5259";

const ADMIN_MEDIA_ROLES: readonly AdminMediaRole[] = [
  "primary",
  "gallery",
  "detail",
  "lifestyle",
  "variant",
  "source_reference"
];

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
  media: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    select: {
      mediaKey: true,
      role: true,
      cloudinarySecureUrl: true,
      sourceUrl: true,
      isPrimary: true,
      isPublic: true,
      isActive: true,
      reviewStatus: true
    }
  },
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

const adminProductMediaProductSelect = {
  id: true,
  key: true,
  slug: true,
  name: true,
  sku: true
} satisfies Prisma.ProductSelect;

const adminProductMediaSelect = {
  id: true,
  mediaKey: true,
  productId: true,
  variantId: true,
  role: true,
  cloudinaryPublicId: true,
  cloudinarySecureUrl: true,
  cloudinaryResourceType: true,
  cloudinaryFormat: true,
  cloudinaryVersion: true,
  sourceUrl: true,
  sourceProvider: true,
  altText: true,
  title: true,
  caption: true,
  sortOrder: true,
  isPrimary: true,
  isPublic: true,
  isActive: true,
  reviewStatus: true,
  updatedAt: true
} satisfies Prisma.ProductMediaSelect;

const adminOrderListSelect = {
  id: true,
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

type AdminProductMediaProductRecord = Prisma.ProductGetPayload<{
  select: typeof adminProductMediaProductSelect;
}>;

type AdminProductMediaRecord = Prisma.ProductMediaGetPayload<{
  select: typeof adminProductMediaSelect;
}>;

@Injectable()
export class AdminService implements OnModuleDestroy {
  private readonly logger = new Logger(AdminService.name);
  private prisma: PrismaClient | null = null;

  async onModuleDestroy(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }

  async getDashboardSummary(): Promise<unknown> {
    const prisma = this.getPrisma();

    await this.assertDashboardDatabaseAvailable(prisma);

    const orders = await this.getDashboardOrders(prisma);
    const products = await this.getDashboardProducts(prisma);
    const webhookHealth = await this.getDashboardWebhookHealth(prisma);
    const inventory = this.getDashboardInventorySummary();
    const auditLog = this.getDashboardAuditLogSummary();

    return {
      orders,
      products,
      inventory,
      auditLog,
      webhookHealth,
      payments: this.getDashboardPaymentsSummary(webhookHealth)
    };
  }

  private async getDashboardOrders(prisma: PrismaClient) {
    try {
      const paidOrdersCount = await prisma.order.count({
        where: {
          status: "paid"
        }
      });
      const pendingCheckoutOrdersCount = await prisma.order.count({
        where: {
          status: "checkout_pending"
        }
      });
      const failedCheckoutOrdersCount = await prisma.order.count({
        where: {
          status: "checkout_failed"
        }
      });
      const recentOrders = await prisma.order.findMany({
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
      });

      return {
        status: "ok",
        paidCount: paidOrdersCount,
        pendingCount: pendingCheckoutOrdersCount,
        pendingCheckoutCount: pendingCheckoutOrdersCount,
        failedCount: failedCheckoutOrdersCount,
        failedCheckoutCount: failedCheckoutOrdersCount,
        recent: recentOrders.map((order) => this.serializeListOrder(order))
      };
    } catch {
      return {
        status: "unavailable",
        paidCount: 0,
        pendingCount: 0,
        pendingCheckoutCount: 0,
        failedCount: 0,
        failedCheckoutCount: 0,
        recent: [],
        message: "Order summary is temporarily unavailable."
      };
    }
  }

  private async getDashboardProducts(prisma: PrismaClient) {
    try {
      const totalProductsCount = await prisma.product.count();
      const activeProductsCount = await prisma.product.count({
        where: {
          status: "active"
        }
      });
      const checkoutScopeProductsCount = await prisma.product.count({
        where: {
          v1CheckoutScope: true
        }
      });
      const missingCheckoutPriceCount = await prisma.product.count({
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
      });
      const missingPublicImageCount = await prisma.product.count({
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
      });
      const variantsCount = await prisma.productVariant.count();

      return {
        status: "ok",
        count: totalProductsCount,
        totalCount: totalProductsCount,
        activeCount: activeProductsCount,
        checkoutScopeCount: checkoutScopeProductsCount,
        variantCount: variantsCount,
        warnings: {
          missingCheckoutPriceCount,
          missingPublicImageCount
        }
      };
    } catch {
      return {
        status: "unavailable",
        count: 0,
        totalCount: 0,
        activeCount: 0,
        checkoutScopeCount: 0,
        variantCount: 0,
        warnings: {
          missingCheckoutPriceCount: 0,
          missingPublicImageCount: 0
        },
        message: "Product summary is temporarily unavailable."
      };
    }
  }

  private async getDashboardWebhookHealth(prisma: PrismaClient): Promise<DashboardWebhookHealth> {
    try {
      const totalWebhookEventsCount = await prisma.stripeWebhookEvent.count();
      const unprocessedWebhookEventsCount = await prisma.stripeWebhookEvent.count({
        where: {
          processedAt: null
        }
      });
      const latestProcessedWebhookEvent = await prisma.stripeWebhookEvent.findFirst({
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
      });
      const recentWebhookEvents = await prisma.stripeWebhookEvent.findMany({
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
      });
      const recentItems = recentWebhookEvents.map((event) => this.serializeWebhookEvent(event));

      return {
        status: "ok",
        eventStatus: this.getWebhookHealthStatus(
          totalWebhookEventsCount,
          latestProcessedWebhookEvent
        ),
        webhookEventsTracked: totalWebhookEventsCount > 0,
        totalWebhookEventsCount,
        unprocessedWebhookEventsCount,
        latestProcessedWebhookEvent: latestProcessedWebhookEvent
          ? this.serializeWebhookEvent(latestProcessedWebhookEvent)
          : null,
        recentWebhookEvents: recentItems,
        items: recentItems
      };
    } catch (error) {
      const status = this.getOptionalDashboardSectionStatus(error);

      return {
        status,
        eventStatus: status,
        webhookEventsTracked: false,
        totalWebhookEventsCount: 0,
        unprocessedWebhookEventsCount: 0,
        latestProcessedWebhookEvent: null,
        recentWebhookEvents: [],
        items: [],
        message:
          status === "not_configured"
            ? "Webhook event tracking is not configured."
            : "Webhook health is temporarily unavailable."
      };
    }
  }

  private getDashboardInventorySummary() {
    return {
      status: "not_configured",
      items: [],
      warnings: [],
      message: "Inventory tables are not implemented yet."
    };
  }

  private getDashboardAuditLogSummary() {
    return {
      status: "not_configured",
      items: [],
      message: "Audit log table not implemented yet."
    };
  }

  private getDashboardPaymentsSummary(webhookHealth: DashboardWebhookHealth) {
    return {
      webhookEventsTracked: webhookHealth.webhookEventsTracked,
      status: webhookHealth.eventStatus,
      totalWebhookEventsCount: webhookHealth.totalWebhookEventsCount,
      unprocessedWebhookEventsCount: webhookHealth.unprocessedWebhookEventsCount,
      latestProcessedWebhookEvent: webhookHealth.latestProcessedWebhookEvent,
      recentWebhookEvents: webhookHealth.recentWebhookEvents
    };
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

  async updateProduct(idParam: string, input: AdminProductUpdateInput): Promise<unknown> {
    const productId = this.parseRouteIdentifier(idParam, "Product");
    const update = this.normalizeProductUpdateInput(input);
    const prisma = this.getPrisma();
    let changedFields: string[] = [];

    try {
      await prisma.$transaction(async (transaction) => {
        const product = await transaction.product.findUnique({
          where: { id: productId },
          select: adminProductDetailSelect
        });

        if (!product) {
          throw new NotFoundException({ message: "Admin product was not found." });
        }

        if (product.updatedAt.getTime() !== update.expectedUpdatedAt.getTime()) {
          throw new ConflictException({
            message: "This product changed after the editor was opened. Reload and try again."
          });
        }

        this.assertCompleteVariantUpdate(product, update.variants);
        this.assertProposedProductIsSafe(product, update);

        const isCurrentlyAvailable = this.isProductAvailableForSale(product);
        const productData: Prisma.ProductUpdateManyMutationInput = {
          name: update.name,
          priceCents: update.priceCents,
          updatedAt: new Date()
        };

        if (update.availableForSale) {
          productData.status = "active";
          productData.v1PublicNavigation = true;
          productData.v1CheckoutScope = true;
        } else if (isCurrentlyAvailable) {
          productData.status = "archived";
          productData.v1PublicNavigation = false;
          productData.v1CheckoutScope = false;
        }

        const productUpdate = await transaction.product.updateMany({
          where: { id: productId, updatedAt: update.expectedUpdatedAt },
          data: productData
        });

        if (productUpdate.count !== 1) {
          throw new ConflictException({
            message: "This product changed while it was being saved. Reload and try again."
          });
        }

        for (const variant of update.variants) {
          await transaction.productVariant.update({
            where: { id: variant.id },
            data: { isActive: variant.isActive, priceCents: variant.priceCents }
          });
        }

        changedFields = this.getProductChangedFields(product, update);
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new ServiceUnavailableException({ message: "Admin product could not be saved." });
    }

    this.logger.log(JSON.stringify({ event: "admin_product_updated", productId, changedFields }));

    return this.getProduct(productId);
  }

  async getProductMedia(idParam: string): Promise<unknown> {
    const productId = this.parseRouteIdentifier(idParam, "Product");
    const prisma = this.getPrisma();

    try {
      const product = await prisma.product.findUnique({
        where: {
          id: productId
        },
        select: adminProductMediaProductSelect
      });

      if (!product) {
        throw new NotFoundException({
          message: "Admin product was not found."
        });
      }

      const media = await prisma.productMedia.findMany({
        where: {
          productId
        },
        orderBy: [
          {
            isActive: "desc"
          },
          {
            isPrimary: "desc"
          },
          {
            sortOrder: "asc"
          },
          {
            updatedAt: "desc"
          }
        ],
        select: adminProductMediaSelect
      });

      return this.serializeProductMediaResponse(product, media);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new BadRequestException({
          message: "Product media request is invalid."
        });
      }

      throw new ServiceUnavailableException({
        message: "Admin product media is unavailable."
      });
    }
  }

  async addProductMedia(idParam: string, input: AdminProductMediaInput): Promise<unknown> {
    const productId = this.parseRouteIdentifier(idParam, "Product");
    const mediaInput = this.normalizeProductMediaInput(input);
    const prisma = this.getPrisma();

    try {
      const product = await prisma.product.findUnique({
        where: {
          id: productId
        },
        select: adminProductMediaProductSelect
      });

      if (!product) {
        throw new NotFoundException({
          message: "Admin product was not found."
        });
      }

      await prisma.$transaction(async (transaction) => {
        if (mediaInput.isPrimary) {
          await this.clearPrimaryProductMedia(transaction, productId);
        }

        await transaction.productMedia.create({
          data: {
            altText: mediaInput.altText,
            caption: mediaInput.caption,
            cloudinaryFormat: mediaInput.cloudinaryFormat,
            cloudinaryPublicId: mediaInput.cloudinaryPublicId,
            cloudinaryResourceType: mediaInput.cloudinaryResourceType,
            cloudinarySecureUrl: mediaInput.cloudinarySecureUrl,
            cloudinaryVersion: mediaInput.cloudinaryVersion,
            isActive: true,
            isPrimary: mediaInput.isPrimary,
            isPublic: true,
            mediaKey: this.createAdminMediaKey(product.slug, mediaInput),
            productId,
            reviewStatus: "approved",
            role: mediaInput.role,
            sortOrder: mediaInput.sortOrder,
            sourceProvider: "cloudinary",
            title: mediaInput.title
          }
        });
      });

      return this.getProductMedia(productId);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      this.throwProductMediaWriteError(error);
    }
  }

  async updateProductMedia(
    idParam: string,
    mediaIdParam: string,
    input: AdminProductMediaInput
  ): Promise<unknown> {
    const productId = this.parseRouteIdentifier(idParam, "Product");
    const mediaId = this.parseRouteIdentifier(mediaIdParam, "Product media");
    const mediaInput = this.normalizeProductMediaInput(input);

    try {
      await this.getPrisma().$transaction(async (transaction) => {
        const media = await transaction.productMedia.findFirst({
          where: {
            id: mediaId,
            productId
          },
          select: {
            id: true
          }
        });

        if (!media) {
          throw new NotFoundException({
            message: "Admin product media row was not found."
          });
        }

        if (mediaInput.isPrimary) {
          await this.clearPrimaryProductMedia(transaction, productId);
        }

        await transaction.productMedia.update({
          where: {
            id: mediaId
          },
          data: {
            altText: mediaInput.altText,
            caption: mediaInput.caption,
            cloudinaryFormat: mediaInput.cloudinaryFormat,
            cloudinaryPublicId: mediaInput.cloudinaryPublicId,
            cloudinaryResourceType: mediaInput.cloudinaryResourceType,
            cloudinarySecureUrl: mediaInput.cloudinarySecureUrl,
            cloudinaryVersion: mediaInput.cloudinaryVersion,
            isActive: true,
            isPrimary: mediaInput.isPrimary,
            isPublic: true,
            reviewStatus: "approved",
            role: mediaInput.role,
            sortOrder: mediaInput.sortOrder,
            sourceProvider: "cloudinary",
            title: mediaInput.title
          }
        });
      });

      return this.getProductMedia(productId);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      this.throwProductMediaWriteError(error);
    }
  }

  async unassignProductMedia(idParam: string, mediaIdParam: string): Promise<unknown> {
    const productId = this.parseRouteIdentifier(idParam, "Product");
    const mediaId = this.parseRouteIdentifier(mediaIdParam, "Product media");

    try {
      const media = await this.getPrisma().productMedia.findFirst({
        where: {
          id: mediaId,
          productId
        },
        select: {
          id: true
        }
      });

      if (!media) {
        throw new NotFoundException({
          message: "Admin product media row was not found."
        });
      }

      await this.getPrisma().productMedia.update({
        where: {
          id: mediaId
        },
        data: {
          isActive: false,
          isPrimary: false,
          isPublic: false
        }
      });

      return this.getProductMedia(productId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new ServiceUnavailableException({
        message: "Admin product media could not be unassigned."
      });
    }
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
        freeShippingThresholdCents: CANADA_FREE_SHIPPING_THRESHOLD_CENTS,
        flatRateShippingCents: CANADA_FLAT_RATE_SHIPPING_CENTS,
        freeShippingException: {
          productSlug: AQUA_FOUR_PACK_PRODUCT_SLUG,
          variantKey: AQUA_FOUR_PACK_VARIANT_KEY,
          requiresExclusiveCart: true
        },
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

  private serializeProductMediaResponse(
    product: AdminProductMediaProductRecord,
    media: AdminProductMediaRecord[]
  ) {
    return {
      product: {
        id: product.id,
        key: product.key,
        slug: product.slug,
        name: product.name,
        sku: product.sku
      },
      media: media.map((item) => this.serializeProductMedia(item))
    };
  }

  private serializeProductMedia(media: AdminProductMediaRecord) {
    return {
      id: media.id,
      mediaKey: media.mediaKey,
      productId: media.productId,
      variantId: media.variantId,
      role: media.role,
      cloudinaryPublicId: media.cloudinaryPublicId,
      cloudinarySecureUrl: media.cloudinarySecureUrl,
      cloudinaryResourceType: media.cloudinaryResourceType,
      cloudinaryFormat: media.cloudinaryFormat,
      cloudinaryVersion: media.cloudinaryVersion,
      sourceUrl: media.sourceUrl,
      sourceProvider: media.sourceProvider,
      altText: media.altText,
      title: media.title,
      caption: media.caption,
      sortOrder: media.sortOrder,
      isPrimary: media.isPrimary,
      isPublic: media.isPublic,
      isActive: media.isActive,
      reviewStatus: media.reviewStatus,
      previewUrl:
        media.cloudinarySecureUrl ?? this.createCloudinaryDeliveryUrl(media.cloudinaryPublicId),
      updatedAt: this.serializeDate(media.updatedAt)
    };
  }

  private normalizeProductMediaInput(input: AdminProductMediaInput): NormalizedProductMediaInput {
    if (!this.isRecord(input)) {
      throw new BadRequestException({
        message: "Product media input is required."
      });
    }

    const cloudinaryPublicId = this.normalizeCloudinaryPublicId(input.cloudinaryPublicId);
    const cloudinarySecureUrl = this.normalizeCloudinarySecureUrl(input.cloudinarySecureUrl);
    const parsedCloudinaryUrl = cloudinarySecureUrl
      ? this.parseCloudinaryDeliveryUrl(cloudinarySecureUrl)
      : null;

    if (cloudinarySecureUrl && !parsedCloudinaryUrl) {
      throw new BadRequestException({
        message: "cloudinarySecureUrl must be a valid Cloudinary image delivery URL."
      });
    }

    const resolvedPublicId = cloudinaryPublicId ?? parsedCloudinaryUrl?.publicId ?? null;
    const resolvedSecureUrl =
      cloudinarySecureUrl ?? this.createCloudinaryDeliveryUrl(resolvedPublicId);

    if (!resolvedPublicId) {
      throw new BadRequestException({
        message:
          "A Cloudinary public ID or Cloudinary secure URL is required for product media mapping."
      });
    }

    if (!resolvedSecureUrl) {
      throw new BadRequestException({
        message:
          "Product media must resolve to a Cloudinary secure URL. Provide cloudinarySecureUrl or configure CLOUDINARY_CLOUD_NAME for public ID delivery URLs."
      });
    }

    const requestedRole = this.normalizeMediaRole(input.role);
    const isPrimary = this.normalizeBoolean(input.isPrimary) || requestedRole === "primary";
    const role = isPrimary ? "primary" : requestedRole;

    return {
      altText: this.normalizeOptionalString(input.altText),
      caption: this.normalizeOptionalString(input.caption),
      cloudinaryFormat: parsedCloudinaryUrl?.format ?? null,
      cloudinaryPublicId: resolvedPublicId,
      cloudinaryResourceType: parsedCloudinaryUrl?.resourceType ?? "image",
      cloudinarySecureUrl: resolvedSecureUrl,
      cloudinaryVersion: parsedCloudinaryUrl?.version ?? null,
      isPrimary,
      role,
      sortOrder: this.normalizeSortOrder(input.sortOrder),
      title: this.normalizeOptionalString(input.title)
    };
  }

  private normalizeProductUpdateInput(input: AdminProductUpdateInput): NormalizedProductUpdate {
    if (!this.isRecord(input)) {
      throw new BadRequestException({ message: "Product update input is required." });
    }

    this.assertAllowedKeys(input, [
      "availableForSale",
      "expectedUpdatedAt",
      "name",
      "priceCents",
      "variants"
    ]);

    if (typeof input.name !== "string") {
      throw new BadRequestException({ message: "name must be a string." });
    }

    const name = input.name.trim();
    if (!name || name.length > MAX_PRODUCT_NAME_LENGTH) {
      throw new BadRequestException({
        message: `name must be between 1 and ${MAX_PRODUCT_NAME_LENGTH} characters.`
      });
    }

    if (typeof input.availableForSale !== "boolean") {
      throw new BadRequestException({ message: "availableForSale must be a boolean." });
    }

    if (typeof input.expectedUpdatedAt !== "string") {
      throw new BadRequestException({ message: "expectedUpdatedAt must be an ISO timestamp." });
    }

    const expectedUpdatedAt = new Date(input.expectedUpdatedAt);
    if (
      !Number.isFinite(expectedUpdatedAt.getTime()) ||
      expectedUpdatedAt.toISOString() !== input.expectedUpdatedAt
    ) {
      throw new BadRequestException({ message: "expectedUpdatedAt must be an ISO timestamp." });
    }

    if (!Array.isArray(input.variants) || input.variants.length > 100) {
      throw new BadRequestException({ message: "variants must be an array of at most 100 items." });
    }

    const seenVariantIds = new Set<string>();
    const variants = input.variants.map((value, index) => {
      if (!this.isRecord(value)) {
        throw new BadRequestException({ message: `variants[${index}] must be an object.` });
      }

      this.assertAllowedKeys(value, ["id", "isActive", "priceCents"]);
      const id = typeof value.id === "string" ? value.id.trim() : "";
      if (!id || id.length > 200) {
        throw new BadRequestException({ message: `variants[${index}].id is invalid.` });
      }
      if (seenVariantIds.has(id)) {
        throw new BadRequestException({ message: "variants contains a duplicate ID." });
      }
      if (typeof value.isActive !== "boolean") {
        throw new BadRequestException({
          message: `variants[${index}].isActive must be a boolean.`
        });
      }

      seenVariantIds.add(id);
      return {
        id,
        isActive: value.isActive,
        priceCents: this.normalizeProductPrice(value.priceCents, `variants[${index}].priceCents`)
      };
    });

    return {
      availableForSale: input.availableForSale,
      expectedUpdatedAt,
      name,
      priceCents: this.normalizeProductPrice(input.priceCents, "priceCents"),
      variants
    };
  }

  private normalizeProductPrice(value: unknown, path: string): number | null {
    if (value === null) {
      return null;
    }

    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < 1 ||
      value > MAX_PRODUCT_PRICE_CENTS
    ) {
      throw new BadRequestException({
        message: `${path} must be null or an integer between 1 and ${MAX_PRODUCT_PRICE_CENTS}.`
      });
    }

    return value;
  }

  private assertAllowedKeys(value: Record<string, unknown>, allowedKeys: string[]): void {
    const allowed = new Set(allowedKeys);
    const unknownKey = Object.keys(value).find((key) => !allowed.has(key));
    if (unknownKey) {
      throw new BadRequestException({ message: `${unknownKey} is not supported.` });
    }
  }

  private assertCompleteVariantUpdate(
    product: AdminProductDetailRecord,
    variants: NormalizedProductVariantUpdate[]
  ): void {
    const existingIds = new Set(product.variants.map((variant) => variant.id));
    if (
      variants.length !== existingIds.size ||
      variants.some((variant) => !existingIds.has(variant.id))
    ) {
      throw new BadRequestException({
        message: "variants must contain each existing product variant exactly once."
      });
    }
  }

  private assertProposedProductIsSafe(
    product: AdminProductDetailRecord,
    update: NormalizedProductUpdate
  ): void {
    if (!update.availableForSale) {
      return;
    }

    const proposedProduct = {
      ...product,
      name: update.name,
      priceCents: update.priceCents,
      status: "active" as const,
      v1PublicNavigation: true,
      v1CheckoutScope: true
    };
    const checkoutEligibility = this.getCheckoutEligibility(proposedProduct);
    const reasons = [...checkoutEligibility.reasons];

    if (this.getImageStatus(proposedProduct).status !== "public_image_available") {
      reasons.push("public_image_required");
    }

    if (product.variants.length > 0) {
      const existingById = new Map(product.variants.map((variant) => [variant.id, variant]));
      const activeCheckoutVariants = update.variants.filter((variant) => {
        const existing = existingById.get(variant.id);
        if (!variant.isActive || !existing) {
          return false;
        }
        if (
          existing.purchaseModeOverride &&
          !CHECKOUT_PURCHASE_MODES.has(existing.purchaseModeOverride)
        ) {
          return false;
        }
        return true;
      });

      if (activeCheckoutVariants.length === 0) {
        reasons.push("active_checkout_variant_required");
      }
      if (
        activeCheckoutVariants.some(
          (variant) =>
            variant.priceCents === null &&
            !(product.productKind === "table" && update.priceCents !== null)
        )
      ) {
        reasons.push("active_variant_price_required");
      }
    }

    if (reasons.length > 0) {
      throw new BadRequestException({
        message: `Product cannot be made available: ${reasons.join(", ")}.`
      });
    }
  }

  private isProductAvailableForSale(product: AdminProductListRecord): boolean {
    return product.status === "active" && product.v1PublicNavigation && product.v1CheckoutScope;
  }

  private getProductChangedFields(
    product: AdminProductDetailRecord,
    update: NormalizedProductUpdate
  ): string[] {
    const changedFields: string[] = [];
    if (product.name !== update.name) changedFields.push("name");
    if (product.priceCents !== update.priceCents) changedFields.push("priceCents");
    if (this.isProductAvailableForSale(product) !== update.availableForSale) {
      changedFields.push("availableForSale");
    }
    const variantsById = new Map(product.variants.map((variant) => [variant.id, variant]));
    if (
      update.variants.some((variant) => {
        const existing = variantsById.get(variant.id);
        return (
          existing?.priceCents !== variant.priceCents || existing?.isActive !== variant.isActive
        );
      })
    ) {
      changedFields.push("variants");
    }
    return changedFields;
  }

  private async clearPrimaryProductMedia(
    transaction: Prisma.TransactionClient,
    productId: string
  ): Promise<void> {
    await transaction.productMedia.updateMany({
      where: {
        productId,
        isPrimary: true
      },
      data: {
        isPrimary: false,
        role: "gallery"
      }
    });
  }

  private createAdminMediaKey(
    productSlug: string,
    input: Pick<NormalizedProductMediaInput, "cloudinaryPublicId" | "role" | "sortOrder">
  ): string {
    const source = input.cloudinaryPublicId ?? `${input.role}-${input.sortOrder}`;
    const slug = source
      .split("/")
      .filter(Boolean)
      .slice(-2)
      .join("-")
      .replace(/[^A-Za-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    const suffix = slug || `${input.role}-${Date.now()}`;

    return `${productSlug}-${suffix}`.slice(0, 180);
  }

  private throwProductMediaWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new BadRequestException({
        message:
          "That Cloudinary public ID or media key is already assigned. Update the existing row or unassign it first."
      });
    }

    throw new ServiceUnavailableException({
      message: "Admin product media could not be saved."
    });
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
      taxAmountCents: order.taxAmountCents,
      orderStatus: order.status,
      paymentStatus: this.getPaymentStatus(order.status),
      itemCount: order._count.items,
      stripe: {
        checkoutSessionId: order.stripeCheckoutSessionId,
        paymentIntentId: order.stripePaymentIntentId,
        customerId: order.stripeCustomerId,
        amountTotalCents: order.stripeAmountTotalCents,
        amountTaxCents: order.stripeAmountTaxCents,
        automaticTaxStatus: order.stripeAutomaticTaxStatus
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
        taxAmountCents: order.taxAmountCents,
        shippingRule: order.shippingRule
      },
      orderStatus: order.status,
      paymentStatus: this.getPaymentStatus(order.status),
      checkoutSource: order.checkoutSource,
      stripe: {
        checkoutSessionId: order.stripeCheckoutSessionId,
        paymentIntentId: order.stripePaymentIntentId,
        customerId: order.stripeCustomerId,
        amountTotalCents: order.stripeAmountTotalCents,
        amountTaxCents: order.stripeAmountTaxCents,
        automaticTaxStatus: order.stripeAutomaticTaxStatus
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

  private async assertDashboardDatabaseAvailable(prisma: PrismaClient): Promise<void> {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        message: "Admin dashboard summary is unavailable."
      });
    }
  }

  private getOptionalDashboardSectionStatus(error: unknown): DashboardSectionStatus {
    return this.isMissingPrismaObjectError(error) ? "not_configured" : "unavailable";
  }

  private isMissingPrismaObjectError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
    );
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

  private normalizeMediaRole(value: unknown): AdminMediaRole {
    const normalized = this.normalizeOptionalString(value) ?? "gallery";

    if (ADMIN_MEDIA_ROLES.includes(normalized as AdminMediaRole)) {
      return normalized as AdminMediaRole;
    }

    throw new BadRequestException({
      message: "role is invalid."
    });
  }

  private normalizeBoolean(value: unknown): boolean {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      return normalized === "true" || normalized === "on" || normalized === "1";
    }

    return false;
  }

  private normalizeSortOrder(value: unknown): number {
    let sortOrder: number | null = null;

    if (typeof value === "number" && Number.isInteger(value)) {
      sortOrder = value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);

      if (Number.isInteger(parsed)) {
        sortOrder = parsed;
      }
    }

    if (sortOrder !== null) {
      if (sortOrder < MIN_MEDIA_SORT_ORDER || sortOrder > MAX_MEDIA_SORT_ORDER) {
        throw new BadRequestException({
          message: `sortOrder must be between ${MIN_MEDIA_SORT_ORDER} and ${MAX_MEDIA_SORT_ORDER}.`
        });
      }

      return sortOrder;
    }

    throw new BadRequestException({
      message: "sortOrder must be an integer."
    });
  }

  private normalizeCloudinaryPublicId(value: unknown): string | null {
    const publicId = this.normalizeOptionalString(value);

    if (!publicId) {
      return null;
    }

    if (
      publicId.startsWith("http://") ||
      publicId.startsWith("https://") ||
      publicId.includes("?") ||
      publicId.includes("#")
    ) {
      throw new BadRequestException({
        message: "cloudinaryPublicId must be a public ID, not a URL."
      });
    }

    if (!/^[A-Za-z0-9/_-]+$/.test(publicId)) {
      throw new BadRequestException({
        message: "cloudinaryPublicId contains unsupported characters."
      });
    }

    return publicId.replace(/^\/+|\/+$/g, "");
  }

  private normalizeCloudinarySecureUrl(value: unknown): string | null {
    const secureUrl = this.normalizeOptionalString(value);

    if (!secureUrl) {
      return null;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(secureUrl);
    } catch {
      throw new BadRequestException({
        message: "cloudinarySecureUrl must be a valid URL."
      });
    }

    if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "res.cloudinary.com") {
      throw new BadRequestException({
        message: "cloudinarySecureUrl must be an HTTPS Cloudinary delivery URL."
      });
    }

    return parsedUrl.toString();
  }

  private createCloudinaryDeliveryUrl(publicId: string | null): string | null {
    if (!publicId) {
      return null;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();

    if (!cloudName) {
      return null;
    }

    return `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/${publicId}`;
  }

  private parseCloudinaryDeliveryUrl(value: string): {
    format: string | null;
    publicId: string | null;
    resourceType: string | null;
    version: string | null;
  } | null {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(value);
    } catch {
      return null;
    }

    const parts = parsedUrl.pathname.split("/").filter(Boolean);

    if (parts.length < 4) {
      return null;
    }

    const resourceType = parts[1] ?? null;
    const uploadIndex = parts.indexOf("upload");

    if (resourceType !== "image" || uploadIndex < 0) {
      return null;
    }

    const pathAfterUpload = parts.slice(uploadIndex + 1);
    const version = pathAfterUpload[0]?.match(/^v\d+$/) ? (pathAfterUpload.shift() ?? null) : null;
    const publicPath = pathAfterUpload.join("/");

    if (!publicPath) {
      return null;
    }

    const publicId = publicPath.replace(/\.[A-Za-z0-9]+$/, "");
    const formatMatch = publicPath.match(/\.([A-Za-z0-9]+)$/);

    return {
      format: formatMatch?.[1]?.toLowerCase() ?? null,
      publicId,
      resourceType,
      version
    };
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
