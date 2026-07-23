"use client";

import { TABLE_ACCESSORIES_PRICING_RULE_VERSION } from "@tigerpingpong/shared";
import { useState } from "react";

import { CheckoutApiError, createCheckoutSession } from "../../lib/checkout-api";
import {
  MAX_CART_QUANTITY_PER_LINE,
  formatCartItemOptions,
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

function getCartItemHref(item: CartItem): string {
  if (item.productKind === "replacement_part") {
    return item.productSlug === "tiger-pingpong-replacement-part-40"
      ? "/replacement-parts/#part-40"
      : "/replacement-parts/";
  }

  return `/catalog/products/${item.productSlug}`;
}

export function CartPageClient() {
  const {
    discountCents,
    itemCount,
    items,
    listSubtotalCents,
    pricingAllocations,
    removeItem,
    reconcileItems,
    shippingCents,
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
          quantity: item.quantity,
          expectedUnitPriceCents: item.unitPriceCents,
          selectedVariantKey: item.selectedVariantKey,
          selectedOptions: item.selectedOptions.map((option) => ({
            name: option.name,
            value: option.value
          }))
        })),
        pricingRuleVersion: TABLE_ACCESSORIES_PRICING_RULE_VERSION
      });

      window.location.href = session.checkoutUrl;
    } catch (checkoutError) {
      if (
        checkoutError instanceof CheckoutApiError &&
        checkoutError.status === 409 &&
        checkoutError.cartChanges.length > 0
      ) {
        reconcileItems(checkoutError.cartChanges);
        setError("Your cart changed. Review the updated items before checking out again.");
      } else {
        setError(CHECKOUT_ERROR_MESSAGE);
      }
      setIsCheckingOut(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <section className={styles.emptyState} aria-labelledby="cart-empty-title">
          <h1 id="cart-empty-title">Your cart is empty.</h1>
          {error ? <p role="status">{error}</p> : null}
          <a className={styles.primaryAction} href="/tables/">
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
          <h1 id="cart-title">Review your cart.</h1>
        </div>
        <a className={styles.secondaryAction} href="/tables/">
          Continue shopping
        </a>
      </section>

      <section className={styles.cartLayout} aria-label="Cart review">
        <div className={styles.cartItems} aria-label={`${itemCount} cart items`}>
          {items.map((item) => {
            const pricing = pricingAllocations.find(
              (allocation) => allocation.lineId === item.cartLineId
            );

            return (
              <article className={styles.cartItem} key={item.cartLineId}>
                <a
                  className={styles.itemImage}
                  href={getCartItemHref(item)}
                  aria-label={`View ${item.name}`}
                >
                  <CartThumbnail item={item} />
                </a>

                <div className={styles.itemInfo}>
                  <p>{item.categoryName ?? "Tiger Ping Pong"}</p>
                  <h2>
                    <a href={getCartItemHref(item)}>{item.name}</a>
                  </h2>
                  {item.selectedOptions.length > 0 ? (
                    <em>{formatCartItemOptions(item.selectedOptions)}</em>
                  ) : null}
                  <span>
                    Regular price {formatCartMoney(item.unitPriceCents, item.currency)} each
                  </span>
                  {pricing && pricing.discountedQuantity > 0 ? (
                    <strong className={styles.offerLabel}>
                      30% off {pricing.discountedQuantity}
                      {pricing.discountedQuantity === item.quantity
                        ? ""
                        : ` of ${item.quantity}`}{" "}
                      with your table
                    </strong>
                  ) : null}
                </div>

                <div className={styles.quantityControls} aria-label={`Quantity for ${item.name}`}>
                  <button
                    aria-label={`Decrease quantity for ${item.name}`}
                    disabled={item.quantity <= 1}
                    onClick={() => updateQuantity(item.cartLineId, item.quantity - 1)}
                    type="button"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    aria-label={`Increase quantity for ${item.name}`}
                    disabled={item.quantity >= MAX_CART_QUANTITY_PER_LINE}
                    onClick={() => updateQuantity(item.cartLineId, item.quantity + 1)}
                    type="button"
                  >
                    +
                  </button>
                </div>

                <div className={styles.itemTotal}>
                  {pricing && pricing.discountCents > 0 ? (
                    <del>{formatCartMoney(pricing.listLineTotalCents, item.currency)}</del>
                  ) : null}
                  <strong>
                    {formatCartMoney(
                      pricing?.netLineTotalCents ?? item.unitPriceCents * item.quantity,
                      item.currency
                    )}
                  </strong>
                  {pricing && pricing.discountCents > 0 ? (
                    <span>You save {formatCartMoney(pricing.discountCents, item.currency)}</span>
                  ) : null}
                  <button onClick={() => removeItem(item.cartLineId)} type="button">
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <aside className={styles.summary} aria-labelledby="cart-summary-title">
          <h2 id="cart-summary-title">Order summary</h2>
          <dl className={styles.summaryList}>
            {discountCents > 0 ? (
              <>
                <div>
                  <dt>Regular subtotal</dt>
                  <dd>{formatCartMoney(listSubtotalCents, currency)}</dd>
                </div>
                <div className={styles.savingsRow}>
                  <dt>Table accessory savings</dt>
                  <dd>-{formatCartMoney(discountCents, currency)}</dd>
                </div>
              </>
            ) : null}
            <div>
              <dt>Subtotal</dt>
              <dd>{formatCartMoney(subtotalCents, currency)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{shippingCents === 0 ? "Free" : formatCartMoney(shippingCents, currency)}</dd>
            </div>
            <div className={styles.taxRow}>
              <dt>Taxes</dt>
              <dd>Calculated at checkout</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{formatCartMoney(totalCents, currency)}</dd>
            </div>
          </dl>

          <div className={styles.shippingNotice}>
            <strong>You’re so close to the next rally!</strong>
            <span>One more step and we’ll take it from there.</span>
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
        </aside>
      </section>
    </main>
  );
}
