import styles from "./page.module.css";

type AquaProductVisualKind =
  | "duo"
  | "four-pack"
  | "single-canada-red"
  | "single-ocean-blue"
  | "two-pack";

const AQUA_VISUALS = {
  duo: "/storefront/products/aqua/two-paddles-three-balls-original.jpg",
  "four-pack": "/storefront/products/aqua/four-paddles-three-balls-original.jpg",
  "single-canada-red": "/storefront/products/aqua/canada-red-single-original.jpg",
  "single-ocean-blue": "/storefront/products/aqua/ocean-blue-single-original.jpg",
  "two-pack": "/storefront/products/aqua/two-paddles-three-balls-original.jpg"
} satisfies Record<AquaProductVisualKind, string>;

interface AquaProductVisualProps {
  altText: string;
  compact?: boolean;
  decorative?: boolean;
  testId?: string;
  variantKey?: string | null;
}

function getVisualKind(variantKey?: string | null): AquaProductVisualKind {
  if (variantKey?.includes("single-coral")) {
    return "single-canada-red";
  }

  if (variantKey?.includes("single-ocean-blue")) {
    return "single-ocean-blue";
  }

  if (variantKey?.includes("4-pack")) {
    return "four-pack";
  }

  if (variantKey?.includes("2-pack")) {
    return "two-pack";
  }

  return "duo";
}

export function AquaProductVisual({
  altText,
  compact = false,
  decorative = false,
  testId,
  variantKey
}: AquaProductVisualProps) {
  const kind = getVisualKind(variantKey);

  return (
    <span
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : altText}
      className={`${styles.aquaWhiteVisual} ${compact ? styles.aquaWhiteVisualCompact : ""}`}
      data-aqua-visual={kind}
      data-aqua-white-background="true"
      data-testid={testId}
      role={decorative ? undefined : "img"}
    >
      <img
        alt=""
        aria-hidden="true"
        className={styles.aquaOriginalProductImage}
        src={AQUA_VISUALS[kind]}
      />
    </span>
  );
}
