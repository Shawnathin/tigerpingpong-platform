import type { Metadata } from "next";

import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import styles from "../info-page.module.css";

export const metadata: Metadata = {
  title: "About | Tiger Ping Pong",
  description: "About Tiger Ping Pong and its Canadian ecommerce storefront."
};

export default function AboutPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="support" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="about-title">
          <p className={styles.eyebrow}>About Tiger Ping Pong</p>
          <h1 id="about-title">Tables, paddles, balls, and support for Canadian play.</h1>
          <p>
            Tiger Ping Pong serves customers from Vancouver, BC with a focused ecommerce storefront
            for ping pong tables, paddles, balls, accessories, and replacement-parts support.
          </p>
        </section>

        <section className={styles.panelGrid} aria-label="About Tiger Ping Pong">
          <article>
            <span>Storefront</span>
            <strong>Built around the current Tiger Ping Pong product lineup.</strong>
            <p>Category pages use live catalog data where product records are available.</p>
          </article>
          <article>
            <span>Checkout</span>
            <strong>Secure online checkout keeps payment handling simple.</strong>
            <p>Orders are confirmed through the backend after Stripe payment events.</p>
          </article>
          <article>
            <span>Support</span>
            <strong>Customer help starts with one clear contact path.</strong>
            <p>Contact support for products, shipping, orders, setup, and replacement parts.</p>
          </article>
        </section>

        <section className={styles.supportBand} aria-labelledby="about-support-title">
          <div>
            <p className={styles.eyebrow}>Questions</p>
            <h2 id="about-support-title">Need help choosing or ordering?</h2>
            <p>Reach Tiger Ping Pong for product, shipping, checkout, and setup questions.</p>
          </div>
          <a href="/contact">Contact support</a>
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
