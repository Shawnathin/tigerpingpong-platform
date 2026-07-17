import type { Metadata } from "next";

import { getPathMetadata } from "../lib/seo";
import { HomepagePromotions } from "./HomepagePromotions";
import { PublicStorefrontFooter } from "./PublicStorefrontFooter";
import { PublicStorefrontNav } from "./PublicStorefrontNav";
import styles from "./page.module.css";

export const metadata: Metadata = getPathMetadata({
  pathname: "/",
  title: "Tiger Ping Pong | Tables, Paddles, Balls, and Accessories"
});

export default function Home() {
  return (
    <>
      <PublicStorefrontNav activeItem="home" />
      <main className={styles.page}>
        <HomepagePromotions />

        <section className={styles.supportBand} aria-label="Support">
          <div>
            <p>
              Call <a href="tel:+18885525259">1-888-552-5259</a> or email{" "}
              <a href="mailto:info@tigerpingpong.com">info@tigerpingpong.com</a>.
            </p>
          </div>
          <div className={styles.supportActions} aria-label="Support links">
            <a className={styles.primaryAction} href="/contact">
              Contact
            </a>
            <a className={styles.secondaryAction} href="/contact#order-help-title">
              Orders
            </a>
            <a className={styles.secondaryAction} href="/catalog">
              Products
            </a>
          </div>
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
