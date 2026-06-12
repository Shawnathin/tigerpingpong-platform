"use client";

import { useEffect } from "react";

import { clearCart } from "../../../lib/cart";
import type { CheckoutSessionPublicStatus } from "../../../lib/checkout-api";

interface CheckoutCartCleanupProps {
  status: CheckoutSessionPublicStatus | null;
}

export function CheckoutCartCleanup({ status }: CheckoutCartCleanupProps) {
  useEffect(() => {
    if (status === "paid") {
      clearCart();
    }
  }, [status]);

  return null;
}
