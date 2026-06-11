export const CART_STORAGE_KEY = "tigerpingpong.cart.v1";
export const CART_CHANGE_EVENT = "tigerpingpong:cart-change";
export const FLAT_SHIPPING_CENTS = 1500;
export const FREE_SHIPPING_THRESHOLD_CENTS = 10000;
export const MAX_CART_QUANTITY_PER_LINE = 10;

export interface CartItem {
  categoryName?: string;
  currency: string;
  imageUrl: string | null;
  name: string;
  productKind?: string;
  productSlug: string;
  quantity: number;
  unitPriceCents: number;
}

export interface CartProductInput {
  categoryName?: string;
  currency: string;
  imageUrl: string | null;
  name: string;
  productKind?: string;
  productSlug: string;
  unitPriceCents: number;
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
  const existingIndex = items.findIndex((item) => item.productSlug === productSlug);
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
      unitPriceCents: normalizePrice(product.unitPriceCents)
    };
  } else {
    items.push({
      categoryName: product.categoryName,
      currency: normalizeCurrency(product.currency),
      imageUrl: normalizeImageUrl(product.imageUrl),
      name: product.name.trim(),
      productKind: product.productKind,
      productSlug,
      quantity: nextQuantity,
      unitPriceCents: normalizePrice(product.unitPriceCents)
    });
  }

  return writeCartItems(items);
}

export function updateCartItemQuantity(productSlug: string, quantity: number): CartItem[] {
  const normalizedSlug = productSlug.trim().toLowerCase();
  const nextItems = readCartItems()
    .map((item) =>
      item.productSlug === normalizedSlug
        ? {
            ...item,
            quantity: normalizeQuantity(quantity)
          }
        : item
    )
    .filter((item) => item.quantity > 0);

  return writeCartItems(nextItems);
}

export function removeCartItem(productSlug: string): CartItem[] {
  const normalizedSlug = productSlug.trim().toLowerCase();
  return writeCartItems(readCartItems().filter((item) => item.productSlug !== normalizedSlug));
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
    ? "Free shipping across Canada"
    : "Free shipping on orders over $100";
}

export function formatCartMoney(cents: number, currency = "CAD"): string {
  return new Intl.NumberFormat("en-CA", {
    currency,
    style: "currency"
  }).format(cents / 100);
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
  const seenSlugs = new Set<string>();

  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }

    const productSlug =
      typeof item.productSlug === "string" ? item.productSlug.trim().toLowerCase() : "";
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const unitPriceCents = normalizePrice(item.unitPriceCents);
    const quantity = normalizeQuantity(item.quantity);

    if (!isValidSlug(productSlug) || !name || unitPriceCents <= 0 || seenSlugs.has(productSlug)) {
      continue;
    }

    seenSlugs.add(productSlug);
    items.push({
      categoryName: typeof item.categoryName === "string" ? item.categoryName : undefined,
      currency: normalizeCurrency(item.currency),
      imageUrl: normalizeImageUrl(item.imageUrl),
      name,
      productKind: typeof item.productKind === "string" ? item.productKind : undefined,
      productSlug,
      quantity,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
