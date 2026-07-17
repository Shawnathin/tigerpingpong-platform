"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  addCartItem,
  clearCart,
  getCartItemCount,
  getCartShippingCents,
  getCartShippingCopy,
  getCartSnapshot,
  getCartSubtotalCents,
  readCartItems,
  reconcileCartItems,
  removeCartItem,
  subscribeCart,
  updateCartItemQuantity,
  type CartItem
} from "./cart";

const EMPTY_CART_SNAPSHOT = "[]";

export function useCart() {
  const snapshot = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerSnapshot);
  const items = useMemo(() => parseCartSnapshot(snapshot), [snapshot]);
  const itemCount = getCartItemCount(items);
  const subtotalCents = getCartSubtotalCents(items);
  const shippingCents = items.length > 0 ? getCartShippingCents(subtotalCents) : 0;
  const totalCents = subtotalCents + shippingCents;

  return {
    addItem: addCartItem,
    clearCart,
    itemCount,
    items,
    refreshItems: readCartItems,
    reconcileItems: reconcileCartItems,
    removeItem: removeCartItem,
    shippingCents,
    shippingCopy: getCartShippingCopy(subtotalCents),
    subtotalCents,
    totalCents,
    updateQuantity: updateCartItemQuantity
  };
}

function getServerSnapshot(): string {
  return EMPTY_CART_SNAPSHOT;
}

function parseCartSnapshot(snapshot: string): CartItem[] {
  try {
    const parsed = JSON.parse(snapshot) as unknown;
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}
