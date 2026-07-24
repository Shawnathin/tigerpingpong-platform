import { getPrimaryProductMediaFallback } from "../../../../lib/public-storefront-demo";
import { getVicePackageVisualAltText, VICE_BUNDLE_VARIANT_KEY } from "../../../../lib/vice-package";

import styles from "./page.module.css";

const viceMedia = requireProductComponentMedia("tiger-vice-paddle");
const whiteBallsMedia = requireProductComponentMedia("tiger-premium-balls-6-white");

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
          <span className={styles.viceBundleComponent}>
            <img alt="" src={viceMedia.src} />
            <strong>4 paddles</strong>
          </span>
          <span className={styles.viceBundleComponent}>
            <img alt="" src={whiteBallsMedia.src} />
            <strong>6 balls</strong>
          </span>
        </span>
      ) : (
        <img alt="" aria-hidden="true" className={styles.viceSingleImage} src={viceMedia.src} />
      )}
    </span>
  );
}

function requireProductComponentMedia(slug: string): { src: string } {
  const media = getPrimaryProductMediaFallback(slug);

  if (!media) {
    throw new Error(`Required Vice package component media is missing: ${slug}`);
  }

  return media;
}
