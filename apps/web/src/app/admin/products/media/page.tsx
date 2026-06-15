import type { Metadata } from "next";

import {
  AdminApiError,
  getAdminProductMedia,
  getAdminProducts,
  type AdminProductMediaResponse,
  type AdminProductsResponse
} from "../../../../lib/admin-api";
import styles from "../../admin.module.css";

import { ProductMediaMappingTool } from "./ProductMediaMappingTool";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Product Media | Tiger Ping Pong",
  description: "Protected Tiger Ping Pong product media mapping."
};

interface AdminProductMediaPageProps {
  searchParams?: {
    productId?: string;
  };
}

interface ProductMediaResource {
  data: AdminProductMediaResponse | null;
  error: {
    message: string;
    selectedProductId: string;
    status: number | null;
  } | null;
}

async function loadProducts(): Promise<AdminProductsResponse | null> {
  try {
    return await getAdminProducts({
      limit: 100
    });
  } catch {
    return null;
  }
}

async function loadProductMedia(productId: string | null): Promise<ProductMediaResource> {
  if (!productId) {
    return {
      data: null,
      error: null
    };
  }

  try {
    return {
      data: await getAdminProductMedia(productId),
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: getAdminMediaErrorMessage(error),
        selectedProductId: productId,
        status: error instanceof AdminApiError ? error.status : null
      }
    };
  }
}

function getAdminMediaErrorMessage(error: unknown): string {
  if (error instanceof AdminApiError) {
    return error.responseMessage ?? error.message;
  }

  return "Product media could not be loaded.";
}

export default async function AdminProductMediaPage({
  searchParams
}: AdminProductMediaPageProps) {
  const productsResource = await loadProducts();
  const products = productsResource?.items ?? [];
  const requestedProductId = searchParams?.productId ?? products[0]?.id ?? null;
  const productMediaResource = await loadProductMedia(requestedProductId);

  return (
    <div className={styles.pageStack}>
      <section className={styles.pageHeader} aria-labelledby="admin-product-media-title">
        <p className={styles.eyebrow}>Protected admin</p>
        <h1 className={styles.title} id="admin-product-media-title">
          Product media mapping
        </h1>
        <p className={styles.intro}>
          Assign existing Cloudinary product images to storefront products.
        </p>
      </section>

      <section className={styles.alert} aria-label="Product media mapping warnings">
        <ul className={styles.alertList}>
          <li>This only changes which existing Cloudinary image is assigned to this product.</li>
          <li>This does not upload or delete Cloudinary assets.</li>
          <li>
            Changes affect the storefront after refresh/deploy/API cache refresh as applicable.
          </li>
        </ul>
      </section>

      {productsResource ? (
        <ProductMediaMappingTool
          mediaResource={productMediaResource}
          products={products}
          selectedProductId={requestedProductId}
        />
      ) : (
        <section className={styles.panel} aria-labelledby="admin-product-media-error-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="admin-product-media-error-title">Product media</h2>
              <p>Product data could not be loaded from the protected admin API.</p>
            </div>
            <span className={`${styles.badge} ${styles.badgeWarning}`}>Unavailable</span>
          </div>
          <div className={styles.alert}>
            <p>Confirm the API service and server-side admin token are configured.</p>
          </div>
        </section>
      )}
    </div>
  );
}
