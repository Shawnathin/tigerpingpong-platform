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
    body: "Aqua outdoor paddle sets and play-ready options for the first match out of the box.",
    cta: "Shop paddles",
    href: "/accessories/paddles/",
    imageAlt: "Aqua paddle set box",
    imageSrc: "/storefront/prototype/aqua-paddle/aqua-4count-box-angle.jpg",
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
              <em>Free shipping across Canada</em>
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

        <section className={styles.shippingBand} aria-labelledby="shipping-promise-title">
          <div>
            <p className={styles.eyebrow}>Shipping promise</p>
            <h2 id="shipping-promise-title">Free shipping over $100 across Canada.</h2>
            <p>
              Orders over $100 CAD ship free across Canada. Orders $100 CAD or under use $15 CAD
              flat-rate shipping.
            </p>
          </div>
          <a className={styles.secondaryAction} href="/shipping-returns">
            Shipping details
          </a>
        </section>

        <section className={styles.supportBand} aria-labelledby="support-title">
          <div>
            <p className={styles.eyebrow}>Need a local hand?</p>
            <h2 id="support-title">
              Product, shipping, checkout, and setup questions all have one clear path.
            </h2>
            <p>
              Call <a href="tel:+18885525259">1-888-552-5259</a> or email{" "}
              <a href="mailto:info@tigerpingpong.com">info@tigerpingpong.com</a> for Vancouver, BC
              support across Canada.
            </p>
          </div>
          <a className={styles.primaryAction} href="/contact">
            Contact support
          </a>
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
