"use client";

import { useEffect, useMemo, useState } from "react";
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
  label: string;
  value: string;
}

interface CheckoutButtonProps {
  isCheckoutEligible: boolean;
  product: CartProductInput;
  productOptions: ProductOptionGroup[];
  recommendedProducts: CartProductInput[];
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

function AddToCartModal({
  cartSlugs,
  onAddOn,
  onClose,
  product,
  recommendedProducts
}: {
  cartSlugs: Set<string>;
  onAddOn: (addOn: CartProductInput) => void;
  onClose: () => void;
  product: CartProductInput;
  recommendedProducts: CartProductInput[];
}) {
  const modal = (
    <div className={styles.cartModalOverlay} onClick={onClose} role="presentation">
      <section
        aria-labelledby="added-to-cart-title"
        aria-modal="true"
        className={styles.cartModal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Close added to cart dialog"
          className={styles.cartModalClose}
          onClick={onClose}
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

        {recommendedProducts.length > 0 ? (
          <div className={styles.recommendations} aria-labelledby="recommended-addons-title">
            <div className={styles.recommendationsHeader}>
              <p className={styles.cartModalLabel}>Recommended add-ons</p>
              <h3 id="recommended-addons-title">Complete the setup.</h3>
            </div>

            <div className={styles.addOnGrid}>
              {recommendedProducts.map((addOn) => {
                const isAlreadyAdded = cartSlugs.has(addOn.productSlug);

                return (
                  <article className={styles.addOnCard} key={addOn.productSlug}>
                    <div className={styles.addOnImage}>
                      <ProductThumb product={addOn} />
                    </div>
                    <div className={styles.addOnBody}>
                      <span>{addOn.categoryName ?? "Tiger Ping Pong"}</span>
                      <strong>{addOn.name}</strong>
                      <p>{formatCartMoney(addOn.unitPriceCents, addOn.currency)}</p>
                    </div>
                    <button
                      className={styles.addOnButton}
                      disabled={isAlreadyAdded}
                      onClick={() => onAddOn(addOn)}
                      type="button"
                    >
                      {isAlreadyAdded ? "Added" : "Add"}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className={styles.cartModalActions}>
          <button className={styles.keepShoppingButton} onClick={onClose} type="button">
            Keep shopping
          </button>
          <a className={styles.viewCartButton} href="/cart">
            View cart
          </a>
          <a className={styles.modalCheckoutButton} href="/cart">
            Review cart
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
  productOptions,
  recommendedProducts
}: CheckoutButtonProps) {
  const { addItem, items } = useCart();
  const [addedProduct, setAddedProduct] = useState<CartProductInput | null>(null);
  const [selectedOptionValues, setSelectedOptionValues] = useState<Record<string, string>>({});
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const cartSlugs = useMemo(() => new Set(items.map((item) => item.productSlug)), [items]);
  const selectedOptions = useMemo(
    () => getSelectedOptions(productOptions, selectedOptionValues),
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
      selectedOptions
    };

    addItem(productForCart);
    setAddedProduct(productForCart);
    setIsModalOpen(true);
  }

  function handleAddOn(addOn: CartProductInput): void {
    addItem(addOn);
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

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
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
        <AddToCartModal
          cartSlugs={cartSlugs}
          onAddOn={handleAddOn}
          onClose={() => setIsModalOpen(false)}
          product={addedProduct ?? product}
          recommendedProducts={recommendedProducts}
        />
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
