import type { Metadata } from "next";

import { PublicStorefrontNav } from "../../PublicStorefrontNav";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Checkout Canceled | Tiger Ping Pong Platform",
  description: "V1 Stripe checkout cancellation redirect page for Tiger Ping Pong."
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
            This page only handles a canceled or incomplete Stripe checkout redirect. It does not
            mark an order as failed, paid, or fulfilled.
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

          <div className={styles.actions}>
            <a className={styles.primaryAction} href="/catalog">
              Return to catalog
            </a>
            <a className={styles.secondaryLink} href="/shipping">
              Review shipping
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
