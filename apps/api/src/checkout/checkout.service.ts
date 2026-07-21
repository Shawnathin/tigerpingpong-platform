import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  OnModuleDestroy,
  ServiceUnavailableException
} from "@nestjs/common";
import { createDatabaseConfig, Prisma, PrismaClient } from "@tigerpingpong/db";
import {
  calculateCanadaShippingCents,
  CURRENT_CANADA_SHIPPING_RULE,
  CURRENT_CANADA_SHIPPING_RULE_VERSION
} from "@tigerpingpong/shared";
import Stripe from "stripe";

import { CheckoutConfig, getCheckoutConfig } from "../config";

const CHECKOUT_SOURCE = "tigerpingpong-web";
const MAX_ITEMS = 20;
const MAX_QUANTITY_PER_LINE = 10;
const STRIPE_CHECKOUT_SOURCE = "stripe_checkout";
const STRIPE_TAX_BEHAVIOR = "exclusive" as const;
const V1_CURRENCY = "cad";
const CHECKOUT_PURCHASE_MODES = new Set(["online_checkout", "online_checkout_candidate"]);
const NON_CHECKOUT_VARIANT_PURCHASE_MODES = new Set(["deferred_from_v1", "disabled"]);

interface CheckoutRequestSelectedOption {
  name: string;
  value: string;
}

interface CheckoutRequestItem {
  expectedUnitPriceCents: number | null;
  productSlug: string;
  quantity: number;
  selectedVariantKey: string | null;
  selectedOptions: CheckoutRequestSelectedOption[];
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

interface ValidatedLineItemOption {
  displayName: string;
  label: string;
  name: string;
  value: string;
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

type CheckoutSessionPublicStatus =
  | "canceled"
  | "checkout_failed"
  | "checkout_pending"
  | "expired"
  | "manual_review"
  | "not_found"
  | "paid";

interface CheckoutSessionStatusResponse {
  found: boolean;
  status: CheckoutSessionPublicStatus;
  publicReference?: string;
  currency?: string;
  subtotalCents?: number;
  shippingCents?: number;
  totalCents?: number;
  taxAmountCents?: number;
  stripeAmountTotalCents?: number;
  stripeAmountTaxCents?: number;
  stripeAutomaticTaxStatus?: string;
  customerEmail?: string;
  paidAt?: string;
  createdAt?: string;
  message?: string;
}

type CreatedCheckoutOrder = Prisma.OrderGetPayload<{
  include: {
    items: true;
  };
}>;

const checkoutStatusOrderSelect = {
  status: true,
  publicReference: true,
  currency: true,
  subtotalCents: true,
  shippingCents: true,
  totalCents: true,
  taxAmountCents: true,
  stripeAmountTotalCents: true,
  stripeAmountTaxCents: true,
  stripeAutomaticTaxStatus: true,
  customerEmail: true,
  paidAt: true,
  createdAt: true
} satisfies Prisma.OrderSelect;

type CheckoutStatusOrder = Prisma.OrderGetPayload<{
  select: typeof checkoutStatusOrderSelect;
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
  },
  variants: {
    where: {
      isActive: true
    },
    orderBy: [
      {
        name: "asc"
      },
      {
        key: "asc"
      }
    ],
    select: {
      id: true,
      key: true,
      sku: true,
      name: true,
      priceCents: true,
      currency: true,
      purchaseModeOverride: true,
      isActive: true,
      optionValues: {
        select: {
          productOptionValue: {
            select: {
              value: true,
              label: true,
              sortOrder: true,
              option: {
                select: {
                  name: true,
                  displayName: true,
                  sortOrder: true
                }
              }
            }
          }
        }
      }
    }
  }
} satisfies Prisma.ProductSelect;

type CheckoutProductRecord = Prisma.ProductGetPayload<{
  select: typeof checkoutProductSelect;
}>;

type CheckoutProductVariantRecord = CheckoutProductRecord["variants"][number];

interface ValidatedLineItemOptions {
  selectedOptions: ValidatedLineItemOption[];
  variant: CheckoutProductVariantRecord | null;
}

interface RequiredVariantOption {
  displayName: string;
  name: string;
  sortOrder: number;
  values: Map<string, { label: string; sortOrder: number; value: string }>;
}

@Injectable()
export class CheckoutService implements OnModuleDestroy {
  private prisma: PrismaClient | null = null;
  private stripe: ReturnType<typeof Stripe> | null = null;
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

