export interface VariantScopedMedia {
  variantKey?: string | null;
}

/**
 * Shows the complete curated gallery before a required option is selected,
 * then keeps only the chosen variant media plus shared media. This preserves
 * the product's intentional catalogue order without allowing one colour's
 * images to leak into another colour after selection.
 */
export function getVisibleProductMediaItems<T extends VariantScopedMedia>(
  mediaItems: T[],
  selectedVariantKey?: string | null
): T[] {
  const sharedMedia = mediaItems.filter((media) => !media.variantKey);

  if (!selectedVariantKey) {
    return mediaItems;
  }

  const variantMedia = mediaItems.filter((media) => media.variantKey === selectedVariantKey);

  if (variantMedia.length === 0) {
    return sharedMedia.length > 0 ? sharedMedia : mediaItems;
  }

  return [...variantMedia, ...sharedMedia];
}
