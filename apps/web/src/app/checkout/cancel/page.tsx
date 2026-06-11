import type { Metadata } from "next";

import { PublicStorefrontNav } from "../../PublicStorefrontNav";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Checkout Canceled | Tiger Ping Pong",
  description: "Tiger Ping Pong checkout cancellation page."
};

export default function CheckoutCancelPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="catalog" />
      <main className={styles.page}>
        <div className={styles.backBar}>
          <a href="/catalog">Back to catalog</a>
        </div>

        <section className={styles.header} aria-labelledby="checkout-cancel-title">
          <p className={styles.eyebrow}>TigerPingPong.ca checkout</p>
          <h1 className={styles.title} id="checkout-cancel-title">
            Checkout was canceled
          </h1>
          <p className={styles.intro}>
            Checkout was canceled. No payment was completed through this page. You can return to the
            catalog and try again when ready.
          </p>
        </section>

        <section className={styles.panel} aria-labelledby="checkout-cancel-status-title">
          <h2 id="checkout-cancel-status-title">No checkout confirmation</h2>
          <p>
            This page only handles a canceled or incomplete checkout. It does not mark an order as
            failed, paid, or fulfilled.
          </p>

          <dl className={styles.statusList}>
            <div>
              <dt>Redirect result</dt>
              <dd>Checkout was canceled or not completed.</dd>
            </div>
            <div>
              <dt>Payment status</dt>
              <dd>No payment confirmation happens on this page.</dd>
            </div>
          </dl>

          <p className={styles.supportNote}>
            If you canceled because checkout was unclear, a product detail is unclear, or you have
            payment questions, <a href="/contact">contact support</a> before trying again. Include
            your order reference if available, checkout email, and product name if relevant.
          </p>

          <div className={styles.actions}>
            <a className={styles.primaryAction} href="/catalog">
              Return to catalog
            </a>
            <a className={styles.secondaryLink} href="/shipping">
              Review shipping
            </a>
            <a className={styles.secondaryLink} href="/contact">
              Contact support
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
