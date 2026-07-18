import Image from "next/image";

import { getProducts } from "../../lib/catalog-api";
import {
  getProductAnchorId,
  getProductDisplayName,
  sortProductsForBrowsing
} from "../../lib/product-browsing";
import { resolveProductMediaUrl } from "../../lib/product-media";
import { getPrimaryProductMediaFallback } from "../../lib/public-storefront-demo";
import {
  tigerStory,
  tigerTablesProductStories,
  type TigerStoryImage,
  type TigerTablesProductStory
} from "../../lib/tiger-story";
import type { CatalogProductSummary } from "../../types/catalog";
import { getCategoryPageConfig } from "../category-pages";

import styles from "./page.module.css";

interface ProductResource {
  data: CatalogProductSummary[] | null;
  error: string | null;
}

interface ProductImage {
  alt: string;
  src: string | null;
}

const tables = tigerStory.tables;

async function loadProducts(): Promise<ProductResource> {
  try {
    return {
      data: await getProducts(),
      error: null
    };
  } catch {
    return {
      data: null,
      error: "Live catalog data is temporarily unavailable."
    };
  }
}

function normalizePingPong(value: string): string {
  return value.replace(/ping\s+pong/gi, "PingPong");
}

function formatPrice(priceCents: number | null, currency: string): string {
  if (priceCents === null) {
    return "Price coming soon";
  }

  return new Intl.NumberFormat("en-CA", {
    currency,
    style: "currency"
  }).format(priceCents / 100);
}

function getProductImage(product: CatalogProductSummary): ProductImage {
  const liveSrc = product.primaryMedia
    ? resolveProductMediaUrl(product.primaryMedia, product.slug)
    : null;

  if (liveSrc) {
    return {
      alt: normalizePingPong(product.primaryMedia?.altText ?? product.name),
      src: liveSrc
    };
  }

  const fallback = getPrimaryProductMediaFallback(product.slug);

  return {
    alt: normalizePingPong(fallback?.alt ?? product.name),
    src: fallback?.src ?? null
  };
}

function getProductStory(product: CatalogProductSummary): TigerTablesProductStory {
  return (
    tigerTablesProductStories[product.slug as keyof typeof tigerTablesProductStories] ?? {
      mode: product.slug.includes("indoor") ? "Indoor" : "Outdoor",
      descriptor: "Made for real-life rallies.",
      body: "Made for people who would rather start the rally than overthink the table.",
      cta: `Meet ${getProductDisplayName(product)}`
    }
  );
}

function ProductPicture({
  className,
  decorative = false,
  image: storyImage,
  product
}: {
  className?: string;
  decorative?: boolean;
  image?: TigerStoryImage;
  product: CatalogProductSummary;
}) {
  const image = storyImage
    ? { alt: storyImage.altText, src: storyImage.finalUrl }
    : getProductImage(product);

  if (!image.src) {
    return (
      <div
        aria-label={decorative ? undefined : `${getProductDisplayName(product)} image pending`}
        aria-hidden={decorative ? "true" : undefined}
        className={`${styles.productPlaceholder} ${className ?? ""}`}
      >
        <span>{getProductDisplayName(product)}</span>
      </div>
    );
  }

  return (
    <img alt={decorative ? "" : image.alt} className={className} loading="lazy" src={image.src} />
  );
}

function DecisionOption({
  body,
  heading,
  href,
  image
}: {
  body: string;
  heading: string;
  href: string;
  image: TigerStoryImage;
}) {
  return (
    <a className={styles.decisionOption} data-kind={heading.toLowerCase()} href={href}>
      <div aria-hidden="true" className={styles.decisionMedia}>
        <Image
          alt=""
          fill
          loading="lazy"
          sizes="(max-width: 899px) 100vw, 38vw"
          src={image.finalUrl}
        />
      </div>
      <div className={styles.decisionCopy}>
        <h3>{heading}</h3>
        <p>{body}</p>
        <span>Explore {heading.toLowerCase()}</span>
      </div>
    </a>
  );
}

