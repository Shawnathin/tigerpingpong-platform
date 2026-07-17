import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminProduct, type AdminProductDetail } from "../../../../lib/admin-api";
import { formatStatus } from "../../admin-format";
import styles from "../../admin.module.css";
import { saveProduct } from "./actions";
import { SaveProductButton } from "./SaveProductButton";

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
        <p>Product details could not be loaded. Confirm the API service and admin token.</p>
      </div>
    );
  }

  const availableForSale =
    product.status === "active" && product.visible && product.v1CheckoutScope;
  const statusMessage = getStatusMessage(query.status);

  return (
    <div className={styles.pageStack}>
      <section className={styles.pageHeader} aria-labelledby="product-editor-title">
        <p className={styles.eyebrow}>Protected product editor</p>
        <h1 className={styles.title} id="product-editor-title">Edit {product.name}</h1>
        <p className={styles.intro}>
          Changes apply to the storefront and new checkouts. URLs and historical orders are preserved.
        </p>
      </section>

      {statusMessage ? (
        <div className={query.status === "saved" ? styles.success : styles.alert} role="status">
          <p>{statusMessage}</p>
        </div>
      ) : null}

      <form action={saveProduct} className={styles.editorForm}>
        <input name="productId" type="hidden" value={product.id} />
        <input name="expectedUpdatedAt" type="hidden" value={product.updatedAt} />

        <section className={styles.panel} aria-labelledby="product-fields-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="product-fields-title">Product</h2>
              <p>Edit the customer-facing name, base price, and whole-product availability.</p>
            </div>
            <span className={styles.badge}>{availableForSale ? "Available" : "Unavailable"}</span>
          </div>

          <div className={styles.editorGrid}>
            <label className={styles.field}>
              <span>Product name</span>
              <input defaultValue={product.name} maxLength={160} name="name" required />
            </label>
            <label className={styles.field}>
              <span>Base price (CAD)</span>
              <input defaultValue={formatMoneyInput(product.priceCents)} inputMode="decimal" name="price" placeholder="0.00" />
            </label>
            <label className={styles.checkboxField}>
              <input defaultChecked={availableForSale} name="availableForSale" type="checkbox" />
              Available for sale
            </label>
          </div>

          <dl className={styles.definitionList}>
            <div><dt>Slug</dt><dd>{product.slug}</dd></div>
            <div><dt>SKU</dt><dd>{product.sku ?? "Not set"}</dd></div>
            <div><dt>Category</dt><dd>{product.category.name}</dd></div>
            <div><dt>Purchase mode</dt><dd>{formatStatus(product.purchaseMode)}</dd></div>
          </dl>
        </section>

        <section className={styles.panel} aria-labelledby="variant-fields-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="variant-fields-title">Variants</h2>
              <p>Disable only an unavailable option or update its authoritative checkout price.</p>
            </div>
            <span className={styles.badge}>{product.variants.length} variants</span>
          </div>

          {product.variants.length === 0 ? (
            <p className={styles.emptyText}>This product has no variants.</p>
          ) : (
            <div className={styles.variantEditorRows}>
              {product.variants.map((variant) => (
                <div className={styles.variantEditorRow} key={variant.id}>
                  <input name="variantId" type="hidden" value={variant.id} />
                  <div>
                    <strong>{formatVariantLabel(variant)}</strong>
                    <span>{variant.sku ?? variant.key}</span>
                  </div>
                  <label className={styles.field}>
                    <span>Price (CAD)</span>
                    <input defaultValue={formatMoneyInput(variant.priceCents)} inputMode="decimal" name={`variantPrice:${variant.id}`} placeholder="Uses base price" />
                  </label>
                  <label className={styles.checkboxField}>
                    <input defaultChecked={variant.isActive} name={`variantActive:${variant.id}`} type="checkbox" />
                    Available
                  </label>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className={styles.formActions}>
          <Link className={styles.secondaryButton} href="/admin/products">Cancel</Link>
          <SaveProductButton />
        </div>
      </form>
    </div>
  );
}

function formatMoneyInput(value: number | null): string {
  return value === null ? "" : (value / 100).toFixed(2);
}

function formatVariantLabel(variant: AdminProductDetail["variants"][number]): string {
  const options = variant.options.map((option) => option.label ?? option.value).join(" / ");
  return options || variant.name || variant.key;
}

function getStatusMessage(status: string | undefined): string | null {
  if (status === "saved") return "Product changes were saved.";
  if (status === "stale") return "This product changed elsewhere. Review the latest values and save again.";
  if (status === "validation") return "The product could not be saved. Review the name, prices, availability, and checkout readiness.";
  if (status === "error") return "The product could not be saved. Try again or check the API health.";
  return null;
}
