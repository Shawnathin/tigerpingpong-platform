import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.resolve("apps/web/src/app/catalog/products/[slug]/ProductFeatureCarousel.tsx"),
  "utf8"
);

describe("ProductFeatureCarousel interaction contract", () => {
  it("provides non-looping previous and next controls", () => {
    expect(source).toContain('aria-label="Show previous highlight"');
    expect(source).toContain('aria-label="Show next highlight"');
    expect(source).toContain("disabled={activeIndex === 0}");
    expect(source).toContain("disabled={activeIndex === moments.length - 1}");
    expect(source).toContain("scrollToFeature(activeIndex - 1)");
    expect(source).toContain("scrollToFeature(activeIndex + 1)");
  });

  it("provides interactive dots, slide semantics, and an announced current count", () => {
    expect(source).toContain('aria-roledescription="carousel"');
    expect(source).toContain('aria-roledescription="slide"');
    expect(source).toContain('aria-current={index === activeIndex ? "true" : undefined}');
    expect(source).toContain("onClick={() => scrollToFeature(index)}");
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain("{activeIndex + 1} of {moments.length}");
  });

  it("tracks manual scrolling and respects reduced-motion preferences", () => {
    expect(source).toContain('track.addEventListener("scroll", scheduleActiveIndexUpdate');
    expect(source).toContain("track.scrollLeft + track.clientWidth >= track.scrollWidth - 1");
    expect(source).toContain('window.matchMedia?.("(prefers-reduced-motion: reduce)").matches');
    expect(source).toContain('behavior: prefersReducedMotion ? "auto" : "smooth"');
    expect(source).not.toMatch(/setInterval|autoPlay|autoplay/);
  });

  it("supports keyboard navigation without looping", () => {
    expect(source).toContain("onKeyDown={handleCarouselKeyDown}");
    expect(source).toContain("tabIndex={0}");
    expect(source).toContain('event.key === "ArrowLeft"');
    expect(source).toContain('event.key === "ArrowRight"');
    expect(source).toContain('event.key === "Home"');
    expect(source).toContain('event.key === "End"');
    expect(source).toContain("scrollToFeature(targetIndex)");
  });

  it("allows the universal table system to keep every feature image on top", () => {
    expect(source).toContain('layout?: "alternating" | "uniform"');
    expect(source).toContain('layout = "alternating"');
    expect(source).toContain('layout === "alternating" && index % 2 === 1');
  });
});
