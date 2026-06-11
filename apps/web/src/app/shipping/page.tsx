import type { Metadata } from "next";

import { PublicStorefrontNav } from "../PublicStorefrontNav";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Shipping | Tiger Ping Pong",
  description: "Tiger Ping Pong Canada-wide shipping terms."
};

export default function ShippingPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="shipping" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="shipping-title">
          <p className={styles.eyebrow}>Shipping</p>
          <h1 className={styles.title} id="shipping-title">
            Simple Canada-wide shipping for online orders.
          </h1>
          <p className={styles.intro}>
            Tiger Ping Pong ships storefront orders within Canada. Tables and high-priced products
            qualify for free shipping across Canada.
          </p>
        </section>

        <section className={styles.ruleGrid} aria-labelledby="shipping-rules-title">
          <div className={styles.ruleLead}>
            <p className={styles.eyebrow}>Shipping rule</p>
            <h2 id="shipping-rules-title">Over $100 ships free. $100 or under ships for $15.</h2>
          </div>

          <article>
            <span>Canada only</span>
            <strong>Online orders ship across Canada.</strong>
            <p>Shipping outside Canada is not supported in this storefront pass.</p>
          </article>

          <article>
            <span>Orders over $100 CAD</span>
            <strong>Free shipping across Canada.</strong>
            <p>This includes tables and other higher-priced products.</p>
          </article>

          <article>
            <span>$100 CAD or under</span>
            <strong>$15 flat-rate shipping.</strong>
            <p>Exactly $100.00 CAD still uses the $15 flat-rate shipping rule.</p>
          </article>
        </section>

        <section className={styles.copyBand} aria-labelledby="shipping-copy-title">
          <div>
            <p className={styles.eyebrow}>Customer copy</p>
            <h2 id="shipping-copy-title">What shoppers see on product pages.</h2>
          </div>
          <ul>
            <li>High-priced products and tables: Free shipping across Canada.</li>
            <li>Lower-priced products: Free shipping on orders over $100.</li>
            <li>Checkout calculates the final shipping total before payment.</li>
          </ul>
        </section>

        <section className={styles.supportBand} aria-labelledby="shipping-support-title">
          <div>
            <p className={styles.eyebrow}>Shipping questions</p>
            <h2 id="shipping-support-title">Need help before or after checkout?</h2>
            <p>
              Contact Tiger Ping Pong for shipping questions, order/payment help, product details,
              or dealer and setup support from Vancouver, BC across Canada. For order questions,
              include your order reference if available, checkout email, and product name if
              relevant.
            </p>
          </div>
          <a className={styles.primaryAction} href="/contact">
            Contact support
          </a>
        </section>
      </main>
    </>
  );
}
