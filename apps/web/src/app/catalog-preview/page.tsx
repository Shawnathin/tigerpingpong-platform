import type { Metadata } from "next";

import {
  CatalogApiError,
  getCatalogApiBaseUrl,
  getCatalogHealth,
  getCategories,
  getProductFamilies,
  getProducts
} from "../../lib/catalog-api";
import type {
  CatalogCategory,
  CatalogFamily,
  CatalogHealth,
  CatalogProductSummary
} from "../../types/catalog";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalog Preview | Tiger Ping Pong",
  robots: {
    index: false,
    follow: false
  }
};

interface PreviewResource<TData> {
  data: TData | null;
  error: string | null;
}

interface CatalogPreviewData {
  health: PreviewResource<CatalogHealth>;
  categories: PreviewResource<CatalogCategory[]>;
  families: PreviewResource<CatalogFamily[]>;
  products: PreviewResource<CatalogProductSummary[]>;
}

const countLabels: Record<keyof CatalogHealth["counts"], string> = {
  brands: "Brands",
  categories: "Categories",
  productFamilies: "Product families",
  products: "Products",
  variants: "Variants",
  media: "Media"
};

async function loadResource<TData>(loader: () => Promise<TData>): Promise<PreviewResource<TData>> {
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

async function loadCatalogPreview(): Promise<CatalogPreviewData> {
  const [health, categories, families, products] = await Promise.all([
    loadResource(getCatalogHealth),
    loadResource(getCategories),
    loadResource(getProductFamilies),
    loadResource(getProducts)
  ]);

  return {
    health,
    categories,
    families,
    products
  };
}

function formatError(error: unknown): string {
  if (error instanceof CatalogApiError) {
    return `${error.message} (${error.url})`;
  }

  return error instanceof Error ? error.message : "Catalog API request failed.";
}

function flattenCategories(categories: CatalogCategory[]): CatalogCategory[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children)]);
}

function formatPrice(priceCents: number | null, currency: string): string {
  if (priceCents === null) {
    return "No price";
  }

  return new Intl.NumberFormat("en-CA", {
    currency,
    style: "currency"
  }).format(priceCents / 100);
}

function getMediaLabel(product: CatalogProductSummary): string {
  if (!product.primaryMedia) {
    return "No primary media";
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

function CategoryList({ categories }: { categories: CatalogCategory[] }) {
  if (categories.length === 0) {
    return <p className={styles.empty}>No categories returned.</p>;
  }

  return (
    <ul className={styles.categoryList}>
      {categories.map((category) => (
        <li key={category.key}>
          <span>{category.name}</span>
          <code>{category.slug}</code>
          {category.children.length > 0 ? <CategoryList categories={category.children} /> : null}
        </li>
      ))}
    </ul>
  );
}

export default async function CatalogPreviewPage() {
  const preview = await loadCatalogPreview();
  const allCategories = preview.categories.data ? flattenCategories(preview.categories.data) : [];

  return (
    <main className={styles.page}>
      <section className={styles.header} aria-labelledby="catalog-preview-title">
        <div>
          <p className={styles.eyebrow}>Internal preview</p>
          <h1 className={styles.title} id="catalog-preview-title">
            Catalog API preview
          </h1>
        </div>
        <dl className={styles.endpoint}>
          <div>
            <dt>API base URL</dt>
            <dd>{getCatalogApiBaseUrl()}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="catalog-health-title">
        <div className={styles.sectionHeader}>
          <h2 id="catalog-health-title">Catalog health</h2>
          {preview.health.data ? (
            <span className={styles.statusBadge} data-status={preview.health.data.status}>
              {preview.health.data.status}
            </span>
          ) : null}
        </div>
        <ResourceError label="Catalog health" error={preview.health.error} />
        {preview.health.data ? (
          <>
            <div className={styles.countGrid}>
              {Object.entries(preview.health.data.counts).map(([key, value]) => (
                <div className={styles.countCard} key={key}>
                  <span>{countLabels[key as keyof CatalogHealth["counts"]]}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <p className={styles.meta}>
              Checked {preview.health.data.timestamp} by {preview.health.data.service}.
            </p>
          </>
        ) : null}
      </section>

      <section className={styles.section} aria-labelledby="catalog-lists-title">
        <div className={styles.sectionHeader}>
          <h2 id="catalog-lists-title">Catalog lists</h2>
        </div>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryPanel}>
            <h3>Categories</h3>
            <ResourceError label="Categories" error={preview.categories.error} />
            {preview.categories.data ? (
              <>
                <p className={styles.meta}>{allCategories.length} public categories fetched.</p>
                <CategoryList categories={preview.categories.data} />
              </>
            ) : null}
          </div>

          <div className={styles.summaryPanel}>
            <h3>Product families</h3>
            <ResourceError label="Product families" error={preview.families.error} />
            {preview.families.data ? (
              <ul className={styles.familyList}>
                {preview.families.data.map((family) => (
                  <li key={family.key}>
                    <span>{family.name}</span>
                    <code>{family.slug}</code>
                    <small>{family.primaryCategory.name}</small>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="catalog-products-title">
        <div className={styles.sectionHeader}>
          <h2 id="catalog-products-title">Products</h2>
          {preview.products.data ? (
            <span className={styles.total}>
              {preview.products.data.length} public products fetched
            </span>
          ) : null}
        </div>
        <ResourceError label="Products" error={preview.products.error} />
        {preview.products.data ? (
          <div className={styles.tableWrap}>
            <table className={styles.productTable}>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Slug</th>
                  <th scope="col">Price</th>
                  <th scope="col">Category</th>
                  <th scope="col">Family</th>
                  <th scope="col">Shipping review</th>
                  <th scope="col">Primary media</th>
                </tr>
              </thead>
              <tbody>
                {preview.products.data.map((product) => (
                  <tr key={product.key}>
                    <td>{product.name}</td>
                    <td>
                      <code>{product.slug}</code>
                    </td>
                    <td>{formatPrice(product.priceCents, product.currency)}</td>
                    <td>{product.category.name}</td>
                    <td>{product.family.name}</td>
                    <td>
                      <span
                        className={styles.reviewBadge}
                        data-required={product.shippingReviewRequired}
                      >
                        {product.shippingReviewRequired ? "Required" : "No"}
                      </span>
                    </td>
                    <td>{getMediaLabel(product)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}
