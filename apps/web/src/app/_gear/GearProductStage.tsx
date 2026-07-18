import { getProductAnchorId, getProductDisplayName } from "../../lib/product-browsing";
import { resolveProductMediaUrl } from "../../lib/product-media";
import { getPrimaryProductMediaFallback } from "../../lib/public-storefront-demo";
import {
  tigerGearProductStories,
  type TigerGearProductStory,
  type TigerStoryImage
} from "../../lib/tiger-story";
import type { CatalogProductSummary } from "../../types/catalog";

import styles from "./gear-category.module.css";

export interface GearProductImage {
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

function getProductStory(product: CatalogProductSummary): TigerGearProductStory {
  return (
    tigerGearProductStories[product.slug as keyof typeof tigerGearProductStories] ?? {
      eyebrow: product.family.name,
      descriptor: "Ready for the next rally.",
      body: "Good gear for people who would rather start playing than overthink it.",
      cta: `Meet ${getProductDisplayName(product)}`,
      copyStatus: "provisional"
    }
  );
}

export function resolveGearProductImage(
  product: CatalogProductSummary,
  storyImage?: TigerStoryImage
): GearProductImage {
  if (storyImage) {
    return {
      alt: storyImage.altText,
      src: storyImage.finalUrl
    };
  }

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

function ProductPicture({
  product,
  story
}: {
  product: CatalogProductSummary;
  story: TigerGearProductStory;
}) {
  const image = resolveGearProductImage(product, story.image);

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

export function GearProductStage({
  headingLevel = 2,
  index = 0,
  layout = "feature",
  product
}: {
  headingLevel?: 2 | 3;
  index?: number;
  layout?: "compact" | "feature";
  product: CatalogProductSummary;
}) {
  const story = getProductStory(product);
  const displayName = getProductDisplayName(product);
  const accessibleDisplayName = displayName.replaceAll("-", " ");
  const href = `/catalog/products/${product.slug}`;
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <article
      className={styles.productStage}
      data-layout={layout}
      data-reverse={index % 2 === 1 ? "true" : undefined}
      data-tone={String(index % 3)}
      id={getProductAnchorId(product)}
    >
      <a
        aria-label={`View product details for ${accessibleDisplayName}`}
        className={styles.productMediaLink}
        href={href}
      >
        <div className={styles.productMedia}>
          <ProductPicture product={product} story={story} />
        </div>
      </a>
      <div className={styles.productCopy}>
        <p className={styles.eyebrow}>{story.eyebrow}</p>
        <Heading>{displayName}</Heading>
        <div className={styles.productMeta}>
          <strong>
            {story.pricePrefix ? `${story.pricePrefix} ` : ""}
            {formatPrice(product.priceCents, product.currency)}
          </strong>
        </div>
        <p className={styles.productDescriptor}>{story.descriptor}</p>
        <p className={styles.productStory}>{story.body}</p>
        <a className={styles.productAction} href={href}>
          {story.cta}
        </a>
      </div>
    </article>
  );
}
