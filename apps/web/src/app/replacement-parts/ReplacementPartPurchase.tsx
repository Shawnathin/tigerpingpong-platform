"use client";

import { useState } from "react";

import { formatCartMoney, type CartProductInput } from "../../lib/cart";
import { useCart } from "../../lib/use-cart";
import styles from "./page.module.css";

interface ReplacementPartSetOption {
  buttonLabel: string;
  confirmationLabel: string;
  label: string;
  quantity: number;
  shippingCopy: string;
}

interface ReplacementPartPurchaseProps {
  anchorId: string;
  confirmationLabel: string;
  fullSetOption?: ReplacementPartSetOption;
  priceLabel?: string;
  product: CartProductInput;
  shippingCopy: string;
  singleButtonLabel?: string;
  supportHref?: string;
  supportPrompt?: string;
}

export function ReplacementPartPurchase({
  anchorId,
  confirmationLabel,
  fullSetOption,
  priceLabel = "Current price",
  product,
  shippingCopy,
  singleButtonLabel = "Add to Cart",
  supportHref,
  supportPrompt
}: ReplacementPartPurchaseProps) {
  const { addItem } = useCart();
  const [addedConfirmation, setAddedConfirmation] = useState<string | null>(null);
  const priceId = `${product.productSlug}-price`;
  const shippingId = `${product.productSlug}-shipping`;
  const fullSetPriceId = `${product.productSlug}-full-set-price`;
  const fullSetShippingId = `${product.productSlug}-full-set-shipping`;

  function handleAddToCart(quantity: number, nextConfirmation: string): void {
    addItem(product, quantity);
    setAddedConfirmation(nextConfirmation);
  }

  return (
    <div className={styles.purchasePanel} data-testid={`${anchorId}-purchase`}>
      <p className={styles.partPrice} id={priceId}>
        <span>{priceLabel}</span>
        <strong data-testid={`${anchorId}-live-price`}>
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
          onClick={() => handleAddToCart(1, confirmationLabel)}
          type="button"
        >
          {singleButtonLabel}
        </button>
        {supportHref && supportPrompt ? (
          <a className={styles.supportAction} href={supportHref}>
            {supportPrompt}
          </a>
        ) : null}
      </div>
      {fullSetOption ? (
        <div className={styles.fullSetOption} data-testid={`${anchorId}-full-set-option`}>
          <p className={styles.fullSetPrice} id={fullSetPriceId}>
            <span>{fullSetOption.label}</span>
            <strong data-testid={`${anchorId}-full-set-live-price`}>
              {formatCartMoney(product.unitPriceCents * fullSetOption.quantity, product.currency)}{" "}
              CAD
            </strong>
          </p>
          <p className={styles.fullSetShipping} id={fullSetShippingId}>
            {fullSetOption.shippingCopy}
          </p>
          <button
            aria-describedby={`${fullSetPriceId} ${fullSetShippingId}`}
            className={styles.fullSetButton}
            onClick={() => handleAddToCart(fullSetOption.quantity, fullSetOption.confirmationLabel)}
            type="button"
          >
            {fullSetOption.buttonLabel}
          </button>
        </div>
      ) : null}
      {addedConfirmation ? (
        <div aria-live="polite" className={styles.purchaseConfirmation} role="status">
          <span>{addedConfirmation}</span>
          <a href="/cart/">View Cart</a>
        </div>
      ) : null}
    </div>
  );
}
