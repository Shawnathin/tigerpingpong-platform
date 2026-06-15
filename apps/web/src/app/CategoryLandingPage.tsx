import { getProducts } from "../lib/catalog-api";
import { getPrimaryProductMediaFallback, getProductCardPitch } from "../lib/public-storefront-demo";
import { getV1ShippingMessage } from "../lib/shipping";
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

function getProductImage(product: CatalogProductSummary): {
  alt: string;
  src: string | null;
} {
  const livePrimaryMedia = product.primaryMedia?.cloudinarySecureUrl ? product.primaryMedia : null;

  if (livePrimaryMedia) {
    return {
      alt: livePrimaryMedia.altText ?? product.name,
      src: livePrimaryMedia.cloudinarySecureUrl
    };
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
  productCtaLabel
}: {
  href: string;
  product: CatalogProductSummary;
  productCtaLabel: string;
}) {
  return (
    <article className={styles.productCard}>
      <a
        className={styles.productLink}
        href={href}
        aria-label={`View product details for ${product.name}`}
      >
        <ProductMedia product={product} />
        <div className={styles.productBody}>
          <p>{product.category.name}</p>
          <h2>{product.name}</h2>
          <strong>{formatPrice(product.priceCents, product.currency)}</strong>
          <span>{getProductCardPitch(product)}</span>
          <dl>
            <div>
              <dt>Lineup</dt>
              <dd>{product.family.name}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{formatProductKind(product.productKind)}</dd>
            </div>
          </dl>
        </div>
      </a>
      <div className={styles.cardFooter}>
        <p>{getV1ShippingMessage(product.priceCents)}</p>
        <a href={href}>{productCtaLabel}</a>
      </div>
    </article>
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

  return (
    <>
      <PublicStorefrontNav activeItem={config.activeItem} />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="category-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{config.eyebrow}</p>
            <h1 id="category-title">{config.title}</h1>
            <p>{config.intro}</p>
            {config.navLinks && config.navLinks.length > 0 ? (
              <nav className={styles.subnav} aria-label={`${config.title} navigation`}>
                {config.navLinks.map((link) => (
                  <a href={link.href} key={link.href}>
                    {link.label}
                  </a>
                ))}
              </nav>
            ) : null}
          </div>
          <CategoryHeroImage products={products} slug={config.heroImageSlug} />
        </section>

        {productResource.error ? (
          <div className={styles.error} role="status">
            <strong>Catalog connection issue</strong>
            <span>{productResource.error}</span>
          </div>
        ) : null}

        <section className={styles.section} aria-labelledby="category-products-title">
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Shop</p>
            <h2 id="category-products-title">Available products</h2>
          </div>

          {productResource.data && products.length > 0 ? (
            <div className={styles.productGrid}>
              {products.map((product) => (
                <ProductCard
                  href={config.productHref?.(product) ?? `/catalog/products/${product.slug}`}
                  product={product}
                  productCtaLabel={config.productCtaLabel ?? "View product"}
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
