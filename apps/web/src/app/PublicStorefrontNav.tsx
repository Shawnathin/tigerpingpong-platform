"use client";

import { useCart } from "../lib/use-cart";

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
  dropdown?: Array<{
    href: string;
    label: string;
  }>;
}> = [
  {
    href: "/tables/",
    id: "tables",
    label: "Tables",
    dropdown: [
      {
        href: "/tables/",
        label: "All Tables"
      },
      {
        href: "/tables/indoor-tables/",
        label: "Indoor Tables"
      },
      {
        href: "/tables/outdoor-tables/",
        label: "Outdoor Tables"
      }
    ]
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
    label: "Accessories",
    dropdown: [
      {
        href: "/accessories/",
        label: "All Accessories"
      },
      {
        href: "/accessories/covers/",
        label: "Covers"
      },
      {
        href: "/accessories/nets/",
        label: "Nets"
      },
      {
        href: "/replacement-parts/",
        label: "Replacement Parts"
      }
    ]
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

interface PublicStorefrontNavProps {
  activeItem: PublicStorefrontNavItem;
}

export function PublicStorefrontNav({ activeItem }: PublicStorefrontNavProps) {
  const { itemCount } = useCart();

  return (
    <header className="publicHeader" aria-label="Tiger Ping Pong public header">
      <nav className="glassNav" aria-label="Public navigation">
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

        <div className="publicNavLinks">
          {NAV_ITEMS.map((item) => (
            <div
              className="publicNavItem"
              data-active={activeItem === item.id ? "true" : undefined}
              data-has-dropdown={item.dropdown ? "true" : undefined}
              key={item.id}
            >
              <a
                aria-current={activeItem === item.id ? "page" : undefined}
                className="publicNavLink"
                href={item.href}
              >
                {item.label}
              </a>
              {item.dropdown ? (
                <div className="publicDropdown" aria-label={`${item.label} links`}>
                  {item.dropdown.map((dropdownItem) => (
                    <a href={dropdownItem.href} key={dropdownItem.href}>
                      {dropdownItem.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <a
          aria-current={activeItem === "cart" ? "page" : undefined}
          className="publicCartButton"
          href="/cart"
        >
          <span>View Cart</span>
          <span className="publicCartCount" aria-label={`${itemCount} items in cart`}>
            {itemCount}
          </span>
        </a>
      </nav>
    </header>
  );
}
