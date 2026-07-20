"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  formatCartItemOptions,
  formatCartMoney,
  type CartItemOption,
  type CartProductInput
} from "../../../../lib/cart";
import { getV1ShippingMessage } from "../../../../lib/shipping";
import { useCart } from "../../../../lib/use-cart";

import { AquaProductVisual } from "./AquaProductVisual";
import styles from "./page.module.css";

const AQUA_PRODUCT_SLUG = "tiger-aqua-outdoor-indoor-paddle";
const PLAZA_PRODUCT_SLUG = "tiger-plaza-outdoor-table-grey";

export interface ProductOptionGroup {
  displayName: string;
  name: string;
  required: boolean;
  values: ProductOptionValue[];
}

export interface ProductOptionValue {
  accent?: "blue" | "canada-red" | "green" | "grey" | "ocean-blue" | "pack";
  currency?: string;
  label: string;
  priceCents?: number;
  shopperLabel?: string;
  thumbnailAlt?: string;
  thumbnailSrc?: string;
  value: string;
  variantKey?: string;
}

export interface TigerPurchasePresentation {
  descriptor: string;
  mode: "tiger-v2";
  optionLegend: string;
  pricePrefix?: string;
  selectionError: string;
  summary: string;
  supportHref: string;
  supportText: string;
}

interface CheckoutButtonProps {
  availabilityMessage: string;
  basePriceLabel: string;
  isCheckoutEligible: boolean;
  onVariantChange?: (variantKey: string | null) => void;
  priceSummary: string | null;
  presentation?: TigerPurchasePresentation;
  product: CartProductInput;
  productOptions: ProductOptionGroup[];
  shippingLines: string[];
  shippingLinesAreFixed: boolean;
}

function ProductThumb({ product }: { product: CartProductInput }) {
  if (product.productSlug === AQUA_PRODUCT_SLUG) {
    return (
      <AquaProductVisual altText={product.name} compact variantKey={product.selectedVariantKey} />
    );
  }

  if (product.imageUrl) {
    return <img src={product.imageUrl} alt={product.name} />;
  }

  return <span aria-hidden="true">{product.name.charAt(0)}</span>;
}

type OptionTone = "black" | "blue" | "green" | "grey" | "orange" | "white" | null;

function getOptionTone(optionValue: ProductOptionValue): OptionTone {
  const normalizedValue = `${optionValue.label} ${optionValue.value}`.toLowerCase();

  if (normalizedValue.includes("grey") || normalizedValue.includes("gray")) {
    return "grey";
  }

  for (const tone of ["blue", "green", "orange", "white", "black"] as const) {
    if (normalizedValue.includes(tone)) {
      return tone;
    }
  }

  return null;
}

