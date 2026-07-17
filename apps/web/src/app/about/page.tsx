import type { Metadata } from "next";

import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import styles from "../info-page.module.css";

export const metadata: Metadata = {
  title: "About | Tiger Ping Pong"
};

export default function AboutPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="support" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="about-title">
          <h1 id="about-title">About Tiger Ping Pong</h1>
        </section>
        <section className={styles.supportBand} aria-label="Support">
          <a href="/contact">Contact support</a>
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
