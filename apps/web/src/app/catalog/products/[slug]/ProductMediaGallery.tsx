"use client";

import { useEffect, useMemo, useState } from "react";

import { getVisibleProductMediaItems } from "../../../../lib/product-gallery";

import { AquaProductVisual } from "./AquaProductVisual";
import styles from "./page.module.css";

const AQUA_PRODUCT_SLUG = "tiger-aqua-outdoor-indoor-paddle";

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
  const [selectedMediaKey, setSelectedMediaKey] = useState<string | null>(
    () => mediaItems[0]?.mediaKey ?? null
  );
  const [failedMediaKeys, setFailedMediaKeys] = useState<Set<string>>(() => new Set());
  const isAquaGallery = productSlug === AQUA_PRODUCT_SLUG;
  const shoppingMediaItems = useMemo(
    () =>
      isAquaGallery
        ? mediaItems.filter((media) => media.isPrimary || Boolean(media.variantKey))
        : mediaItems,
    [isAquaGallery, mediaItems]
  );
  const visibleMediaItems = useMemo(
    () =>
      isAquaGallery
        ? shoppingMediaItems
        : getVisibleProductMediaItems(shoppingMediaItems, selectedVariantKey),
    [isAquaGallery, selectedVariantKey, shoppingMediaItems]
  );
  const requestedMedia =
    visibleMediaItems.find((media) => media.mediaKey === selectedMediaKey) ?? visibleMediaItems[0];
  const selectedMedia =
    getUsableMedia(requestedMedia, failedMediaKeys) ??
    visibleMediaItems.find(
      (media) => !media.variantKey && getUsableMedia(media, failedMediaKeys)
    ) ??
    visibleMediaItems.find((media) => getUsableMedia(media, failedMediaKeys)) ??
    requestedMedia;
  const label = getMediaLabel(selectedMedia, `${productName} image pending`);
  const selectedSrc = failedMediaKeys.has(selectedMedia.mediaKey) ? null : selectedMedia.src;
  const hasMultipleImages = visibleMediaItems.length > 1;

  useEffect(() => {
    const matchingVariantMedia = selectedVariantKey
      ? shoppingMediaItems.find((media) => media.variantKey === selectedVariantKey)
      : null;
    const sharedMedia = shoppingMediaItems.find((media) => !media.variantKey);
    const nextMedia = matchingVariantMedia ?? sharedMedia ?? shoppingMediaItems[0];

    setSelectedMediaKey(nextMedia?.mediaKey ?? null);
  }, [selectedVariantKey, shoppingMediaItems]);

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
        {isAquaGallery ? (
          <AquaProductVisual
            altText={selectedMedia.altText ?? productName}
            testId="product-main-image"
            variantKey={selectedMedia.variantKey}
          />
        ) : selectedSrc ? (
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
          {visibleMediaItems.map((media) => {
            const thumbnailLabel = getMediaLabel(media, productName);
            const thumbnailSrc = failedMediaKeys.has(media.mediaKey) ? null : media.src;
            const isSelected = media.mediaKey === selectedMedia.mediaKey;

            return (
              <button
                aria-label={`Show ${thumbnailLabel}`}
                aria-pressed={isSelected}
                className={styles.thumbnailButton}
                data-media-key={media.mediaKey}
                key={media.mediaKey}
                onClick={() => setSelectedMediaKey(media.mediaKey)}
                type="button"
              >
                <span className={styles.thumbnailImage}>
                  {isAquaGallery ? (
                    <AquaProductVisual
                      altText={thumbnailLabel}
                      compact
                      decorative
                      variantKey={media.variantKey}
                    />
                  ) : thumbnailSrc ? (
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

function getUsableMedia(
  media: ProductMediaGalleryItem | undefined,
  failedMediaKeys: Set<string>
): ProductMediaGalleryItem | null {
  if (!media?.src || failedMediaKeys.has(media.mediaKey)) {
    return null;
  }

  return media;
}