  async getCheckoutSessionStatus(sessionIdParam: string): Promise<CheckoutSessionStatusResponse> {
    const sessionId = this.validateCheckoutSessionId(sessionIdParam);

    try {
      const order = await this.getPrisma().order.findUnique({
        where: {
          stripeCheckoutSessionId: sessionId
        },
        select: checkoutStatusOrderSelect
      });

      if (!order) {
        return {
          found: false,
          status: "not_found"
        };
      }

      return this.toCheckoutSessionStatusResponse(order);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new ServiceUnavailableException({
        message: "Checkout status is unavailable."
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

    const seenLineKeys = new Set<string>();
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

      const selectedOptions = this.validateSelectedOptions(item.selectedOptions, index);
      const lineKey = this.getRequestLineKey(productSlug, selectedOptions);

      if (seenLineKeys.has(lineKey)) {
        throw new BadRequestException({
          message: "Duplicate cart lines are not supported for V1 checkout."
        });
      }

      seenLineKeys.add(lineKey);

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
        expectedUnitPriceCents: this.validateExpectedUnitPriceCents(
          item.expectedUnitPriceCents,
          index
        ),
        productSlug,
        quantity,
        selectedVariantKey: this.validateSelectedVariantKey(item.selectedVariantKey, index),
        selectedOptions
      };
    });

    return {
      customerEmail: this.validateCustomerEmail(body.customerEmail),
      items
    };
  }

  private validateExpectedUnitPriceCents(value: unknown, itemIndex: number): number | null {
    if (value === undefined || value === null) {
      return null;
    }
    if (
      typeof value !== "number" ||
      !Number.isSafeInteger(value) ||
      value < 1 ||
      value > 99_999_999
    ) {
      throw new BadRequestException({
        message: `items[${itemIndex}].expectedUnitPriceCents must be a positive integer.`
      });
    }
    return value;
  }

  private validateSelectedOptions(
    value: unknown,
    itemIndex: number
  ): CheckoutRequestSelectedOption[] {
    if (value === undefined || value === null) {
      return [];
    }

    if (!Array.isArray(value)) {
      throw new BadRequestException({
        message: `items[${itemIndex}].selectedOptions must be an array.`
      });
    }

    if (value.length > 4) {
      throw new BadRequestException({
        message: `items[${itemIndex}].selectedOptions cannot include more than 4 options.`
      });
    }

    const selectedOptions: CheckoutRequestSelectedOption[] = [];
    const seenOptionNames = new Set<string>();

    for (const [optionIndex, selectedOption] of value.entries()) {
      if (!this.isRecord(selectedOption)) {
        throw new BadRequestException({
          message: `items[${itemIndex}].selectedOptions[${optionIndex}] must be an object.`
        });
      }

      const name = this.validateOptionText(
        selectedOption.name,
        `items[${itemIndex}].selectedOptions[${optionIndex}].name`
      );
      const optionValue = this.validateOptionText(
        selectedOption.value,
        `items[${itemIndex}].selectedOptions[${optionIndex}].value`
      );
      const normalizedName = this.normalizeOptionKey(name);

      if (seenOptionNames.has(normalizedName)) {
        throw new BadRequestException({
          message: `items[${itemIndex}].selectedOptions includes duplicate option names.`
        });
      }

      seenOptionNames.add(normalizedName);
      selectedOptions.push({
        name,
        value: optionValue
      });
    }

    return selectedOptions.sort((left, right) =>
      this.normalizeOptionKey(left.name).localeCompare(this.normalizeOptionKey(right.name))
    );
  }

