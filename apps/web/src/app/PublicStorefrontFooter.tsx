"use client";

import { useState } from "react";

const FOOTER_SECTIONS = [
  {
    title: "Shop",
    links: [
      { href: "/tables/", label: "Tables" },
      { href: "/tables/indoor-tables/", label: "Indoor Tables" },
      { href: "/tables/outdoor-tables/", label: "Outdoor Tables" },
      { href: "/accessories/paddles/", label: "Paddles" },
      { href: "/accessories/ping-pong-balls/", label: "Balls" },
      { href: "/accessories/covers/", label: "Covers" },
      { href: "/accessories/nets/", label: "Nets" },
      { href: "/accessories/", label: "Accessories" },
      { href: "/replacement-parts/", label: "Replacement Parts" }
    ]
  },
  {
    title: "Support",
    links: [
      { href: "/shipping-returns", label: "Shipping & Returns" },
      { href: "/contact", label: "Contact" }
    ]
  },
  {
    title: "Resources",
    links: [{ href: "/resources/", label: "Resources" }]
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" }
    ]
  },
  {
    title: "Legal",
    links: [{ href: "/shipping-returns", label: "Refund / Returns Policy" }]
  }
];

export function PublicStorefrontFooter() {
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set());

  function toggleSection(title: string) {
    setOpenSections((currentOpenSections) => {
      const nextOpenSections = new Set(currentOpenSections);

      if (nextOpenSections.has(title)) {
        nextOpenSections.delete(title);
      } else {
        nextOpenSections.add(title);
      }

      return nextOpenSections;
    });
  }

  return (
    <footer className="publicFooter" aria-label="Tiger Ping Pong footer">
      <div className="publicFooterInner">
        <div className="publicFooterBrand">
          <a className="publicBrand" href="/" aria-label="Tiger Ping Pong home">
            <span className="publicBrandMark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="publicBrandText">
              <strong>Tiger</strong>
              <span>Ping Pong</span>
            </span>
          </a>
          <p>
            Tables, paddles, balls, accessories, and Canada-wide storefront support from Vancouver,
            BC.
          </p>
        </div>

        <nav className="publicFooterNav" aria-label="Footer navigation">
          {FOOTER_SECTIONS.map((section) => (
            <section key={section.title} aria-labelledby={`footer-${section.title.toLowerCase()}`}>
              <h2 id={`footer-${section.title.toLowerCase()}`}>{section.title}</h2>
              <ul>
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.href}-${link.label}`}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <nav className="publicFooterMobileNav" aria-label="Footer navigation">
          {FOOTER_SECTIONS.map((section) => (
            <section key={section.title} data-open={openSections.has(section.title)}>
              <h2>
                <button
                  id={`footer-${section.title.toLowerCase()}-button`}
                  type="button"
                  aria-expanded={openSections.has(section.title)}
                  aria-controls={`footer-${section.title.toLowerCase()}-links`}
                  onClick={() => toggleSection(section.title)}
                >
                  <span>{section.title}</span>
                  <span aria-hidden="true">+</span>
                </button>
              </h2>
              <ul id={`footer-${section.title.toLowerCase()}-links`}>
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.href}-${link.label}`}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </div>
    </footer>
  );
}
