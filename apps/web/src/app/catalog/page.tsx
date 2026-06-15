import type { Metadata } from "next";

import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";
import { getCategories, getProductFamilies, getProducts } from "../../lib/catalog-api";
import {
  getPrimaryProductMediaFallback,
  getProductCardPitch
} from "../../lib/public-storefront-demo";
import { getV1ShippingMessage } from "../../lib/shipping";
import type {
  CatalogCategory,
  CatalogFamily,
  CatalogProductSummary,
  CatalogSummary
} from "../../types/catalog";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalog | Tiger Ping Pong",
  description: "Shop Tiger Ping Pong tables, paddles, balls, and accessories."
};

const PORTLAND_IMAGE =
  "https://cdn11.bigcommerce.com/s-dh0jici9dm/images/stencil/1280x1280/products/112/774/Portland_Outdoor_Black_-_Grey_Top__73629.1685479931.jpg?c=1";

interface CatalogResource<TData> {
  data: TData | null;
  error: string | null;
}

interface PublicCatalogData {
  categories: CatalogResource<CatalogCategory[]>;
  families: CatalogResource<CatalogFamily[]>;
  products: CatalogResource<CatalogProductSummary[]>;
}

interface ProductCategoryGroup {
  category: CatalogSummary;
  products: CatalogProductSummary[];
}

async function loadResource<TData>(loader: () => Promise<TData>): Promise<CatalogResource<TData>> {
  try {
    return {
      data: await loader(),
      error: null
    };
  } catch {
    return {
      data: null,
      error: "Live catalog data is temporarily unavailable."
    };
  }
}

async function loadPublicCatalog(): Promise<PublicCatalogData> {
  const [categories, families, products] = await Promise.all([
    loadResource(getCategories),
    loadResource(getProductFamilies),
    loadResource(getProducts)
  ]);

  return {
    categories: {
      ...categories,
      data: categories.data ? filterPublicCategories(categories.data) : null
    },
    families: {
      ...families,
      data: families.data ? filterPublicFamilies(families.data) : null
    },
    products: {
      ...products,
      data: products.data ? filterPublicProducts(products.data) : null
    }
  };
}

function hasReplacementPartsMarker(...values: Array<string | null | undefined>): boolean {
  return values.some((value) => {
    if (!value) {
      return false;
    }

    const normalized = value.toLowerCase().replace(/[_\s]+/g, "-");
    return normalized === "replacement-parts" || normalized.includes("replacement-part");
  });
}

function isReplacementPartsSummary(summary: CatalogSummary): boolean {
  return hasReplacementPartsMarker(summary.key, summary.slug, summary.name);
}

function filterPublicCategories(categories: CatalogCategory[]): CatalogCategory[] {
  return categories
    .filter((category) => !isReplacementPartsSummary(category))
    .map((category) => ({
      ...category,
      children: filterPublicCategories(category.children)
    }));
}

function filterPublicFamilies(families: CatalogFamily[]): CatalogFamily[] {
  return families.filter(
    (family) =>
      !isReplacementPartsSummary(family) && !isReplacementPartsSummary(family.primaryCategory)
  );
}

function filterPublicProducts(products: CatalogProductSummary[]): CatalogProductSummary[] {
  return products.filter(
    (product) =>
      !hasReplacementPartsMarker(product.productKind, product.key, product.slug, product.name) &&
      !isReplacementPartsSummary(product.category) &&
      !isReplacementPartsSummary(product.family)
  );
}

function flattenCategories(categories: CatalogCategory[]): CatalogCategory[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children)]);
}

