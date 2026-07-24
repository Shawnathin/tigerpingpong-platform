import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  ServiceUnavailableException
} from "@nestjs/common";
import { createDatabaseConfig, Prisma, PrismaClient } from "@tigerpingpong/db";
import {
  calculateCanadaShippingCents,
  calculateTableAccessoryPricing,
  isCanadaShippingRule,
  TABLE_ACCESSORIES_PRICING_RULE_VERSION,
  TABLE_ACCESSORIES_PROMOTION_KEY
} from "@tigerpingpong/shared";
import StripeConstructor from "stripe";

import { StripeWebhookConfig, getStripeWebhookConfig } from "../config";

const CHECKOUT_SESSION_COMPLETED_EVENT = "checkout.session.completed";
const SUPPORTED_EVENTS = new Set<string>([CHECKOUT_SESSION_COMPLETED_EVENT]);
const V1_CURRENCY = "cad";

interface StripeWebhookResponse {
  received: true;
  status:
    | "already_paid"
    | "duplicate_in_progress"
    | "duplicate_processed"
    | "ignored"
    | "manual_review"
    | "paid";
  type: string;
}

type StripeWebhookProcessStatus = StripeWebhookResponse["status"];

type StripeWebhookProcessResult = {
  reason?: string;
  status: StripeWebhookProcessStatus;
};

type StripeWebhookTransaction = Prisma.TransactionClient;

type CheckoutOrder = Prisma.OrderGetPayload<{
  include: {
    items: true;
  };
}>;

interface ShippingDetailsSnapshot {
  address: Record<string, unknown>;
  name: string | null;
}

interface VerifiedStripeEvent {
  data: {
    object: unknown;
  };
  id: string;
  livemode: boolean;
  type: string;
}

interface StripeCheckoutSessionPayload {
  amount_subtotal: number | null;
  amount_total: number | null;
  automatic_tax?: {
    status?: unknown;
  } | null;
  client_reference_id: string | null;
  collected_information?: {
    shipping_details?: unknown;
  } | null;
  currency: string | null;
  customer: unknown;
  customer_details?: {
    email?: unknown;
    name?: unknown;
    phone?: unknown;
  } | null;
  id: string;
  livemode: boolean;
  metadata?: {
    orderId?: string;
  } | null;
  mode: string | null;
  object: "checkout.session";
  payment_intent: unknown;
  payment_status: string | null;
  shipping_cost?: {
    amount_total?: unknown;
  } | null;
  status: string | null;
  total_details?: {
    amount_discount?: unknown;
    amount_shipping?: unknown;
    amount_tax?: unknown;
  } | null;
}

interface StripeTotalSnapshot {
  automaticTaxStatus: string | null;
  discountCents: number | null;
  shippingCents: number | null;
  subtotalCents: number | null;
  taxCents: number | null;
  totalCents: number | null;
}

@Injectable()
export class StripeWebhookService implements OnModuleDestroy {
  private readonly logger = new Logger(StripeWebhookService.name);
  private prisma: PrismaClient | null = null;

  async onModuleDestroy(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }

  async receiveWebhook(
    rawBody: Buffer | undefined,
    signature: string | string[] | undefined
  ): Promise<StripeWebhookResponse> {
    if (!signature || (Array.isArray(signature) && signature.length === 0)) {
      throw new BadRequestException({
        message: "Stripe signature is required."
      });
    }

    const config = this.readWebhookConfig();

    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      throw new BadRequestException({
        message: "Stripe webhook payload is required."
      });
    }

    const event = this.verifyWebhookEvent(rawBody, signature, config.stripeWebhookSecret);
    const result = await this.recordAndProcessWebhookEvent(event, config);

    this.logWebhookResult(event, result);

