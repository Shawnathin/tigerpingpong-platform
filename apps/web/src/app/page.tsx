import type { Metadata } from "next";

import { PublicStorefrontFooter } from "./PublicStorefrontFooter";
import { PublicStorefrontNav } from "./PublicStorefrontNav";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Tiger Ping Pong | Tables, Paddles, Balls, and Accessories",
  description:
    "Shop Tiger Ping Pong tables, paddles, balls, and accessories with Canada-wide shipping."
};

const PORTLAND_IMAGE =
  "https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/1280x1280/products/112/774/Portland_Outdoor_Black_-_Grey_Top__73629.1685479931.jpg?c=1";
const WHISTLER_IMAGE =
  "https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/1280x1280/products/116/623/whistler_indoor-04__70000.1665858593.jpg?c=1";
const NET_POST_IMAGE =
  "https://cdn11.bigcommerce.com/s-dh0jici9dm/products/128/images/644/home_accessories-net_post_set__11719.1650711219__23376.1659982669.386.513.png?c=1";
const VICE_PADDLE_IMAGE =
  "https://cdn11.bigcommerce.com/s-dh0jici9dm/products/122/images/642/Asset_39__72425__25086.1659982440.386.513.jpg?c=1";

const CATEGORY_CARDS = [
  {
    body: "Weather-ready outdoor builds and polished indoor tables for home, school, and club play.",
    cta: "Explore tables",
    href: "/tables/",
    imageAlt: "Portland Outdoor table",
    imageSrc: PORTLAND_IMAGE,
    label: "Tables",
    title: "From rec room to rain-ready."
  },
  {
    body: "Entry-level paddle options for quick matches and everyday rallies.",
    cta: "Shop paddles",
    href: "/accessories/paddles/",
    imageAlt: "Tiger Ping Pong Vice paddle",
    imageSrc: VICE_PADDLE_IMAGE,
    label: "Paddles",
    title: "Add a clean, fast first serve."
  },
  {
    body: "Covers and simple setup extras keep the table ready between matches.",
    cta: "View accessories",
    href: "/accessories/",
    imageAlt: "Tiger Ping Pong outdoor table cover",
    imageSrc: "/storefront/prototype/table-cover-transparent.png",
    label: "Accessories",
    title: "Protection that still looks party-ready."
  }
];

const PRODUCT_FEATURES = [
  {
    badge: "Indoor table",
    body: "A serious indoor table with a tournament-spec playing surface.",
    cta: "View Whistler Indoor",
    href: "/catalog/products/tiger-whistler-indoor-table",
    imageAlt: "Whistler Indoor table",
    imageSrc: WHISTLER_IMAGE,
    label: "Featured table",
    title: "Whistler Indoor"
  },
  {
    badge: "Accessory",
    body: "A net and post set for keeping the table ready to play.",
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
              Tables, paddles, and game-night gear for the next rally.
            </h1>
            <p className={styles.intro}>
              Shop the Tiger Ping Pong product lineup with clear product pages, secure checkout, and
              simple Canada-wide shipping.
            </p>
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

        <section className={styles.positioning} aria-label="Tiger Ping Pong promise">
          <div>
            <span>Canada only</span>
            <strong>Ships across Canada with a simple order rule.</strong>
          </div>
          <div>
            <span>Secure checkout</span>
            <strong>Product pages keep the path to purchase simple.</strong>
          </div>
          <div>
            <span>Product lineup</span>
            <strong>Shop tables, paddles, balls, and accessories.</strong>
          </div>
        </section>

        <section className={styles.featured} aria-labelledby="featured-title">
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Shop the lineup</p>
            <h2 id="featured-title">Everything for the next match.</h2>
          </div>

          <div className={styles.categoryGrid}>
            {CATEGORY_CARDS.map((card) => (
              <a className={styles.categoryCard} href={card.href} key={card.label}>
                <span className={styles.cardCopy}>
                  <small>{card.label}</small>
                  <strong>{card.title}</strong>
                  <span>{card.body}</span>
                  <em>{card.cta}</em>
                </span>
                <img src={card.imageSrc} alt={card.imageAlt} />
              </a>
            ))}
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
                <span>{feature.body}</span>
                <em>{feature.cta}</em>
              </span>
              <span className={styles.productFeatureVisual}>
                <span>{feature.badge}</span>
                <img src={feature.imageSrc} alt={feature.imageAlt} />
              </span>
            </a>
          ))}
        </section>

        <section className={styles.shippingBand} aria-labelledby="shipping-promise-title">
          <div>
            <p className={styles.eyebrow}>Shipping promise</p>
            <h2 id="shipping-promise-title">Free shipping over $100 across Canada.</h2>
          </div>
          <a className={styles.secondaryAction} href="/shipping-returns">
            Shipping details
          </a>
        </section>

        <section className={styles.supportBand} aria-labelledby="support-title">
          <div>
            <p className={styles.eyebrow}>Need a local hand?</p>
            <h2 id="support-title">Questions before the next match?</h2>
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
