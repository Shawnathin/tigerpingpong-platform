import type { Metadata } from "next";

import { getPathMetadata } from "../lib/seo";
import { PublicStorefrontFooter } from "./PublicStorefrontFooter";
import { PublicStorefrontNav } from "./PublicStorefrontNav";
import styles from "./page.module.css";

export const metadata: Metadata = getPathMetadata({
  pathname: "/",
  title: "Tiger Ping Pong | Tables, Paddles, Balls, and Accessories"
});

const PORTLAND_IMAGE =
  "https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/1280x1280/products/112/774/Portland_Outdoor_Black_-_Grey_Top__73629.1685479931.jpg?c=1";
const WHISTLER_IMAGE =
  "https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/1280x1280/products/116/623/whistler_indoor-04__70000.1665858593.jpg?c=1";
const NET_POST_IMAGE =
  "https://cdn11.bigcommerce.com/s-dh0jici9dm/products/128/images/644/home_accessories-net_post_set__11719.1650711219__23376.1659982669.386.513.png?c=1";

const PRODUCT_FEATURES = [
  {
    badge: "Indoor table",
    cta: "View Whistler Indoor",
    href: "/catalog/products/tiger-whistler-indoor-table",
    imageAlt: "Whistler Indoor table",
    imageSrc: WHISTLER_IMAGE,
    label: "Featured table",
    title: "Whistler Indoor"
  },
  {
    badge: "Accessory",
    cta: "View Net & Post Set",
    href: "/catalog/products/tiger-net-post-set",
    imageAlt: "Tiger Ping Pong net and post set",
    imageSrc: NET_POST_IMAGE,
    label: "Featured accessory",
    title: "Net & Post Set"
  }
];

export default function Home() {
  return (
    <>
      <PublicStorefrontNav activeItem="home" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>TigerPingPong.ca</p>
            <h1 className={styles.title} id="home-title">
              Tables, paddles, balls, and accessories.
            </h1>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="/tables/">
                Shop tables
              </a>
              <a className={styles.secondaryAction} href="/shipping-returns">
                Shipping & returns
              </a>
            </div>
          </div>

          <div className={styles.heroVisual} aria-label="Featured Portland Outdoor table">
            <span className={styles.heroBadge}>
              <small>Featured setup</small>
              <strong>Portland Outdoor</strong>
              <em>Free shipping over $100</em>
            </span>
            <img src={PORTLAND_IMAGE} alt="Portland Outdoor table in grey" />
          </div>
        </section>

        <section className={styles.productFeatures} aria-label="Featured products">
          {PRODUCT_FEATURES.map((feature, index) => (
            <a
              className={styles.productFeature}
              data-layout={index % 2 === 0 ? "image-right" : "image-left"}
              href={feature.href}
              key={feature.title}
            >
              <span className={styles.productFeatureCopy}>
                <small>{feature.label}</small>
                <strong>{feature.title}</strong>
                <em>{feature.cta}</em>
              </span>
              <span className={styles.productFeatureVisual}>
                <span>{feature.badge}</span>
                <img src={feature.imageSrc} alt={feature.imageAlt} />
              </span>
            </a>
          ))}
        </section>

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
