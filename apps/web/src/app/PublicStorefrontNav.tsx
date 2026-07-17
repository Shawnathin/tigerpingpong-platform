"use client";

import { useEffect, useState } from "react";

import { useCart } from "../lib/use-cart";
import { PublicBrandLogo } from "./PublicBrandLogo";

export type PublicStorefrontNavItem =
  | "home"
  | "tables"
  | "paddles"
  | "balls"
  | "accessories"
  | "resources"
  | "contact"
  | "cart"
  | "support";

const NAV_ITEMS: Array<{
  href: string;
  id: PublicStorefrontNavItem;
  label: string;
}> = [
  {
    href: "/tables/",
    id: "tables",
    label: "Tables"
  },
  {
    href: "/accessories/paddles/",
    id: "paddles",
    label: "Paddles"
  },
  {
    href: "/accessories/ping-pong-balls/",
    id: "balls",
    label: "Balls"
  },
  {
    href: "/accessories/",
    id: "accessories",
    label: "Accessories"
  },
  {
    href: "/resources/",
    id: "resources",
    label: "Resources"
  },
  {
    href: "/contact",
    id: "contact",
    label: "Contact"
  }
];

const MOBILE_NAV_ITEMS: Array<{
  href: string;
  id: PublicStorefrontNavItem;
  label: string;
}> = [
  {
    href: "/tables/",
    id: "tables",
    label: "Tables"
  },
  {
    href: "/accessories/paddles/",
    id: "paddles",
    label: "Paddles"
  },
  {
    href: "/accessories/ping-pong-balls/",
    id: "balls",
    label: "Balls"
  },
  {
    href: "/accessories/",
    id: "accessories",
    label: "Accessories"
  },
  {
    href: "/resources/",
    id: "resources",
    label: "Resources"
  },
  {
    href: "/contact/",
    id: "contact",
    label: "Contact"
  }
];

interface PublicStorefrontNavProps {
  activeItem: PublicStorefrontNavItem;
}

export function PublicStorefrontNav({ activeItem }: PublicStorefrontNavProps) {
  const { itemCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="publicHeader" aria-label="Tiger Ping Pong public header">
      <nav
        className={`glassNav${isMobileMenuOpen ? " publicMobileMenuIsOpen" : ""}`}
        aria-label="Public navigation"
      >
        <button
          aria-controls="public-mobile-menu"
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          className="publicMobileMenuButton"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          type="button"
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>

        <a className="publicBrand" href="/" aria-label="Tiger Ping Pong home">
          <PublicBrandLogo priority />
        </a>

        <div className="publicNavLinks">
          {NAV_ITEMS.map((item) => (
            <div
              className="publicNavItem"
              data-active={activeItem === item.id ? "true" : undefined}
              key={item.id}
            >
              <a
                aria-current={activeItem === item.id ? "page" : undefined}
                className="publicNavLink"
                href={item.href}
              >
                {item.label}
              </a>
            </div>
          ))}
        </div>

        <a
          aria-current={activeItem === "cart" ? "page" : undefined}
          className="publicCartButton"
          href="/cart"
          aria-label="View cart"
        >
          <span>View Cart</span>
          <span className="publicCartCount" aria-label={`${itemCount} items in cart`}>
            {itemCount}
          </span>
        </a>

        <a
          aria-current={activeItem === "cart" ? "page" : undefined}
          aria-label="View cart"
          className="publicMobileCartButton"
          href="/cart"
        >
          <span>Cart</span>
          <span className="publicCartCount" aria-label={`${itemCount} items in cart`}>
            {itemCount}
          </span>
        </a>

        <div className="publicMobileMenu" id="public-mobile-menu">
          {MOBILE_NAV_ITEMS.map((item) => (
            <a
              aria-current={activeItem === item.id ? "page" : undefined}
              href={item.href}
              key={item.id}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
