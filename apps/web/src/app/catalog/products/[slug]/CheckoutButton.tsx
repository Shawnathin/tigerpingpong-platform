"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  formatCartItemOptions,
  formatCartMoney,
  type CartItemOption,
  type CartProductInput
} from "../../../../lib/cart";
import { useCart } from "../../../../lib/use-cart";

import styles from "./page.module.css";

export interface ProductOptionGroup {
  displayName: string;
  name: string;
  required: boolean;
  values: ProductOptionValue[];
}

export interface ProductOptionValue {
  currency?: string;
  label: string;
  priceCents?: number;
  value: string;
  variantKey?: string;
}

interface CheckoutButtonProps {
  isCheckoutEligible: boolean;
  product: CartProductInput;
  productOptions: ProductOptionGroup[];
}

function ProductThumb({ product }: { product: CartProductInput }) {
  if (product.imageUrl) {
    return <img src={product.imageUrl} alt={product.name} />;
  }

  return <span aria-hidden="true">{product.name.charAt(0)}</span>;
}

function getOptionSwatchClassName(optionValue: ProductOptionValue): string {
  const normalizedValue = `${optionValue.label} ${optionValue.value}`.toLowerCase();
  const swatchClasses = [styles.optionSwatch];

  if (normalizedValue.includes("grey") || normalizedValue.includes("gray")) {
    swatchClasses.push(styles.optionSwatchGrey);
  } else if (normalizedValue.includes("blue")) {
    swatchClasses.push(styles.optionSwatchBlue);
  } else if (normalizedValue.includes("green")) {
    swatchClasses.push(styles.optionSwatchGreen);
  } else if (normalizedValue.includes("orange")) {
    swatchClasses.push(styles.optionSwatchOrange);
  } else if (normalizedValue.includes("white")) {
    swatchClasses.push(styles.optionSwatchWhite);
  } else if (normalizedValue.includes("black")) {
    swatchClasses.push(styles.optionSwatchBlack);
  }

  return swatchClasses.join(" ");
}

function getOptionLegend(optionGroup: ProductOptionGroup): string {
  const normalizedLabel = `${optionGroup.displayName} ${optionGroup.name}`.toLowerCase();

  if (
    normalizedLabel.includes("top") ||
    normalizedLabel.includes("colour") ||
    normalizedLabel.includes("color")
  ) {
    return "Select top colour";
  }

  return `Select ${optionGroup.displayName.toLowerCase()}`;
}

function AddToCartModal({ onClose, product }: { onClose: () => void; product: CartProductInput }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLElement>): void {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []
    );

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  const modal = (
    <div className={styles.cartModalOverlay} onClick={onClose} role="presentation">
      <section
        aria-labelledby="added-to-cart-title"
        aria-modal="true"
        className={styles.cartModal}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <button
          aria-label="Close added to cart dialog"
          className={styles.cartModalClose}
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          &times;
        </button>

        <div className={styles.cartModalHeader}>
          <span className={styles.cartModalCheck} aria-hidden="true" />
          <p className={styles.cartModalLabel}>Added to cart</p>
          <h2 id="added-to-cart-title">{product.name} is in your cart.</h2>
        </div>

        <div className={styles.addedItemSummary}>
          <div className={styles.addedItemImage}>
            <ProductThumb product={product} />
          </div>
          <div className={styles.addedItemBody}>
            <strong>{product.name}</strong>
            <span>{product.categoryName ?? "Tiger Ping Pong"}</span>
            {product.selectedOptions && product.selectedOptions.length > 0 ? (
              <em>{formatCartItemOptions(product.selectedOptions)}</em>
            ) : null}
          </div>
          <p>{formatCartMoney(product.unitPriceCents, product.currency)}</p>
        </div>

        <div className={styles.cartModalActions}>
          <button className={styles.keepShoppingButton} onClick={onClose} type="button">
            Keep shopping
          </button>
          <a className={styles.viewCartButton} href="/cart">
            View cart
          </a>
        </div>
      </section>
    </div>
  );

  return createPortal(modal, document.body);
}

