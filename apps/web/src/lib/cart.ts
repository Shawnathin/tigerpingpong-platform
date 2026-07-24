import {
  calculateCanadaShippingCents,
  calculateTableAccessoryPricing,
  CANADA_FLAT_RATE_SHIPPING_CENTS,
  CANADA_FREE_SHIPPING_THRESHOLD_CENTS,
  isAquaFourPackShippingItem,
  type CanadaShippingItem,
  type TableAccessoryPricingResult
} from "@tigerpingpong/shared";

import {
  AQUA_FOUR_PACK_FREE_SHIPPING_COPY,
  V1_FLAT_RATE_SHIPPING_COPY,
  V1_FREE_SHIPPING_COPY
} from "./shipping";
import {
  getVicePackageShopperLabel,
  VICE_BUNDLE_OPTION_VALUE,
  VICE_BUNDLE_SHOPPER_LABEL,
  VICE_PACKAGE_OPTION_NAME,
  VICE_PRODUCT_SLUG,
  VICE_SINGLE_OPTION_VALUE,
  VICE_SINGLE_SHOPPER_LABEL,
  VICE_SINGLE_VARIANT_KEY
} from "./vice-package";

export const CART_STORAGE_KEY = "tigerpingpong.cart.v1";
export const CART_CHANGE_EVENT = "tigerpingpong:cart-change";
export const FLAT_SHIPPING_CENTS = CANADA_FLAT_RATE_SHIPPING_CENTS;
export const FREE_SHIPPING_THRESHOLD_CENTS = CANADA_FREE_SHIPPING_THRESHOLD_CENTS;
export const MAX_CART_QUANTITY_PER_LINE = 10;

export interface CartItem {
  cartLineId: string;
  categoryName?: string;
  currency: string;
  imageUrl: string | null;
  name: string;
  productKey: string;
  productKind?: string;
  productSlug: string;
  quantity: number;
  selectedVariantKey?: string;
  selectedOptions: CartItemOption[];
  unitPriceCents: number;
}

export interface CartProductInput {
  categoryName?: string;
  currency: string;
  imageUrl: string | null;
  name: string;
  productKey: string;
  productKind?: string;
  productSlug: string;
  selectedVariantKey?: string;
  selectedOptions?: CartItemOption[];
  unitPriceCents: number;
}

export interface CartItemOption {
  displayName: string;
  label: string;
  name: string;
  value: string;
}

export interface CartReconciliationItem {
  cartLineId: string;
  currency?: string;
  name?: string;
  status: "price_changed" | "unavailable";
  unitPriceCents?: number;
}

export interface CartPricingDelta {
  addedListSubtotalCents: number;
  additionalDiscountCents: number;
  additionalNetSubtotalCents: number;
  projectedPricing: TableAccessoryPricingResult;
}

interface StoredCart {
  items?: unknown;
  version?: unknown;
}

export function getCartSnapshot(): string {
  return JSON.stringify(readCartItems());
}

export function readCartItems(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!rawCart) {
      return [];
    }

    const parsed = JSON.parse(rawCart) as unknown;
    const storedItems = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray((parsed as StoredCart).items)
        ? (parsed as StoredCart).items
        : [];

    return sanitizeCartItems(storedItems);
  } catch {
    return [];
  }
}

