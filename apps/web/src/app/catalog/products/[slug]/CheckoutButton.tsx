"use client";

import { useMemo, useState } from "react";

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
        <div
          className={styles.cartModalOverlay}
          onClick={() => setIsModalOpen(false)}
          role="presentation"
        >
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
              onClick={() => setIsModalOpen(false)}
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
              <div>
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
                          <strong>{addOn.name}</strong>
                          <span>{formatCartMoney(addOn.unitPriceCents, addOn.currency)}</span>
                        </div>
                        <button
                          className={styles.addOnButton}
                          disabled={isAlreadyAdded}
                          onClick={() => handleAddOn(addOn)}
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
              <button
                className={styles.keepShoppingButton}
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                Keep shopping
              </button>
              <a className={styles.viewCartButton} href="/cart">
                View cart
              </a>
              <a className={styles.modalCheckoutButton} href="/cart">
                Checkout
              </a>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
