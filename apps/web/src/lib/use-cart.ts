"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  addCartItem,
  clearCart,
  getCartItemCount,
  getCartPricing,
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
  const listSubtotalCents = getCartSubtotalCents(items);
  const pricing = getCartPricing(items);
  const subtotalCents = pricing.netSubtotalCents;
  const shippingCents = items.length > 0 ? getCartShippingCents(subtotalCents, items) : 0;
  const totalCents = subtotalCents + shippingCents;

  return {
    addItem: addCartItem,
    clearCart,
    discountCents: pricing.discountCents,
    itemCount,
    items,
    listSubtotalCents,
    pricingAllocations: pricing.allocations,
    pricingRuleVersion: pricing.pricingRuleVersion,
    refreshItems: readCartItems,
    reconcileItems: reconcileCartItems,
    removeItem: removeCartItem,
    shippingCents,
    shippingCopy: getCartShippingCopy(subtotalCents, items),
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
