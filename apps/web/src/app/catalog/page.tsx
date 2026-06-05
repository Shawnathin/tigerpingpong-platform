import type { Metadata } from "next";

import {
  CatalogApiError,
  getCategories,
  getProductFamilies,
  getProducts
} from "../../lib/catalog-api";
import type {
  CatalogCategory,
  CatalogFamily,
  CatalogProductSummary,
  CatalogSummary
} from "../../types/catalog";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalog | Tiger Ping Pong Platform",
  description: "Browse the public Tiger Ping Pong catalog skeleton."
};

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
  } catch (error) {
    return {
      data: null,
      error: formatError(error)
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

function formatError(error: unknown): string {
  if (error instanceof CatalogApiError) {
    return `${error.message} (${error.url})`;
  }

  return error instanceof Error ? error.message : "Catalog API request failed.";
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

function isReplacementPartsCategory(category: CatalogCategory): boolean {
  return isReplacementPartsSummary(category);
}

function filterPublicCategories(categories: CatalogCategory[]): CatalogCategory[] {
  return categories
    .filter((category) => !isReplacementPartsCategory(category))
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
    return "Price pending";
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

function getMediaLabel(product: CatalogProductSummary): string {
  if (!product.primaryMedia) {
    return `${product.name} image pending`;
  }

  const mediaText = [product.primaryMedia.altText, product.primaryMedia.title]
    .filter(Boolean)
    .join(" / ");

  return mediaText || product.primaryMedia.mediaKey;
}

function ResourceError({ label, error }: { label: string; error: string | null }) {
  if (!error) {
    return null;
  }

  return (
    <div className={styles.error} role="status">
      <strong>{label} failed.</strong>
      <span>{error}</span>
    </div>
  );
}

function CategoryTree({ categories }: { categories: CatalogCategory[] }) {
  if (categories.length === 0) {
    return <p className={styles.empty}>No public categories returned.</p>;
  }

  return (
    <ul className={styles.categoryList}>
      {categories.map((category) => (
        <li key={category.key}>
          <a href={`#category-${category.slug}`}>{category.name}</a>
          {category.children.length > 0 ? <CategoryTree categories={category.children} /> : null}
        </li>
      ))}
    </ul>
  );
}

function ProductMedia({ product }: { product: CatalogProductSummary }) {
  const label = getMediaLabel(product);
  const cloudinaryUrl = product.primaryMedia?.cloudinarySecureUrl;

  if (cloudinaryUrl) {
    return (
      <div className={styles.mediaFrame}>
        <img src={cloudinaryUrl} alt={product.primaryMedia?.altText ?? product.name} />
      </div>
    );
  }

  return (
    <div className={styles.mediaPlaceholder} aria-label={label}>
      <span>Image pending</span>
      <small>{label}</small>
    </div>
  );
}

function ProductCard({ product }: { product: CatalogProductSummary }) {
  return (
    <article className={styles.productCard}>
      <a
        className={styles.productLink}
        href={`/catalog/products/${product.slug}`}
        aria-label={`Future product page for ${product.name}`}
      >
        <ProductMedia product={product} />
        <div className={styles.productBody}>
          <div className={styles.productHeader}>
            <h3>{product.name}</h3>
            <strong>{formatPrice(product.priceCents, product.currency)}</strong>
          </div>

          <dl className={styles.productFacts}>
            <div>
              <dt>Slug</dt>
              <dd>{product.slug}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{product.category.name}</dd>
            </div>
            <div>
              <dt>Family</dt>
              <dd>{product.family.name}</dd>
            </div>
            <div>
              <dt>Kind</dt>
              <dd>{formatProductKind(product.productKind)}</dd>
            </div>
            <div>
              <dt>Primary media</dt>
              <dd>{getMediaLabel(product)}</dd>
            </div>
          </dl>

          {product.shippingReviewRequired ? (
            <span className={styles.shippingBadge}>Freight details confirmed before checkout</span>
          ) : null}
        </div>
      </a>
    </article>
  );
}

export default async function CatalogPage() {
  const catalog = await loadPublicCatalog();
  const categories = catalog.categories.data ?? [];
  const families = catalog.families.data ?? [];
  const products = catalog.products.data ?? [];
  const productGroups = groupProductsByCategory(products, categories);

  return (
    <main className={styles.page}>
      <section className={styles.header} aria-labelledby="catalog-title">
        <p className={styles.eyebrow}>TigerPingPong.ca</p>
        <h1 className={styles.title} id="catalog-title">
          Tiger Ping Pong Catalog
        </h1>
        <p className={styles.intro}>
          Browse the first public catalog skeleton for Tiger Ping Pong tables, paddles, balls, nets,
          and covers. Checkout is not live on this page.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="catalog-navigation-title">
        <div className={styles.sectionHeader}>
          <h2 id="catalog-navigation-title">Categories</h2>
          {categories.length > 0 ? (
            <span className={styles.count}>{flattenCategories(categories).length} public</span>
          ) : null}
        </div>
        <ResourceError label="Categories" error={catalog.categories.error} />
        {catalog.categories.data ? <CategoryTree categories={categories} /> : null}
      </section>

      <section className={styles.section} aria-labelledby="catalog-families-title">
        <div className={styles.sectionHeader}>
          <h2 id="catalog-families-title">Product Families</h2>
          {families.length > 0 ? (
            <span className={styles.count}>{families.length} public</span>
          ) : null}
        </div>
        <ResourceError label="Product families" error={catalog.families.error} />
        {catalog.families.data ? (
          families.length > 0 ? (
            <div className={styles.familyGrid}>
              {families.map((family) => (
                <article className={styles.familyCard} key={family.key}>
                  <div>
                    <h3>{family.name}</h3>
                    <p>{family.description ?? "Catalog family summary pending."}</p>
                  </div>
                  <dl className={styles.familyMeta}>
                    <div>
                      <dt>Slug</dt>
                      <dd>{family.slug}</dd>
                    </div>
                    <div>
                      <dt>Category</dt>
                      <dd>{family.primaryCategory.name}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>No public product families returned.</p>
          )
        ) : null}
      </section>

      <section className={styles.section} aria-labelledby="catalog-products-title">
        <div className={styles.sectionHeader}>
          <h2 id="catalog-products-title">Products</h2>
          {products.length > 0 ? (
            <span className={styles.count}>{products.length} public</span>
          ) : null}
        </div>
        <ResourceError label="Products" error={catalog.products.error} />
        {catalog.products.data ? (
          products.length > 0 ? (
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
                    <span>{group.products.length} products</span>
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
            <p className={styles.empty}>No public products returned.</p>
          )
        ) : null}
      </section>
    </main>
  );
}
