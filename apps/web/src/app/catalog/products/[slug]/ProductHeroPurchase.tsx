"use client";

import { useState } from "react";

import type { CartProductInput } from "../../../../lib/cart";

import { CheckoutButton, type ProductOptionGroup } from "./CheckoutButton";
import { ProductMediaGallery, type ProductMediaGalleryItem } from "./ProductMediaGallery";
import styles from "./page.module.css";

interface ProductHeroPurchaseProps {
  availabilityMessage: string;
  basePriceLabel: string;
  categoryName: string;
  heroClassName: string;
  heroEyebrow: string;
  heroTitle: string;
  isCheckoutEligible: boolean;
  mediaItems: ProductMediaGalleryItem[];
  priceSummary: string | null;
  product: CartProductInput;
  productName: string;
  productOptions: ProductOptionGroup[];
  productSlug: string;
  shippingLines: string[];
  shippingLinesAreFixed: boolean;
}

export function ProductHeroPurchase({
  availabilityMessage,
  basePriceLabel,
  categoryName,
  heroClassName,
  heroEyebrow,
  heroTitle,
  isCheckoutEligible,
  mediaItems,
  priceSummary,
  product,
  productName,
  productOptions,
  productSlug,
  shippingLines,
  shippingLinesAreFixed
}: ProductHeroPurchaseProps) {
  const [selectedVariantKey, setSelectedVariantKey] = useState<string | null>(null);

  return (
    <section className={heroClassName} aria-labelledby="product-title">
      <ProductMediaGallery
        categoryName={categoryName}
        mediaItems={mediaItems}
        productName={heroTitle}
        productSlug={productSlug}
        selectedVariantKey={selectedVariantKey}
      />

      <aside className={styles.purchasePanel} aria-label={`${productName} purchase panel`}>
        <p className={styles.eyebrow}>{heroEyebrow}</p>
        <h1 className={styles.title} id="product-title">
          {heroTitle}
        </h1>

        <CheckoutButton
          availabilityMessage={availabilityMessage}
          basePriceLabel={basePriceLabel}
          isCheckoutEligible={isCheckoutEligible}
          onVariantChange={setSelectedVariantKey}
          priceSummary={priceSummary}
          product={product}
          productOptions={productOptions}
          shippingLines={shippingLines}
          shippingLinesAreFixed={shippingLinesAreFixed}
        />
      </aside>
    </section>
  );
}
