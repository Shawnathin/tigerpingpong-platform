import type { Metadata } from "next";

import { PublicStorefrontFooter } from "../../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../../PublicStorefrontNav";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Checkout Canceled | Tiger Ping Pong",
  robots: {
    index: false,
    follow: false
  }
};

export default function CheckoutCancelPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="tables" />
      <main className={styles.page}>
        <div className={styles.backBar}>
          <a href="/tables/">Back to tables</a>
        </div>

        <section className={styles.header} aria-labelledby="checkout-cancel-title">
          <p className={styles.eyebrow}>TigerPingPong.ca checkout</p>
          <h1 className={styles.title} id="checkout-cancel-title">
            Checkout was canceled
          </h1>
        </section>

        <section className={styles.panel} aria-labelledby="checkout-cancel-status-title">
          <h2 id="checkout-cancel-status-title">Checkout was not completed.</h2>

          <p className={styles.supportNote}>
            If you canceled because checkout was unclear, a product detail is unclear, or you have
            payment questions, <a href="/contact">contact support</a> before trying again. Include
            your order reference if available, checkout email, and product name if relevant.
          </p>

          <div className={styles.actions}>
            <a className={styles.primaryAction} href="/tables/">
              Return to tables
            </a>
            <a className={styles.secondaryLink} href="/shipping-returns">
              Review shipping
            </a>
            <a className={styles.secondaryLink} href="/contact">
              Contact support
            </a>
          </div>
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