  private validateOptionText(value: unknown, path: string): string {
    if (typeof value !== "string") {
      throw new BadRequestException({
        message: `${path} must be a string.`
      });
    }

    const normalized = value.trim();

    if (
      !normalized ||
      normalized.length > 80 ||
      !/^[A-Za-z0-9][A-Za-z0-9 .,_/-]*$/.test(normalized)
    ) {
      throw new BadRequestException({
        message: `${path} is invalid.`
      });
    }

    return normalized;
  }

  private validateSelectedVariantKey(value: unknown, itemIndex: number): string | null {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    if (typeof value !== "string") {
      throw new BadRequestException({
        message: `items[${itemIndex}].selectedVariantKey must be a string.`
      });
    }

    const variantKey = value.trim();

    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(variantKey)) {
      throw new BadRequestException({
        message: `items[${itemIndex}].selectedVariantKey is invalid.`
      });
    }

    return variantKey;
  }

  private getRequestLineKey(
    productSlug: string,
    selectedOptions: CheckoutRequestSelectedOption[]
  ): string {
    const optionSignature = selectedOptions
      .map(
        (selectedOption) =>
          `${this.normalizeOptionKey(selectedOption.name)}=${this.normalizeOptionKey(
            selectedOption.value
          )}`
      )
      .join("&");

    return optionSignature ? `${productSlug}::${optionSignature}` : productSlug;
  }

  private formatSelectedOptions(selectedOptions: ValidatedLineItemOption[]): string {
    return selectedOptions
      .map((selectedOption) => `${selectedOption.displayName}: ${selectedOption.label}`)
      .join(", ");
  }

  private normalizeOptionKey(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, "-");
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

  private validateCheckoutSessionId(value: string): string {
    const sessionId = value.trim();

    if (!/^cs_(test|live)_[A-Za-z0-9_]{3,255}$/.test(sessionId)) {
      throw new BadRequestException({
        message: "sessionId is invalid."
      });
    }

    return sessionId;
  }

  private toCheckoutSessionStatusResponse(
    order: CheckoutStatusOrder
  ): CheckoutSessionStatusResponse {
    const status = this.toPublicOrderStatus(order.status);

    return {
      found: true,
      status,
      publicReference: order.publicReference,
      currency: order.currency.trim().toLowerCase(),
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      totalCents: order.totalCents,
      taxAmountCents: order.taxAmountCents ?? undefined,
      stripeAmountTotalCents: order.stripeAmountTotalCents ?? undefined,
      stripeAmountTaxCents: order.stripeAmountTaxCents ?? undefined,
      stripeAutomaticTaxStatus: order.stripeAutomaticTaxStatus ?? undefined,
      customerEmail: order.customerEmail ?? undefined,
      paidAt: order.paidAt?.toISOString(),
      createdAt: order.createdAt.toISOString(),
      message: this.getStatusMessage(status)
    };
  }

  private toPublicOrderStatus(status: string): CheckoutSessionPublicStatus {
    if (
      status === "checkout_pending" ||
      status === "checkout_failed" ||
      status === "paid" ||
      status === "canceled" ||
      status === "expired"
    ) {
      return status;
    }

    return "manual_review";
  }