function ProductStage({ index, product }: { index: number; product: CatalogProductSummary }) {
  const story = getProductStory(product);
  const displayName = getProductDisplayName(product);
  const href = `/catalog/products/${product.slug}`;

  return (
    <article
      className={styles.productStage}
      data-mode={story.mode.toLowerCase()}
      data-reverse={index % 2 === 1 ? "true" : undefined}
      data-tone={String(index % 3)}
      id={getProductAnchorId(product)}
    >
      <a
        aria-label={`View product details for ${displayName}`}
        className={styles.productMediaLink}
        href={href}
      >
        <div className={styles.productMedia}>
          <ProductPicture image={story.image} product={product} />
        </div>
      </a>
      <div className={styles.productCopy}>
        <p className={styles.productEyebrow}>{story.mode} table</p>
        <h2>{displayName}</h2>
        <strong className={styles.productPrice}>
          {formatPrice(product.priceCents, product.currency)}
        </strong>
        <p className={styles.productDescriptor}>{story.descriptor}</p>
        <p className={styles.productStory}>{story.body}</p>
        <a className={styles.productAction} href={href}>
          {story.cta}
        </a>
      </div>
    </article>
  );
}

export async function TablesExperience() {
  const productResource = await loadProducts();
  const tableConfig = getCategoryPageConfig("tables");
  const products = sortProductsForBrowsing(
    (productResource.data ?? []).filter(tableConfig.productFilter),
    tableConfig.productOrder
  );

  return (
    <div className={styles.tablesExperience}>
      <section aria-labelledby="tables-hero-title" className={styles.hero}>
        <Image
          alt={tables.hero.image.altText}
          className={styles.heroImage}
          fill
          priority
          sizes="(max-width: 1490px) 100vw, 1440px"
          src={tables.hero.image.finalUrl}
        />
        <div aria-hidden="true" className={styles.heroOverlay} />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{tables.hero.eyebrow}</p>
          <h1 id="tables-hero-title">{tables.hero.heading}</h1>
          <p className={styles.heroBody}>{tables.hero.body}</p>
          <a className={styles.heroAction} href={tables.hero.action.href}>
            {tables.hero.action.label}
          </a>
        </div>
      </section>

      <section
        aria-labelledby="tables-chooser-title"
        className={styles.chooser}
        id={tables.chooser.anchor}
      >
        <div className={styles.chooserHeading}>
          <p className={styles.eyebrow}>Start here</p>
          <h2 id="tables-chooser-title">{tables.chooser.heading}</h2>
        </div>
        <div className={styles.chooserOptions}>
          {tables.chooser.options.map((option) => (
            <DecisionOption
              body={option.body}
              heading={option.heading}
              href={option.href}
              image={option.image}
              key={option.heading}
            />
          ))}
        </div>
        <div className={styles.chooserMeta}>
          <a href={tables.chooser.compare.href}>{tables.chooser.compare.label}</a>
        </div>
      </section>

      <aside aria-label="Table shipping" className={styles.shippingRibbon}>
        <strong>{tables.shipping.heading}</strong>
        <span>{tables.shipping.body}</span>
      </aside>

      {productResource.error ? (
        <div className={styles.error} role="status">
          <strong>Catalog connection issue</strong>
          <span>{productResource.error}</span>
        </div>
      ) : null}

      {productResource.data && products.length > 0 ? (
        <section aria-label="Tiger PingPong tables" className={styles.products}>
          {products.map((product, index) => (
            <div className={styles.productSequence} key={product.key}>
              <ProductStage index={index} product={product} />
              {index === 2 ? (
                <section
                  aria-labelledby="outdoor-inside-title"
                  className={styles.education}
                  id={tables.education.anchor}
                >
                  <div className={styles.educationCopy}>
                    <p className={styles.eyebrow}>{tables.education.eyebrow}</p>
                    <h2 id="outdoor-inside-title">{tables.education.heading}</h2>
                    <p>{tables.education.body}</p>
                    <a href={tables.education.action.href}>{tables.education.action.label}</a>
                  </div>
                  <div className={styles.educationMedia}>
                    <Image
                      alt={tables.education.image.altText}
                      fill
                      loading="lazy"
                      sizes="(max-width: 899px) 100vw, 58vw"
                      src={tables.education.image.finalUrl}
                    />
                  </div>
                </section>
              ) : null}
            </div>
          ))}
        </section>
      ) : (
        <section className={styles.empty}>
          <h2>This page is being prepared.</h2>
          <p>Contact Tiger PingPong for current availability or help finding the right table.</p>
          <a href="/contact">Contact Tiger PingPong</a>
        </section>
      )}
    </div>
  );
}
