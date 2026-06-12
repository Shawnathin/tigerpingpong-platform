"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { formatCartMoney, type CartProductInput } from "../../../../lib/cart";
import { useCart } from "../../../../lib/use-cart";

import styles from "./page.module.css";

interface CheckoutButtonProps {
  isCheckoutEligible: boolean;
  product: CartProductInput;
  recommendedProducts: CartProductInput[];
}

function ProductThumb({ product }: { product: CartProductInput }) {
  if (product.imageUrl) {
    return <img src={product.imageUrl} alt={product.name} />;
  }

  return <span aria-hidden="true">{product.name.charAt(0)}</span>;
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
  recommendedProducts
}: CheckoutButtonProps) {
  const { addItem, items } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const cartSlugs = useMemo(() => new Set(items.map((item) => item.productSlug)), [items]);

  function handleAddToCart(): void {
    addItem(product);
    setIsModalOpen(true);
  }

  function handleAddOn(addOn: CartProductInput): void {
    addItem(addOn);
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
      <button className={styles.checkoutButton} onClick={handleAddToCart} type="button">
        Add to cart
      </button>

      {isModalOpen ? (
        <AddToCartModal
          cartSlugs={cartSlugs}
          onAddOn={handleAddOn}
          onClose={() => setIsModalOpen(false)}
          product={product}
          recommendedProducts={recommendedProducts}
        />
      ) : null}
    </div>
  );
}