  private getStatusMessage(status: CheckoutSessionPublicStatus): string {
    switch (status) {
      case "paid":
        return "Payment is confirmed by backend order state.";
      case "checkout_pending":
        return "Payment confirmation is still pending.";
      case "checkout_failed":
        return "Checkout did not complete successfully.";
      case "canceled":
        return "Checkout was canceled.";
      case "expired":
        return "Checkout session expired.";
      case "manual_review":
        return "Order status needs support review.";
      case "not_found":
        return "No matching order was found.";
    }
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
    const snapshotItems: SnapshotLineItem[] = [];
    const cartChanges: Array<{
      cartLineId: string;
      currency?: string;
      name?: string;
      status: "price_changed" | "unavailable";
      unitPriceCents?: number;
    }> = [];

    for (const item of requestItems) {
      const product = productsBySlug.get(item.productSlug);
      const cartLineId = this.getRequestLineKey(item.productSlug, item.selectedOptions);

      if (!product || !this.isProductCheckoutable(product)) {
        if (item.expectedUnitPriceCents !== null) {
          cartChanges.push({ cartLineId, status: "unavailable" });
          continue;
        }
        throw new BadRequestException({
          message: "One or more requested items are unavailable for checkout."
        });
      }

      let optionValidation: ValidatedLineItemOptions;
      try {
        optionValidation = this.validateLineItemOptions(item, product);
      } catch (error) {
        if (item.expectedUnitPriceCents !== null && error instanceof BadRequestException) {
          cartChanges.push({ cartLineId, status: "unavailable" });
          continue;
        }
        throw error;
      }
      const unitPriceCents = this.resolveUnitPriceCents(product, optionValidation.variant);

      if (
        typeof unitPriceCents !== "number" ||
        !Number.isInteger(unitPriceCents) ||
        unitPriceCents <= 0
      ) {
        if (item.expectedUnitPriceCents !== null) {
          cartChanges.push({ cartLineId, status: "unavailable" });
          continue;
        }
        throw new BadRequestException({
          message: "One or more requested items are unavailable for checkout."
        });
      }

      const lineTotalCents = unitPriceCents * item.quantity;
      const optionSummary = this.formatSelectedOptions(optionValidation.selectedOptions);
      const displayName = optionSummary ? `${product.name} (${optionSummary})` : product.name;

      if (item.expectedUnitPriceCents !== null && item.expectedUnitPriceCents !== unitPriceCents) {
        cartChanges.push({
          cartLineId,
          currency: "CAD",
          name: product.name,
          status: "price_changed",
          unitPriceCents
        });
      }

      snapshotItems.push({
        productId: product.id,
        variantId: optionValidation.variant?.id ?? null,
        productKey: product.key,
        productSlug: product.slug,
        variantKey: optionValidation.variant?.key ?? null,
        sku: optionValidation.variant?.sku ?? product.sku,
        name: displayName,
        imageUrl: this.getProductImageUrl(product),
        unitPriceCents,
        quantity: item.quantity,
        lineTotalCents,
        currency: "CAD"
      });
    }

    if (cartChanges.length > 0) {
      throw new ConflictException({
        code: "cart_changed",
        message: "Your cart changed. Review the updated items before checking out.",
        items: cartChanges
      });
    }

    return snapshotItems;
  }

  private validateLineItemOptions(
    item: CheckoutRequestItem,
    product: CheckoutProductRecord
  ): ValidatedLineItemOptions {
    const requiredOptions = this.getRequiredVariantOptions(product);

    if (requiredOptions.length === 0) {
      if (item.selectedOptions.length > 0) {
        throw new BadRequestException({
          message: "Selected options are not supported for one or more requested items."
        });
      }

      if (item.selectedVariantKey) {
        throw new BadRequestException({
          message: "A selected product variant is invalid."
        });
      }

      return {
        selectedOptions: [],
        variant: null
      };
    }

    if (item.selectedOptions.length !== requiredOptions.length) {
      throw new BadRequestException({
        message: "A required product option is missing."
      });
    }

    const requiredOptionsByName = new Map(
      requiredOptions.map((option) => [this.normalizeOptionKey(option.name), option])
    );
    const selectedOptionsByName = new Map(
      item.selectedOptions.map((option) => [this.normalizeOptionKey(option.name), option])
    );
    const selectedOptions: ValidatedLineItemOption[] = [];

    for (const selectedOption of item.selectedOptions) {
      if (!requiredOptionsByName.has(this.normalizeOptionKey(selectedOption.name))) {
        throw new BadRequestException({
          message: "A selected product option is invalid."
        });
      }
    }

    for (const requiredOption of requiredOptions) {
      const selectedOption = selectedOptionsByName.get(
        this.normalizeOptionKey(requiredOption.name)
      );

      if (!selectedOption) {
        throw new BadRequestException({
          message: "A required product option is missing."
        });
      }

      const canonicalValue = requiredOption.values.get(
        this.normalizeOptionKey(selectedOption.value)
      );

      if (!canonicalValue) {
        throw new BadRequestException({
          message: "A selected product option value is invalid."
        });
      }

      selectedOptions.push({
        displayName: requiredOption.displayName,
        label: canonicalValue.label,
        name: requiredOption.name,
        value: canonicalValue.value
      });
    }

    const matchingVariants = product.variants
      .filter((variant) => this.isVariantCheckoutable(variant))
      .filter((variant) => this.variantMatchesSelectedOptions(variant, selectedOptionsByName));

    if (matchingVariants.length !== 1) {
      throw new BadRequestException({
        message: "A selected product option could not be matched to a checkout variant."
      });
    }

    const matchedVariant = matchingVariants[0];

    if (item.selectedVariantKey && item.selectedVariantKey !== matchedVariant.key) {
      throw new BadRequestException({
        message: "A selected product variant is invalid."
      });
    }

    return {
      selectedOptions,
      variant: matchedVariant
    };
  }

