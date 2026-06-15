"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./page.module.css";

export type ProductFeatureVisualVariant = "anchor" | "frame" | "lock" | "net" | "top" | "wheel";

export interface ProductFeatureVisual {
  alt?: string;
  label?: string;
  src?: string;
  variant?: ProductFeatureVisualVariant;
}

export interface ProductFeatureMoment {
  description?: string;
  kicker: string;
  title: string;
  visual?: ProductFeatureVisual;
}

interface ProductFeatureCarouselProps {
  ariaLabel: string;
  moments: ProductFeatureMoment[];
}

const PLACEHOLDER_VARIANT_CLASSES: Record<ProductFeatureVisualVariant, string> = {
  anchor: styles.anchorPlaceholder,
  frame: styles.framePlaceholder,
  lock: styles.lockPlaceholder,
  net: styles.netPlaceholder,
  top: styles.topPlaceholder,
  wheel: styles.wheelPlaceholder
};

export function ProductFeatureCarousel({ ariaLabel, moments }: ProductFeatureCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    function updateActiveIndex(): void {
      const card = track?.querySelector<HTMLElement>("[data-feature-card]");

      if (!track || !card) {
        return;
      }

      const gap = parseFloat(window.getComputedStyle(track).columnGap || "0");
      const cardWidth = card.getBoundingClientRect().width + gap;
      const nextIndex = Math.round(track.scrollLeft / Math.max(cardWidth, 1));
      setActiveIndex(Math.min(Math.max(nextIndex, 0), moments.length - 1));
    }

    updateActiveIndex();
    track.addEventListener("scroll", updateActiveIndex, { passive: true });

    return () => track.removeEventListener("scroll", updateActiveIndex);
  }, [moments.length]);

  function scrollToNextFeature(): void {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>("[data-feature-card]");

    if (!track || !card) {
      return;
    }

    const gap = parseFloat(window.getComputedStyle(track).columnGap || "0");
    const step = card.getBoundingClientRect().width + gap;
    const nearEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - step / 2;

    track.scrollTo({
      behavior: "smooth",
      left: nearEnd ? 0 : track.scrollLeft + step
    });
  }

  return (
    <>
      <div ref={trackRef} className={styles.featureTrack} aria-label={ariaLabel}>
        {moments.map((feature, index) => (
          <article
            className={
              index % 2 === 1
                ? `${styles.featureMoment} ${styles.reverseFeature}`
                : styles.featureMoment
            }
            data-feature-card=""
            key={`${feature.kicker}-${feature.title}`}
          >
            <div>
              <p className={styles.productKicker}>{feature.kicker}</p>
              <h3>{feature.title}</h3>
              {feature.description ? <p>{feature.description}</p> : null}
            </div>
            {feature.visual ? <FeatureVisual size="feature" visual={feature.visual} /> : null}
          </article>
        ))}
      </div>
      {moments.length > 1 ? (
        <div className={styles.featureCarouselNav} aria-label="Highlights carousel controls">
          <div className={styles.featureDots} aria-hidden="true">
            {moments.map((feature, index) => (
              <span
                className={index === activeIndex ? styles.featureDotActive : undefined}
                key={`${feature.title}-dot`}
              />
            ))}
          </div>
          <button
            className={styles.featureNext}
            onClick={scrollToNextFeature}
            type="button"
            aria-label="Show next highlight"
          >
            <span aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </>
  );
}

function FeatureVisual({
  size,
  visual
}: {
  size: "feature" | "mini";
  visual: ProductFeatureVisual;
}) {
  if (visual.src) {
    return <img src={visual.src} alt={visual.alt ?? ""} />;
  }

  const variantClass = visual.variant ? PLACEHOLDER_VARIANT_CLASSES[visual.variant] : "";
  const className = `${size === "feature" ? styles.featurePlaceholder : styles.miniPlaceholder} ${
    variantClass
  }`.trim();

  return (
    <span className={className} aria-hidden="true">
      {visual.label}
    </span>
  );
}