export function subscribeCart(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === CART_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener(CART_CHANGE_EVENT, listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CART_CHANGE_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function addCartItem(product: CartProductInput, quantity = 1): CartItem[] {
  const items = readCartItems();
  const productSlug = product.productSlug.trim().toLowerCase();
  const selectedOptions = sanitizeCartItemOptions(product.selectedOptions);
  const cartLineId = getCartLineId(productSlug, selectedOptions);
  const existingIndex = items.findIndex((item) => item.cartLineId === cartLineId);
  const nextQuantity = normalizeQuantity(quantity);

  if (existingIndex >= 0) {
    const existingItem = items[existingIndex];

    items[existingIndex] = {
      ...existingItem,
      categoryName: product.categoryName,
      currency: normalizeCurrency(product.currency),
      imageUrl: normalizeImageUrl(product.imageUrl),
      name: product.name.trim() || existingItem.name,
      productKey: normalizeProductKey(product.productKey, productSlug),
      productKind: product.productKind,
      quantity: Math.min(existingItem.quantity + nextQuantity, MAX_CART_QUANTITY_PER_LINE),
      selectedVariantKey: normalizeOptionalText(product.selectedVariantKey),
      selectedOptions,
      unitPriceCents: normalizePrice(product.unitPriceCents)
    };
  } else {
    items.push({
      cartLineId,
      categoryName: product.categoryName,
      currency: normalizeCurrency(product.currency),
      imageUrl: normalizeImageUrl(product.imageUrl),
      name: product.name.trim(),
      productKey: normalizeProductKey(product.productKey, productSlug),
      productKind: product.productKind,
      productSlug,
      quantity: nextQuantity,
      selectedVariantKey: normalizeOptionalText(product.selectedVariantKey),
      selectedOptions,
      unitPriceCents: normalizePrice(product.unitPriceCents)
    });
  }

  return writeCartItems(items);
}

export function updateCartItemQuantity(cartLineId: string, quantity: number): CartItem[] {
  const normalizedCartLineId = normalizeCartLineId(cartLineId);
  const nextItems = readCartItems()
    .map((item) =>
      item.cartLineId === normalizedCartLineId
        ? {
            ...item,
            quantity: normalizeQuantity(quantity)
          }
        : item
    )
    .filter((item) => item.quantity > 0);

  return writeCartItems(nextItems);
}

export function removeCartItem(cartLineId: string): CartItem[] {
  const normalizedCartLineId = normalizeCartLineId(cartLineId);
  return writeCartItems(readCartItems().filter((item) => item.cartLineId !== normalizedCartLineId));
}

export function reconcileCartItems(changes: CartReconciliationItem[]): CartItem[] {
  const changesByLine = new Map(changes.map((change) => [change.cartLineId, change]));
  const nextItems = readCartItems().flatMap((item) => {
    const change = changesByLine.get(item.cartLineId);
    if (!change) return [item];
    if (change.status === "unavailable") return [];
    if (!change.unitPriceCents || !Number.isInteger(change.unitPriceCents)) return [item];
    return [
      {
        ...item,
        currency: normalizeCurrency(change.currency ?? item.currency),
        name: change.name?.trim() || item.name,
        unitPriceCents: change.unitPriceCents
      }
    ];
  });
  return writeCartItems(nextItems);
}

export function clearCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    return [];
  }

  emitCartChange();
  return [];
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

export function getCartSubtotalCents(items: CartItem[]): number {
  return items.reduce((subtotal, item) => subtotal + item.unitPriceCents * item.quantity, 0);
}

export function getCartPricing(items: readonly CartItem[]): TableAccessoryPricingResult {
  return calculateTableAccessoryPricing(
    items.map((item) => ({
      lineId: item.cartLineId,
      listUnitPriceCents: item.unitPriceCents,
      productKey: item.productKey,
      productKind: item.productKind,
      quantity: item.quantity,
      variantKey: item.selectedVariantKey
    }))
  );
}

export function getCartPricingDelta(
  items: readonly CartItem[],
  additions: readonly CartProductInput[]
): CartPricingDelta {
  const projectedItems = items.map((item) => ({ ...item }));
  let addedListSubtotalCents = 0;

  for (const addition of additions) {
    const selectedOptions = sanitizeCartItemOptions(addition.selectedOptions);
    const cartLineId = getCartLineId(addition.productSlug, selectedOptions);
    const existingItem = projectedItems.find((item) => item.cartLineId === cartLineId);
    const liveUnitPriceCents = normalizePrice(addition.unitPriceCents);

    if (existingItem) {
      existingItem.categoryName = addition.categoryName;
      existingItem.currency = normalizeCurrency(addition.currency);
      existingItem.imageUrl = normalizeImageUrl(addition.imageUrl);
      existingItem.name = addition.name.trim() || existingItem.name;
      existingItem.productKey = normalizeProductKey(addition.productKey, addition.productSlug);
      existingItem.productKind = addition.productKind;
      existingItem.selectedOptions = selectedOptions;
      existingItem.selectedVariantKey = normalizeOptionalText(addition.selectedVariantKey);
      existingItem.unitPriceCents = liveUnitPriceCents;

      if (existingItem.quantity >= MAX_CART_QUANTITY_PER_LINE) {
        continue;
      }

      existingItem.quantity += 1;
      addedListSubtotalCents += liveUnitPriceCents;
      continue;
    }

    projectedItems.push({
      cartLineId,
      categoryName: addition.categoryName,
      currency: normalizeCurrency(addition.currency),
      imageUrl: normalizeImageUrl(addition.imageUrl),
      name: addition.name,
      productKey: normalizeProductKey(addition.productKey, addition.productSlug),
      productKind: addition.productKind,
      productSlug: addition.productSlug.trim().toLowerCase(),
      quantity: 1,
      selectedOptions,
      selectedVariantKey: normalizeOptionalText(addition.selectedVariantKey),
      unitPriceCents: liveUnitPriceCents
    });
    addedListSubtotalCents += liveUnitPriceCents;
  }

  const currentPricing = getCartPricing(items);
  const projectedPricing = getCartPricing(projectedItems);

  return {
    addedListSubtotalCents,
    additionalDiscountCents: projectedPricing.discountCents - currentPricing.discountCents,
    additionalNetSubtotalCents: projectedPricing.netSubtotalCents - currentPricing.netSubtotalCents,
    projectedPricing
  };
}

export function getCartShippingCents(
  subtotalCents: number,
  items: readonly CartItem[] = []
): number {
  return calculateCanadaShippingCents(subtotalCents, toCanadaShippingItems(items));
}

export function getCartShippingCopy(
  subtotalCents: number,
  items: readonly CartItem[] = []
): string {
  const shippingItems = toCanadaShippingItems(items);

  if (shippingItems.length > 0 && shippingItems.every(isAquaFourPackShippingItem)) {
    return AQUA_FOUR_PACK_FREE_SHIPPING_COPY;
  }

  return subtotalCents > FREE_SHIPPING_THRESHOLD_CENTS
    ? V1_FREE_SHIPPING_COPY
    : V1_FLAT_RATE_SHIPPING_COPY;
}

export function formatCartMoney(cents: number, currency = "CAD"): string {
  return new Intl.NumberFormat("en-CA", {
    currency,
    style: "currency"
  }).format(cents / 100);
}

export function formatCartItemOptions(options: CartItemOption[]): string {
  return options.map((option) => `${option.displayName}: ${option.label}`).join(", ");
}

export function getCartLineId(productSlug: string, selectedOptions: CartItemOption[]): string {
  const normalizedSlug = productSlug.trim().toLowerCase();
  const optionSignature = sanitizeCartItemOptions(selectedOptions)
    .map((option) => `${normalizeOptionKey(option.name)}=${normalizeOptionKey(option.value)}`)
    .join("&");

  return optionSignature ? `${normalizedSlug}::${optionSignature}` : normalizedSlug;
}

function toCanadaShippingItems(items: readonly CartItem[]): CanadaShippingItem[] {
  return items.map((item) => ({
    productSlug: item.productSlug,
    variantKey: item.selectedVariantKey
  }));
}

function writeCartItems(items: CartItem[]): CartItem[] {
  const sanitizedItems = sanitizeCartItems(items);

  if (typeof window === "undefined") {
    return sanitizedItems;
  }

  try {
    if (sanitizedItems.length === 0) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({
          version: 1,
          items: sanitizedItems
        })
      );
    }
  } catch {
    return sanitizedItems;
  }

  emitCartChange();
  return sanitizedItems;
}

function emitCartChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_CHANGE_EVENT));
  }
}

function sanitizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: CartItem[] = [];
  const cartLinesById = new Map<string, { index: number; wasLegacyViceLine: boolean }>();

  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }

    const productSlug =
      typeof item.productSlug === "string" ? item.productSlug.trim().toLowerCase() : "";
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const unitPriceCents = normalizePrice(item.unitPriceCents);
    const quantity = normalizeQuantity(item.quantity);
    let selectedOptions = sanitizeCartItemOptions(
      productSlug === VICE_PRODUCT_SLUG
        ? canonicalizeStoredVicePackageOptions(item.selectedOptions)
        : item.selectedOptions
    );
    let selectedVariantKey = normalizeOptionalText(item.selectedVariantKey);
    const wasLegacyViceLine =
      productSlug === VICE_PRODUCT_SLUG &&
      !selectedOptions.some(
        (option) => normalizeOptionKey(option.name) === normalizeOptionKey(VICE_PACKAGE_OPTION_NAME)
      );

    if (wasLegacyViceLine) {
      selectedOptions = sanitizeCartItemOptions([
        ...selectedOptions,
        {
          displayName: VICE_PACKAGE_OPTION_NAME,
          label: VICE_SINGLE_SHOPPER_LABEL,
          name: VICE_PACKAGE_OPTION_NAME,
          value: VICE_SINGLE_OPTION_VALUE
        }
      ]);
      selectedVariantKey = VICE_SINGLE_VARIANT_KEY;
    }

    const vicePackageShopperLabel =
      productSlug === VICE_PRODUCT_SLUG ? getVicePackageShopperLabel(selectedVariantKey) : null;

    if (vicePackageShopperLabel) {
      selectedOptions = selectedOptions.map((option) =>
        normalizeOptionKey(option.name) === normalizeOptionKey(VICE_PACKAGE_OPTION_NAME)
          ? {
              ...option,
              displayName: VICE_PACKAGE_OPTION_NAME,
              label: vicePackageShopperLabel,
              name: VICE_PACKAGE_OPTION_NAME
            }
          : option
      );
    }

    const cartLineId = getCartLineId(productSlug, selectedOptions);

    if (!isValidSlug(productSlug) || !name || unitPriceCents <= 0) {
      continue;
    }

    const sanitizedItem: CartItem = {
      cartLineId,
      categoryName: typeof item.categoryName === "string" ? item.categoryName : undefined,
      currency: normalizeCurrency(item.currency),
      imageUrl: normalizeImageUrl(item.imageUrl),
      name,
      productKey: normalizeProductKey(item.productKey, productSlug),
      productKind: typeof item.productKind === "string" ? item.productKind : undefined,
      productSlug,
      quantity,
      selectedVariantKey,
      selectedOptions,
      unitPriceCents
    };
    const existingLine = cartLinesById.get(cartLineId);

    if (existingLine) {
      const existingItem = items[existingLine.index];
      const preferredItem =
        existingLine.wasLegacyViceLine && !wasLegacyViceLine ? sanitizedItem : existingItem;

      items[existingLine.index] = {
        ...preferredItem,
        quantity: Math.min(
          existingItem.quantity + sanitizedItem.quantity,
          MAX_CART_QUANTITY_PER_LINE
        )
      };
      cartLinesById.set(cartLineId, {
        index: existingLine.index,
        wasLegacyViceLine: existingLine.wasLegacyViceLine && wasLegacyViceLine
      });
      continue;
    }

    cartLinesById.set(cartLineId, {
      index: items.length,
      wasLegacyViceLine
    });
    items.push(sanitizedItem);
  }

  return items;
}