function groupProductsByCategory(
  products: CatalogProductSummary[],
  categories: CatalogCategory[]
): ProductCategoryGroup[] {
  const categoryOrder = new Map(
    flattenCategories(categories).map((category, index) => [category.key, index])
  );
  const groups = new Map<string, ProductCategoryGroup>();

  for (const product of products) {
    const key = product.category.key;
    const existing = groups.get(key);

    if (existing) {
      existing.products.push(product);
    } else {
      groups.set(key, {
        category: product.category,
        products: [product]
      });
    }
  }

  return [...groups.values()].sort((left, right) => {
    const leftOrder = categoryOrder.get(left.category.key) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = categoryOrder.get(right.category.key) ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.category.name.localeCompare(right.category.name);
  });
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

function getHeroImage(products: CatalogProductSummary[]): {
  alt: string;
  src: string;
} {
  const liveFeaturedProduct = products.find((product) => product.primaryMedia?.cloudinarySecureUrl);

  if (liveFeaturedProduct?.primaryMedia?.cloudinarySecureUrl) {
    return {
      alt: liveFeaturedProduct.primaryMedia.altText ?? liveFeaturedProduct.name,
      src: liveFeaturedProduct.primaryMedia.cloudinarySecureUrl
    };
  }

  const fallbackFeaturedProduct =
    products.find((product) => product.slug === "tiger-portland-outdoor-table") ??
    products.find((product) => getPrimaryProductMediaFallback(product.slug));
  const fallbackMedia = fallbackFeaturedProduct
    ? getPrimaryProductMediaFallback(fallbackFeaturedProduct.slug)
    : null;

  return {
    alt: fallbackMedia?.alt ?? "Portland Outdoor table",
    src: fallbackMedia?.src ?? PORTLAND_IMAGE
  };
}

function ResourceError({ error }: { error: string | null }) {
  if (!error) {
    return null;
  }

  return (
    <div className={styles.error} role="status">
      <strong>Catalog connection issue</strong>
      <span>{error}</span>
    </div>
  );
}

function CategoryNav({ categories }: { categories: CatalogCategory[] }) {
  const flatCategories = flattenCategories(categories);

  if (flatCategories.length === 0) {
    return null;
  }

  return (
    <nav className={styles.categoryNav} aria-label="Catalog categories">
      {flatCategories.map((category) => (
        <a href={`#category-${category.slug}`} key={category.key}>
          {category.name}
        </a>
      ))}
    </nav>
  );
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

function ShippingTermsCopy({ priceCents }: { priceCents: number | null }) {
  return (
    <>
      {getV1ShippingMessage(priceCents)} <a href="/shipping-returns">Shipping details</a>
    </>
  );
}

function FamilyCard({ family }: { family: CatalogFamily }) {
  return (
    <a className={styles.familyCard} href={`#category-${family.primaryCategory.slug}`}>
      <small>{family.primaryCategory.name}</small>
      <strong>{family.name}</strong>
      <span>{family.description ?? "Explore this Tiger Ping Pong product family."}</span>
    </a>
  );
}

function ProductCard({ product }: { product: CatalogProductSummary }) {
  return (
    <article className={styles.productCard}>
      <a
        className={styles.productLink}
        href={`/catalog/products/${product.slug}`}
        aria-label={`View product details for ${product.name}`}
      >
        <ProductMedia product={product} />
        <div className={styles.productBody}>
          <div className={styles.productHeader}>
            <p>{product.category.name}</p>
            <h3>{product.name}</h3>
            <strong>{formatPrice(product.priceCents, product.currency)}</strong>
          </div>
          <p className={styles.productPitch}>{getProductCardPitch(product)}</p>
          <dl className={styles.productFacts}>
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
        <p>
          <ShippingTermsCopy priceCents={product.priceCents} />
        </p>
        <a href={`/catalog/products/${product.slug}`}>View product</a>
      </div>
    </article>
  );
}

export default async function CatalogPage() {
  const catalog = await loadPublicCatalog();
  const categories = catalog.categories.data ?? [];
  const families = catalog.families.data ?? [];
  const products = catalog.products.data ?? [];
  const productGroups = groupProductsByCategory(products, categories);
  const heroImage = getHeroImage(products);

  return (
    <>
      <PublicStorefrontNav activeItem="tables" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="catalog-title">
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>TigerPingPong.ca catalog</p>
            <h1 className={styles.title} id="catalog-title">
              Shop tables, paddles, balls, and accessories.
            </h1>
            <p className={styles.intro}>
              Browse the Tiger Ping Pong product lineup, then open any product page for details,
              shipping terms, and secure checkout.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#products">
                Browse products
              </a>
              <a className={styles.secondaryAction} href="/shipping-returns">
                Shipping terms
              </a>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <img src={heroImage.src} alt={heroImage.alt} />
          </div>
        </section>

        <ResourceError
          error={catalog.categories.error ?? catalog.families.error ?? catalog.products.error}
        />

        <section className={styles.section} aria-labelledby="catalog-navigation-title">
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Find your match</p>
            <h2 id="catalog-navigation-title">Jump into the lineup.</h2>
          </div>
          <CategoryNav categories={categories} />
        </section>

        {families.length > 0 ? (
          <section className={styles.section} aria-labelledby="catalog-families-title">
            <div className={styles.sectionHeader}>
              <p className={styles.eyebrow}>Product stories</p>
              <h2 id="catalog-families-title">Choose by style of play.</h2>
            </div>
            <div className={styles.familyGrid}>
              {families.slice(0, 6).map((family) => (
                <FamilyCard family={family} key={family.key} />
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.section} id="products" aria-labelledby="catalog-products-title">
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Products</p>
            <h2 id="catalog-products-title">Ready for the next match.</h2>
          </div>

          {catalog.products.data && products.length > 0 ? (
            <div className={styles.productGroups}>
              {productGroups.map((group) => (
                <section
                  className={styles.productGroup}
                  id={`category-${group.category.slug}`}
                  key={group.category.key}
                  aria-labelledby={`category-${group.category.slug}-title`}
                >
                  <div className={styles.groupHeader}>
                    <h3 id={`category-${group.category.slug}-title`}>{group.category.name}</h3>
                  </div>
                  <div className={styles.productGrid}>
                    {group.products.map((product) => (
                      <ProductCard product={product} key={product.key} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>
              Product cards will appear here as soon as the product lineup is available.
            </p>
          )}
        </section>
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
