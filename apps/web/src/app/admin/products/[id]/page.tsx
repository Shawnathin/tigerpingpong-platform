import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminProduct, type AdminProductDetail } from "../../../../lib/admin-api";
import styles from "../../admin.module.css";
import { ProductEditor } from "./ProductEditor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Product | Tiger Ping Pong Admin",
  description: "Protected Tiger Ping Pong product editor."
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminProductEditorPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  let product: AdminProductDetail;

  try {
    product = (await getAdminProduct(id)).product;
  } catch (error) {
    if (error instanceof Error && "status" in error && error.status === 404) {
      notFound();
    }
    return (
      <div className={styles.alert}>
        <p>Product could not be loaded. Try again.</p>
      </div>
    );
  }

  const statusMessage = getStatusMessage(query.status);

  return (
    <div className={styles.pageStack}>
      <section className={styles.pageHeader} aria-labelledby="product-editor-title">
        <h1 className={styles.title} id="product-editor-title">
          Edit {product.name}
        </h1>
      </section>

      {statusMessage ? (
        <div className={query.status === "saved" ? styles.success : styles.alert} role="status">
          <p>{statusMessage}</p>
        </div>
      ) : null}

      <ProductEditor key={product.updatedAt} product={product} />
    </div>
  );
}

function getStatusMessage(status: string | undefined): string | null {
  if (status === "saved") return "Product changes were saved.";
  if (status === "stale")
    return "This product changed elsewhere. Review the latest values and save again.";
  if (status === "validation")
    return "Could not save. Check prices and stock, or reload if the editor was updated.";
  if (status === "error") return "Could not save. Try again.";
  return null;
}