  private getRequiredVariantOptions(product: CheckoutProductRecord): RequiredVariantOption[] {
    const checkoutableVariants = product.variants.filter((variant) =>
      this.isVariantCheckoutable(variant)
    );
    const optionsByName = new Map<string, RequiredVariantOption & { variantCount: number }>();

    for (const variant of checkoutableVariants) {
      const optionNamesSeenForVariant = new Set<string>();

      for (const { productOptionValue } of variant.optionValues) {
        const normalizedName = this.normalizeOptionKey(productOptionValue.option.name);
        const normalizedValue = this.normalizeOptionKey(productOptionValue.value);

        if (!normalizedName || !normalizedValue || optionNamesSeenForVariant.has(normalizedName)) {
          continue;
        }

        const option = optionsByName.get(normalizedName) ?? {
          displayName: this.getOptionDisplayName(
            product,
            productOptionValue.option.name,
            productOptionValue.option.displayName
          ),
          name: productOptionValue.option.name,
          sortOrder: productOptionValue.option.sortOrder,
          values: new Map<string, { label: string; sortOrder: number; value: string }>(),
          variantCount: 0
        };

        if (!option.values.has(normalizedValue)) {
          option.values.set(normalizedValue, {
            label: productOptionValue.label ?? productOptionValue.value,
            sortOrder: productOptionValue.sortOrder,
            value: productOptionValue.value
          });
        }

        option.variantCount += 1;
        optionNamesSeenForVariant.add(normalizedName);
        optionsByName.set(normalizedName, option);
      }
    }

    return [...optionsByName.values()]
      .filter(
        (option) =>
          option.variantCount === checkoutableVariants.length &&
          option.values.size > 1 &&
          this.isRequiredCheckoutOption(product, checkoutableVariants, option)
      )
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((option) => ({
        displayName: option.displayName,
        name: option.name,
        sortOrder: option.sortOrder,
        values: option.values
      }));
  }

  private isRequiredCheckoutOption(
    product: CheckoutProductRecord,
    variants: CheckoutProductVariantRecord[],
    option: RequiredVariantOption
  ): boolean {
    if (product.productKind === "table" && this.normalizeOptionKey(option.name) === "color") {
      return true;
    }

    const distinctPrices = new Set<number>();

    for (const variant of variants) {
      const hasOptionValue = variant.optionValues.some(
        ({ productOptionValue }) =>
          this.normalizeOptionKey(productOptionValue.option.name) ===
            this.normalizeOptionKey(option.name) &&
          option.values.has(this.normalizeOptionKey(productOptionValue.value))
      );

      if (!hasOptionValue || !this.isValidPriceCents(variant.priceCents)) {
        return false;
      }

      distinctPrices.add(variant.priceCents);
    }

    return distinctPrices.size > 1;
  }

  private isValidPriceCents(value: unknown): value is number {
    return typeof value === "number" && Number.isInteger(value) && value > 0;
  }

  private getOptionDisplayName(
    product: CheckoutProductRecord,
    optionName: string,
    displayName: string | null
  ): string {
    if (product.productKind === "table" && this.normalizeOptionKey(optionName) === "color") {
      return "Top colour";
    }

    return displayName?.trim() || this.formatOptionLabel(optionName);
  }

