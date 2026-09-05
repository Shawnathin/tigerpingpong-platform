import type { Metadata } from "next";
import Link from "next/link";

import {
  getAdminProducts,
  type AdminProductListItem,
  type AdminProductsResponse
} from "../../../lib/admin-api";
import { formatMoney, formatStatus } from "../admin-format";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Products | Tiger Ping Pong",
  description: "Tiger PingPong product management."
};

interface ProductsResource {
  data: AdminProductsResponse | null;
}

async function loadProducts(): Promise<ProductsResource> {
  try {
    return {
      data: await getAdminProducts({
        limit: 100
      })
    };
  } catch {
    return {
      data: null
    };
  }
}

function renderProductsTable(products: AdminProductListItem[]) {
  if (products.length === 0) return <p className={styles.emptyText}>No products.</p>;
  return (
    <table className={styles.productTable}>
      <thead>
        <tr>
          <th>Product / SKU</th>
          <th>Price</th>
          <th>Publication</th>
          <th>Stock</th>
          <th>
            <span className={styles.srOnly}>Edit</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => {
          const published = product.status === "active" && product.visible;
          const reasons = product.checkoutEligibilityReasons.filter(
            (reason) =>
              !["product_not_active", "not_public_navigation", "not_checkout_scope"].includes(
                reason
              )
          );
          const warnings = product.v1CheckoutScope
            ? [...reasons.map(formatStatus), ...(product.stockWarnings ?? [])]
            : [];
          if (product.imageStatus.status !== "public_image_available")
            warnings.push(formatStatus(product.imageStatus.status));
          return (
            <tr key={product.id}>
              <td className={styles.productIdentity}>
                <strong>{product.name}</strong>
                {product.sku ? <span className={styles.muted}>{product.sku}</span> : null}
                {warnings.length ? (
                  <span className={styles.stockWarning}>Needs attention</span>
                ) : null}
                <details className={styles.productDetails}>
                  <summary>Details</summary>
                  <dl>
                    <div>
                      <dt>Category</dt>
                      <dd>{product.category.name}</dd>
                    </div>
                    <div>
                      <dt>Slug</dt>
                      <dd>{product.slug}</dd>
                    </div>
                    <div>
                      <dt>Purchase mode</dt>
                      <dd>{formatStatus(product.purchaseMode)}</dd>
                    </div>
                  </dl>
                  {warnings.length ? (
                    <ul>
                      {warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  ) : null}
                </details>
              </td>
              <td data-label="Price" className={styles.productPrice}>
                {formatMoney(product.priceCents, product.currency)}
              </td>
              <td data-label="Publication">{published ? "Published" : "Hidden"}</td>
              <td data-label="Stock">{product.v1CheckoutScope ? "In stock" : "Out of stock"}</td>
              <td className={styles.productAction}>
                <Link
                  className={styles.secondaryButton}
                  href={`/admin/products/${encodeURIComponent(product.id)}`}
                  aria-label={`Edit ${product.name}`}
                >
                  Edit
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default async function AdminProductsPage() {
  const resource = await loadProducts();
  const products = resource.data?.items ?? [];

  return (
    <div className={styles.pageStack}>
      <section className={styles.pageHeader} aria-labelledby="admin-products-title">
        <h1 className={styles.title} id="admin-products-title">
          Products
        </h1>
      </section>

      <section className={styles.panel} aria-labelledby="admin-products-list-title">
        <h2 id="admin-products-list-title" className={styles.srOnly}>
          Product list
        </h2>

        {resource.data ? (
          renderProductsTable(products)
        ) : (
          <div className={styles.alert}>
            <p>Products could not be loaded. Try again.</p>
          </div>
        )}
      </section>
    </div>
  );
}
