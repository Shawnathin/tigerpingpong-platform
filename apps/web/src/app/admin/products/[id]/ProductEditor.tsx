"use client";

import { useState } from "react";
import Link from "next/link";
import type { AdminProductDetail } from "../../../../lib/admin-api";
import { formatStatus } from "../../admin-format";
import styles from "../../admin.module.css";
import { saveProduct } from "./actions";
import { SaveProductButton } from "./SaveProductButton";

export function ProductEditor({ product }: { product: AdminProductDetail }) {
  const [published, setPublished] = useState(product.status === "active" && product.visible);
  const [inStock, setInStock] = useState(product.v1CheckoutScope);
  const [variantStock, setVariantStock] = useState(
    Object.fromEntries(product.variants.map((variant) => [variant.id, variant.isActive]))
  );
  const [basePrice, setBasePrice] = useState(formatMoneyInput(product.priceCents));
  const [variantPrices, setVariantPrices] = useState(
    Object.fromEntries(
      product.variants.map((variant) => [variant.id, formatMoneyInput(variant.priceCents)])
    )
  );
  const validPrice = (value: string) =>
    /^\d{1,6}(?:\.\d{1,2})?$/.test(value.trim()) && Number(value) > 0;
  const allVariantsOut =
    inStock && product.variants.length > 0 && !Object.values(variantStock).some(Boolean);
  function getVariantStatus(
    variant: AdminProductDetail["variants"][number],
    active: boolean
  ): string {
    if (!active) return "Out of stock";
    if (!inStock) return "Blocked: product out of stock";
    if (!published) return "Blocked: product hidden";
    if (
      variant.currency.toLowerCase() !== "cad" ||
      (variant.purchaseModeOverride &&
        !["online_checkout", "online_checkout_candidate"].includes(variant.purchaseModeOverride))
    )
      return "Blocked: purchase restrictions";
    if (
      !validPrice(basePrice) ||
      (!validPrice(variantPrices[variant.id]) &&
        !(product.type === "table" && !variantPrices[variant.id].trim() && validPrice(basePrice)))
    )
      return "Blocked: check price";
    const otherReasons = product.checkoutEligibilityReasons.filter(
      (reason) =>
        ![
          "product_not_active",
          "not_public_navigation",
          "not_checkout_scope",
          "missing_or_invalid_price"
        ].includes(reason)
    );
    if (otherReasons.length) return "Blocked: product needs attention";
    return "In stock";
  }
  return (
    <form
      action={saveProduct}
      className={styles.editorForm}
      onSubmit={(event) => {
        if (allVariantsOut) event.preventDefault();
      }}
    >
      <input name="productId" type="hidden" value={product.id} />
      <input name="expectedUpdatedAt" type="hidden" value={product.updatedAt} />

      <section className={styles.panel} aria-labelledby="product-fields-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="product-fields-title">Product</h2>
          </div>
          <span className={styles.badge}>
            {published ? "Published" : "Hidden"} · {inStock ? "In stock" : "Out of stock"}
          </span>
        </div>

        <div className={styles.editorGrid}>
          <label className={styles.field}>
            <span>Product name</span>
            <input defaultValue={product.name} maxLength={160} name="name" required />
          </label>
          <label className={styles.field}>
            <span>Base price (CAD)</span>
            <input
              value={basePrice}
              onChange={(event) => setBasePrice(event.target.value)}
              inputMode="decimal"
              name="price"
              placeholder="0.00"
            />
          </label>
          <label className={styles.field}>
            <span id="publication-label">Publication</span>
            <select
              name="published"
              aria-labelledby="publication-label"
              value={String(published)}
              onChange={(event) => setPublished(event.target.value === "true")}
            >
              <option value="true">Published</option>
              <option value="false">Hidden</option>
            </select>
          </label>
          <label className={styles.field}>
            <span id="stock-label">Stock</span>
            <select
              name="inStock"
              aria-labelledby="stock-label"
              value={String(inStock)}
              onChange={(event) => setInStock(event.target.value === "true")}
            >
              <option value="true">In stock</option>
              <option value="false">Out of stock</option>
            </select>
          </label>
        </div>

        <details className={styles.productDetails}>
          <summary>Details</summary>
          <dl className={styles.definitionList}>
            <div>
              <dt>Slug</dt>
              <dd>{product.slug}</dd>
            </div>
            <div>
              <dt>SKU</dt>
              <dd>{product.sku ?? "Not set"}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{product.category.name}</dd>
            </div>
            <div>
              <dt>Purchase mode</dt>
              <dd>{formatStatus(product.purchaseMode)}</dd>
            </div>
          </dl>
        </details>
      </section>

      <section className={styles.panel} aria-labelledby="variant-fields-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="variant-fields-title">Variants</h2>
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
                  {variant.sku ? <span>{variant.sku}</span> : null}
                </div>
                <label className={styles.field}>
                  <span>Price (CAD)</span>
                  <input
                    value={variantPrices[variant.id]}
                    onChange={(event) =>
                      setVariantPrices({ ...variantPrices, [variant.id]: event.target.value })
                    }
                    inputMode="decimal"
                    name={`variantPrice:${variant.id}`}
                    placeholder={
                      product.type === "table" ? "Uses base price" : "Required when in stock"
                    }
                  />
                </label>
                <label className={styles.checkboxField}>
                  <input
                    checked={variantStock[variant.id]}
                    onChange={(event) =>
                      setVariantStock({ ...variantStock, [variant.id]: event.target.checked })
                    }
                    name={`variantActive:${variant.id}`}
                    type="checkbox"
                  />
                  In stock
                </label>
                <span className={styles.variantStatus} role="status">
                  {getVariantStatus(variant, variantStock[variant.id])}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {allVariantsOut ? (
        <p className={styles.alert} role="alert">
          All variants are out of stock. Set product Stock to Out of stock before saving.
        </p>
      ) : null}
      <div className={styles.formActions}>
        <Link className={styles.secondaryButton} href="/admin/products">
          Cancel
        </Link>
        <SaveProductButton />
      </div>
    </form>
  );
}

function formatMoneyInput(value: number | null): string {
  return value === null ? "" : (value / 100).toFixed(2);
}

function formatVariantLabel(variant: AdminProductDetail["variants"][number]): string {
  const options = variant.options.map((option) => option.label ?? option.value).join(" / ");
  return options || variant.name || variant.key;
}
