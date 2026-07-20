export interface VariantScopedMedia {
  variantKey?: string | null;
}

/**
 * Keeps shared media visible while preventing one package option from showing
 * another package option's image. Products without shared media retain their
 * existing full-gallery behaviour until a variant is selected.
 */
export function getVisibleProductMediaItems<T extends VariantScopedMedia>(
  mediaItems: T[],
  selectedVariantKey?: string | null
): T[] {
  const sharedMedia = mediaItems.filter((media) => !media.variantKey);

  if (!selectedVariantKey) {
    return sharedMedia.length > 0 ? sharedMedia : mediaItems;
  }

  const variantMedia = mediaItems.filter((media) => media.variantKey === selectedVariantKey);

  if (variantMedia.length === 0) {
    return sharedMedia.length > 0 ? sharedMedia : mediaItems;
  }

  return [...variantMedia, ...sharedMedia];
}
