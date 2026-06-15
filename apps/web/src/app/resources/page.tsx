import type { Metadata } from "next";

import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import styles from "../info-page.module.css";

export const metadata: Metadata = {
  title: "Resources | Tiger Ping Pong",
  description: "Tiger Ping Pong shopping resources for tables, accessories, shipping, and support."
};

const RESOURCE_LINKS = [
  { href: "/tables/", label: "Shop tables" },
  { href: "/tables/indoor-tables/", label: "Indoor tables" },
  { href: "/tables/outdoor-tables/", label: "Outdoor tables" },
  { href: "/accessories/", label: "Accessories" },
  { href: "/shipping-returns", label: "Shipping & returns" },
  { href: "/contact", label: "Contact support" }
];

export default function ResourcesPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="resources" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="resources-title">
          <p className={styles.eyebrow}>Resources</p>
          <h1 id="resources-title">Useful starting points for choosing Tiger Ping Pong gear.</h1>
          <p>
            Start with the active shopping categories, shipping terms, and support paths that are
            ready on the storefront today.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="resources-links-title">
          <p className={styles.eyebrow}>Browse</p>
          <h2 id="resources-links-title">Current storefront resources.</h2>
          <ul className={styles.linkList}>
            {RESOURCE_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.panelGrid} aria-label="Resource notes">
          <article>
            <span>Tables</span>
            <strong>Indoor and outdoor table paths are live.</strong>
            <p>Use the table pages to compare current table products and shipping terms.</p>
          </article>
          <article>
            <span>Accessories</span>
            <strong>Paddles, balls, covers, and nets are organized by route.</strong>
            <p>Accessory pages use the live catalog data available to the storefront.</p>
          </article>
          <article>
            <span>Support</span>
            <strong>Shipping and contact pages are ready for customer questions.</strong>
            <p>Policy-heavy pages not backed by real content are intentionally not linked yet.</p>
          </article>
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
