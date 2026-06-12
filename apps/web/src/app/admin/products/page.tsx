import type { Metadata } from "next";

import {
  getAdminProducts,
  type AdminProductListItem,
  type AdminProductsResponse
} from "../../../lib/admin-api";
import {
  formatBoolean,
  formatMoney,
  formatNullable,
  formatStatus
} from "../admin-format";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Products | Tiger Ping Pong",
  description: "Protected read-only Tiger Ping Pong admin product list."
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

function getCheckoutEligibility(product: AdminProductListItem): string {
  if (product.checkoutEligible) {
    return "Eligible";
  }

  if (product.checkoutEligibilityReasons.length === 0) {
    return "Not eligible";
  }

  return product.checkoutEligibilityReasons.map(formatStatus).join(", ");
}

function getImageWarning(product: AdminProductListItem): string {
  if (product.imageStatus.status === "public_image_available") {
    return "None";
  }

  return formatStatus(product.imageStatus.status);
}

function renderProductsTable(products: AdminProductListItem[]) {
  if (products.length === 0) {
    return <p className={styles.emptyText}>No admin products were returned.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Product name</th>
            <th>Slug</th>
            <th>Price</th>
            <th>Category / type</th>
            <th>Visibility / status</th>
            <th>Checkout eligibility</th>
            <th>Image warning</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <div>{product.name}</div>
                <div className={styles.muted}>{formatNullable(product.sku)}</div>
              </td>
              <td className={styles.mono}>{product.slug}</td>
              <td>{formatMoney(product.priceCents, product.currency)}</td>
              <td>
                <div>{product.category.name}</div>
                <div className={styles.muted}>{formatStatus(product.type)}</div>
              </td>
              <td>
                <div>{formatStatus(product.status)}</div>
                <div className={styles.muted}>Visible: {formatBoolean(product.visible)}</div>
              </td>
              <td>{getCheckoutEligibility(product)}</td>
              <td>{getImageWarning(product)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminProductsPage() {
  const resource = await loadProducts();
  const products = resource.data?.items ?? [];

  return (
    <div className={styles.pageStack}>
      <section className={styles.pageHeader} aria-labelledby="admin-products-title">
        <p className={styles.eyebrow}>Protected admin</p>
        <h1 className={styles.title} id="admin-products-title">
          Products
        </h1>
        <p className={styles.intro}>
          Read-only catalog visibility for V1 launch operations. Product editing is intentionally
          not included.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="admin-products-list-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="admin-products-list-title">Product list</h2>
            <p>Catalog status, checkout scope, and image readiness from the protected admin API.</p>
          </div>
          <span className={styles.badge}>Read-only</span>
        </div>

        {resource.data ? (
          renderProductsTable(products)
        ) : (
          <div className={styles.alert}>
            <p>
              Admin products could not be loaded. Confirm the API service and server-side admin
              token are configured.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
