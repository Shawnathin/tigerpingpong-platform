"use client";

import { useState } from "react";

import { createCheckoutSession } from "../../lib/checkout-api";
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  MAX_CART_QUANTITY_PER_LINE,
  formatCartMoney,
  type CartItem
} from "../../lib/cart";
import { useCart } from "../../lib/use-cart";

import styles from "./page.module.css";

const CHECKOUT_ERROR_MESSAGE = "Checkout could not be started. Please try again or contact us.";

function CartThumbnail({ item }: { item: CartItem }) {
  if (item.imageUrl) {
    return <img src={item.imageUrl} alt={item.name} />;
  }

  return <span aria-hidden="true">{item.name.charAt(0)}</span>;
}

export function CartPageClient() {
  const {
    itemCount,
    items,
    removeItem,
    shippingCents,
    shippingCopy,
    subtotalCents,
    totalCents,
    updateQuantity
  } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currency = items[0]?.currency ?? "CAD";

  async function handleCheckout(): Promise<void> {
    if (items.length === 0) {
      return;
    }

    setIsCheckingOut(true);
    setError(null);

    try {
      const session = await createCheckoutSession({
        items: items.map((item) => ({
          productSlug: item.productSlug,
          quantity: item.quantity
        }))
      });

      window.location.href = session.checkoutUrl;
    } catch {
      setError(CHECKOUT_ERROR_MESSAGE);
      setIsCheckingOut(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <section className={styles.emptyState} aria-labelledby="cart-empty-title">
          <p className={styles.eyebrow}>TigerPingPong.ca cart</p>
          <h1 id="cart-empty-title">Your cart is empty.</h1>
          <p>
            Add a table, paddle, balls, or accessory from the catalog, then return here before
            Stripe Checkout.
          </p>
          <a className={styles.primaryAction} href="/catalog">
            Continue shopping
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.header} aria-labelledby="cart-title">
        <div>
          <p className={styles.eyebrow}>TigerPingPong.ca cart</p>
          <h1 id="cart-title">Review your cart.</h1>
          <p>
            Canada only. Stripe Checkout handles payment after the backend re-checks products,
            totals, and shipping.
          </p>
        </div>
        <a className={styles.secondaryAction} href="/catalog">
          Continue shopping
        </a>
      </section>

      <section className={styles.cartLayout} aria-label="Cart review">
        <div className={styles.cartItems} aria-label={`${itemCount} cart items`}>
          {items.map((item) => (
            <article className={styles.cartItem} key={item.productSlug}>
              <a
                className={styles.itemImage}
                href={`/catalog/products/${item.productSlug}`}
                aria-label={`View ${item.name}`}
              >
                <CartThumbnail item={item} />
              </a>

              <div className={styles.itemInfo}>
                <p>{item.categoryName ?? "Tiger Ping Pong"}</p>
                <h2>
                  <a href={`/catalog/products/${item.productSlug}`}>{item.name}</a>
                </h2>
                <span>{formatCartMoney(item.unitPriceCents, item.currency)} each</span>
              </div>

              <div className={styles.quantityControls} aria-label={`Quantity for ${item.name}`}>
                <button
                  aria-label={`Decrease quantity for ${item.name}`}
                  disabled={item.quantity <= 1}
                  onClick={() => updateQuantity(item.productSlug, item.quantity - 1)}
                  type="button"
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  aria-label={`Increase quantity for ${item.name}`}
                  disabled={item.quantity >= MAX_CART_QUANTITY_PER_LINE}
                  onClick={() => updateQuantity(item.productSlug, item.quantity + 1)}
                  type="button"
                >
                  +
                </button>
              </div>

              <div className={styles.itemTotal}>
                <strong>
                  {formatCartMoney(item.unitPriceCents * item.quantity, item.currency)}
                </strong>
                <button onClick={() => removeItem(item.productSlug)} type="button">
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className={styles.summary} aria-labelledby="cart-summary-title">
          <h2 id="cart-summary-title">Order summary</h2>
          <dl className={styles.summaryList}>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatCartMoney(subtotalCents, currency)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{shippingCents === 0 ? "Free" : formatCartMoney(shippingCents, currency)}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{formatCartMoney(totalCents, currency)}</dd>
            </div>
          </dl>

          <div className={styles.shippingNotice}>
            <strong>{shippingCopy}</strong>
            <span>
              Orders over {formatCartMoney(FREE_SHIPPING_THRESHOLD_CENTS, currency)} ship free.
              Orders at or under {formatCartMoney(FREE_SHIPPING_THRESHOLD_CENTS, currency)} use $15
              flat-rate shipping.
            </span>
          </div>

          <button
            aria-busy={isCheckingOut}
            className={styles.checkoutButton}
            disabled={isCheckingOut}
            onClick={() => void handleCheckout()}
            type="button"
          >
            {isCheckingOut ? "Opening Stripe Checkout..." : "Checkout"}
          </button>

          {error ? (
            <p className={styles.checkoutError} role="status">
              {error}
            </p>
          ) : null}

          <p className={styles.paymentTruth}>
            Payment is confirmed only after the backend receives Stripe webhook confirmation.
          </p>
        </aside>
      </section>
    </main>
  );
}
