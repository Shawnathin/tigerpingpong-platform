import Image from "next/image";

import { getProductAnchorId, getProductDisplayName } from "../../lib/product-browsing";
import { resolveProductMediaUrl } from "../../lib/product-media";
import { getPrimaryProductMediaFallback } from "../../lib/public-storefront-demo";
import {
  tigerTablesProductStories,
  type TigerStoryImage,
  type TigerTablesProductStory
} from "../../lib/tiger-story";
import type { CatalogProductSummary } from "../../types/catalog";

import styles from "./page.module.css";

interface ProductImage {
  alt: string;
  src: string | null;
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
  image: storyImage,
  product
}: {
  image?: TigerStoryImage;
  product: CatalogProductSummary;
}) {
  const image = storyImage
    ? { alt: storyImage.altText, src: storyImage.finalUrl }
    : getProductImage(product);

  if (!image.src) {
    return (
      <div
        aria-label={`${getProductDisplayName(product)} image pending`}
        className={styles.productPlaceholder}
      >
        <span>{getProductDisplayName(product)}</span>
      </div>
    );
  }

  return <img alt={image.alt} loading="lazy" src={image.src} />;
}

export function TableProductStage({
  index,
  product
}: {
  index: number;
  product: CatalogProductSummary;
}) {
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

export function OutdoorInsideEducation({
  education
}: {
  education: {
    action: { href: string; label: string };
    anchor: string;
    body: string;
    eyebrow: string;
    heading: string;
    image: TigerStoryImage;
  };
}) {
  return (
    <section
      aria-labelledby="outdoor-inside-title"
      className={styles.education}
      id={education.anchor}
    >
      <div className={styles.educationCopy}>
        <p className={styles.eyebrow}>{education.eyebrow}</p>
        <h2 id="outdoor-inside-title">{education.heading}</h2>
        <p>{education.body}</p>
        <a href={education.action.href}>{education.action.label}</a>
      </div>
      <div className={styles.educationMedia}>
        <Image
          alt={education.image.altText}
          fill
          loading="lazy"
          sizes="(max-width: 899px) 100vw, 58vw"
          src={education.image.finalUrl}
        />
      </div>
    </section>
  );
}