  private formatOptionLabel(value: string): string {
    return value
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  private variantMatchesSelectedOptions(
    variant: CheckoutProductVariantRecord,
    selectedOptionsByName: Map<string, CheckoutRequestSelectedOption>
  ): boolean {
    return [...selectedOptionsByName.entries()].every(([selectedName, selectedOption]) =>
      variant.optionValues.some(
        ({ productOptionValue }) =>
          this.normalizeOptionKey(productOptionValue.option.name) === selectedName &&
          this.normalizeOptionKey(productOptionValue.value) ===
            this.normalizeOptionKey(selectedOption.value)
      )
    );
  }

  private resolveUnitPriceCents(
    product: CheckoutProductRecord,
    variant: CheckoutProductVariantRecord | null
  ): number | null {
    if (!variant) {
      return product.priceCents;
    }

    const currency = variant.currency.trim().toLowerCase();

    if (currency !== V1_CURRENCY) {
      return null;
    }

    if (this.isValidPriceCents(variant.priceCents)) {
      return variant.priceCents;
    }

    return product.productKind === "table" ? product.priceCents : null;
  }

  private isVariantCheckoutable(variant: CheckoutProductVariantRecord): boolean {
    return (
      variant.isActive &&
      (variant.purchaseModeOverride === null ||
        !NON_CHECKOUT_VARIANT_PURCHASE_MODES.has(variant.purchaseModeOverride))
    );
  }

  private isProductCheckoutable(product: CheckoutProductRecord): boolean {
    const currency = product.currency.trim().toLowerCase();

    return (
      product.status === "active" &&
      product.v1PublicNavigation &&
      product.v1CheckoutScope &&
      CHECKOUT_PURCHASE_MODES.has(product.purchaseMode) &&
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
    const shippingCents = calculateCanadaShippingCents(subtotalCents, items);

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
            shippingRule: CURRENT_CANADA_SHIPPING_RULE,
            checkoutSource: STRIPE_CHECKOUT_SOURCE,
            customerEmail,
            items: {
              create: items.map((item) => ({
                product: {
                  connect: {
                    id: item.productId
                  }
                },
                ...(item.variantId
                  ? {
                      variant: {
                        connect: {
                          id: item.variantId
                        }
                      }
                    }
                  : {}),
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
    const sessionParams = {
      mode: "payment" as const,
      ...(config.stripeTaxEnabled
        ? {
            automatic_tax: {
              enabled: true
            }
          }
        : {}),
      line_items: order.items.map((item) => this.createStripeLineItem(config, item)),
      shipping_address_collection: {
        allowed_countries: ["CA" as const]
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount" as const,
            fixed_amount: {
              amount: order.shippingCents,
              currency: V1_CURRENCY
            },
            display_name:
              order.shippingCents === 0
                ? "Standard shipping \u2014 Free"
                : "Standard shipping \u2014 $15",
            ...(config.stripeTaxEnabled
              ? {
                  tax_behavior: STRIPE_TAX_BEHAVIOR
                }
              : {})
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
          website: "tigerpingpong",
          environment: config.appEnv
        }
      },
      customer_email: order.customerEmail ?? undefined
    };

    return stripe.checkout.sessions.create(sessionParams, {
      idempotencyKey: `checkout_session_create:${order.id}`
    });
  }

  private createStripeLineItem(
    config: CheckoutConfig,
    item: CreatedCheckoutOrder["items"][number]
  ) {
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
        product_data: productData,
        ...(config.stripeTaxEnabled
          ? {
              tax_behavior: STRIPE_TAX_BEHAVIOR
            }
          : {})
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
      website: "tigerpingpong",
      environment: config.appEnv,
      shippingRuleVersion: CURRENT_CANADA_SHIPPING_RULE_VERSION,
      subtotalCents: String(order.subtotalCents),
      shippingCents: String(order.shippingCents),
      totalCents: String(order.totalCents),
      stripeTaxEnabled: config.stripeTaxEnabled ? "true" : "false"
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

  private getStripe(secretKey: string): ReturnType<typeof Stripe> {
    if (!this.stripe || this.stripeSecretKey !== secretKey) {
      this.stripe = new Stripe(secretKey, {
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
