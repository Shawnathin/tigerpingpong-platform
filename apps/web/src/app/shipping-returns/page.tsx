import type { Metadata } from "next";

import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import { getPathMetadata } from "../../lib/seo";
import styles from "../shipping/page.module.css";

export const metadata: Metadata = getPathMetadata({
  title: "Shipping & Returns | Tiger Ping Pong",
  description: "Tiger Ping Pong Canada-wide shipping and returns support.",
  pathname: "/shipping-returns"
});

export default function ShippingReturnsPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="support" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="shipping-title">
          <h1 className={styles.title} id="shipping-title">
            Shipping & Returns
          </h1>
          <p className={styles.intro}>
            Tiger Ping Pong ships storefront orders within Canada. Orders over $100 CAD ship free
            across Canada. The Aqua 4-Pack w/ 3 Balls also ships free when it is the only item in
            the cart.
          </p>
        </section>

        <section className={styles.ruleGrid} aria-labelledby="shipping-rules-title">
          <div className={styles.ruleLead}>
            <p className={styles.eyebrow}>Shipping rule</p>
            <h2 id="shipping-rules-title">
              Over $100 ships free. The Aqua 4-Pack ships free on its own. Otherwise, shipping is
              $15.
            </h2>
          </div>

          <article>
            <span>Canada only</span>
            <strong>Online orders ship across Canada.</strong>
            <p>Shipping outside Canada is not supported.</p>
          </article>

          <article>
            <span>Orders over $100 CAD</span>
            <strong>Orders over $100 CAD ship free across Canada.</strong>
            <p>Checkout calculates the final shipping total before payment.</p>
          </article>

          <article>
            <span>$100 CAD or under</span>
            <strong>Other orders $100 CAD or under use $15 CAD flat-rate shipping.</strong>
            <p>Exactly $100.00 CAD still uses the $15 flat-rate shipping rule.</p>
          </article>

          <article>
            <span>Aqua 4-Pack exception</span>
            <strong>The Aqua 4-Pack w/ 3 Balls ships free across Canada.</strong>
            <p>
              The free-shipping exception applies when that 4-pack is the only item in the cart.
            </p>
          </article>
        </section>

        <section className={styles.copyBand} aria-labelledby="returns-copy-title">
          <div>
            <p className={styles.eyebrow}>Returns support</p>
            <h2 id="returns-copy-title">Contact support for returns or order questions.</h2>
          </div>
          <ul>
            <li>Review the dedicated returns policy before sending any product back.</li>
            <li>Include your order reference if available.</li>
            <li>Include your checkout email.</li>
            <li>Include the product name and a short description of the issue.</li>
            <li>Tiger Ping Pong support will confirm the next step for the order.</li>
          </ul>
        </section>

        <section className={styles.supportBand} aria-label="Shipping and returns support">
          <a className={styles.primaryAction} href="/contact">
            Contact support
          </a>
          <a className={styles.primaryAction} href="/returns-policy">
            Read returns policy
          </a>
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
