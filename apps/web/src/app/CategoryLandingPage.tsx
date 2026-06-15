import { getProducts } from "../lib/catalog-api";
import { resolveProductMediaUrl } from "../lib/product-media";
import { getPrimaryProductMediaFallback, getProductCardPitch } from "../lib/public-storefront-demo";
import { V1_FLAT_RATE_SHIPPING_COPY, V1_FREE_SHIPPING_COPY } from "../lib/shipping";
import type { CatalogProductSummary } from "../types/catalog";

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

function formatProductKind(productKind: string): string {
  return productKind
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getProductAnchorId(product: CatalogProductSummary): string {
  return `product-${product.slug}`;
}

function getProductMode(product: CatalogProductSummary): string | null {
  const normalized = `${product.name} ${product.slug} ${product.key}`.toLowerCase();

  if (normalized.includes("indoor")) {
    return "Indoor";
  }

  if (normalized.includes("outdoor")) {
    return "Outdoor";
  }

  return null;
}

function getProductChips(product: CatalogProductSummary, layout: "editorial" | "compact"): string[] {
  const chips = [product.family.name];
  const productMode = getProductMode(product);

  if (productMode && !chips.includes(productMode)) {
    chips.push(productMode);
  }

  if (layout === "compact") {
    const productKind = formatProductKind(product.productKind);

    if (!chips.includes(productKind)) {
      chips.push(productKind);
    }
  }

  return chips.slice(0, 3);
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
  const chips = getProductChips(product, layout);
  const anchorId = getProductAnchorId(product);

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
          <h2>{product.name}</h2>
          <strong>{formatPrice(product.priceCents, product.currency)}</strong>
          {chips.length > 0 ? (
            <ul className={styles.productChips} aria-label={`${product.name} product details`}>
              {chips.map((chip) => (
                <li key={chip}>{chip}</li>
              ))}
            </ul>
          ) : null}
          <p className={styles.productPitch}>{getProductCardPitch(product)}</p>
          <a className={styles.productCta} href={href}>
            {productCtaLabel}
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
          <h2>{product.name}</h2>
          <strong>{formatPrice(product.priceCents, product.currency)}</strong>
          {chips.length > 0 ? (
            <ul className={styles.productChips} aria-label={`${product.name} product details`}>
              {chips.map((chip) => (
                <li key={chip}>{chip}</li>
              ))}
            </ul>
          ) : null}
          <span>{getProductCardPitch(product)}</span>
        </div>
      </a>
      <div className={styles.cardFooter}>
        <a href={href}>{productCtaLabel}</a>
      </div>
    </article>
  );
}

function ProductRail({
  products,
  title
}: {
  products: CatalogProductSummary[];
  title: string;
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <nav className={styles.productRail} aria-label={`${title} products`}>
      <div className={styles.productRailInner}>
        {products.map((product) => (
          <a href={`#${getProductAnchorId(product)}`} key={product.key}>
            {product.name}
          </a>
        ))}
      </div>
    </nav>
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
  const products = (productResource.data ?? []).filter(config.productFilter);
  const productLayout = config.productLayout ?? "compact";

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

        <ProductRail products={products} title={config.title} />

        {productResource.error ? (
          <div className={styles.error} role="status">
            <strong>Catalog connection issue</strong>
            <span>{productResource.error}</span>
          </div>
        ) : null}

        <section className={styles.section} aria-label={`${config.title} products`}>
          {productResource.data && products.length > 0 ? (
            <p className={styles.shippingNote}>
              {V1_FREE_SHIPPING_COPY} {V1_FLAT_RATE_SHIPPING_COPY}
            </p>
          ) : null}

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
