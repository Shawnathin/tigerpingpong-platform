"use client";

import { useEffect, useMemo, useState } from "react";

import styles from "./page.module.css";

export interface ProductMediaGalleryItem {
  altText: string | null;
  caption: string | null;
  isPrimary: boolean;
  mediaKey: string;
  role: string;
  sortOrder: number;
  src: string | null;
  title: string | null;
  variantKey?: string | null;
}

interface ProductMediaGalleryProps {
  categoryName: string;
  mediaItems: ProductMediaGalleryItem[];
  productName: string;
  productSlug: string;
  selectedVariantKey?: string | null;
}

function getMediaLabel(media: ProductMediaGalleryItem, fallback: string): string {
  const mediaText = [media.altText, media.title].filter(Boolean).join(" / ");
  return mediaText || media.caption || fallback;
}

export function ProductMediaGallery({
  categoryName,
  mediaItems,
  productName,
  productSlug,
  selectedVariantKey
}: ProductMediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedMediaKeys, setFailedMediaKeys] = useState<Set<string>>(() => new Set());
  const selectedMedia = mediaItems[selectedIndex] ?? mediaItems[0];
  const activeIndex = mediaItems[selectedIndex] ? selectedIndex : 0;
  const label = getMediaLabel(selectedMedia, `${productName} image pending`);
  const selectedSrc = failedMediaKeys.has(selectedMedia.mediaKey) ? null : selectedMedia.src;
  const hasMultipleImages = mediaItems.length > 1;
  const thumbnailItems = useMemo(() => mediaItems, [mediaItems]);

  useEffect(() => {
    if (!selectedVariantKey) {
      return;
    }

    const variantMediaIndex = mediaItems.findIndex(
      (media) => media.variantKey === selectedVariantKey
    );

    if (variantMediaIndex >= 0) {
      setSelectedIndex(variantMediaIndex);
    }
  }, [mediaItems, selectedVariantKey]);

  function markImageFailed(mediaKey: string): void {
    setFailedMediaKeys((currentFailedKeys) => {
      const nextFailedKeys = new Set(currentFailedKeys);
      nextFailedKeys.add(mediaKey);
      return nextFailedKeys;
    });
  }

  return (
    <div className={styles.gallery} data-product-slug={productSlug}>
      <figure className={styles.mainMedia}>
        {selectedSrc ? (
          <img
            data-testid="product-main-image"
            src={selectedSrc}
            alt={selectedMedia.altText ?? productName}
            onError={() => markImageFailed(selectedMedia.mediaKey)}
          />
        ) : (
          <div className={styles.mediaPlaceholder} aria-label={label}>
            <span>{categoryName}</span>
            <strong>{productName}</strong>
          </div>
        )}
      </figure>

      {hasMultipleImages ? (
        <div className={styles.thumbnailGrid} aria-label="Product images">
          {thumbnailItems.map((media, index) => {
            const thumbnailLabel = getMediaLabel(media, productName);
            const thumbnailSrc = failedMediaKeys.has(media.mediaKey) ? null : media.src;
            const isSelected = index === activeIndex;

            return (
              <button
                aria-label={`Show ${thumbnailLabel}`}
                aria-pressed={isSelected}
                className={styles.thumbnailButton}
                key={media.mediaKey}
                onClick={() => setSelectedIndex(index)}
                type="button"
              >
                <span className={styles.thumbnailImage}>
                  {thumbnailSrc ? (
                    <img
                      src={thumbnailSrc}
                      alt=""
                      aria-hidden="true"
                      onError={() => markImageFailed(media.mediaKey)}
                    />
                  ) : (
                    <span className={styles.thumbnailPlaceholder} aria-hidden="true" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
