"use client";

import { useState } from "react";

import { formatCartMoney, type CartProductInput } from "../../lib/cart";
import { useCart } from "../../lib/use-cart";
import styles from "./page.module.css";

interface ReplacementPartPurchaseProps {
  product: CartProductInput;
  shippingCopy: string;
  supportHref: string;
  supportPrompt: string;
}

export function ReplacementPartPurchase({
  product,
  shippingCopy,
  supportHref,
  supportPrompt
}: ReplacementPartPurchaseProps) {
  const { addItem } = useCart();
  const [hasAdded, setHasAdded] = useState(false);
  const priceId = `${product.productSlug}-price`;
  const shippingId = `${product.productSlug}-shipping`;

  function handleAddToCart(): void {
    addItem(product);
    setHasAdded(true);
  }

  return (
    <div className={styles.purchasePanel} data-testid="part-40-purchase">
      <p className={styles.partPrice} id={priceId}>
        <span>Current price</span>
        <strong data-testid="part-40-live-price">
          {formatCartMoney(product.unitPriceCents, product.currency)} CAD
        </strong>
      </p>
      <p className={styles.purchaseShipping} id={shippingId}>
        {shippingCopy}
      </p>
      <div className={styles.purchaseActions}>
        <button
          aria-describedby={`${priceId} ${shippingId}`}
          className={styles.addToCartButton}
          onClick={handleAddToCart}
          type="button"
        >
          Add to Cart
        </button>
        <a className={styles.supportAction} href={supportHref}>
          {supportPrompt}
        </a>
      </div>
      {hasAdded ? (
        <div aria-live="polite" className={styles.purchaseConfirmation} role="status">
          <span>Part 40 is in your cart.</span>
          <a href="/cart/">View Cart</a>
        </div>
      ) : null}
    </div>
  );
}
