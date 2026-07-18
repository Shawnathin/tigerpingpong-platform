import Image from "next/image";

import { tigerStory } from "../lib/tiger-story";
import styles from "./page.module.css";

const homepage = tigerStory.homepage;

function Eyebrow({ children }: { children: string }) {
  return <p className={styles.eyebrow}>{children}</p>;
}

function ActionLink({
  children,
  href,
  tone = "primary"
}: {
  children: string;
  href: string;
  tone?: "primary" | "quiet" | "secondary";
}) {
  return (
    <a className={styles.action} data-tone={tone} href={href}>
      {children}
    </a>
  );
}

export function HomepageExperience() {
  const activeAquaCampaign = homepage.aqua.activeCampaign;

  return (
    <div className={styles.homepageExperience}>
      <section
        aria-labelledby="homepage-hero-title"
        className={styles.hero}
        id={homepage.hero.anchor}
      >
        <Image
          alt={homepage.hero.image.altText}
          className={styles.heroImage}
          fill
          priority
          sizes="(max-width: 1490px) 100vw, 1440px"
          src={homepage.hero.image.finalUrl}
        />
        <div aria-hidden="true" className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <Eyebrow>{homepage.hero.eyebrow}</Eyebrow>
          <h1 id="homepage-hero-title">{homepage.hero.heading}</h1>
          <p className={styles.heroBody}>{homepage.hero.body}</p>
          <div aria-label="Homepage actions" className={styles.heroActions}>
            <ActionLink href={homepage.hero.actions[0].href}>
              {homepage.hero.actions[0].label}
            </ActionLink>
            <ActionLink href={homepage.hero.actions[1].href} tone="secondary">
              {homepage.hero.actions[1].label}
            </ActionLink>
          </div>
        </div>
        <p className={styles.heroCaption}>Home court, Vancouver.</p>
      </section>

      <section
        aria-labelledby="homepage-shop-title"
        className={`${styles.shopShelf} ${styles.storySection}`}
        id={homepage.shop.anchor}
      >
        <header className={styles.shopHeader}>
          <Eyebrow>{homepage.shop.eyebrow}</Eyebrow>
          <h2 className={styles.visuallyHidden} id="homepage-shop-title">
            {homepage.shop.heading}
          </h2>
        </header>
        <div className={styles.shopGrid}>
          {homepage.shop.items.map((item, index) => (
            <a
              className={styles.shopItem}
              data-featured={index === 1 ? "true" : undefined}
              href={item.href}
              key={item.heading}
            >
              <div className={styles.shopItemCopy}>
                <h3>{item.heading}</h3>
                <p>{item.body}</p>
              </div>
              <span aria-hidden="true" className={styles.shopItemAction}>
                Explore
              </span>
              <div className={styles.shopItemVisual}>
                <Image
                  alt=""
                  height={item.image.sourceDimensions.height}
                  sizes="(max-width: 899px) 34vw, 18vw"
                  src={item.image.finalUrl}
                  width={item.image.sourceDimensions.width}
                />
              </div>
            </a>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="homepage-aqua-title"
        className={`${styles.aquaCampaign} ${styles.storySection}`}
        id={homepage.aqua.anchor}
      >
        <Image
          alt=""
          className={styles.aquaBackground}
          fill
          loading="lazy"
          sizes="(max-width: 1490px) 100vw, 1440px"
          src={homepage.aqua.backgroundImage.finalUrl}
        />
        <div aria-hidden="true" className={styles.aquaWash} />
        <div className={styles.aquaCopy}>
          <Eyebrow>{activeAquaCampaign.eyebrow}</Eyebrow>
          <h2 id="homepage-aqua-title">{activeAquaCampaign.heading}</h2>
          <p className={styles.sectionBody}>{activeAquaCampaign.body}</p>
          <ActionLink href={homepage.aqua.href}>{activeAquaCampaign.cta}</ActionLink>
        </div>
        <div className={styles.aquaProduct}>
          <Image
            alt={homepage.aqua.productImage.altText}
            height={homepage.aqua.productImage.sourceDimensions.height}
            loading="lazy"
            sizes="(max-width: 899px) 82vw, 48vw"
            src={homepage.aqua.productImage.finalUrl}
            width={homepage.aqua.productImage.sourceDimensions.width}
          />
        </div>
      </section>

      <section
        aria-labelledby="homepage-portland-title"
        className={`${styles.portland} ${styles.storySection}`}
        id={homepage.portland.anchor}
      >
        <Image
          alt=""
          className={styles.portlandBackground}
          fill
          loading="lazy"
          sizes="(max-width: 1490px) 100vw, 1440px"
          src={homepage.portland.backgroundImage.finalUrl}
        />
        <div aria-hidden="true" className={styles.portlandWash} />
        <div className={styles.portlandProduct}>
          <Image
            alt={homepage.portland.image.altText}
            height={homepage.portland.image.sourceDimensions.height}
            loading="lazy"
            sizes="(max-width: 899px) 90vw, 56vw"
            src={homepage.portland.image.finalUrl}
            width={homepage.portland.image.sourceDimensions.width}
          />
        </div>
        <div className={styles.portlandCopy}>
          <Eyebrow>{homepage.portland.eyebrow}</Eyebrow>
          <h2 id="homepage-portland-title">{homepage.portland.heading}</h2>
          <p className={styles.sectionBody}>{homepage.portland.body}</p>
          <ActionLink href={homepage.portland.action.href}>
            {homepage.portland.action.label}
          </ActionLink>
        </div>
      </section>

      <section
        aria-labelledby="homepage-vancouver-title"
        className={`${styles.community} ${styles.storySection}`}
        id={homepage.vancouver.anchor}
      >
        <div className={styles.communityCopy}>
          <Eyebrow>{homepage.vancouver.eyebrow}</Eyebrow>
          <h2 id="homepage-vancouver-title">{homepage.vancouver.heading}</h2>
          <p className={styles.sectionBody}>{homepage.vancouver.body}</p>
          <blockquote>{homepage.vancouver.pullLine}</blockquote>
          <ActionLink href={homepage.vancouver.action.href} tone="quiet">
            {homepage.vancouver.action.label}
          </ActionLink>
        </div>
        <div className={styles.communityPhotos}>
          <figure className={styles.communityPrimaryPhoto}>
            <Image
              alt={homepage.vancouver.images[0].altText}
              fill
              loading="lazy"
              sizes="(max-width: 899px) 88vw, 47vw"
              src={homepage.vancouver.images[0].finalUrl}
            />
          </figure>
          <figure className={styles.communitySecondaryPhoto}>
            <Image
              alt={homepage.vancouver.images[1].altText}
              fill
              loading="lazy"
              sizes="(max-width: 899px) 48vw, 22vw"
              src={homepage.vancouver.images[1].finalUrl}
            />
          </figure>
        </div>
      </section>

      <section
        aria-labelledby="homepage-cover-title"
        className={`${styles.cover} ${styles.storySection}`}
        id={homepage.cover.anchor}
      >
        <div className={styles.coverCopy}>
          <Eyebrow>{homepage.cover.eyebrow}</Eyebrow>
          <h2 id="homepage-cover-title">{homepage.cover.heading}</h2>
          <p className={styles.sectionBody}>{homepage.cover.body}</p>
          <ActionLink href={homepage.cover.action.href} tone="secondary">
            {homepage.cover.action.label}
          </ActionLink>
        </div>
        <div className={styles.coverProduct}>
          <Image
            alt={homepage.cover.image.altText}
            height={homepage.cover.image.sourceDimensions.height}
            loading="lazy"
            sizes="(max-width: 899px) 78vw, 44vw"
            src={homepage.cover.image.finalUrl}
            width={homepage.cover.image.sourceDimensions.width}
          />
        </div>
      </section>
    </div>
  );
}
