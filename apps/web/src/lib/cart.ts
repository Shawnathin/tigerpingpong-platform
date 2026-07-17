import { V1_FLAT_RATE_SHIPPING_COPY, V1_FREE_SHIPPING_COPY } from "./shipping";

export const CART_STORAGE_KEY = "tigerpingpong.cart.v1";
export const CART_CHANGE_EVENT = "tigerpingpong:cart-change";
export const FLAT_SHIPPING_CENTS = 1500;
export const FREE_SHIPPING_THRESHOLD_CENTS = 10000;
export const MAX_CART_QUANTITY_PER_LINE = 10;

export interface CartItem {
  cartLineId: string;
  categoryName?: string;
  currency: string;
  imageUrl: string | null;
  name: string;
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
    return [{
      ...item,
      currency: normalizeCurrency(change.currency ?? item.currency),
      name: change.name?.trim() || item.name,
      unitPriceCents: change.unitPriceCents
    }];
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

export function getCartShippingCents(subtotalCents: number): number {
  return subtotalCents > FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
}

export function getCartShippingCopy(subtotalCents: number): string {
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
  const seenCartLineIds = new Set<string>();

  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }

    const productSlug =
      typeof item.productSlug === "string" ? item.productSlug.trim().toLowerCase() : "";
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const unitPriceCents = normalizePrice(item.unitPriceCents);
    const quantity = normalizeQuantity(item.quantity);
    const selectedOptions = sanitizeCartItemOptions(item.selectedOptions);
    const cartLineId = getCartLineId(productSlug, selectedOptions);

    if (
      !isValidSlug(productSlug) ||
      !name ||
      unitPriceCents <= 0 ||
      seenCartLineIds.has(cartLineId)
    ) {
      continue;
    }

    seenCartLineIds.add(cartLineId);
    items.push({
      cartLineId,
      categoryName: typeof item.categoryName === "string" ? item.categoryName : undefined,
      currency: normalizeCurrency(item.currency),
      imageUrl: normalizeImageUrl(item.imageUrl),
      name,
      productKind: typeof item.productKind === "string" ? item.productKind : undefined,
      productSlug,
      quantity,
      selectedVariantKey: normalizeOptionalText(item.selectedVariantKey),
      selectedOptions,
      unitPriceCents
    });
  }

  return items;
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
    !/^[A-Za-z0-9][A-Za-z0-9 .,_/-]*$/.test(normalized)
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
