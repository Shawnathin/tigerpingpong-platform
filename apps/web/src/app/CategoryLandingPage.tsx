import { getProducts } from "../lib/catalog-api";
import {
  ACCESSORY_SHIPPING_MESSAGE,
  getProductAnchorId,
  getProductChips,
  getProductCtaLabel,
  getProductDisplayName,
  getProductPitch,
  sortProductsForBrowsing
} from "../lib/product-browsing";
import { resolveProductMediaUrl } from "../lib/product-media";
import { getPrimaryProductMediaFallback, getProductCardPitch } from "../lib/public-storefront-demo";
import type { CatalogProductSummary } from "../types/catalog";

import { ProductAnchorRail } from "./ProductAnchorRail";
import { PublicStorefrontFooter } from "./PublicStorefrontFooter";
import { PublicStorefrontNav, type PublicStorefrontNavItem } from "./PublicStorefrontNav";
import styles from "./category-landing.module.css";

export interface CategoryLandingPageConfig {
  activeItem: PublicStorefrontNavItem;
  eyebrow: string;
  title: string;
  intro: string;
  heroImageSlug?: string;
  navLinks?: Array<{
    href: string;
    label: string;
  }>;
  emptyTitle: string;
  emptyBody: string;
  productFilter: (product: CatalogProductSummary) => boolean;
  productHref?: (product: CatalogProductSummary) => string;
  productCtaLabel?: string;
  productLayout?: "editorial" | "compact";
  productOrder?: string[];
  productRailLabels?: Record<string, string>;
  shippingMessage?: string;
}

interface ProductResource {
  data: CatalogProductSummary[] | null;
  error: string | null;
}

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

function formatPrice(priceCents: number | null, currency: string): string {
  if (priceCents === null) {
    return "Price coming soon";
  }

  return new Intl.NumberFormat("en-CA", {
    currency,
    style: "currency"
  }).format(priceCents / 100);
}

function getProductImage(product: CatalogProductSummary): {
  alt: string;
  src: string | null;
} {
  const livePrimaryMedia = product.primaryMedia
    ? {
        alt: product.primaryMedia.altText ?? product.name,
        src: resolveProductMediaUrl(product.primaryMedia, product.slug)
      }
    : null;

  if (livePrimaryMedia?.src) {
    return livePrimaryMedia;
  }

  const fallbackMedia = getPrimaryProductMediaFallback(product.slug);

  return {
    alt: fallbackMedia?.alt ?? product.name,
    src: fallbackMedia?.src ?? null
  };
}

function ProductMedia({ product }: { product: CatalogProductSummary }) {
  const image = getProductImage(product);

  if (image.src) {
    return (
      <div className={styles.mediaFrame}>
        <img src={image.src} alt={image.alt} />
      </div>
    );
  }

  return (
    <div className={styles.mediaPlaceholder} aria-label={`${product.name} image pending`}>
      <span>{product.category.name}</span>
      <strong>{product.name}</strong>
    </div>
  );
}

function ProductCard({
  href,
  product,
  productCtaLabel,
  layout
}: {
  href: string;
  product: CatalogProductSummary;
  productCtaLabel: string;
  layout: "editorial" | "compact";
}) {
  const displayName = getProductDisplayName(product);
  const chips = getProductChips(product, layout);
  const anchorId = getProductAnchorId(product);
  const ctaLabel = getProductCtaLabel(product, productCtaLabel);
  const pitch = getProductPitch(product, getProductCardPitch(product));

  if (layout === "editorial") {
    return (
      <article className={styles.editorialProductCard} id={anchorId}>
        <a
          className={styles.editorialMediaLink}
          href={href}
          aria-label={`View product details for ${product.name}`}
        >
          <ProductMedia product={product} />
        </a>
        <div className={styles.editorialProductBody}>
          <p className={styles.productLabel}>{product.family.name}</p>
          <h2>{displayName}</h2>
          <strong>{formatPrice(product.priceCents, product.currency)}</strong>
          {chips.length > 0 ? (
            <ul className={styles.productChips} aria-label={`${displayName} product details`}>
              {chips.map((chip) => (
                <li key={chip}>{chip}</li>
              ))}
            </ul>
          ) : null}
          <p className={styles.productPitch}>{pitch}</p>
          <a className={styles.productCta} href={href}>
            {ctaLabel}
          </a>
        </div>
      </article>
    );
  }

  return (
    <article className={styles.productCard} id={anchorId}>
      <a
        className={styles.productLink}
        href={href}
        aria-label={`View product details for ${product.name}`}
      >
        <ProductMedia product={product} />
        <div className={styles.productBody}>
          <p>{product.family.name}</p>
          <h2>{displayName}</h2>
          <strong>{formatPrice(product.priceCents, product.currency)}</strong>
          {chips.length > 0 ? (
            <ul className={styles.productChips} aria-label={`${displayName} product details`}>
              {chips.map((chip) => (
                <li key={chip}>{chip}</li>
              ))}
            </ul>
          ) : null}
          <span>{pitch}</span>
        </div>
      </a>
      <div className={styles.cardFooter}>
        <a href={href}>{ctaLabel}</a>
      </div>
    </article>
  );
}

