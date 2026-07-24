import { getProductMediaFallbacks } from "../../../../lib/public-storefront-demo";
import { getVicePackageVisualAltText, VICE_BUNDLE_VARIANT_KEY } from "../../../../lib/vice-package";

import styles from "./page.module.css";

const viceMedia = requireProductComponentMedia("tiger-vice-paddle", 0);
const viceBundlePaddleMedia = requireProductComponentMedia("tiger-vice-paddle", 1);
const whiteBallsMedia = requireProductComponentMedia("tiger-premium-balls-6-white", 0);

interface VicePackageVisualProps {
  altText?: string;
  compact?: boolean;
  decorative?: boolean;
  variantKey?: string | null;
}

export function VicePackageVisual({
  altText,
  compact = false,
  decorative = false,
  variantKey
}: VicePackageVisualProps) {
  const isBundle = variantKey === VICE_BUNDLE_VARIANT_KEY;

  return (
    <span
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : (altText ?? getVicePackageVisualAltText(variantKey))}
      className={`${styles.vicePackageVisual} ${compact ? styles.vicePackageVisualCompact : ""}`}
      data-vice-package-visual={isBundle ? "bundle" : "single"}
      role={decorative ? undefined : "img"}
    >
      {isBundle ? (
        <span className={styles.viceBundleComponents} aria-hidden="true">
          <span className={styles.viceBundlePaddles}>
            {Array.from({ length: 4 }, (_, index) => (
              <img
                alt=""
                className={styles.viceBundlePaddleImage}
                key={index}
                src={viceBundlePaddleMedia.src}
              />
            ))}
          </span>
          <img alt="" className={styles.viceBundleBallsImage} src={whiteBallsMedia.src} />
        </span>
      ) : (
        <img alt="" aria-hidden="true" className={styles.viceSingleImage} src={viceMedia.src} />
      )}
    </span>
  );
}

function requireProductComponentMedia(slug: string, index: number): { src: string } {
  const media = getProductMediaFallbacks(slug)[index];

  if (!media) {
    throw new Error(`Required Vice package component media is missing: ${slug} at index ${index}`);
  }

  return media;
}
