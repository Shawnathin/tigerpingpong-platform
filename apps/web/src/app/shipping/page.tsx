import type { Metadata } from "next";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Shipping | Tiger Ping Pong Platform",
  description: "V1 Tiger Ping Pong online order shipping terms placeholder."
};

export default function ShippingPage() {
  return (
    <main className={styles.page}>
      <div className={styles.backBar}>
        <a href="/catalog">Back to catalog</a>
      </div>

      <section className={styles.header} aria-labelledby="shipping-title">
        <p className={styles.eyebrow}>TigerPingPong.ca</p>
        <h1 className={styles.title} id="shipping-title">
          Shipping
        </h1>
        <p className={styles.intro}>
          This V1 placeholder summarizes the shipping rule for Tiger Ping Pong online orders.
          Final wording should be reviewed before public launch.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="shipping-rules-title">
        <h2 id="shipping-rules-title">V1 Online Order Shipping</h2>
        <ul className={styles.ruleList}>
          <li>Free shipping across Canada on orders over $100.</li>
          <li>$15 flat rate shipping across Canada on orders under or equal to $100.</li>
          <li>Applies to Tiger Ping Pong V1 online orders.</li>
          <li>Additional terms and conditions may apply.</li>
          <li>Final wording should be reviewed before public launch.</li>
        </ul>
      </section>
    </main>
  );
}
