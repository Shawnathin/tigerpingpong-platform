"use client";

import { useState } from "react";

import { createCheckoutSession } from "../../../../lib/checkout-api";

import styles from "./page.module.css";

const CHECKOUT_ERROR_MESSAGE = "Checkout could not be started. Please try again or contact us.";

interface CheckoutButtonProps {
  isCheckoutEligible: boolean;
  productSlug: string;
}

export function CheckoutButton({ isCheckoutEligible, productSlug }: CheckoutButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartCheckout(): Promise<void> {
    setIsSubmitting(true);
    setError(null);

    try {
      const session = await createCheckoutSession({
        items: [
          {
            productSlug,
            quantity: 1
          }
        ]
      });

      window.location.href = session.checkoutUrl;
    } catch {
      setError(CHECKOUT_ERROR_MESSAGE);
      setIsSubmitting(false);
    }
  }

  if (!isCheckoutEligible) {
    return (
      <p className={styles.checkoutUnavailable}>
        This product is not available for online checkout yet.
      </p>
    );
  }

  return (
    <div className={styles.checkoutBox}>
      <button
        aria-busy={isSubmitting}
        className={styles.checkoutButton}
        disabled={isSubmitting}
        onClick={() => void handleStartCheckout()}
        type="button"
      >
        {isSubmitting ? "Starting checkout..." : "Buy with Stripe"}
      </button>
      {error ? (
        <p className={styles.checkoutError} role="status">
          {error}
        </p>
      ) : null}
    </div>
  );
}