function canonicalizeStoredVicePackageOptions(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((option) => {
    if (
      !isRecord(option) ||
      normalizeOptionKey(String(option.name ?? "")) !== normalizeOptionKey(VICE_PACKAGE_OPTION_NAME)
    ) {
      return option;
    }

    const optionValue = typeof option.value === "string" ? option.value.trim() : "";

    if (optionValue === VICE_SINGLE_SHOPPER_LABEL) {
      return {
        ...option,
        value: VICE_SINGLE_OPTION_VALUE
      };
    }

    if (optionValue === VICE_BUNDLE_SHOPPER_LABEL) {
      return {
        ...option,
        value: VICE_BUNDLE_OPTION_VALUE
      };
    }

    return option;
  });
}

function normalizeQuantity(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return 1;
  }

  return Math.min(Math.max(value, 1), MAX_CART_QUANTITY_PER_LINE);
}

function normalizePrice(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : 0;
}

function normalizeCurrency(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim().toUpperCase() : "CAD";
}

function normalizeOptionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeProductKey(value: unknown, fallbackSlug: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallbackSlug;
}

function normalizeCartLineId(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeImageUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const imageUrl = value.trim();

  if (imageUrl.startsWith("/") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  return null;
}

function sanitizeCartItemOptions(value: unknown): CartItemOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const options: CartItemOption[] = [];
  const seenOptionNames = new Set<string>();

  for (const option of value) {
    if (!isRecord(option)) {
      continue;
    }

    const name = normalizeOptionText(option.name);
    const valueText = normalizeOptionText(option.value);

    if (!name || !valueText) {
      continue;
    }

    const normalizedName = normalizeOptionKey(name);

    if (seenOptionNames.has(normalizedName)) {
      continue;
    }

    seenOptionNames.add(normalizedName);
    options.push({
      displayName: normalizeOptionText(option.displayName) ?? name,
      label: normalizeOptionText(option.label) ?? valueText,
      name,
      value: valueText
    });
  }

  return options.sort((left, right) =>
    normalizeOptionKey(left.name).localeCompare(normalizeOptionKey(right.name))
  );
}

function normalizeOptionKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function normalizeOptionText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (
    !normalized ||
    normalized.length > 80 ||
    !/^[A-Za-z0-9][A-Za-z0-9 .,_/·-]*$/.test(normalized)
  ) {
    return null;
  }

  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
