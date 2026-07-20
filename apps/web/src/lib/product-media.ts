import type { ProductMediaSummary } from "../types/catalog";

const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME ?? "djfcisldm";
const CLOUDINARY_PRODUCT_FOLDER = "tigerpingpong/products";
export const PRODUCT_MEDIA_RESPONSIVE_WIDTHS = [480, 800, 1200, 1600] as const;

export function resolveProductMediaUrl(
  media: Pick<
    ProductMediaSummary,
    "cloudinaryPublicId" | "cloudinarySecureUrl" | "mediaKey" | "role"
  >,
  productSlug: string
): string | null {
  const explicitUrl = normalizeMediaSrc(media.cloudinarySecureUrl);

  if (explicitUrl) {
    return explicitUrl;
  }

  const explicitPublicId = normalizeCloudinaryPublicId(media.cloudinaryPublicId);

  if (explicitPublicId) {
    return buildCloudinaryDeliveryUrl(explicitPublicId);
  }

  const publicIdFromKey = resolveCloudinaryPublicIdFromMediaKey(media, productSlug);

  return publicIdFromKey ? buildCloudinaryDeliveryUrl(publicIdFromKey) : null;
}

export function normalizeMediaSrc(src: string | null | undefined): string | null {
  const normalizedSrc = src?.trim();
  return normalizedSrc ? normalizedSrc : null;
}

export function buildResponsiveCloudinaryUrl(src: string, width: number): string {
  if (!Number.isFinite(width) || width <= 0 || !isCloudinaryUploadUrl(src)) {
    return src;
  }

  const roundedWidth = Math.round(width);
  return src.replace("/image/upload/", `/image/upload/f_auto,q_auto,c_limit,w_${roundedWidth}/`);
}

export function buildResponsiveCloudinarySrcSet(
  src: string,
  widths: readonly number[] = PRODUCT_MEDIA_RESPONSIVE_WIDTHS
): string | undefined {
  if (!isCloudinaryUploadUrl(src)) {
    return undefined;
  }

  return widths
    .filter((width) => Number.isFinite(width) && width > 0)
    .map((width) => `${buildResponsiveCloudinaryUrl(src, width)} ${Math.round(width)}w`)
    .join(", ");
}

function isCloudinaryUploadUrl(src: string): boolean {
  try {
    const url = new URL(src);
    return url.hostname === "res.cloudinary.com" && url.pathname.includes("/image/upload/");
  } catch {
    return false;
  }
}

function normalizeCloudinaryPublicId(publicId: string | null | undefined): string | null {
  const normalizedPublicId = publicId?.trim().replace(/^\/+/, "");

  if (!normalizedPublicId) {
    return null;
  }

  if (/^https?:\/\//i.test(normalizedPublicId)) {
    return null;
  }

  return normalizedPublicId;
}

function resolveCloudinaryPublicIdFromMediaKey(
  media: Pick<ProductMediaSummary, "mediaKey" | "role">,
  productSlug: string
): string | null {
  const mediaKey = media.mediaKey.trim();

  if (!mediaKey) {
    return null;
  }

  if (mediaKey.includes("/")) {
    return normalizeCloudinaryPublicId(mediaKey);
  }

  const expectedPrefix = `${productSlug}-`;

  if (!mediaKey.startsWith(expectedPrefix)) {
    return null;
  }

  const keySuffix = mediaKey.slice(expectedPrefix.length);
  const match = keySuffix.match(/^(primary|gallery)-(\d+)$/);

  if (!match) {
    return null;
  }

  const [, keyRole, order] = match;
  const roleSlug = keyRole === "primary" || media.role === "primary" ? "main" : "gallery";

  return `${CLOUDINARY_PRODUCT_FOLDER}/${productSlug}/${order.padStart(2, "0")}-${roleSlug}`;
}

function buildCloudinaryDeliveryUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${encodeURI(publicId)}`;
}
