import type { Metadata } from "next";

import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Shipping | Tiger PingPong",
  description: "Tiger PingPong Canada-wide shipping terms."
};

export default function ShippingPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="support" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="shipping-title">
          <h1 className={styles.title} id="shipping-title">
            Shipping
          </h1>
          <p className={styles.intro}>
            Tiger PingPong ships storefront orders within Canada. Orders over $100 CAD ship free
            across Canada. The Aqua 4-Pack w/ 3 Balls also ships free when it is the only item in
            the cart. A cart with a full set of eight Part 40 clips ships free too.
          </p>
        </section>

        <section className={styles.ruleGrid} aria-labelledby="shipping-rules-title">
          <div className={styles.ruleLead}>
            <p className={styles.eyebrow}>Shipping rule</p>
            <h2 id="shipping-rules-title">
              Over $100 ships free. So do the Aqua 4-Pack on its own and a full set of Part 40
              clips. Otherwise, shipping is $15.
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

          <article>
            <span>Part 40 full-set exception</span>
            <strong>Eight or more Part 40 clips ship free across Canada.</strong>
            <p>The free-shipping exception starts when the cart contains a full set of eight.</p>
          </article>
        </section>

        <section className={styles.supportBand} aria-label="Shipping support">
          <a className={styles.primaryAction} href="/contact">
            Contact support
          </a>
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
