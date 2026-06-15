"use client";

import { useEffect, useState } from "react";

interface ProductAnchorRailItem {
  href: string;
  id: string;
  label: string;
}

interface ProductAnchorRailProps {
  ariaLabel: string;
  className: string;
  innerClassName: string;
  items: ProductAnchorRailItem[];
}

export function ProductAnchorRail({
  ariaLabel,
  className,
  innerClassName,
  items
}: ProductAnchorRailProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (items.length === 0) {
      return undefined;
    }

    const sectionIds = new Set(items.map((item) => item.id));
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));

    function updateActiveSection() {
      const currentSection = sections
        .map((section) => ({
          id: section.id,
          top: section.getBoundingClientRect().top
        }))
        .filter((section) => section.top <= 220)
        .sort((left, right) => right.top - left.top)[0];

      setActiveId(currentSection?.id ?? sections[0]?.id ?? "");
    }

    const hashId = window.location.hash.replace("#", "");

    if (sectionIds.has(hashId)) {
      setActiveId(hashId);
    } else {
      updateActiveSection();
    }

    window.addEventListener("hashchange", updateActiveSection);
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("hashchange", updateActiveSection);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [items]);

  if (items.length <= 1) {
    return null;
  }

  return (
    <nav className={className} aria-label={ariaLabel}>
      <div className={innerClassName}>
        {items.map((item) => (
          <a
            aria-current={activeId === item.id ? "true" : undefined}
            data-active={activeId === item.id ? "true" : undefined}
            href={item.href}
            key={item.id}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
