"use client";

import { useCart } from "../lib/use-cart";

type PublicStorefrontNavItem = "home" | "catalog" | "shipping" | "contact" | "cart";

const NAV_ITEMS: Array<{
  href: string;
  id: PublicStorefrontNavItem;
  label: string;
}> = [
  {
    href: "/",
    id: "home",
    label: "Home"
  },
  {
    href: "/catalog",
    id: "catalog",
    label: "Catalog"
  },
  {
    href: "/shipping",
    id: "shipping",
    label: "Shipping"
  },
  {
    href: "/contact",
    id: "contact",
    label: "Contact"
  },
  {
    href: "/cart",
    id: "cart",
    label: "Cart"
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
            <a
              aria-current={activeItem === item.id ? "page" : undefined}
              data-active={activeItem === item.id ? "true" : undefined}
              href={item.href}
              key={item.id}
            >
              <span>{item.label}</span>
              {item.id === "cart" ? (
                <span className="publicCartCount" aria-label={`${itemCount} items in cart`}>
                  {itemCount}
                </span>
              ) : null}
            </a>
          ))}
        </div>

        <span className="publicNavPromise">Canada-wide shipping</span>
      </nav>
    </header>
  );
}