function getOptionSwatchClassName(optionTone: OptionTone): string {
  const swatchClasses = [styles.optionSwatch];
  const toneClassNames: Record<Exclude<OptionTone, null>, string> = {
    black: styles.optionSwatchBlack,
    blue: styles.optionSwatchBlue,
    green: styles.optionSwatchGreen,
    grey: styles.optionSwatchGrey,
    orange: styles.optionSwatchOrange,
    white: styles.optionSwatchWhite
  };

  if (optionTone) {
    swatchClasses.push(toneClassNames[optionTone]);
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
  availabilityMessage,
  basePriceLabel,
  isCheckoutEligible,
  onVariantChange,
  priceSummary,
  presentation,
  product,
  productOptions,
  shippingLines,
  shippingLinesAreFixed
}: CheckoutButtonProps) {
  const { addItem } = useCart();
  const addToCartButtonRef = useRef<HTMLButtonElement>(null);
  const firstOptionRef = useRef<HTMLInputElement>(null);
  const [addedProduct, setAddedProduct] = useState<CartProductInput | null>(null);
  const [selectedOptionValues, setSelectedOptionValues] = useState<Record<string, string>>(() =>
    getInitialOptionValues(product.productSlug, productOptions)
  );
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const selectedOptions = useMemo(
    () => getSelectedOptions(productOptions, selectedOptionValues),
    [productOptions, selectedOptionValues]
  );
  const selectedOptionPrice = useMemo(
    () =>
      getSelectedOptionPrice(
        productOptions,
        selectedOptionValues,
        product.unitPriceCents,
        product.currency
      ),
    [product.currency, product.unitPriceCents, productOptions, selectedOptionValues]
  );
  const isSelectionComplete = productOptions.every(
    (optionGroup) => !optionGroup.required || Boolean(selectedOptionValues[optionGroup.name])
  );
  const displayedPrice = selectedOptionPrice
    ? formatCartMoney(selectedOptionPrice.priceCents, selectedOptionPrice.currency)
    : basePriceLabel;
  const displayedShippingLines =
    selectedOptionPrice && !shippingLinesAreFixed
      ? [
          getV1ShippingMessage(selectedOptionPrice.priceCents, {
            productSlug: product.productSlug,
            variantKey: selectedOptionPrice.variantKey
          })
        ]
      : shippingLines;

  useEffect(() => {
    onVariantChange?.(selectedOptionPrice?.variantKey ?? null);
  }, [onVariantChange, selectedOptionPrice]);

  function handleAddToCart(): void {
    if (!isSelectionComplete) {
      setSelectionError(presentation?.selectionError ?? getSelectionError(productOptions));
      window.requestAnimationFrame(() => firstOptionRef.current?.focus());
      return;
    }

    const productForCart = {
      ...product,
      imageUrl:
        presentation?.mode === "tiger-v2" && selectedOptionPrice?.thumbnailSrc
          ? selectedOptionPrice.thumbnailSrc
          : product.imageUrl,
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

  return (
    <>
      {presentation?.mode === "tiger-v2" ? (
        <div className={styles.tigerPurchaseControls} data-purchase-presentation="tiger-v2">
          <div className={styles.tigerPriceRow}>
            <strong aria-live="polite" data-testid="product-price">
              {!selectedOptionPrice && presentation.pricePrefix ? (
                <span className={styles.tigerPricePrefix}>{presentation.pricePrefix}</span>
              ) : null}
              {displayedPrice}
            </strong>
          </div>

          {isCheckoutEligible ? (
            <div className={styles.tigerCheckoutBox}>
              {productOptions.map((optionGroup, groupIndex) => (
                <fieldset className={styles.tigerOptionSelector} key={optionGroup.name}>
                  <legend>{presentation.optionLegend}</legend>
                  <div className={styles.tigerOptionChoices}>
                    {optionGroup.values.map((optionValue, optionIndex) => {
                      const inputId =
                        `${product.productSlug}-${optionGroup.name}-${optionValue.value}`
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-");
                      const isSelected =
                        selectedOptionValues[optionGroup.name] === optionValue.value;
                      const shopperLabel = optionValue.shopperLabel ?? optionValue.label;

                      return (
                        <label
                          className={styles.tigerOptionChoice}
                          data-option-accent={optionValue.accent}
                          htmlFor={inputId}
                          key={optionValue.value}
                        >
                          <input
                            checked={isSelected}
                            className={styles.optionChoiceInput}
                            id={inputId}
                            name={`${product.productSlug}-${optionGroup.name}`}
                            onChange={() => handleOptionChange(optionGroup.name, optionValue.value)}
                            ref={groupIndex === 0 && optionIndex === 0 ? firstOptionRef : undefined}
                            type="radio"
                            value={optionValue.value}
                          />
                          <span
                            className={`${styles.tigerOptionMedia} ${
                              product.productSlug === AQUA_PRODUCT_SLUG
                                ? ""
                                : styles.tigerTableOptionMedia
                            }`.trim()}
                          >
                            {product.productSlug === AQUA_PRODUCT_SLUG ? (
                              <AquaProductVisual
                                altText={optionValue.thumbnailAlt ?? shopperLabel}
                                compact
                                variantKey={optionValue.variantKey}
                              />
                            ) : optionValue.thumbnailSrc ? (
                              <img
                                alt={optionValue.thumbnailAlt ?? shopperLabel}
                                src={optionValue.thumbnailSrc}
                              />
                            ) : (
                              <span
                                aria-hidden="true"
                                className={styles.tigerOptionFallback}
                                data-option-accent={optionValue.accent}
                              />
                            )}
                          </span>
                          <span className={styles.tigerOptionCopy}>
                            <strong>{shopperLabel}</strong>
                            {optionValue.priceCents ? (
                              <small>
                                {formatCartMoney(
                                  optionValue.priceCents,
                                  optionValue.currency ?? product.currency
                                )}
                              </small>
                            ) : null}
                          </span>
                          <span className={styles.tigerOptionCheck} aria-hidden="true" />
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}

              <div className={styles.tigerPurchaseReassurance}>
                <strong>{availabilityMessage}</strong>
                <div>
                  {displayedShippingLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
              </div>

              <button
                className={`${styles.checkoutButton} ${styles.tigerCheckoutButton}`}
                data-selection-required={!isSelectionComplete ? "true" : undefined}
                onClick={handleAddToCart}
                ref={addToCartButtonRef}
                type="button"
              >
                Add to cart
              </button>

              {selectionError ? (
                <p className={styles.tigerCheckoutError} role="status">
                  {selectionError}
                </p>
              ) : null}

              <a className={styles.tigerPurchaseHelp} href={presentation.supportHref}>
                {presentation.supportText}
              </a>
            </div>
          ) : (
            <p className={styles.checkoutUnavailable}>
              This product is not available for online checkout yet.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className={styles.priceRow}>
            <strong aria-live="polite" data-testid="product-price">
              {displayedPrice}
            </strong>
            {priceSummary ? <span>{priceSummary}</span> : null}
          </div>

          <div className={styles.shippingNote}>
            <strong>{availabilityMessage}</strong>
            {displayedShippingLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>

          <div className={styles.checkoutPanel}>
            {isCheckoutEligible ? (
              <div className={styles.checkoutBox}>
                {productOptions.length > 0 ? (
                  <div className={styles.optionSelectors}>
                    {productOptions.map((optionGroup, groupIndex) => (
                      <fieldset className={styles.optionSelector} key={optionGroup.name}>
                        <legend>{getOptionLegend(optionGroup)}</legend>
                        <div className={styles.optionChoices}>
                          {optionGroup.values.map((optionValue, optionIndex) => {
                            const inputId =
                              `${product.productSlug}-${optionGroup.name}-${optionValue.value}`
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-");
                            const isSelected =
                              selectedOptionValues[optionGroup.name] === optionValue.value;
                            const optionTone = getOptionTone(optionValue);

                            return (
                              <label
                                className={styles.optionChoice}
                                data-option-tone={optionTone ?? undefined}
                                htmlFor={inputId}
                                key={optionValue.value}
                              >
                                <input
                                  checked={isSelected}
                                  className={styles.optionChoiceInput}
                                  id={inputId}
                                  name={`${product.productSlug}-${optionGroup.name}`}
                                  onChange={() =>
                                    handleOptionChange(optionGroup.name, optionValue.value)
                                  }
                                  ref={
                                    groupIndex === 0 && optionIndex === 0
                                      ? firstOptionRef
                                      : undefined
                                  }
                                  type="radio"
                                  value={optionValue.value}
                                />
                                <span
                                  className={getOptionSwatchClassName(optionTone)}
                                  aria-hidden="true"
                                />
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
              </div>
            ) : (
              <p className={styles.checkoutUnavailable}>
                This product is not available for online checkout yet.
              </p>
            )}
          </div>
        </>
      )}

      {isModalOpen ? (
        <AddToCartModal onClose={handleCloseModal} product={addedProduct ?? product} />
      ) : null}
    </>
  );
}

function getInitialOptionValues(
  productSlug: string,
  productOptions: ProductOptionGroup[]
): Record<string, string> {
  if (productSlug !== PLAZA_PRODUCT_SLUG) {
    return {};
  }

  return Object.fromEntries(
    productOptions
      .filter((optionGroup) => optionGroup.values.length === 1)
      .map((optionGroup) => [optionGroup.name, optionGroup.values[0].value])
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
        label: optionValue.shopperLabel ?? optionValue.label,
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
  selectedOptionValues: Record<string, string>,
  basePriceCents: number,
  baseCurrency: string
): {
  currency: string;
  priceCents: number;
  thumbnailSrc?: string;
  variantKey?: string;
} | null {
  const selections = productOptions
    .map((optionGroup) => {
      const selectedValue = selectedOptionValues[optionGroup.name];
      return optionGroup.values.find((value) => value.value === selectedValue);
    })
    .filter((optionValue): optionValue is ProductOptionValue => Boolean(optionValue));

  if (productOptions.length === 0 || selections.length !== productOptions.length) {
    return null;
  }

  const explicitPrices = selections
    .map((selection) => selection.priceCents)
    .filter((priceCents): priceCents is number => typeof priceCents === "number");
  const variantKeys = [
    ...new Set(
      selections
        .map((selection) => selection.variantKey)
        .filter((variantKey): variantKey is string => Boolean(variantKey))
    )
  ];
  const selectedCurrency = selections.find((selection) => selection.currency)?.currency;
  const selectedThumbnail = selections.find((selection) => selection.thumbnailSrc)?.thumbnailSrc;

  return {
    currency: selectedCurrency ?? baseCurrency,
    priceCents: explicitPrices.length === 1 ? explicitPrices[0] : basePriceCents,
    thumbnailSrc: selectedThumbnail,
    variantKey: variantKeys.length === 1 ? variantKeys[0] : undefined
  };
}