    return {
      received: true,
      status: result.status,
      type: event.type
    };
  }

  private readWebhookConfig(): StripeWebhookConfig {
    try {
      return getStripeWebhookConfig();
    } catch {
      throw new ServiceUnavailableException({
        message: "Stripe webhook is not configured."
      });
    }
  }

  private verifyWebhookEvent(
    rawBody: Buffer,
    signature: string | string[],
    webhookSecret: string
  ): VerifiedStripeEvent {
    try {
      return StripeConstructor.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      ) as VerifiedStripeEvent;
    } catch {
      throw new BadRequestException({
        message: "Stripe webhook signature verification failed."
      });
    }
  }

  private async recordAndProcessWebhookEvent(
    event: VerifiedStripeEvent,
    config: StripeWebhookConfig
  ): Promise<StripeWebhookProcessResult> {
    if (!event.id) {
      throw new BadRequestException({
        message: "Stripe webhook event is invalid."
      });
    }

    try {
      return await this.getPrisma().$transaction(async (transaction) => {
        await transaction.stripeWebhookEvent.create({
          data: {
            stripeEventId: event.id,
            type: event.type
          }
        });

        if (!SUPPORTED_EVENTS.has(event.type)) {
          return {
            status: "ignored"
          };
        }

        return this.processCheckoutSessionCompleted(transaction, event, config);
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        return this.resolveDuplicateWebhookEvent(event.id);
      }

      throw new ServiceUnavailableException({
        message: "Stripe webhook event could not be recorded."
      });
    }
  }

  private async resolveDuplicateWebhookEvent(
    stripeEventId: string
  ): Promise<StripeWebhookProcessResult> {
    try {
      const existingEvent = await this.getPrisma().stripeWebhookEvent.findUnique({
        where: {
          stripeEventId
        },
        select: {
          processedAt: true
        }
      });

      return {
        status: existingEvent?.processedAt ? "duplicate_processed" : "duplicate_in_progress"
      };
    } catch {
      throw new ServiceUnavailableException({
        message: "Stripe webhook event could not be recorded."
      });
    }
  }

  private async processCheckoutSessionCompleted(
    transaction: StripeWebhookTransaction,
    event: VerifiedStripeEvent,
    config: StripeWebhookConfig
  ): Promise<StripeWebhookProcessResult> {
    const session = this.readCheckoutSession(event);

    if (!session) {
      return this.manualReview("invalid_checkout_session_payload");
    }

    const sessionId = this.normalizeOptionalString(session.id);

    if (!sessionId) {
      return this.manualReview("checkout_session_id_missing");
    }

    const orders = await transaction.order.findMany({
      where: {
        stripeCheckoutSessionId: sessionId
      },
      include: {
        items: true
      },
      take: 2
    });

    if (orders.length === 0) {
      return this.manualReview("order_not_found_for_session");
    }

    if (orders.length > 1) {
      return this.manualReview("multiple_orders_for_session");
    }

    const order = orders[0];
    const validationIssue = this.validateSessionForOrder(event, session, order, config);

    if (validationIssue) {
      return this.manualReview(validationIssue);
    }

    const paymentIntentId = this.readStripeId(session.payment_intent);

    if (order.status === "paid") {
      if (this.isAlreadyPaidOrderMatch(order, paymentIntentId)) {
        await this.markWebhookEventProcessed(transaction, event.id, new Date());

        return {
          status: "already_paid"
        };
      }

      return this.manualReview("paid_order_payment_intent_mismatch");
    }

    if (order.status !== "checkout_pending") {
      return this.manualReview("order_not_payable");
    }

    const processedAt = new Date();

    await transaction.order.update({
      where: {
        id: order.id
      },
      data: this.createPaidOrderUpdate(session, paymentIntentId, processedAt)
    });

    await this.markWebhookEventProcessed(transaction, event.id, processedAt);

    return {
      status: "paid"
    };
  }

  private readCheckoutSession(event: VerifiedStripeEvent): StripeCheckoutSessionPayload | null {
    const dataObject = event.data.object;

    if (!this.isRecord(dataObject) || dataObject.object !== "checkout.session") {
      return null;
    }

    return dataObject as unknown as StripeCheckoutSessionPayload;
  }

  private validateSessionForOrder(
    event: VerifiedStripeEvent,
    session: StripeCheckoutSessionPayload,
    order: CheckoutOrder,
    config: StripeWebhookConfig
  ): string | null {
    if (session.id !== order.stripeCheckoutSessionId) {
      return "checkout_session_id_mismatch";
    }

    if (session.client_reference_id !== order.id) {
      return "client_reference_id_mismatch";
    }

    if (session.metadata?.orderId !== order.id) {
      return "metadata_order_id_mismatch";
    }

    if (session.mode !== "payment") {
      return "checkout_session_mode_mismatch";
    }

    if (session.status !== "complete") {
      return "checkout_session_status_not_complete";
    }

    if (session.payment_status !== "paid") {
      return "checkout_session_payment_status_not_paid";
    }

    if (session.currency?.trim().toLowerCase() !== V1_CURRENCY) {
      return "checkout_session_currency_mismatch";
    }

    const stripeTotals = this.createStripeTotalSnapshot(session);
    const totalValidationIssue = this.validateStripeTotalsForOrder(
      stripeTotals,
      order,
      config.stripeTaxEnabled
    );

    if (totalValidationIssue) {
      return totalValidationIssue;
    }

    const shippingDetails = this.readShippingDetails(session);

    if (!shippingDetails) {
      return "checkout_session_shipping_details_missing";
    }

    const shippingCountry = this.normalizeOptionalString(shippingDetails.address.country);

    if (shippingCountry?.toUpperCase() !== "CA") {
      return "checkout_session_shipping_country_mismatch";
    }

    if (order.currency.trim().toLowerCase() !== V1_CURRENCY) {
      return "order_currency_mismatch";
    }

    if (order.totalCents !== order.subtotalCents + order.shippingCents) {
      return "order_total_mismatch";
    }

    if (order.items.length === 0) {
      return "order_items_missing";
    }

    const orderItemSubtotal = order.items.reduce(
      (subtotal, item) => subtotal + item.lineTotalCents,
      0
    );

    if (orderItemSubtotal !== order.subtotalCents) {
      return "order_item_subtotal_mismatch";
    }

    const pricingSnapshotIssue = this.validateOrderPricingSnapshot(order);

    if (pricingSnapshotIssue) {
      return pricingSnapshotIssue;
    }

    if (order.items.some((item) => item.currency.trim().toLowerCase() !== V1_CURRENCY)) {
      return "order_item_currency_mismatch";
    }

    if (!isCanadaShippingRule(order.shippingRule)) {
      return "order_shipping_rule_mismatch";
    }

    const expectedShippingCents = calculateCanadaShippingCents(
      order.subtotalCents,
      order.items,
      order.shippingRule
    );

    if (order.shippingCents !== expectedShippingCents) {
      return "order_shipping_rule_total_mismatch";
    }

    if (typeof config.expectedLivemode === "boolean") {
      if (event.livemode !== config.expectedLivemode) {
        return "stripe_event_livemode_mismatch";
      }

      if (session.livemode !== config.expectedLivemode) {
        return "checkout_session_livemode_mismatch";
      }
    }

    return null;
  }

  private validateOrderPricingSnapshot(order: CheckoutOrder): string | null {
    const isNullRuleWithoutPromotion =
      order.pricingRuleVersion === null &&
      order.discountCents === 0 &&
      order.items.every((item) => item.discountUnitCents === 0 && item.promotionKey === null);
    const isZeroSnapshotLegacyOrder =
      isNullRuleWithoutPromotion &&
      order.listSubtotalCents === 0 &&
      order.items.every((item) => item.listUnitPriceCents === 0);

    if (isZeroSnapshotLegacyOrder) {
      return order.items.every(
        (item) =>
          item.quantity >= 1 &&
          item.unitPriceCents >= 1 &&
          item.unitPriceCents * item.quantity === item.lineTotalCents
      )
        ? null
        : "order_item_pricing_snapshot_mismatch";
    }

    const listSubtotalCents = order.items.reduce(
      (subtotal, item) => subtotal + item.listUnitPriceCents * item.quantity,
      0
    );
    const discountCents = order.items.reduce(
      (discount, item) => discount + item.discountUnitCents * item.quantity,
      0
    );

    if (listSubtotalCents !== order.listSubtotalCents) {
      return "order_item_list_subtotal_mismatch";
    }

    if (discountCents !== order.discountCents) {
      return "order_item_discount_total_mismatch";
    }

    if (order.listSubtotalCents - order.discountCents !== order.subtotalCents) {
      return "order_pricing_total_mismatch";
    }

    for (const item of order.items) {
      if (
        item.quantity < 1 ||
        item.listUnitPriceCents < 1 ||
        item.discountUnitCents < 0 ||
        item.unitPriceCents < 1 ||
        item.listUnitPriceCents - item.discountUnitCents !== item.unitPriceCents ||
        item.unitPriceCents * item.quantity !== item.lineTotalCents
      ) {
        return "order_item_pricing_snapshot_mismatch";
      }

      if (
        item.discountUnitCents > 0
          ? item.promotionKey !== TABLE_ACCESSORIES_PROMOTION_KEY
          : item.promotionKey !== null
      ) {
        return "order_item_promotion_mismatch";
      }
    }

    if (order.pricingRuleVersion === null) {
      return order.discountCents === 0 ? null : "order_legacy_pricing_discount_mismatch";
    }

    if (order.pricingRuleVersion !== TABLE_ACCESSORIES_PRICING_RULE_VERSION) {
      return "order_pricing_rule_version_mismatch";
    }

    const groupedItems = new Map<
      string,
      {
        discountedQuantity: number;
        items: CheckoutOrder["items"];
        listUnitPriceCents: number;
        productKey: string;
        quantity: number;
        variantKey: string | null;
      }
    >();

    for (const item of order.items) {
      const groupKey = `${item.productKey}:${item.variantKey ?? "base"}:${item.listUnitPriceCents}`;
      const group = groupedItems.get(groupKey) ?? {
        discountedQuantity: 0,
        items: [],
        listUnitPriceCents: item.listUnitPriceCents,
        productKey: item.productKey,
        quantity: 0,
        variantKey: item.variantKey
      };

      group.quantity += item.quantity;
      group.discountedQuantity += item.discountUnitCents > 0 ? item.quantity : 0;
      group.items.push(item);
      groupedItems.set(groupKey, group);
    }

    const expectedPricing = calculateTableAccessoryPricing(
      [...groupedItems.entries()].map(([lineId, group]) => ({
        lineId,
        listUnitPriceCents: group.listUnitPriceCents,
        productKey: group.productKey,
        quantity: group.quantity,
        variantKey: group.variantKey
      }))
    );

    if (
      expectedPricing.listSubtotalCents !== order.listSubtotalCents ||
      expectedPricing.discountCents !== order.discountCents ||
      expectedPricing.netSubtotalCents !== order.subtotalCents
    ) {
      return "order_promotion_total_mismatch";
    }

    for (const expectedAllocation of expectedPricing.allocations) {
      const group = groupedItems.get(expectedAllocation.lineId);

      if (
        !group ||
        group.discountedQuantity !== expectedAllocation.discountedQuantity ||
        group.items.some((item) =>
          item.discountUnitCents > 0
            ? item.unitPriceCents !== expectedAllocation.discountedUnitPriceCents
            : item.unitPriceCents !== item.listUnitPriceCents
        )
      ) {
        return "order_promotion_allocation_mismatch";
      }
    }

    return null;
  }

  private createPaidOrderUpdate(
    session: StripeCheckoutSessionPayload,
    paymentIntentId: string | null,
    paidAt: Date
  ): Prisma.OrderUpdateInput {
    const stripeTotals = this.createStripeTotalSnapshot(session);
    const data: Prisma.OrderUpdateInput = {
      paidAt,
      stripeAmountTaxCents: stripeTotals.taxCents,
      stripeAmountTotalCents: stripeTotals.totalCents,
      stripeAutomaticTaxStatus: stripeTotals.automaticTaxStatus,
      taxAmountCents: stripeTotals.taxCents,
      status: "paid"
    };

    const customerId = this.readStripeId(session.customer);
    const customerEmail = this.normalizeOptionalString(session.customer_details?.email);
    const customerName = this.normalizeOptionalString(session.customer_details?.name);
    const customerPhone = this.normalizeOptionalString(session.customer_details?.phone);
    const shippingDetails = this.readShippingDetails(session);

    if (paymentIntentId) {
      data.stripePaymentIntentId = paymentIntentId;
    }

    if (customerId) {
      data.stripeCustomerId = customerId;
    }

    if (customerEmail) {
      data.customerEmail = customerEmail;
    }

    if (customerName) {
      data.customerName = customerName;
    }

    if (customerPhone) {
      data.customerPhone = customerPhone;
      data.shippingPhone = customerPhone;
    }

    if (shippingDetails?.name) {
      data.shippingName = shippingDetails.name;
    }

    if (shippingDetails) {
      data.shippingAddressJson = this.createShippingAddressJson(shippingDetails.address);
    }

    return data;
  }

  private async markWebhookEventProcessed(
    transaction: StripeWebhookTransaction,
    stripeEventId: string,
    processedAt: Date
  ): Promise<void> {
    await transaction.stripeWebhookEvent.update({
      where: {
        stripeEventId
      },
      data: {
        processedAt
      }
    });
  }

  private isAlreadyPaidOrderMatch(order: CheckoutOrder, paymentIntentId: string | null): boolean {
    const existingPaymentIntentId = this.normalizeOptionalString(order.stripePaymentIntentId);

    return existingPaymentIntentId === paymentIntentId;
  }

  private readStripeId(value: unknown): string | null {
    if (typeof value === "string") {
      return this.normalizeOptionalString(value);
    }

    if (this.isRecord(value) && typeof value.id === "string") {
      return this.normalizeOptionalString(value.id);
    }

    return null;
  }

  private readShippingDetails(
    session: StripeCheckoutSessionPayload
  ): ShippingDetailsSnapshot | null {
    const collectedShippingDetails = session.collected_information?.shipping_details;
    const legacyShippingDetails = (session as unknown as Record<string, unknown>).shipping_details;
    const shippingDetails = collectedShippingDetails ?? legacyShippingDetails;

    if (!this.isRecord(shippingDetails) || !this.isRecord(shippingDetails.address)) {
      return null;
    }

    return {
      address: shippingDetails.address,
      name: this.normalizeOptionalString(shippingDetails.name)
    };
  }

  private createShippingAddressJson(address: Record<string, unknown>): Prisma.InputJsonObject {
    const addressJson: Record<string, string> = {};
    const addressFields = ["line1", "line2", "city", "state", "postal_code", "country"];

    for (const field of addressFields) {
      const value = this.normalizeOptionalString(address[field]);

      if (value) {
        addressJson[field] = value;
      }
    }

    return addressJson;
  }

  private createStripeTotalSnapshot(session: StripeCheckoutSessionPayload): StripeTotalSnapshot {
    const totalDetailsShippingCents = this.readOptionalCents(
      session.total_details?.amount_shipping
    );
    const legacyShippingCents = this.readOptionalCents(session.shipping_cost?.amount_total);

    return {
      automaticTaxStatus: this.normalizeOptionalString(session.automatic_tax?.status),
      discountCents: this.readOptionalCents(session.total_details?.amount_discount),
      shippingCents: totalDetailsShippingCents ?? legacyShippingCents,
      subtotalCents: this.readOptionalCents(session.amount_subtotal),
      taxCents: this.readOptionalCents(session.total_details?.amount_tax),
      totalCents: this.readOptionalCents(session.amount_total)
    };
  }

  private validateStripeTotalsForOrder(
    stripeTotals: StripeTotalSnapshot,
    order: CheckoutOrder,
    stripeTaxEnabled: boolean
  ): string | null {
    if (stripeTotals.totalCents === null) {
      return "checkout_session_total_missing";
    }

    if (stripeTotals.subtotalCents === null) {
      return "checkout_session_subtotal_missing";
    }

    if (stripeTotals.subtotalCents !== order.subtotalCents) {
      return "checkout_session_subtotal_mismatch";
    }

    if (stripeTotals.shippingCents === null) {
      return "checkout_session_shipping_cost_missing_amount";
    }

    if (stripeTotals.shippingCents !== order.shippingCents) {
      return "checkout_session_shipping_cost_mismatch";
    }

    if (stripeTotals.discountCents !== null && stripeTotals.discountCents !== 0) {
      return "checkout_session_discount_not_supported";
    }

    if (!stripeTaxEnabled) {
      if (stripeTotals.totalCents !== order.totalCents) {
        return "checkout_session_total_mismatch";
      }

      return null;
    }

    if (stripeTotals.automaticTaxStatus !== "complete") {
      return "checkout_session_automatic_tax_not_complete";
    }

    if (stripeTotals.taxCents === null) {
      return "checkout_session_tax_amount_missing";
    }

    if (stripeTotals.taxCents < 0) {
      return "checkout_session_tax_amount_invalid";
    }

    const expectedStripeTotalCents =
      order.subtotalCents + order.shippingCents + stripeTotals.taxCents;

    if (stripeTotals.totalCents !== expectedStripeTotalCents) {
      return "checkout_session_tax_inclusive_total_mismatch";
    }

    return null;
  }

  private readOptionalCents(value: unknown): number | null {
    return typeof value === "number" && Number.isInteger(value) ? value : null;
  }

  private normalizeOptionalString(value: unknown): string | null {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();

    return normalized || null;
  }

  private manualReview(reason: string): StripeWebhookProcessResult {
    return {
      reason,
      status: "manual_review"
    };
  }

  private logWebhookResult(event: VerifiedStripeEvent, result: StripeWebhookProcessResult): void {
    const baseMessage = `Stripe webhook ${result.status}: eventId=${event.id} eventType=${event.type}`;

    if (result.reason) {
      this.logger.warn(`${baseMessage} reason=${result.reason}`);
      return;
    }

    this.logger.log(baseMessage);
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
          message: "Stripe webhook database is not configured."
        });
      }
    }

    return this.prisma;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return this.isRecord(error) && error.code === "P2002";
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
