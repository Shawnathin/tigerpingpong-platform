"use client";

import { useState } from "react";

import type { CartProductInput } from "../../../../lib/cart";
import type { CatalogTableAccessoryOffer } from "../../../../types/catalog";

import {
  CheckoutButton,
  type ProductOptionGroup,
  type TigerPurchasePresentation
} from "./CheckoutButton";
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
  presentation?: TigerPurchasePresentation;
  product: CartProductInput;
  productName: string;
  productOptions: ProductOptionGroup[];
  productSlug: string;
  sectionId?: string;
  shippingLines: string[];
  shippingLinesAreFixed: boolean;
  tableAccessoryOffer: CatalogTableAccessoryOffer | null;
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
  presentation,
  product,
  productName,
  productOptions,
  productSlug,
  sectionId,
  shippingLines,
  shippingLinesAreFixed,
  tableAccessoryOffer
}: ProductHeroPurchaseProps) {
  const [selectedVariantKey, setSelectedVariantKey] = useState<string | null>(null);

  return (
    <section className={heroClassName} aria-labelledby="product-title" id={sectionId}>
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
        {presentation?.mode === "tiger-v2" ? (
          <div className={styles.tigerPurchaseIntro}>
            <strong>{presentation.descriptor}</strong>
            <p>{presentation.summary}</p>
          </div>
        ) : null}

        <CheckoutButton
          availabilityMessage={availabilityMessage}
          basePriceLabel={basePriceLabel}
          confirmationProductName={heroTitle}
          isCheckoutEligible={isCheckoutEligible}
          onVariantChange={setSelectedVariantKey}
          priceSummary={priceSummary}
          presentation={presentation}
          product={product}
          productOptions={productOptions}
          shippingLines={shippingLines}
          shippingLinesAreFixed={shippingLinesAreFixed}
          tableAccessoryOffer={tableAccessoryOffer}
        />
      </aside>
    </section>
  );
}
