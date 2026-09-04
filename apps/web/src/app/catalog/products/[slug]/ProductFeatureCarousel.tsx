"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import styles from "./page.module.css";

export interface ProductFeatureVisual {
  alt?: string;
  src: string;
}

export interface ProductFeatureMoment {
  description?: string;
  kicker: string;
  title: string;
  visual?: ProductFeatureVisual;
}

interface ProductFeatureCarouselProps {
  ariaLabel: string;
  layout?: "alternating" | "uniform";
  moments: ProductFeatureMoment[];
}

export function ProductFeatureCarousel({
  ariaLabel,
  layout = "alternating",
  moments
}: ProductFeatureCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    let animationFrame = 0;

    function updateActiveIndex(): void {
      if (!track) {
        return;
      }

      const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-feature-card]"));

      if (cards.length === 0) {
        setActiveIndex(0);
        return;
      }

      if (track.scrollLeft <= 1) {
        setActiveIndex(0);
        return;
      }

      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 1) {
        setActiveIndex(cards.length - 1);
        return;
      }

      const trackLeft = track.getBoundingClientRect().left;
      const nextIndex = cards.reduce(
        (closest, card, index) => {
          const distance = Math.abs(card.getBoundingClientRect().left - trackLeft);

          return distance < closest.distance ? { distance, index } : closest;
        },
        {
          distance: Number.POSITIVE_INFINITY,
          index: 0
        }
      ).index;

      setActiveIndex(nextIndex);
    }

    function scheduleActiveIndexUpdate(): void {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateActiveIndex);
    }

    updateActiveIndex();
    track.addEventListener("scroll", scheduleActiveIndexUpdate, { passive: true });

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleActiveIndexUpdate);
    resizeObserver?.observe(track);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      track.removeEventListener("scroll", scheduleActiveIndexUpdate);
    };
  }, [moments.length]);

  function scrollToFeature(index: number): void {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-feature-card]"));
    const targetIndex = Math.min(Math.max(index, 0), cards.length - 1);
    const targetCard = cards[targetIndex];

    if (!targetCard) {
      return;
    }

    const trackLeft = track.getBoundingClientRect().left;
    const targetLeft = track.scrollLeft + targetCard.getBoundingClientRect().left - trackLeft;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    track.scrollTo({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      left: targetLeft
    });
  }

  function handleCarouselKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const targetIndex =
      event.key === "ArrowLeft"
        ? activeIndex - 1
        : event.key === "ArrowRight"
          ? activeIndex + 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? moments.length - 1
              : null;

    if (targetIndex === null) {
      return;
    }

    event.preventDefault();
    scrollToFeature(targetIndex);
  }

  return (
    <>
      <div
        ref={trackRef}
        className={styles.featureTrack}
        aria-label={ariaLabel}
        aria-roledescription="carousel"
        onKeyDown={handleCarouselKeyDown}
        role="region"
        tabIndex={0}
      >
        {moments.map((feature, index) => (
          <article
            aria-label={`${index + 1} of ${moments.length}: ${feature.title}`}
            aria-roledescription="slide"
            className={
              layout === "alternating" && index % 2 === 1
                ? `${styles.featureMoment} ${styles.reverseFeature}`
                : styles.featureMoment
            }
            data-feature-card=""
            key={`${feature.kicker}-${feature.title}`}
            role="group"
          >
            <div>
              <p className={styles.productKicker}>{feature.kicker}</p>
              <h3>{feature.title}</h3>
              {feature.description ? <p>{feature.description}</p> : null}
            </div>
            {feature.visual ? <FeatureVisual visual={feature.visual} /> : null}
          </article>
        ))}
      </div>
      {moments.length > 1 ? (
        <div
          className={styles.featureCarouselNav}
          aria-label="Highlights carousel controls"
          role="group"
        >
          <button
            className={`${styles.featureNext} ${styles.featurePrevious}`}
            data-direction="previous"
            disabled={activeIndex === 0}
            onClick={() => scrollToFeature(activeIndex - 1)}
            type="button"
            aria-label="Show previous highlight"
          >
            <span aria-hidden="true" />
          </button>
          <div className={styles.featureDots} aria-label="Choose a highlight" role="group">
            {moments.map((feature, index) => (
              <button
                aria-current={index === activeIndex ? "true" : undefined}
                aria-label={`Show highlight ${index + 1}: ${feature.title}`}
                className={`${styles.featureDot} ${
                  index === activeIndex ? styles.featureDotActive : ""
                }`.trim()}
                key={`${feature.title}-dot`}
                onClick={() => scrollToFeature(index)}
                type="button"
              >
                <span aria-hidden="true" />
              </button>
            ))}
          </div>
          <span className={styles.featureCount} aria-atomic="true" aria-live="polite">
            {activeIndex + 1} of {moments.length}
          </span>
          <button
            className={styles.featureNext}
            data-direction="next"
            disabled={activeIndex === moments.length - 1}
            onClick={() => scrollToFeature(activeIndex + 1)}
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

function FeatureVisual({ visual }: { visual: ProductFeatureVisual }) {
  return <img src={visual.src} alt={visual.alt ?? ""} />;
}