function ProductRail({
  productRailLabels,
  products,
  title
}: {
  productRailLabels?: Record<string, string>;
  products: CatalogProductSummary[];
  title: string;
}) {
  if (products.length <= 1) {
    return null;
  }

  const railItems = products.map((product) => ({
    href: `#${getProductAnchorId(product)}`,
    id: getProductAnchorId(product),
    label: productRailLabels?.[product.slug] ?? getProductDisplayName(product)
  }));

  return (
    <ProductAnchorRail
      ariaLabel={`${title} products`}
      className={styles.productRail}
      innerClassName={styles.productRailInner}
      items={railItems}
    />
  );
}

function BrowseTools({
  productRailLabels,
  products,
  shippingMessage,
  title
}: {
  productRailLabels?: Record<string, string>;
  products: CatalogProductSummary[];
  shippingMessage: string;
  title: string;
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className={styles.browseTools} data-sticky={products.length > 1 ? "true" : undefined}>
      <ProductRail productRailLabels={productRailLabels} products={products} title={title} />
      <p className={styles.shippingBadge}>{shippingMessage}</p>
    </div>
  );
}

function CategoryHeroImage({
  products,
  slug
}: {
  products: CatalogProductSummary[];
  slug?: string;
}) {
  const featuredProduct =
    products.find((product) => product.slug === slug) ??
    products.find((product) => getProductImage(product).src);

  if (!featuredProduct) {
    return null;
  }

  const image = getProductImage(featuredProduct);

  if (!image.src) {
    return null;
  }

  return (
    <div className={styles.heroVisual}>
      <img src={image.src} alt={image.alt} />
    </div>
  );
}

export async function CategoryLandingPage({ config }: { config: CategoryLandingPageConfig }) {
  const productResource = await loadProducts();
  const products = sortProductsForBrowsing(
    (productResource.data ?? []).filter(config.productFilter),
    config.productOrder
  );
  const productLayout = config.productLayout ?? "compact";
  const shippingMessage = config.shippingMessage ?? ACCESSORY_SHIPPING_MESSAGE;

  return (
    <>
      <PublicStorefrontNav activeItem={config.activeItem} />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="category-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{config.eyebrow}</p>
            <h1 id="category-title">{config.title}</h1>
            <p>{config.intro}</p>
          </div>
          <CategoryHeroImage products={products} slug={config.heroImageSlug} />
        </section>

        {productResource.data && products.length > 0 ? (
          <BrowseTools
            productRailLabels={config.productRailLabels}
            products={products}
            shippingMessage={shippingMessage}
            title={config.title}
          />
        ) : null}

        {productResource.error ? (
          <div className={styles.error} role="status">
            <strong>Catalog connection issue</strong>
            <span>{productResource.error}</span>
          </div>
        ) : null}

        <section className={styles.section} aria-label={`${config.title} products`}>
          {productResource.data && products.length > 0 ? (
            <div
              className={
                productLayout === "editorial" ? styles.editorialProductList : styles.productGrid
              }
            >
              {products.map((product) => (
                <ProductCard
                  href={config.productHref?.(product) ?? `/catalog/products/${product.slug}`}
                  product={product}
                  productCtaLabel={config.productCtaLabel ?? "View product"}
                  layout={productLayout}
                  key={product.key}
                />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <h2>{config.emptyTitle}</h2>
              <p>{config.emptyBody}</p>
              <a href="/contact">Contact Tiger Ping Pong</a>
            </div>
          )}
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