export function CheckoutButton({
  isCheckoutEligible,
  product,
  productOptions
}: CheckoutButtonProps) {
  const { addItem } = useCart();
  const addToCartButtonRef = useRef<HTMLButtonElement>(null);
  const [addedProduct, setAddedProduct] = useState<CartProductInput | null>(null);
  const [selectedOptionValues, setSelectedOptionValues] = useState<Record<string, string>>({});
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const selectedOptions = useMemo(
    () => getSelectedOptions(productOptions, selectedOptionValues),
    [productOptions, selectedOptionValues]
  );
  const selectedOptionPrice = useMemo(
    () => getSelectedOptionPrice(productOptions, selectedOptionValues),
    [productOptions, selectedOptionValues]
  );
  const isSelectionComplete = productOptions.every(
    (optionGroup) => !optionGroup.required || Boolean(selectedOptionValues[optionGroup.name])
  );

  function handleAddToCart(): void {
    if (!isSelectionComplete) {
      setSelectionError(getSelectionError(productOptions));
      return;
    }

    const productForCart = {
      ...product,
      selectedVariantKey: selectedOptionPrice?.variantKey,
      selectedOptions
    };

    if (selectedOptionPrice) {
      productForCart.currency = selectedOptionPrice.currency;
      productForCart.unitPriceCents = selectedOptionPrice.priceCents;
    }

    addItem(productForCart);
    setAddedProduct(productForCart);
    setIsModalOpen(true);
  }

  function handleCloseModal(): void {
    setIsModalOpen(false);
    window.requestAnimationFrame(() => addToCartButtonRef.current?.focus());
  }

  function handleOptionChange(optionName: string, optionValue: string): void {
    setSelectedOptionValues((currentValues) => ({
      ...currentValues,
      [optionName]: optionValue
    }));
    setSelectionError(null);
  }

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isModalOpen]);

  if (!isCheckoutEligible) {
    return (
      <p className={styles.checkoutUnavailable}>
        This product is not available for online checkout yet.
      </p>
    );
  }

  return (
    <div className={styles.checkoutBox}>
      {productOptions.length > 0 ? (
        <div className={styles.optionSelectors}>
          {productOptions.map((optionGroup) => (
            <fieldset className={styles.optionSelector} key={optionGroup.name}>
              <legend>{getOptionLegend(optionGroup)}</legend>
              <div className={styles.optionChoices}>
                {optionGroup.values.map((optionValue) => {
                  const inputId = `${product.productSlug}-${optionGroup.name}-${optionValue.value}`
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-");
                  const isSelected = selectedOptionValues[optionGroup.name] === optionValue.value;

                  return (
                    <label
                      className={styles.optionChoice}
                      htmlFor={inputId}
                      key={optionValue.value}
                    >
                      <input
                        checked={isSelected}
                        className={styles.optionChoiceInput}
                        id={inputId}
                        name={`${product.productSlug}-${optionGroup.name}`}
                        onChange={() => handleOptionChange(optionGroup.name, optionValue.value)}
                        type="radio"
                        value={optionValue.value}
                      />
                      <span className={getOptionSwatchClassName(optionValue)} aria-hidden="true" />
                      <span className={styles.optionChoiceText}>
                        <strong>{optionValue.label}</strong>
                        {optionValue.priceCents ? (
                          <small>
                            {formatCartMoney(
                              optionValue.priceCents,
                              optionValue.currency ?? product.currency
                            )}
                          </small>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      ) : null}

      <button
        className={styles.checkoutButton}
        data-selection-required={!isSelectionComplete ? "true" : undefined}
        onClick={handleAddToCart}
        ref={addToCartButtonRef}
        type="button"
      >
        Add to cart
      </button>

      {selectionError ? (
        <p className={styles.checkoutError} role="status">
          {selectionError}
        </p>
      ) : null}

      {isModalOpen ? (
        <AddToCartModal onClose={handleCloseModal} product={addedProduct ?? product} />
      ) : null}
    </div>
  );
}

function getSelectedOptions(
  productOptions: ProductOptionGroup[],
  selectedOptionValues: Record<string, string>
): CartItemOption[] {
  return productOptions
    .map((optionGroup) => {
      const selectedValue = selectedOptionValues[optionGroup.name];
      const optionValue = optionGroup.values.find((value) => value.value === selectedValue);

      if (!optionValue) {
        return null;
      }

      return {
        displayName: optionGroup.displayName,
        label: optionValue.label,
        name: optionGroup.name,
        value: optionValue.value
      };
    })
    .filter((option): option is CartItemOption => Boolean(option));
}

function getSelectionError(productOptions: ProductOptionGroup[]): string {
  const firstRequiredOption = productOptions.find((optionGroup) => optionGroup.required);

  return firstRequiredOption
    ? `Select ${firstRequiredOption.displayName.toLowerCase()} to add this item.`
    : "Select the required option to add this item.";
}

function getSelectedOptionPrice(
  productOptions: ProductOptionGroup[],
  selectedOptionValues: Record<string, string>
): { currency: string; priceCents: number; variantKey?: string } | null {
  const pricedSelections = productOptions
    .map((optionGroup) => {
      const selectedValue = selectedOptionValues[optionGroup.name];
      return optionGroup.values.find((value) => value.value === selectedValue);
    })
    .filter(
      (
        optionValue
      ): optionValue is ProductOptionValue & {
        priceCents: number;
      } => Boolean(optionValue && typeof optionValue.priceCents === "number")
    );

  if (pricedSelections.length !== 1) {
    return null;
  }

  const pricedSelection = pricedSelections[0];

  return {
    currency: pricedSelection.currency ?? "CAD",
    priceCents: pricedSelection.priceCents,
    variantKey: pricedSelection.variantKey
  };
}
