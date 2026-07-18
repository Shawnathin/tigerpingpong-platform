import Image from "next/image";

import styles from "./page.module.css";

const PROMOTIONS = [
  {
    alt: "Red and blue Aqua outdoor paddles in liquid-glass artwork",
    cta: "Explore Aqua",
    eyebrow: "Aqua Outdoor Paddles",
    height: 811,
    href: "/catalog/products/tiger-aqua-outdoor-indoor-paddle",
    image:
      "https://res.cloudinary.com/djfcisldm/image/upload/v1784314548/tigerpingpong/storefront/homepage-promotions/aqua-outdoor-paddles.png",
    leftHeadline: "Make a",
    rightHeadline: "Splash.",
    tone: "aqua",
    width: 859
  },
  {
    alt: "Portland Outdoor ping pong table",
    cta: "Shop Portland",
    eyebrow: "Portland Outdoor",
    height: 811,
    href: "/catalog/products/tiger-portland-outdoor-table",
    image:
      "https://res.cloudinary.com/djfcisldm/image/upload/v1784314549/tigerpingpong/storefront/homepage-promotions/portland-outdoor.png",
    leftHeadline: "Take it",
    rightHeadline: "Outside.",
    tone: "portland",
    width: 859
  },
  {
    alt: "Black Tiger Ping Pong table cover with a white logo in molten-amber artwork",
    cta: "View the Cover",
    eyebrow: "Tiger Table Cover",
    height: 1266,
    href: "/catalog/products/tiger-table-cover-black-polyester",
    image:
      "https://res.cloudinary.com/djfcisldm/image/upload/v1784314550/tigerpingpong/storefront/homepage-promotions/tiger-table-cover-molten-amber-product-hero-v4-white-logo.png",
    leftHeadline: "Ultra",
    rightHeadline: "Protection.",
    tone: "cover",
    width: 1574
  }
] as const;

export function HomepagePromotions() {
  return (
    <section aria-label="Featured products" className={styles.promotionStack}>
      {PROMOTIONS.map((promotion, index) => (
        <article className={styles.promotionPanel} data-tone={promotion.tone} key={promotion.tone}>
          <div className={styles.promotionVisual}>
            <Image
              alt={promotion.alt}
              className={styles.promotionImage}
              height={promotion.height}
              priority={index === 0}
              sizes="(max-width: 760px) 92vw, (max-width: 1120px) 76vw, 52vw"
              src={promotion.image}
              width={promotion.width}
            />
          </div>

          {index === 0 ? (
            <h1 className={styles.promotionHeadline}>
              <span className={styles.promotionHeadlineLeft}>{promotion.leftHeadline}</span>
              <span className={styles.promotionHeadlineRight}> {promotion.rightHeadline}</span>
            </h1>
          ) : (
            <h2 className={styles.promotionHeadline}>
              <span className={styles.promotionHeadlineLeft}>{promotion.leftHeadline}</span>
              <span className={styles.promotionHeadlineRight}> {promotion.rightHeadline}</span>
            </h2>
          )}

          <div className={styles.promotionMeta}>
            <p className={styles.promotionEyebrow}>{promotion.eyebrow}</p>
            <a className={styles.primaryAction} href={promotion.href}>
              {promotion.cta}
            </a>
          </div>
        </article>
      ))}
    </section>
  );
}
